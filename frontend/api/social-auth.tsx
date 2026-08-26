import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef } from 'react';
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
  YANDEX_CLIENT_ID,
} from '../env/env';

const errorMessage = (e: unknown): string | undefined =>
  typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string'
    ? e.message
    : undefined;

// Required so that the OAuth redirect dismisses the in-app browser
// session on iOS / Android. Calling this once at module load is the
// pattern documented by Expo.
WebBrowser.maybeCompleteAuthSession();

export type SocialSignInResult =
  | { ok: true; idToken: string }
  | { ok: false; cancelled: boolean; reason?: string };

/**
 * Wraps `expo-auth-session/providers/google` so callers get a single
 * async `promptForIdToken()` instead of the request/response/promptAsync
 * tuple. Configures the request to return an `id_token` directly, which
 * is what the backend's `/sign-in-with-google` endpoint expects.
 */
export const useGoogleSignIn = (): {
  ready: boolean;
  promptForIdToken: () => Promise<SocialSignInResult>;
} => {
  // Google's native (iOS and Android) OAuth clients only permit the
  // authorization code flow — they reject `response_type=id_token` with
  // `unsupported_response_type`. Web clients still accept implicit, so
  // we keep the one-hop flow there and pay the extra token-exchange
  // round trip on native.
  const isNative = Platform.OS !== 'web';

  // The returned `request` is null until the discovery doc loads.
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    // Web stays on the cheaper implicit flow; native falls through to
    // the default `code` + PKCE flow and exchanges the code below.
    ...(isNative ? {} : { responseType: 'id_token' as const }),
    scopes: ['openid', 'email'],
  });

  // `useAuthRequest` resolves `promptAsync()` with a result object that
  // describes how the prompt was dismissed; for a successful sign-in the
  // id_token only lands on the separate `response` state. We bridge the
  // two with a deferred resolver and dedup so whichever signal arrives
  // first (the response effect for success, the promptAsync return for
  // cancel/error) settles the promise.
  //
  // Each `promptForIdToken()` call gets its own monotonically-increasing
  // id; settle() refuses to resolve unless the caller's id matches the
  // current pending id. That protects against a cross-talk hazard where
  // a stale `response` (or one re-emitted with the same data) could
  // settle a *later* prompt with a *prior* prompt's token.
  const pendingResolveRef = useRef<
    ((r: SocialSignInResult) => void) | null
  >(null);
  const pendingPromptIdRef = useRef<number | null>(null);
  const promptCounterRef = useRef(0);

  const settle = (id: number, r: SocialSignInResult) => {
    if (pendingPromptIdRef.current !== id) return;
    const resolve = pendingResolveRef.current;
    pendingPromptIdRef.current = null;
    pendingResolveRef.current = null;
    if (resolve) resolve(r);
  };

  useEffect(() => {
    if (!response) return;
    // Only handle success here; cancel/error are settled by the
    // promptAsync return below so we don't double-resolve.
    if (response.type !== 'success') return;
    const id = pendingPromptIdRef.current;
    if (id === null) return;

    const params = response.params as Record<string, string>;

    // Web: implicit flow lands the id_token directly on params.
    if (params.id_token) {
      settle(id, { ok: true, idToken: params.id_token });
      return;
    }

    // Native (iOS / Android): code + PKCE. Exchange against Google's
    // token endpoint. Native clients have no secret, so PKCE is the
    // only credential. The clientId on the exchange must match the one
    // used on the authorize request, which `useAuthRequest` picks per
    // platform — mirror that here.
    const code = params.code;
    if (!code || !request) {
      settle(id, { ok: false, cancelled: false, reason: 'No id_token or code in response' });
      return;
    }

    const exchangeClientId =
      Platform.OS === 'ios' ? GOOGLE_IOS_CLIENT_ID : GOOGLE_ANDROID_CLIENT_ID;

    (async () => {
      try {
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: exchangeClientId,
            code,
            redirectUri: request.redirectUri,
            extraParams: request.codeVerifier
              ? { code_verifier: request.codeVerifier }
              : undefined,
          },
          { tokenEndpoint: 'https://oauth2.googleapis.com/token' },
        );
        const idToken = tokenResponse.idToken;
        if (idToken) {
          settle(id, { ok: true, idToken });
        } else {
          settle(id, {
            ok: false,
            cancelled: false,
            reason: 'No id_token in token response',
          });
        }
      } catch (e: unknown) {
        settle(id, {
          ok: false,
          cancelled: false,
          reason: errorMessage(e) ?? 'Token exchange failed',
        });
      }
    })();
  }, [response]);

  const promptForIdToken = (): Promise<SocialSignInResult> => {
    if (!request) {
      return Promise.resolve({
        ok: false,
        cancelled: false,
        reason: 'Google sign-in not ready',
      });
    }
    return new Promise<SocialSignInResult>((resolve) => {
      const id = ++promptCounterRef.current;
      pendingPromptIdRef.current = id;
      pendingResolveRef.current = resolve;
      promptAsync()
        .then((result) => {
          if (result?.type === 'cancel' || result?.type === 'dismiss') {
            settle(id, { ok: false, cancelled: true });
          } else if (result?.type === 'error') {
            settle(id, {
              ok: false,
              cancelled: false,
              reason: result.error?.message ?? 'Google sign-in error',
            });
          }
          // `success` is intentionally left to the response effect so we
          // wait for the id_token to land on `response.params`.
        })
        .catch((err) => {
          settle(id, {
            ok: false,
            cancelled: false,
            reason: (err as Error).message ?? 'Google sign-in failed',
          });
        });
    });
  };

  return {
    ready: !!request,
    promptForIdToken,
  };
};

const YANDEX_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://oauth.yandex.com/authorize',
  tokenEndpoint: 'https://oauth.yandex.com/token',
};

export const useYandexSignIn = (): {
  ready: boolean;
  promptForAccessToken: () => Promise<SocialSignInResult>;
} => {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'app.duolicious',
    path: 'oauthredirect',
  });
  const [request, response, promptAsync] = AuthSession.useAuthRequest({
    clientId: YANDEX_CLIENT_ID,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes: ['login:info', 'login:email'],
    usePKCE: true,
  }, YANDEX_DISCOVERY);
  const resolveRef = useRef<((r: SocialSignInResult) => void) | null>(null);

  useEffect(() => {
    if (!response || !resolveRef.current) return;
    const resolve = resolveRef.current;
    if (response.type !== 'success') {
      resolveRef.current = null;
      resolve({ ok: false, cancelled: response.type === 'cancel',
        reason: response.type === 'error' ? response.error?.message : undefined });
      return;
    }
    if (!response.params.code || !request) return;
    AuthSession.exchangeCodeAsync({
      clientId: YANDEX_CLIENT_ID,
      code: response.params.code,
      redirectUri: request.redirectUri,
      extraParams: request.codeVerifier
        ? { code_verifier: request.codeVerifier }
        : undefined,
    }, YANDEX_DISCOVERY).then((token) => {
      resolveRef.current = null;
      resolve(token.accessToken
        ? { ok: true, idToken: token.accessToken }
        : { ok: false, cancelled: false, reason: 'Yandex returned no access token' });
    }).catch((e: unknown) => {
      resolveRef.current = null;
      resolve({ ok: false, cancelled: false,
        reason: errorMessage(e) ?? 'Yandex token exchange failed' });
    });
  }, [response]);

  return {
    ready: !!request,
    promptForAccessToken: () => new Promise<SocialSignInResult>((resolve) => {
      if (!request) {
        resolve({ ok: false, cancelled: false, reason: 'Yandex sign-in not ready' });
        return;
      }
      resolveRef.current = resolve;
      promptAsync().catch((e: unknown) => {
        resolveRef.current = null;
        resolve({ ok: false, cancelled: false,
          reason: errorMessage(e) ?? 'Yandex sign-in failed' });
      });
    }),
  };
};
