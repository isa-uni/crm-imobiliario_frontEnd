'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { authService } from '@/service/authService';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';
import { ROTAS_PUBLICAS, podeAcessarRota } from '@/lib/acesso';

export default function RouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const isPublic = ROTAS_PUBLICAS.includes(pathname);
  const enabledInactivity = !isPublic && typeof window !== 'undefined' && !!authService.getUsuario();
  const { showWarning, countdown, keepAlive, logout } = useInactivityLogout({ enabled: enabledInactivity });

  useEffect(() => {
    const authenticated = authService.isAuthenticated();

    if (isPublic) {
      if (pathname === '/login') {
        if (authenticated) {
          router.replace(authService.trocarSenhaObrigatoria() ? '/trocar-senha' : '/dashboard');
          return;
        }
      } else if (pathname === '/trocar-senha') {
        if (!authenticated) {
          router.replace('/login?reason=expired');
          return;
        }
      }
    } else {
      // A validade do token (cookie httpOnly) é verificada pelo backend: se o access token expirou,
      // api.ts renova com o refresh token antes de mandar o usuário para o login.
      if (!authenticated) {
        router.replace('/login?reason=expired');
        return;
      }

      if (authService.trocarSenhaObrigatoria()) {
        router.replace('/trocar-senha');
        return;
      }

      // mesma regra do menu (lib/acesso.ts); papel sem acesso volta para o dashboard
      if (!podeAcessarRota(pathname, authService.getUsuario()?.papel)) {
        router.replace('/dashboard');
        return;
      }
    }

    setChecked(true);
  }, [pathname, router, isPublic]);

  if (!checked) return null;

  const inactivityModal = showWarning ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay/50 p-4">
      <div className="bg-card rounded-card shadow-card-lg max-w-md w-full p-6 border border-line">
        <h3 className="text-lg font-bold text-ink">Sessão expirando</h3>
        <p className="text-sm text-muted mt-2">Você ficou inativo por 30 minutos. Sua sessão será encerrada em <span className="font-bold text-ink">{countdown}s</span> e você será redirecionado para o login.</p>
        <div className="mt-5 flex gap-3">
          <button onClick={keepAlive} className="flex-1 py-2.5 bg-brand text-on-brand rounded-btn font-semibold shadow-btn hover:bg-brand-hover">Continuar logado</button>
          <button onClick={logout} className="px-4 py-2.5 border border-line rounded-btn text-muted hover:bg-surface">Sair agora</button>
        </div>
      </div>
    </div>
  ) : null

  if (isPublic) {
    return <>{inactivityModal}{children}</>;
  }

  return <Sidebar>{inactivityModal}{children}</Sidebar>;
}
