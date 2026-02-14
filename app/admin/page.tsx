import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Ticket,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

export default async function AdminPage() {
  const supabase = await createClient();

  // Obtener estadísticas detalladas
  const [providers, services, orders, users, tickets, recentOrdersData] = await Promise.all([
    supabase.from('api_providers').select('id, status, balance').eq('status', true),
    supabase.from('services').select('id, is_active, category_id'),
    supabase.from('orders').select('id, status, price, profit, created_at'),
    supabase.from('profiles').select('id, role, created_at, balance'),
    supabase.from('support_tickets').select('id, status, priority, created_at'),
    supabase.from('orders')
      .select('id, order_number, service_name, status, price, created_at, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  interface ServiceData {
    is_active: boolean;
    category_id: string;
  }
  
  interface OrderData {
    status: string;
    price: number;
    profit?: number;
    created_at: string;
  }

  interface UserData {
    role: string;
    created_at: string;
    balance: number;
  }

  interface TicketData {
    status: string;
    priority: string;
    created_at: string;
  }

  // Estadísticas generales
  const stats = {
    activeProviders: providers.data?.length || 0,
    totalBalance: providers.data?.reduce((sum, p) => sum + (p.balance || 0), 0) || 0,
    totalServices: services.data?.length || 0,
    activeServices: services.data?.filter((s: ServiceData) => s.is_active).length || 0,
    totalOrders: orders.data?.length || 0,
    pendingOrders: orders.data?.filter((o: OrderData) => o.status === 'pending').length || 0,
    processingOrders: orders.data?.filter((o: OrderData) => ['processing', 'in_progress'].includes(o.status)).length || 0,
    completedOrders: orders.data?.filter((o: OrderData) => o.status === 'completed').length || 0,
    // Ganancias totales (profit de órdenes completadas)
    totalProfit: orders.data
      ?.filter((o: OrderData) => o.status === 'completed')
      .reduce((sum: number, o: OrderData) => sum + (o.profit || 0), 0) || 0,
    // Ventas totales (precio de órdenes completadas)
    totalSales: orders.data
      ?.filter((o: OrderData) => o.status === 'completed')
      .reduce((sum: number, o: OrderData) => sum + o.price, 0) || 0,
    totalUsers: users.data?.length || 0,
    clientUsers: users.data?.filter((u: UserData) => u.role === 'cliente').length || 0,
    distribuidorUsers: users.data?.filter((u: UserData) => u.role === 'distribuidor').length || 0,
    totalTickets: tickets.data?.length || 0,
    openTickets: tickets.data?.filter((t: TicketData) => t.status === 'open').length || 0,
    urgentTickets: tickets.data?.filter((t: TicketData) => t.priority === 'urgent' && t.status !== 'closed').length || 0,
  };

  // Calcular estadísticas de los últimos 7 días
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentOrders = orders.data?.filter((o: OrderData) => 
    new Date(o.created_at) >= sevenDaysAgo
  ).length || 0;

  const recentUsers = users.data?.filter((u: UserData) => 
    new Date(u.created_at) >= sevenDaysAgo
  ).length || 0;

  // Helper functions para estados de órdenes
  const getStatusBadgeClass = (status: string) => {
    const statusClasses: Record<string, string> = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      refunded: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return statusClasses[status] || statusClasses.pending;
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      completed: 'Completado',
      processing: 'Procesando',
      pending: 'Pendiente',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado',
    };
    return statusLabels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Panel de Administración</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Vista general del sistema y estadísticas en tiempo real
        </p>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Ventas Totales</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">
                ${stats.totalSales.toFixed(2)}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Órdenes Completadas
              </p>
            </div>
            <div className="h-14 w-14 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Órdenes Totales</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">
                {stats.totalOrders}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {stats.completedOrders} completadas
              </p>
            </div>
            <div className="h-14 w-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingCart className="h-7 w-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Usuarios</p>
              <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100 mt-2">
                {stats.totalUsers}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                {stats.clientUsers} clientes
              </p>
            </div>
            <div className="h-14 w-14 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Tickets</p>
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-2">
                {stats.openTickets}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {stats.urgentTickets} urgentes
              </p>
            </div>
            <div className="h-14 w-14 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Ticket className="h-7 w-7 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Estado de Órdenes y Servicios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado de Órdenes */}
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estado de Órdenes</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pendientes</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.pendingOrders}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${stats.totalOrders > 0 ? (stats.pendingOrders / stats.totalOrders) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Procesando</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.processingOrders}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${stats.totalOrders > 0 ? (stats.processingOrders / stats.totalOrders) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Completadas</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.completedOrders}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${stats.totalOrders > 0 ? (stats.completedOrders / stats.totalOrders) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Distribución de Usuarios */}
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribución de Usuarios</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Clientes</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.clientUsers}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${stats.totalUsers > 0 ? (stats.clientUsers / stats.totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Distribuidores</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.distribuidorUsers}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${stats.totalUsers > 0 ? (stats.distribuidorUsers / stats.totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Proveedores Activos</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Balance: ${stats.totalBalance.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeProviders}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stats.activeServices} servicios</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Alertas y Notificaciones */}
      {(stats.urgentTickets > 0 || stats.pendingOrders > 10) && (
        <Card className="p-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900 dark:text-amber-100">Atención requerida</h4>
              <div className="text-sm text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                {stats.urgentTickets > 0 && (
                  <p>• {stats.urgentTickets} ticket{stats.urgentTickets > 1 ? 's' : ''} urgente{stats.urgentTickets > 1 ? 's' : ''} sin resolver</p>
                )}
                {stats.pendingOrders > 10 && (
                  <p>• {stats.pendingOrders} órdenes pendientes de procesamiento</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Órdenes Recientes */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Órdenes Recientes
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Orden</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Cliente</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Servicio</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Estado</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Monto</th>
              </tr>
            </thead>
            <tbody>
              {recentOrdersData.data && recentOrdersData.data.length > 0 ? (
                recentOrdersData.data.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">
                      {order.order_number}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">
                      {order.profiles?.full_name || 'N/A'}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">
                      {order.service_name}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm font-medium text-right text-gray-900 dark:text-white">
                      ${order.price.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No hay órdenes recientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
