import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Testes unitários da lógica do frontend (regras de acesso, funil, tratamento de erros, cliente HTTP).
// Ambiente "node": os testes que precisam de window/localStorage os simulam explicitamente.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**', '.next-*/**'],
  },
})
