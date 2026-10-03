import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import RouteShell from '@/components/RouteShell'
import { ToastProvider, GlobalToastSetter } from '@/components/ui/ToastProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ConfirmProvider } from '@/components/ui/ConfirmDialog'
import { ConexaoBanner } from '@/components/ui/ConexaoBanner'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CRM Imobiliário - Gestão de Leads e Vendas',
  description: 'Sistema de gerenciamento de leads e conversões para corretores de imóveis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ToastProvider>
            <GlobalToastSetter />
            <ConfirmProvider>
              <ConexaoBanner />
              <ErrorBoundary>
                <RouteShell>
                  {children}
                </RouteShell>
              </ErrorBoundary>
            </ConfirmProvider>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  )
}