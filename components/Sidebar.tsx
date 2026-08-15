'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/service/authService';
import type { UsuarioAutenticado } from '@/types';
import {
  Home,
  Users,
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

  const handleLogout = () => {
    authService.logout();
    setUsuario(null);
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  const labelPapel = (papel: string) => {
    const nomes: Record<string, string> = { admin: 'Administrador', corretor: 'Corretor' };
    return nomes[papel] || papel;
  };

  const menuItems: (
    | { id: string; label: string; icon: React.ReactNode; path: string; adminOnly?: boolean }
    | { id: string; submenu: { label: string; path: string; icon?: React.ReactNode }[]; adminOnly?: boolean }
  )[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home size={20} />,
      path: '/dashboard',
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: <Users size={20} />,
      path: '/leads',
    },
    //  {
    //   id: 'relogio-vendas',
    //   label: 'Relógio de Vendas',
    //   icon: <TrendingUp size={20} />,
    //   path: '/relogio-vendas',
    // },
    {
      id: 'properties',
      label: 'Imóveis',
      icon: <Building2 size={20} />,
      path: '/properties',
    },
    {
      id: 'usuarios',
      label: 'Usuários',
      icon: <UserCog size={20} />,
      path: '/usuarios',
      adminOnly: true,
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
    <div className="relative min-h-screen bg-gray-100">
      {/* Botão hamburger - mobile */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-white border border-gray-300 lg:hidden hover:bg-gray-100"
        >
          <Menu size={24} className="text-gray-700" />
        </button>
      )}

      {/* Overlay - mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-white z-50 
          ${isOpen ? 'block' : 'hidden lg:block'}
          border-r border-gray-300
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-300">
          <div className="flex items-center gap-2">
            <Building2 size={20} className="text-gray-800" />
            <span className="text-lg font-bold text-gray-800">CRM Imóveis</span>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-1 hover:bg-gray-100"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-gray-300">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {usuario?.nome || 'Usuário'}
          </p>
          <p className="text-xs text-gray-500 truncate">{usuario?.email || ''}</p>
          {usuario?.papel && (
            <span className="mt-1 inline-flex items-center px-2 py-0.5 text-xs bg-gray-200 text-gray-700">
              {labelPapel(usuario.papel)}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems
              .filter((item) => !item.adminOnly || usuario?.papel === 'admin')
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
                              flex items-center gap-3 px-3 py-2
                              ${
                                isActive(subItem.path)
                                  ? 'bg-gray-200 text-gray-900 font-medium'
                                  : 'text-gray-700 hover:bg-gray-100'
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
                        flex items-center gap-3 px-3 py-2
                        ${
                          isActive(item.path)
                            ? 'bg-gray-200 text-gray-900 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
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
        <div className="px-3 py-4 border-t border-gray-300 space-y-1">
          {/* <Link
            href="/trocar-senha"
            onClick={closeSidebar}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            <KeyRound size={20} />
            <span className="text-sm">Alterar senha</span>
          </Link> */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={20} />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-h-screen lg:ml-64">{children}</main>
    </div>
  );
}
