import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'

/**
 * 개발 서버 프록시. /api → VITE_API_PROXY_TARGET (.env.local), 없으면 localhost:8080.
 * 배포 API 주소는 netlify.toml 의 VITE_API_BASE_URL.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_API_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: backend,
          changeOrigin: true,
        },
        '/oauth2': {
          target: backend,
          changeOrigin: true,
        },
        '/login/oauth2': {
          target: backend,
          changeOrigin: true,
        },
      },
    },
  }
})
