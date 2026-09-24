import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'

/**
 * 개발 서버 프록시
 * - 로컬: /api → localhost:8080
 * - Netlify: VITE_API_BASE_URL(EC2)로 직접 호출 (프록시 없음)
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
