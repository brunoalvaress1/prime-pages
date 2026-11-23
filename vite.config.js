import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Em desenvolvimento, /api/* roda as mesmas funções que o Vercel roda em produção.
function devApi() {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/generate', async (req, res) => {
        const mod = await server.ssrLoadModule('/api/generate.js')
        return mod.default(req, res)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return {
    plugins: [react(), devApi()],
    build: { chunkSizeWarningLimit: 1200 },
  }
})
