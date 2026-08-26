"""
Verify identity credentials from Google and Yandex.

Google ID tokens are verified locally against Google's keys. Yandex issues an
opaque OAuth token, so it is resolved through Yandex Login's user-info endpoint;
the returned client ID must match this application before the identity is used.

Env vars:
    DUO_GOOGLE_CLIENT_IDS  Comma-separated allowed `aud` values for Google.
                           Include every OAuth client ID that ships in a
                           client (Web, iOS, Android).
    DUO_YANDEX_CLIENT_ID   Expected Yandex OAuth application ID.
"""

import time
from typing import TypedDict
import service.api.duotypes as t

import jwt
import httpx
from google.auth.transport.requests import Request as _GoogleRequest
from google.oauth2 import id_token as _google_id_token

from service.api.mocking import enable_mocking


# Bound on JWKS / certs HTTP fetches. Without this, a slow upstream pins
# a worker indefinitely on the cold-start fetch.
_PROVIDER_HTTP_TIMEOUT_SECONDS = 5


class SocialAuthError(Exception):
    """Raised when a provider token fails verification."""


from serviceshared.duoenv.api import (
    GOOGLE_CLIENT_IDS as _GOOGLE_CLIENT_IDS,
    YANDEX_CLIENT_ID as _YANDEX_CLIENT_ID,
)

_GOOGLE_ISSUERS = ('https://accounts.google.com', 'accounts.google.com')
_YANDEX_USERINFO_URL = 'https://login.yandex.ru/info'
_YANDEX_MOCK_ISSUER = 'https://login.yandex.ru'


# `google-auth`'s `Request` accepts a per-call timeout via __call__, but
# `verify_oauth2_token` doesn't expose that. Subclass to set a default.
class _BoundedTimeoutGoogleRequest(_GoogleRequest):
    def __call__(
        self,
        url: str,
        method: str = 'GET',
        body: object = None,
        headers: object = None,
        timeout: object = _PROVIDER_HTTP_TIMEOUT_SECONDS,
        **kwargs: object,
    ) -> object:
        return super().__call__(
            url, method, body, headers, timeout=timeout, **kwargs
        )


# `google-auth` caches its certs on the Request object.
_google_request = _BoundedTimeoutGoogleRequest()


def _decode_unverified(
    token: str,
    *,
    allowed_issuers: tuple[str, ...],
    allowed_audiences: list[str],
) -> dict:
    """
    Decode a JWT *without* signature verification, then enforce the
    same iss/aud/exp/required-claim checks that the real verifiers do.
    Used only when `enable_mocking()` is True — in production this path
    is never reached because the mocking flag file isn't shipped in the
    Docker image (`api.Dockerfile` excludes the `test/` directory).
    """
    try:
        claims = jwt.decode(
            token,
            options={
                'verify_signature': False,
                'require': ['sub', 'iss', 'aud', 'exp'],
            },
        )
    except jwt.PyJWTError as e:
        raise SocialAuthError(f'Mock token malformed: {e}')

    iss = claims.get('iss')
    if iss not in allowed_issuers:
        raise SocialAuthError(f'Mock token has unexpected iss: {iss!r}')

    aud_claim = claims.get('aud')
    aud_list = [aud_claim] if isinstance(aud_claim, str) else list(aud_claim or [])
    if not any(a in allowed_audiences for a in aud_list):
        raise SocialAuthError(f'Mock token has unexpected aud: {aud_claim!r}')

    exp = claims.get('exp')
    if not isinstance(exp, (int, float)) or exp < time.time():
        raise SocialAuthError('Mock token has expired or invalid exp')

    return claims


def verify_google_id_token(id_token: str) -> t.SocialClaims:
    """
    Validate a Google ID token. Returns the canonical claims we need.

    Raises SocialAuthError on any verification failure.
    """
    if not _GOOGLE_CLIENT_IDS:
        raise SocialAuthError('DUO_GOOGLE_CLIENT_IDS is not configured')

    if enable_mocking():
        claims = _decode_unverified(
            id_token,
            allowed_issuers=_GOOGLE_ISSUERS,
            allowed_audiences=_GOOGLE_CLIENT_IDS,
        )
    else:
        try:
            # `verify_oauth2_token` checks signature, exp, iss
            # ('accounts.google.com' or 'https://accounts.google.com'), and
            # `aud` against the supplied list.
            claims = _google_id_token.verify_oauth2_token(
                id_token, _google_request, audience=_GOOGLE_CLIENT_IDS,
            )
        except ValueError as e:
            raise SocialAuthError(f'Invalid Google token: {e}')

    sub = claims.get('sub')
    email = claims.get('email')
    if not sub or not email:
        raise SocialAuthError('Google token missing sub or email')

    # Google sometimes returns email_verified as bool, sometimes as string
    raw_verified = claims.get('email_verified', False)
    email_verified = (
        raw_verified is True or
        (isinstance(raw_verified, str) and raw_verified.lower() == 'true')
    )

    return t.SocialClaims(
        sub=sub,
        email=email,
        email_verified=email_verified,
    )


async def verify_yandex_access_token(access_token: str) -> t.SocialClaims:
    """Resolve and validate a Yandex OAuth token against Yandex Login."""
    if not _YANDEX_CLIENT_ID:
        raise SocialAuthError('DUO_YANDEX_CLIENT_ID is not configured')

    if enable_mocking():
        token_claims = _decode_unverified(
            access_token,
            allowed_issuers=(_YANDEX_MOCK_ISSUER,),
            allowed_audiences=[_YANDEX_CLIENT_ID],
        )
        claims = {
            'id': token_claims.get('sub'),
            'default_email': token_claims.get('email'),
            'client_id': token_claims.get('aud'),
        }
    else:
        try:
            async with httpx.AsyncClient(
                timeout=_PROVIDER_HTTP_TIMEOUT_SECONDS,
            ) as client:
                response = await client.get(
                    _YANDEX_USERINFO_URL,
                    headers={'Authorization': f'OAuth {access_token}'},
                    params={'format': 'json'},
                )
                response.raise_for_status()
                claims = response.json()
        except (httpx.HTTPError, ValueError) as e:
            raise SocialAuthError(f'Invalid Yandex token: {e}')

    if not isinstance(claims, dict):
        raise SocialAuthError('Yandex returned an invalid user-info response')
    if claims.get('client_id') != _YANDEX_CLIENT_ID:
        raise SocialAuthError('Yandex token was issued to another application')

    sub = claims.get('id')
    email = claims.get('default_email')
    if not isinstance(sub, str) or not sub:
        raise SocialAuthError('Yandex response missing id')
    if not isinstance(email, str) or not email:
        raise SocialAuthError(
            'Yandex response missing default_email; enable email access'
        )

    return t.SocialClaims(sub=sub, email=email, email_verified=True)
