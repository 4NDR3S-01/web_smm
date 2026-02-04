"use client";

import { useEffect, useState } from "react";
import { 
  History, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Download,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  Eye
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types/database";
import { ORDER_STATUS } from "@/lib/constants/app";

type DateRange = "7days" | "30days" | "90days" | "all";
type StatusFilter = "all" | "completed" | "cancelled";

export default function HistorialPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("30days");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadHistoricalOrders();
  }, [dateRange, statusFilter]);

  const loadHistoricalOrders = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Calcular fecha de inicio según el rango seleccionado
      const now = new Date();
      let startDate: Date | null = null;
      
      if (dateRange !== "all") {
        const days = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : 90;
        startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      }

      let query = supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id);

      // Filtrar por estado (solo completados y cancelados en historial)
      if (statusFilter === "all") {
        query = query.in("status", [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED]);
      } else {
        query = query.eq("status", statusFilter);
      }

      // Filtrar por fecha si no es "all"
      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error al cargar historial:", error);
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const stats = {
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.status === ORDER_STATUS.COMPLETED).length,
    cancelledOrders: orders.filter(o => o.status === ORDER_STATUS.CANCELLED).length,
    totalSpent: orders.reduce((sum, o) => sum + Number(o.price), 0),
    avgOrderValue: orders.length > 0 
      ? orders.reduce((sum, o) => sum + Number(o.price), 0) / orders.length 
      : 0,
  };

  // Filtrar pedidos por búsqueda
  const filteredOrders = orders.filter(order => {
    if (searchTerm === "") return true;
    
    const term = searchTerm.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(term) ||
      order.service_name.toLowerCase().includes(term) ||
      order.target_url.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status: string) => {
    if (status === ORDER_STATUS.COMPLETED) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
          <CheckCircle2 className="w-3 h-3" /> Completado
        </span>
      );
    } else if (status === ORDER_STATUS.CANCELLED) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
          <XCircle className="w-3 h-3" /> Cancelado
        </span>
      );
    }
    return null;
  };

  const exportToCSV = () => {
    const headers = ["ID", "Servicio", "Cantidad", "Estado", "Fecha", "Precio"];
    const rows = filteredOrders.map(order => [
      order.order_number,
      order.service_name,
      order.quantity,
      order.status,
      new Date(order.created_at).toLocaleDateString('es-ES'),
      Number(order.price).toFixed(2)
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historial-pedidos-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <History className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Historial de Pedidos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Revisa el historial completo de tus pedidos finalizados
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          disabled={filteredOrders.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <History className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-white mb-1">
              {stats.totalOrders}
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300">Total Pedidos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-white mb-1">
              {stats.completedOrders}
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">Completados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-900 dark:text-white mb-1">
              {stats.cancelledOrders}
            </div>
            <p className="text-sm text-red-700 dark:text-red-300">Cancelados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-white mb-1">
              ${stats.totalSpent.toFixed(2)}
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">Total Gastado</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-orange-900 dark:text-white mb-1">
              ${stats.avgOrderValue.toFixed(2)}
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300">Promedio/Pedido</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search and Filter Toggle */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por ID, servicio o URL..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full md:w-auto"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant={statusFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("all")}
                      className={statusFilter === "all" ? "bg-gradient-to-r from-purple-600 to-blue-600" : ""}
                    >
                      Todos
                    </Button>
                    <Button
                      variant={statusFilter === "completed" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("completed")}
                      className={statusFilter === "completed" ? "bg-green-600" : ""}
                    >
                      Completados
                    </Button>
                    <Button
                      variant={statusFilter === "cancelled" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("cancelled")}
                      className={statusFilter === "cancelled" ? "bg-red-600" : ""}
                    >
                      Cancelados
                    </Button>
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Período
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={dateRange === "7days" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRange("7days")}
                      className={dateRange === "7days" ? "bg-purple-600" : ""}
                    >
                      7 días
                    </Button>
                    <Button
                      variant={dateRange === "30days" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRange("30days")}
                      className={dateRange === "30days" ? "bg-purple-600" : ""}
                    >
                      30 días
                    </Button>
                    <Button
                      variant={dateRange === "90days" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRange("90days")}
                      className={dateRange === "90days" ? "bg-purple-600" : ""}
                    >
                      90 días
                    </Button>
                    <Button
                      variant={dateRange === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRange("all")}
                      className={dateRange === "all" ? "bg-purple-600" : ""}
                    >
                      Todo
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
          <CardDescription>
            {filteredOrders.length} pedido(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {searchTerm || statusFilter !== "all" || dateRange !== "30days"
                  ? "No hay pedidos con estos filtros"
                  : "No tienes pedidos en el historial"}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Los pedidos completados y cancelados aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      ID
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Servicio
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Cantidad
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Estado
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Fecha Inicio
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Fecha Final
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Precio
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-400">
                          {order.order_number}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {order.service_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {order.target_url}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {order.quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400 text-sm">
                        {new Date(order.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                        <br />
                        <span className="text-xs text-gray-400">
                          {new Date(order.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400 text-sm">
                        {order.completed_at ? (
                          <>
                            {new Date(order.completed_at).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                            <br />
                            <span className="text-xs text-gray-400">
                              {new Date(order.completed_at).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${Number(order.price).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Button variant="ghost" size="sm" title="Ver detalles">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Footer */}
      {filteredOrders.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Tasa de Éxito
                </p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {((stats.completedOrders / stats.totalOrders) * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Invertido
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${stats.totalSpent.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Valor Promedio
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${stats.avgOrderValue.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
