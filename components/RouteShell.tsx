'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { authService } from '@/service/authService';

const PUBLIC_ROUTES = ['/login', '/trocar-senha'];
const ADMIN_ROUTES = ['/usuarios'];

export default function RouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const authenticated = authService.isAuthenticated();
    const isPublic = PUBLIC_ROUTES.includes(pathname);
    const isAdminRoute = ADMIN_ROUTES.includes(pathname);

    if (isPublic) {
      if (pathname === '/login') {
        if (authenticated) {
          router.replace(authService.trocarSenhaObrigatoria() ? '/trocar-senha' : '/dashboard');
          return;
        }
      } else if (pathname === '/trocar-senha') {
        if (!authenticated) {
          router.replace('/login');
          return;
        }
      }
    } else {
      if (!authenticated) {
        router.replace('/login');
        return;
      }

      if (authService.trocarSenhaObrigatoria()) {
        router.replace('/trocar-senha');
        return;
      }

      if (isAdminRoute && authService.getUsuario()?.papel !== 'admin') {
        router.replace('/dashboard');
        return;
      }
    }

    setChecked(true);
  }, [pathname, router]);

  if (!checked) return null;

  if (PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return <Sidebar>{children}</Sidebar>;
}
