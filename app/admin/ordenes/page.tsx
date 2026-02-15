'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Eye,
  DollarSign,
  User,
  Link2,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  order_number: string;
  target_url: string;
  quantity: number;
  price: number;
  profit?: number;
  status: string;
  started_count?: number;
  remains?: number;
  service_name: string;
  service_type: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPartialModal, setShowPartialModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [remainsInput, setRemainsInput] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, statusFilter, orders]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filtrar por búsqueda (ID de orden, link, o cliente)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(search) ||
          order.target_url.toLowerCase().includes(search) ||
          order.user.full_name.toLowerCase().includes(search) ||
          order.user.email.toLowerCase().includes(search)
      );
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Ordenar por fecha (más recientes primero)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredOrders(filtered);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string, remains?: number) => {
    try {
      const payload: any = { status: newStatus };
      
      // Si es parcial o cancelado, incluir remains
      if (newStatus === 'partial' && remains !== undefined) {
        payload.remains = remains;
      }

      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Estado actualizado correctamente');
        await fetchOrders();
        setSelectedOrder(null);
        setShowPartialModal(false);
        setShowCancelModal(false);
        setRemainsInput('');
      } else {
        toast.error(data.error || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const handlePartialSubmit = () => {
    if (!selectedOrder) return;

    const remains = Number.parseInt(remainsInput);
    if (Number.isNaN(remains) || remains < 0 || remains > selectedOrder.quantity) {
      toast.error('Cantidad inválida. Debe ser entre 0 y ' + selectedOrder.quantity);
      return;
    }

    handleUpdateStatus(selectedOrder.id, 'partial', remains);
  };

  const handleCancelOrder = () => {
    if (!selectedOrder) return;
    handleUpdateStatus(selectedOrder.id, 'canceled');
  };

  const handleSyncOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/sync`, {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Orden sincronizada');
        await fetchOrders();
      } else {
        toast.error(data.error || 'Error al sincronizar orden');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al sincronizar orden');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string; icon: any }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Pendiente', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'Procesando', icon: RefreshCw },
      completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Completado', icon: CheckCircle },
      partial: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', label: 'Parcial', icon: Package },
      cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Cancelado', icon: XCircle },
      refunded: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', label: 'Reembolsado', icon: DollarSign },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const stats = {
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing' || o.status === 'in_progress').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    failed: orders.filter((o) => o.status === 'canceled' || o.status === 'refunded').length,
    total: orders.length,
    totalRevenue: orders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.price, 0),
    totalProfit: orders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + (o.profit || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Órdenes</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Administra todas las órdenes del sistema
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.total}
          </p>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
            {stats.pending}
          </p>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Procesando</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stats.processing}
          </p>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Completadas</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {stats.completed}
          </p>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Fallidas</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {stats.failed}
          </p>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Ventas</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            ${stats.totalRevenue.toFixed(2)}
          </p>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Ganancia</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ${stats.totalProfit.toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por ID, link o cliente..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
            >
              Pendientes
            </Button>
            <Button
              variant={statusFilter === 'processing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('processing')}
            >
              Procesando
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('completed')}
            >
              Completadas
            </Button>
            <Button
              variant={statusFilter === 'canceled' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('canceled')}
            >
              Canceladas
            </Button>
          </div>
        </div>
      </Card>

      {/* Resultados */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredOrders.length} orden{filteredOrders.length === 1 ? '' : 'es'} encontrada{filteredOrders.length === 1 ? '' : 's'}
          </p>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No hay órdenes para mostrar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        #{order.order_number}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]" title={order.target_url}>
                        {order.target_url}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{order.user.full_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{order.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{order.service_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{order.service_type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {order.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ${order.price.toFixed(2)}
                      </div>
                      {order.profit !== undefined && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          +${order.profit.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status !== 'completed' && order.status !== 'canceled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSyncOrder(order.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de detalles */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <Card 
            className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 shadow-sm">
                    <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Orden #{selectedOrder.order_number}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(selectedOrder.created_at).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-5">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado actual:</p>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(selectedOrder.status)}
                    {selectedOrder.status === 'processing' && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        En proceso...
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</p>
                  </div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">{selectedOrder.user.full_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedOrder.user.email}</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Servicio</p>
                  </div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">{selectedOrder.service_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">{selectedOrder.service_type}</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">URL de destino</p>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 break-all hover:underline">
                    <a href={selectedOrder.target_url} target="_blank" rel="noopener noreferrer">
                      {selectedOrder.target_url}
                    </a>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Cantidad</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {selectedOrder.quantity.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Precio Total</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      ${selectedOrder.price.toFixed(2)}
                    </p>
                    {selectedOrder.profit !== undefined && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Ganancia: +${selectedOrder.profit.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Barra de progreso si está en proceso */}
                {selectedOrder.status === 'processing' && selectedOrder.started_count !== undefined && selectedOrder.remains !== undefined && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Progreso del servicio</p>
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                        {Math.round(((selectedOrder.quantity - selectedOrder.remains) / selectedOrder.quantity) * 100)}%
                      </p>
                    </div>
                    <div className="w-full h-3 bg-blue-100 dark:bg-blue-900/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 rounded-full"
                        style={{ 
                          width: `${Math.round(((selectedOrder.quantity - selectedOrder.remains) / selectedOrder.quantity) * 100)}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-blue-600 dark:text-blue-400">
                      <span>Entregados: {(selectedOrder.quantity - selectedOrder.remains).toLocaleString()}</span>
                      <span>Pendientes: {selectedOrder.remains.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {(selectedOrder.started_count !== undefined || selectedOrder.remains !== undefined) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedOrder.started_count !== undefined && (
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Contador Inicial</p>
                        <p className="text-xl font-bold text-purple-900 dark:text-purple-100">{selectedOrder.started_count.toLocaleString()}</p>
                      </div>
                    )}
                    {selectedOrder.remains !== undefined && (
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Restantes</p>
                        <p className="text-xl font-bold text-orange-900 dark:text-orange-100">{selectedOrder.remains.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Cambiar estado de la orden:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      variant={selectedOrder.status === 'pending' ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'pending')}
                      className="hover:scale-105 transition-transform"
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Pendiente
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedOrder.status === 'processing' ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'processing')}
                      className="hover:scale-105 transition-transform hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Procesando
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedOrder.status === 'completed' ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                      className="hover:scale-105 transition-transform hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Completado
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedOrder.status === 'partial' ? 'default' : 'outline'}
                      onClick={() => setShowPartialModal(true)}
                      className="hover:scale-105 transition-transform hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    >
                      <Package className="h-4 w-4 mr-1" />
                      Parcial
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedOrder.status === 'canceled' ? 'default' : 'outline'}
                      onClick={() => setShowCancelModal(true)}
                      className="hover:scale-105 transition-transform hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de confirmación para estado PARCIAL */}
      {showPartialModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPartialModal(false)}>
          <Card 
            className="max-w-md w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    Marcar como Parcial
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Orden #{selectedOrder.order_number}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                  <strong>¿Qué es estado parcial?</strong>
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Se usa cuando la orden no se completó al 100%. Por ejemplo, si se pidieron 1000 seguidores pero solo se entregaron 700, 
                  el cliente pagará solo por los 700 entregados y se le reembolsará automáticamente el costo de los 300 restantes.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remains" className="text-gray-700 dark:text-gray-300">
                  Cantidad que NO se entregó (Restantes)
                </Label>
                <Input
                  id="remains"
                  type="number"
                  min="0"
                  max={selectedOrder.quantity}
                  value={remainsInput}
                  onChange={(e) => setRemainsInput(e.target.value)}
                  placeholder={`Máximo: ${selectedOrder.quantity}`}
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cantidad total solicitada: <strong>{selectedOrder.quantity.toLocaleString()}</strong>
                </p>
                {remainsInput && !Number.isNaN(Number.parseInt(remainsInput)) && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Cantidad entregada: <strong>{(selectedOrder.quantity - Number.parseInt(remainsInput)).toLocaleString()}</strong>
                      <br />
                      Porcentaje completado: <strong>{Math.round(((selectedOrder.quantity - Number.parseInt(remainsInput)) / selectedOrder.quantity) * 100)}%</strong>
                      <br />
                      Se reembolsará aproximadamente: <strong>${((selectedOrder.price * Number.parseInt(remainsInput)) / selectedOrder.quantity).toFixed(2)}</strong>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowPartialModal(false);
                    setRemainsInput('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={handlePartialSubmit}
                  disabled={!remainsInput || Number.isNaN(Number.parseInt(remainsInput))}
                >
                  Confirmar Estado Parcial
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de confirmación para CANCELAR orden */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCancelModal(false)}>
          <Card 
            className="max-w-md w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    Cancelar Orden
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Orden #{selectedOrder.order_number}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                  <strong>⚠️ Esta acción realizará lo siguiente:</strong>
                </p>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                  <li>Se cancelará completamente la orden</li>
                  <li>Se reembolsará <strong>${selectedOrder.price.toFixed(2)}</strong> al cliente</li>
                  <li>El saldo se acreditará automáticamente en su billetera</li>
                </ul>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Cliente:</strong> {selectedOrder.user.full_name}<br />
                  <strong>Servicio:</strong> {selectedOrder.service_name}<br />
                  <strong>Cantidad:</strong> {selectedOrder.quantity.toLocaleString()}<br />
                  <strong>Precio pagado:</strong> ${selectedOrder.price.toFixed(2)}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCancelModal(false)}
                >
                  No, Mantener Orden
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleCancelOrder}
                >
                  Sí, Cancelar y Reembolsar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
