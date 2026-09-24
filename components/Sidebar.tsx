'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/service/authService';
import type { UsuarioAutenticado } from '@/types';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  Home,
  Users,
  User,
  UserCog,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  KeyRound,
  Menu,
  X,
  Building2,
  TrendingUp,
  Calendar,
  CheckCircle,
  Bell,
  AlertTriangle,
} from 'lucide-react';

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(() => authService.getUsuario());

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const handleLogout = async () => {
    await authService.logout(true);
    setUsuario(null);
  };

  const isActive = (path: string) => pathname === path;

  const labelPapel = (papel: string) => {
    const nomes: Record<string, string> = { admin: 'Administrador', corretor: 'Corretor', gestor: 'Gestor' };
    return nomes[papel] || papel;
  };

  const menuItems: (
    | { id: string; label: string; icon: React.ReactNode; path: string; adminOnly?: boolean; gestorOnly?: boolean; corretorOnly?: boolean }
    | { id: string; submenu: { label: string; path: string; icon?: React.ReactNode }[]; adminOnly?: boolean; gestorOnly?: boolean; corretorOnly?: boolean }
  )[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home size={20} />,
      path: '/dashboard',
    },
    {
      id: 'dashboard-gestor',
      label: 'Dashboard Gestor',
      icon: <BarChart3 size={20} />,
      path: '/dashboard/gestor',
      gestorOnly: true,
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: <Users size={20} />,
      path: '/leads',
    },
     {
      id: 'relogio-vendas',
      label: 'Relógio de Vendas',
      icon: <TrendingUp size={20} />,
      path: '/relogio-vendas',
    },
    {
      id: 'leads-exportar',
      label: 'Exportar Leads',
      icon: <FileText size={20} />,
      path: '/leads/exportar',
      corretorOnly: true,
    },
    {
      id: 'properties',
      label: 'Imóveis',
      icon: <Building2 size={20} />,
      path: '/properties',
    },
    {
      id: 'empreendimentos',
      label: 'Empreendimentos',
      icon: <Building2 size={20} />,
      path: '/empreendimentos',
    },
    {
      id: 'equipes',
      label: 'Equipes',
      icon: <Building2 size={20} />,
      path: '/equipes',
      adminOnly: true,
    },
    {
      id: 'redistribuicao',
      label: 'Redistribuição',
      icon: <AlertTriangle size={20} />,
      path: '/redistribuicao',
      gestorOnly: true,
    },
    {
      id: 'usuarios',
      label: 'Usuários',
      icon: <UserCog size={20} />,
      path: '/usuarios',
      adminOnly: true,
    },
    {
      id: 'notificacoes',
      label: 'Notificações',
      icon: <Bell size={20} />,
      path: '/notificacoes',
    },
    {
      id: 'perfil',
      label: 'Meu Perfil',
      icon: <User size={20} />,
      path: '/perfil',
    },
    // {
    //   id: 'analytics',
    //   // label: 'Análises',
    //   // icon: <BarChart3 size={20} />,
    //   submenu: [
    //     { label: 'Visão Geral', path: '/analytics', icon: <TrendingUp size={16} /> },
    //     // { label: 'Por Período', path: '/analytics/period', icon: <Calendar size={16} /> },
    //     // { label: 'Conversões', path: '/analytics/conversions', icon: <CheckCircle size={16} /> },
    //     { label: 'Por Período', path: '/analytics', icon: <Calendar size={16} /> },
    //     { label: 'Conversões', path: '/analytics', icon: <CheckCircle size={16} /> },
    //   ],
    // },
    // {
    //   id: 'reports',
    //   label: 'Relatórios',
    //   icon: <FileText size={20} />,
    //   path: '/reports',
    // },
    // {
    //   id: 'settings',
    //   label: 'Configurações',
    //   icon: <Settings size={20} />,
    //   path: '/settings',
    // },
  ];

  return (
    <div className="relative min-h-screen bg-surface">
      {/* Botão hamburger - mobile */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
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
          <p className="text-sm font-semibold text-white truncate">
            {usuario?.nome || 'Usuário'}
          </p>
          <p className="text-xs text-sidebar-fg/70 truncate">{usuario?.email || ''}</p>
          {usuario?.papel && (
            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full bg-accent text-on-accent">
              {labelPapel(usuario.papel)}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems
              .filter((item) => {
                if ((item as any).adminOnly && usuario?.papel !== 'admin') return false;
                if ((item as any).gestorOnly && !['admin','gestor'].includes(usuario?.papel || '')) return false;
                if ((item as any).corretorOnly && usuario?.papel !== 'corretor') return false;
                return true;
              })
              .map((item) => (
                <li key={item.id}>
                  {'submenu' in item ? (
                    <ul>
                      {item.submenu.map((subItem) => (
                        <li key={subItem.path}>
                          <Link
                            href={subItem.path}
                            onClick={closeSidebar}
                            className={`
                              flex items-center gap-3 px-3 py-2.5 rounded-btn transition-colors
                              ${
                                isActive(subItem.path)
                                  ? 'bg-accent text-on-accent font-semibold'
                                  : 'text-sidebar-fg hover:bg-white/10 hover:text-white'
                              }
                            `}
                          >
                            {subItem.icon}
                            <span className="text-sm">{subItem.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Link
                      href={item.path}
                      onClick={closeSidebar}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-btn transition-colors
                        ${
                          isActive(item.path)
                            ? 'bg-accent text-on-accent font-semibold'
                            : 'text-sidebar-fg hover:bg-white/10 hover:text-white'
                        }
                      `}
                    >
                      {item.icon}
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  )}
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
