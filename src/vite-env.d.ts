/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PORTONE_STORE_ID: string
  readonly VITE_PORTONE_CHANNEL_KEY: string
  /** S3 공개 베이스 URL (profile/xxx.png 키 → 절대 URL) */
  readonly VITE_S3_PUBLIC_BASE_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
