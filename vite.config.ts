import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'

/**
 * 개발 서버 프록시
 * 브라우저 → localhost:5173/api/... → EC2(13.209.210.142:80) → Spring(8080)
 * RDS는 프론트가 아니라 EC2 스프링이 직접 접속한다.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_API_PROXY_TARGET || 'http://13.209.210.142'

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
