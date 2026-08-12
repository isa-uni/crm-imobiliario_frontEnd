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
  ChevronDown,
  ChevronRight,
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
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
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

  const toggleSubmenu = (menu: string) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  };

  const isActive = (path: string) => pathname === path;

  const iniciais = (nome: string) => {
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
  };

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
    {
      id: 'analytics',
      // label: 'Análises',
      // icon: <BarChart3 size={20} />,
      submenu: [
        { label: 'Visão Geral', path: '/analytics', icon: <TrendingUp size={16} /> },
        // { label: 'Por Período', path: '/analytics/period', icon: <Calendar size={16} /> },
        // { label: 'Conversões', path: '/analytics/conversions', icon: <CheckCircle size={16} /> },
        { label: 'Por Período', path: '/analytics', icon: <Calendar size={16} /> },
        { label: 'Conversões', path: '/analytics', icon: <CheckCircle size={16} /> },
      ],
    },
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
    <div className="relative min-h-screen bg-gray-50">
      {/* Botão hamburger - mobile */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg lg:hidden hover:bg-gray-100 transition-colors"
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
          fixed top-0 left-0 h-screen w-64 bg-white shadow-lg z-50 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          border-r border-gray-200
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-800">CRM Imóveis</span>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {usuario ? iniciais(usuario.nome) : '--'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {usuario?.nome || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 truncate">{usuario?.email || ''}</p>
              {usuario?.papel && (
                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
                  {labelPapel(usuario.papel)}
                </span>
              )}
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems
              .filter((item) => !item.adminOnly || usuario?.papel === 'admin')
              .map((item) => (
              <li key={item.id}>
                {'submenu' in item ? (
                  // Item com submenu
                  <div>
                    {/* <button
                      onClick={() => toggleSubmenu(item.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      {openSubmenu === item.id ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button> */}
                    
                    {/* Submenu */}
                    {/* {openSubmenu === item.id && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {item.submenu.map((subItem) => (
                          <li key={subItem.path}>
                            <Link
                              href={subItem.path}
                              onClick={closeSidebar}
                              className={`
                                flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors
                                ${
                                  isActive(subItem.path)
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }
                              `}
                            >
                              {subItem.icon}
                              <span>{subItem.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )} */}
                  </div>
                ) : (
                  // Item sem submenu
                  <Link
                    href={item.path}
                    onClick={closeSidebar}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                      ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-200 space-y-1">
          <Link
            href="/trocar-senha"
            onClick={closeSidebar}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <KeyRound size={20} />
            <span className="text-sm font-medium">Alterar senha</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`
          min-h-screen transition-all duration-300
          lg:ml-64
        `}
      >
        {children}
      </main>
    </div>
  );
}
