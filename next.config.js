/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite rodar uma segunda instância (ex.: verificação/testes) sem compartilhar a pasta de build.
  // Dois `next dev` gravando na mesma `.next` sobrescrevem os manifestos um do outro e passam a
  // responder 404 / tela em branco em páginas que existem. Padrão: `.next`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
}

module.exports = nextConfig
