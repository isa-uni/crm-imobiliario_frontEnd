'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/service/authService';
import type { UsuarioAutenticado } from '@/types';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { podeVerNoMenu } from '@/lib/acesso';
import NotificacoesSino from '@/components/NotificacoesSino';
import {
  Home,
  Users,
  User,
  UserCog,
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X,
  Building2,
  TrendingUp,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';

interface SidebarProps {
  children: React.ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
  { id: 'dashboard-gestor', label: 'Dashboard Gestor', icon: BarChart3, path: '/dashboard/gestor' },
  { id: 'leads', label: 'Leads', icon: Users, path: '/leads' },
  { id: 'relogio-vendas', label: 'Relógio de Vendas', icon: TrendingUp, path: '/relogio-vendas' },
  { id: 'leads-exportar', label: 'Exportar Leads', icon: FileText, path: '/leads/exportar' },
  { id: 'properties', label: 'Imóveis', icon: Building2, path: '/properties' },
  { id: 'empreendimentos', label: 'Empreendimentos', icon: Building2, path: '/empreendimentos' },
  { id: 'equipes', label: 'Equipes', icon: Building2, path: '/equipes' },
  { id: 'redistribuicao', label: 'Redistribuição', icon: AlertTriangle, path: '/redistribuicao' },
  { id: 'usuarios', label: 'Usuários', icon: UserCog, path: '/usuarios' },
  { id: 'perfil', label: 'Meu Perfil', icon: User, path: '/perfil' },
];

const NOMES_PAPEL: Record<string, string> = { admin: 'Administrador', corretor: 'Corretor', gestor: 'Gestor' };

// visibilidade por papel vem de lib/acesso.ts (mesma regra da guarda de rotas do RouteShell)
function podeVer(item: MenuItem, papel?: string) {
  return podeVerNoMenu(item.path, papel);
}

export default function Sidebar({ children }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(() => authService.getUsuario());

  const closeSidebar = () => setIsOpen(false);

  const handleLogout = async () => {
    await authService.logout(true);
    setUsuario(null);
  };

  return (
    <div className="relative min-h-screen bg-surface">
      {/* Botão hamburger - mobile */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-card border border-line rounded-btn shadow-card lg:hidden hover:bg-surface"
        >
          <Menu size={24} className="text-brand-fg" />
        </button>
      )}

      {/* Overlay - mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-overlay/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen h-[100dvh] w-64 bg-sidebar z-50 flex-col
          ${isOpen ? 'flex' : 'hidden lg:flex'}
        `}
      >
        {/* Header / Brand */}
        <div className="shrink-0 flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-orange-600 flex items-center justify-center text-on-accent font-black shadow-btn">
              <Building2 size={20} />
            </span>
            <div className="leading-tight">
              <span className="text-base font-extrabold text-white tracking-tight">CRM Imóveis</span>
              <span className="block text-[11px] font-medium text-sidebar-fg/70">Gestão de leads e vendas</span>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-1 rounded-lg hover:bg-white/10 text-sidebar-fg"
          >
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        <div className="shrink-0 px-4 py-4 border-b border-white/10">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {usuario?.nome || 'Usuário'}
              </p>
              <p className="text-xs text-sidebar-fg/70 truncate">{usuario?.email || ''}</p>
            </div>
            {/* notificações ficam sempre à mão, sem tela própria */}
            <NotificacoesSino ocultarGatilhoMovel={isOpen} />
          </div>
          {usuario?.papel && (
            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full bg-accent text-on-accent">
              {NOMES_PAPEL[usuario.papel] || usuario.papel}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {MENU_ITEMS.filter((item) => podeVer(item, usuario?.papel)).map(({ id, label, icon: Icon, path }) => (
              <li key={id}>
                <Link
                  href={path}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-btn transition-colors ${
                    pathname === path
                      ? 'bg-accent text-on-accent font-semibold'
                      : 'text-sidebar-fg hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="shrink-0 px-3 py-4 border-t border-white/10 space-y-1">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-btn text-sidebar-fg hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-h-screen lg:ml-64 bg-surface">{children}</main>
    </div>
  );
}
