/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** S3 공개 베이스 URL (profile/xxx.png 키 → 절대 URL) */
  readonly VITE_S3_PUBLIC_BASE_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
