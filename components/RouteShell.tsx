'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { authService } from '@/service/authService';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';

const PUBLIC_ROUTES = ['/login', '/trocar-senha'];
const ADMIN_ROUTES = ['/usuarios'];
const GESTOR_ROUTES = ['/dashboard/gestor'];

export default function RouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const enabledInactivity = !isPublic && typeof window !== 'undefined' && !!authService.getUsuario();
  const { showWarning, countdown, keepAlive, logout } = useInactivityLogout({ enabled: enabledInactivity });

  useEffect(() => {
    const authenticated = authService.isAuthenticated();
    const isAdminRoute = ADMIN_ROUTES.includes(pathname);
    const isGestorRoute = GESTOR_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));

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
        // valida também se token está expirado mesmo com troca obrigatória
        if (authService.isExpired()) {
          authService.logoutLocal();
          router.replace('/login?reason=expired');
          return;
        }
      }
    } else {
      if (!authenticated) {
        const fetched = authService.getUsuario();
        if (!fetched) {
          router.replace('/login?reason=expired');
          return;
        }
        // se tem usuario mas token expirou, api.ts tentará refresh antes de cair aqui
        if (authService.isExpired()) {
          router.replace('/login?reason=expired');
          return;
        }
      }

      if (authService.trocarSenhaObrigatoria()) {
        router.replace('/trocar-senha');
        return;
      }

      if (isAdminRoute && authService.getUsuario()?.papel !== 'admin') {
        router.replace('/dashboard');
        return;
      }

      if (isGestorRoute && !['admin','gestor'].includes(authService.getUsuario()?.papel || '')) {
        router.replace('/dashboard');
        return;
      }
    }

    setChecked(true);
  }, [pathname, router, isPublic]);

  if (!checked) return null;

  const inactivityModal = showWarning ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-card shadow-card-lg max-w-md w-full p-6 border border-line">
        <h3 className="text-lg font-bold text-ink">Sessão expirando</h3>
        <p className="text-sm text-muted mt-2">Você ficou inativo por 30 minutos. Sua sessão será encerrada em <span className="font-bold text-ink">{countdown}s</span> e você será redirecionado para o login.</p>
        <div className="mt-5 flex gap-3">
          <button onClick={keepAlive} className="flex-1 py-2.5 bg-primary text-white rounded-btn font-semibold shadow-btn hover:bg-primary-700">Continuar logado</button>
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
