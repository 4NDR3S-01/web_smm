"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Sparkles, 
  Home, 
  ShoppingCart, 
  Package, 
  CreditCard, 
  Users, 
  Settings, 
  LifeBuoy,
  BarChart3,
  UserCog,
  Ticket,
  Database,
  X,
  Instagram,
  Youtube,
  Facebook,
  Twitter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants/app";

interface SidebarProps {
  user: any;
  profile: any;
}

const clienteMenu = [
  {
    title: "Principal",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Nuevo Pedido", href: "/dashboard/pedidos/nuevo", icon: ShoppingCart },
    ]
  },
  {
    title: "Mis Pedidos",
    items: [
      { name: "Pedidos Activos", href: "/dashboard/pedidos", icon: Package },
      { name: "Historial", href: "/dashboard/historial", icon: BarChart3 },
    ]
  },
  {
    title: "Servicios Populares",
    items: [
      { name: "Instagram", href: "/dashboard/servicios/instagram", icon: Instagram },
      { name: "TikTok", href: "/dashboard/servicios/tiktok", icon: Package },
      { name: "YouTube", href: "/dashboard/servicios/youtube", icon: Youtube },
      { name: "Facebook", href: "/dashboard/servicios/facebook", icon: Facebook },
      { name: "X (Twitter)", href: "/dashboard/servicios/twitter", icon: Twitter },
    ]
  },
  {
    title: "Cuenta",
    items: [
      { name: "Billetera", href: "/dashboard/billetera", icon: CreditCard },
      { name: "Soporte", href: "/dashboard/soporte", icon: LifeBuoy },
      { name: "Configuración", href: "/dashboard/configuracion", icon: Settings },
    ]
  }
];

const distribuidorMenu = [
  {
    title: "Principal",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Nuevo Pedido", href: "/dashboard/pedidos/nuevo", icon: ShoppingCart },
    ]
  },
  {
    title: "Revendedor",
    items: [
      { name: "Mis Clientes", href: "/dashboard/clientes", icon: Users },
      { name: "Mis Pedidos", href: "/dashboard/pedidos", icon: Package },
      { name: "Comisiones", href: "/dashboard/comisiones", icon: BarChart3 },
    ]
  },
  {
    title: "Cuenta",
    items: [
      { name: "Billetera", href: "/dashboard/billetera", icon: CreditCard },
      { name: "Soporte", href: "/dashboard/soporte", icon: LifeBuoy },
      { name: "Configuración", href: "/dashboard/configuracion", icon: Settings },
    ]
  }
];

const soporteMenu = [
  {
    title: "Principal",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Tickets", href: "/dashboard/tickets", icon: Ticket },
    ]
  },
  {
    title: "Gestión",
    items: [
      { name: "Usuarios", href: "/dashboard/usuarios", icon: Users },
      { name: "Pedidos", href: "/dashboard/pedidos", icon: Package },
    ]
  },
  {
    title: "Cuenta",
    items: [
      { name: "Configuración", href: "/dashboard/configuracion", icon: Settings },
    ]
  }
];

const adminMenu = [
  {
    title: "Principal",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Estadísticas", href: "/dashboard/estadisticas", icon: BarChart3 },
    ]
  },
  {
    title: "Gestión",
    items: [
      { name: "Usuarios", href: "/dashboard/usuarios", icon: Users },
      { name: "Pedidos", href: "/dashboard/pedidos", icon: Package },
      { name: "Servicios", href: "/dashboard/servicios-admin", icon: Database },
      { name: "Tickets", href: "/dashboard/tickets", icon: Ticket },
    ]
  },
  {
    title: "Finanzas",
    items: [
      { name: "Transacciones", href: "/dashboard/transacciones", icon: CreditCard },
      { name: "Comisiones", href: "/dashboard/comisiones", icon: BarChart3 },
    ]
  },
  {
    title: "Sistema",
    items: [
      { name: "Configuración", href: "/dashboard/configuracion", icon: Settings },
      { name: "Administradores", href: "/dashboard/administradores", icon: UserCog },
    ]
  }
];

export default function DashboardSidebar({ user, profile }: SidebarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determinar menú según el rol
  const getMenuByRole = () => {
    const role = profile?.role || "cliente";
    switch (role) {
      case "admin":
        return adminMenu;
      case "soporte":
        return soporteMenu;
      case "distribuidor":
        return distribuidorMenu;
      default:
        return clienteMenu;
    }
  };

  const menuItems = getMenuByRole();

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {APP_NAME}
            </span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Sidebar Desktop */}
      <aside className={cn(
        "fixed top-0 left-0 z-40 h-screen w-64 transition-transform bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {APP_NAME}
              </span>
            </Link>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {profile?.full_name || "Usuario"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {profile?.role || "cliente"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            {menuItems.map((section) => (
              <div key={section.title}>
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                          isActive
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                ¿Necesitas ayuda?
              </p>
              <Link 
                href="/dashboard/soporte"
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
              >
                Contacta a soporte →
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          role="button"
          tabIndex={0}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setMobileMenuOpen(false);
            }
          }}
        />
      )}
    </>
  );
}
