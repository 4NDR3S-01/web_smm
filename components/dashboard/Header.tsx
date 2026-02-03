"use client";

import { useState, useEffect } from "react";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  user: any;
  profile: any;
}

export default function DashboardHeader({ user, profile }: HeaderProps) {
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const supabase = createClient();
        
        // Verificar pedidos en proceso o pendientes
        const { data: orders } = await supabase
          .from("orders")
          .select("id, status")
          .eq("user_id", user.id)
          .in("status", ["pending", "processing"]);

        setUnreadNotifications(orders?.length || 0);
      } catch (err) {
        console.error("Error al cargar notificaciones:", err);
      }
    };

    checkNotifications();
  }, [user.id]);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar servicios, pedidos..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-semibold">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {profile?.full_name || "Usuario"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ${profile?.balance || "0.00"}
                </p>
              </div>
              <form action="/api/auth/signout" method="post">
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Salir
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
