import Constants from 'expo-constants';


export const DEEP_LINK_HOSTNAME: string =
  Constants.expoConfig?.extra?.deepLinkHostname
  ?? 'get.duolicious.app';

export const API_URL = Constants.expoConfig?.extra?.apiUrl
  ?? 'http://localhost:5000';

export const CHAT_URL = Constants.expoConfig?.extra?.chatUrl
  ?? 'ws://localhost:5000/chat';

export const IMAGES_URL = Constants.expoConfig?.extra?.imagesUrl
  ?? 'http://localhost:9090/s3-mock-bucket';

export const AUDIO_URL = Constants.expoConfig?.extra?.audioUrl
  ?? 'http://localhost:9090/s3-mock-audio-bucket';

export const STATUS_URL = Constants.expoConfig?.extra?.statusUrl
  ?? 'http://localhost:8080';

export const INVITE_URL = Constants.expoConfig?.extra?.inviteUrl
  ?? 'https://duolicious.gg';

export const PARTNER_URL = Constants.expoConfig?.extra?.partnerUrl
  ?? 'https://partner.duolicious.app'

export const WEB_VERSION = Constants.expoConfig?.extra?.webVersion
  ?? '000000';

export const KLIPY_API_KEY = Constants.expoConfig?.extra?.klipyApiKey
  ?? 'zRR3mhpo6qidN2teiLQ2DcCcQqrSL8YNBzz8qaCqbGVkDe4r7vLAQc7couS48krD';

export const NOTIFICATION_ICON_URL = Constants.expoConfig?.extra?.notificationIconUrl
  ?? 'https://duolicious.app/assets/desktop-notification.png';

export const NOTIFICATION_SOUND_URL = Constants.expoConfig?.extra?.notificationSoundUrl
  ?? 'https://duolicious.app/assets/desktop-notification.wav';

export const WEB_PUSH_VAPID_PUBLIC_KEY: string =
  Constants.expoConfig?.extra?.webPushVapidPublicKey ?? '';

// OAuth client IDs for Google Sign-In. Each platform gets a different ID
// from Google Cloud Console; the web ID is also used as the audience the
// backend verifies against during native flows.
//
// Social-auth client IDs below are required at build time. We
// fall back to '' rather than `undefined` so consumers don't need
// null-guards — a missing build-time value will surface as a malformed
// OAuth request from Google/Yandex, which is the correct "fail loudly"
// behavior for a misconfigured build.
export const GOOGLE_IOS_CLIENT_ID: string =
  Constants.expoConfig?.extra?.googleIosClientId ??
  '';
export const GOOGLE_ANDROID_CLIENT_ID: string =
  Constants.expoConfig?.extra?.googleAndroidClientId ??
  '';
export const GOOGLE_WEB_CLIENT_ID: string =
  Constants.expoConfig?.extra?.googleWebClientId ??
  '443037492722-n1lcbdqe2u49ev56b1tv6m087a9muhsd.apps.googleusercontent.com';

export const YANDEX_CLIENT_ID: string =
  Constants.expoConfig?.extra?.yandexClientId ?? '';
