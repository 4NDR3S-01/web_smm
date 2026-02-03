"use client";

import { useEffect, useState } from "react";
import { 
  ShoppingCart, 
  Package, 
  CreditCard,
  ArrowUpRight,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Clock,
  CheckCircle2,
  Sparkles,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Order } from "@/lib/types/database";
import { ORDER_STATUS, LOCALE } from "@/lib/constants/app";

interface DashboardStats {
  totalPedidos: number;
  pedidosActivos: number;
  pedidosCompletados: number;
  totalGastado: number;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalPedidos: 0,
    pedidosActivos: 0,
    pedidosCompletados: 0,
    totalGastado: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError("Usuario no autenticado");
          return;
        }

        // Cargar perfil del usuario
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profileError) {
          console.error("Error al cargar perfil:", profileError);
          console.error("Detalles del error:", {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          });
          setError(`Error al cargar el perfil: ${profileError.message}`);
        } else {
          setProfile(profileData);
        }

        // Cargar todos los pedidos del usuario
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (ordersError) {
          console.error("Error al cargar pedidos:", ordersError);
          console.error("Detalles del error:", {
            code: ordersError.code,
            message: ordersError.message,
            details: ordersError.details,
            hint: ordersError.hint
          });
        } else {
          // Calcular estadísticas
          const totalPedidos = ordersData?.length || 0;
          const pedidosActivos = ordersData?.filter(
            (o: Order) => o.status === ORDER_STATUS.PENDING || o.status === ORDER_STATUS.PROCESSING
          ).length || 0;
          const pedidosCompletados = ordersData?.filter(
            (o: Order) => o.status === ORDER_STATUS.COMPLETED
          ).length || 0;
          const totalGastado = ordersData?.reduce(
            (sum: number, o: Order) => sum + Number(o.price), 
            0
          ) || 0;

          setStats({
            totalPedidos,
            pedidosActivos,
            pedidosCompletados,
            totalGastado
          });

          // Guardar los últimos 3 pedidos
          setRecentOrders(ordersData?.slice(0, 3) || []);
        }
      } catch (err) {
        console.error("Error general:", err);
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const quickActions = [
    {
      icon: Instagram,
      title: "Instagram",
      description: "Seguidores, likes, vistas",
      href: "/dashboard/servicios/instagram",
      gradient: "from-pink-500 to-purple-500"
    },
    {
      icon: Youtube,
      title: "YouTube",
      description: "Suscriptores, vistas, likes",
      href: "/dashboard/servicios/youtube",
      gradient: "from-red-500 to-pink-500"
    },
    {
      icon: Facebook,
      title: "Facebook",
      description: "Seguidores, likes, shares",
      href: "/dashboard/servicios/facebook",
      gradient: "from-blue-600 to-blue-400"
    },
    {
      icon: Twitter,
      title: "X (Twitter)",
      description: "Seguidores, retweets, likes",
      href: "/dashboard/servicios/twitter",
      gradient: "from-gray-800 to-gray-600"
    },
  ];

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completado',
          icon: CheckCircle2,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900'
        };
      case 'processing':
        return {
          label: 'En proceso',
          icon: Clock,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900'
        };
      case 'pending':
        return {
          label: 'Pendiente',
          icon: Clock,
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900'
        };
      default:
        return {
          label: 'Desconocido',
          icon: Package,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-700'
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString(LOCALE);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center animate-pulse shadow-lg shadow-purple-500/50">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md border-red-200 dark:border-red-800">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Error al cargar los datos
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <div className="space-x-2">
              <Button onClick={() => globalThis.location.reload()}>
                Reintentar
              </Button>
              <Link href="/api/auth/signout">
                <Button variant="outline">
                  Cerrar Sesión
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              ¡Bienvenido de vuelta, {profile?.full_name || "Usuario"}!
            </h1>
            <p className="text-purple-100">
              Aquí está el resumen de tu cuenta SMM
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Balance
              </CardTitle>
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-white">
              ${profile?.balance?.toFixed(2) || "0.00"}
            </div>
            <Link href="/dashboard/billetera" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-2">
              Recargar saldo <ArrowUpRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
                Total Pedidos
              </CardTitle>
              <ShoppingCart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-white">
              {stats.totalPedidos}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
              Todos los tiempos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
                Completados
              </CardTitle>
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-white">
              {stats.pedidosCompletados}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              Total completados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">
                En Progreso
              </CardTitle>
              <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900 dark:text-white">
              {stats.pedidosActivos}
            </div>
            <Link href="/dashboard/pedidos" className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 mt-2">
              Ver pedidos <ArrowUpRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Servicios Populares
          </h2>
          <Link href="/dashboard/pedidos/nuevo">
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              Nuevo Pedido
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Link href={action.href} key={action.href}>
              <Card className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-purple-300 dark:hover:border-purple-700">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Pedidos Recientes</CardTitle>
              <CardDescription>Tus últimas transacciones</CardDescription>
            </div>
            <Link href="/dashboard/pedidos">
              <Button variant="ghost" size="sm">
                Ver todos <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusInfo.bgColor}`}>
                        <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {order.service_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Cantidad: {order.quantity.toLocaleString()} • {order.order_number}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No tienes pedidos recientes
                </p>
                <Link href="/dashboard/pedidos/nuevo">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                    Hacer tu primer pedido
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
