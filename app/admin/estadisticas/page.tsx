import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

export default async function EstadisticasPage() {
  const supabase = await createClient();

  // Obtener todas las órdenes con detalles
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, price, profit, created_at, service_name, service_type')
    .order('created_at', { ascending: false });

  // Obtener usuarios
  const { data: users } = await supabase
    .from('profiles')
    .select('id, role, created_at, balance');

  // Calcular períodos de tiempo
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Estadísticas del mes actual
  const ordersThisMonth = orders?.filter(o => new Date(o.created_at) >= startOfMonth) || [];
  const ordersLastMonth = orders?.filter(o => 
    new Date(o.created_at) >= startOfLastMonth && new Date(o.created_at) <= endOfLastMonth
  ) || [];
  const ordersLast7Days = orders?.filter(o => new Date(o.created_at) >= last7Days) || [];
  const ordersLast30Days = orders?.filter(o => new Date(o.created_at) >= last30Days) || [];

  // Estadísticas de ingresos
  const completedOrders = orders?.filter(o => o.status === 'completed') || [];
  const completedThisMonth = ordersThisMonth.filter(o => o.status === 'completed');
  const completedLastMonth = ordersLastMonth.filter(o => o.status === 'completed');

  // Ventas totales (precio de órdenes completadas)
  const salesThisMonth = completedThisMonth.reduce((sum, o) => sum + (o.price || 0), 0);
  const salesLastMonth = completedLastMonth.reduce((sum, o) => sum + (o.price || 0), 0);
  const totalSales = completedOrders.reduce((sum, o) => sum + (o.price || 0), 0);
  
  // Ganancias totales (profit de órdenes completadas)
  const profitThisMonth = completedThisMonth.reduce((sum, o) => sum + (o.profit || 0), 0);
  const profitLastMonth = completedLastMonth.reduce((sum, o) => sum + (o.profit || 0), 0);
  const totalProfit = completedOrders.reduce((sum, o) => sum + (o.profit || 0), 0);

  // Ingresos totales (suma de balances de usuarios)
  const totalUserBalance = users?.reduce((sum, u) => sum + (u.balance || 0), 0) || 0;

  // Calcular cambios porcentuales
  const salesChange = salesLastMonth > 0 
    ? ((salesThisMonth - salesLastMonth) / salesLastMonth) * 100 
    : 0;
  const profitChange = profitLastMonth > 0 
    ? ((profitThisMonth - profitLastMonth) / profitLastMonth) * 100 
    : 0;
  const ordersChange = ordersLastMonth.length > 0 
    ? ((ordersThisMonth.length - ordersLastMonth.length) / ordersLastMonth.length) * 100 
    : 0;

  // Estadísticas de usuarios
  const usersThisMonth = users?.filter(u => new Date(u.created_at) >= startOfMonth).length || 0;
  const usersLastMonth = users?.filter(u => 
    new Date(u.created_at) >= startOfLastMonth && new Date(u.created_at) <= endOfLastMonth
  ).length || 0;
  const usersChange = usersLastMonth > 0 
    ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100 
    : 0;

  interface ServiceStat {
    name: string;
    count: number;
    revenue: number;
    profit: number;
  }

  // Top servicios más vendidos
  const serviceStats = orders?.reduce((acc: Record<string, ServiceStat>, order) => {
    const serviceName = order.service_name || 'Sin nombre';
    if (!acc[serviceName]) {
      acc[serviceName] = {
        name: serviceName,
        count: 0,
        revenue: 0,
        profit: 0
      };
    }
    if (order.status === 'completed') {
      acc[serviceName].count += 1;
      acc[serviceName].revenue += order.price || 0;
      acc[serviceName].profit += order.profit || 0;
    }
    return acc;
  }, {});

  const topServices = Object.values(serviceStats || {})
    .sort((a: ServiceStat, b: ServiceStat) => b.revenue - a.revenue)
    .slice(0, 5);

  // Estadísticas por estado
  const ordersByStatus = {
    pending: orders?.filter(o => o.status === 'pending').length || 0,
    processing: orders?.filter(o => o.status === 'processing').length || 0,
    completed: orders?.filter(o => o.status === 'completed').length || 0,
    cancelled: orders?.filter(o => o.status === 'cancelled').length || 0,
    refunded: orders?.filter(o => o.status === 'refunded').length || 0,
  };

  // Tasa de conversión
  const conversionRate = orders && orders.length > 0 
    ? ((completedOrders.length / orders.length) * 100).toFixed(1)
    : '0';

  // Ticket promedio
  const averageTicket = completedOrders.length > 0 
    ? (totalSales / completedOrders.length).toFixed(2)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Estadísticas Avanzadas</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Análisis detallado del rendimiento de tu negocio
        </p>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ganancias Totales */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              profitChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {profitChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(profitChange).toFixed(1)}%
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ganancias Totales</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              ${totalProfit.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Profit de Órdenes
            </p>
          </div>
        </Card>

        {/* Ventas del Mes */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              salesChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {salesChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(salesChange).toFixed(1)}%
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ventas del Mes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              ${salesThisMonth.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              vs ${salesLastMonth.toFixed(2)} mes anterior
            </p>
          </div>
        </Card>

        {/* Órdenes del Mes */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <ShoppingCart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              ordersChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {ordersChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(ordersChange).toFixed(1)}%
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Órdenes del Mes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {ordersThisMonth.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              vs {ordersLastMonth.length} mes anterior
            </p>
          </div>
        </Card>

        {/* Nuevos Usuarios */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              usersChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {usersChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(usersChange).toFixed(1)}%
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Nuevos Usuarios</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {usersThisMonth}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              vs {usersLastMonth} mes anterior
            </p>
          </div>
        </Card>
      </div>

      {/* Métricas Secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Tasa de Conversión</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{conversionRate}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {completedOrders.length} de {orders?.length || 0} órdenes completadas
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
              <DollarSign className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Ticket Promedio</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">${averageTicket}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Por orden completada
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
              <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Rentabilidad</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0'}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Profit vs Ventas
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
              <DollarSign className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Balance Total</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            ${totalUserBalance.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Balance en Billeteras
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Servicios */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top 5 Servicios Más Vendidos
            </h3>
          </div>
          <div className="space-y-4">
            {topServices.length > 0 ? (
              topServices.map((service: ServiceStat) => (
                <div key={service.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {service.name}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ${service.revenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ 
                          width: `${topServices[0] ? (service.revenue / topServices[0].revenue) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-500 min-w-[60px] text-right">
                      {service.count} órdenes
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No hay datos disponibles
              </p>
            )}
          </div>
        </Card>

        {/* Órdenes por Estado */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Distribución de Órdenes
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Completadas</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {ordersByStatus.completed}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">En Proceso</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {ordersByStatus.processing}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Pendientes</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {ordersByStatus.pending}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Canceladas/Reembolsadas</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {ordersByStatus.cancelled + ordersByStatus.refunded}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Resumen Temporal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Últimos 7 Días</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Órdenes</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {ordersLast7Days.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Completadas</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {ordersLast7Days.filter(o => o.status === 'completed').length}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Últimos 30 Días</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Órdenes</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {ordersLast30Days.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Completadas</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {ordersLast30Days.filter(o => o.status === 'completed').length}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Total Histórico</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Ventas Totales</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                ${totalSales.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Ganancias Totales</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                ${totalProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
