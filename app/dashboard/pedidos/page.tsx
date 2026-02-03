"use client";

import { useEffect, useState } from "react";
import { Package, Search, CheckCircle2, Clock, XCircle, Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types/database";
import Link from "next/link";
import { ORDER_STATUS } from "@/lib/constants/app";

export default function PedidosPage() {
  const [filter, setFilter] = useState("todos");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error al cargar pedidos:", error);
          console.error("Detalles del error:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
        } else {
          setOrders(data || []);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const stats = {
    total: orders.length,
    completed: orders.filter(o => o.status === ORDER_STATUS.COMPLETED).length,
    processing: orders.filter(o => o.status === ORDER_STATUS.PROCESSING || o.status === ORDER_STATUS.PENDING).length,
    totalSpent: orders.reduce((sum, o) => sum + Number(o.price), 0)
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            <CheckCircle2 className="w-3 h-3" /> Completado
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            <Clock className="w-3 h-3" /> En Proceso
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
            <Clock className="w-3 h-3" /> Pendiente
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
            <XCircle className="w-3 h-3" /> Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === "todos" || order.status === filter;
    const matchesSearch = searchTerm === "" || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.target_url.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mis Pedidos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona y monitorea todos tus pedidos de servicios SMM
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-900 dark:text-white mb-1">
              {stats.total}
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">Total</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-900 dark:text-white mb-1">
              {stats.completed}
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">Completados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-900 dark:text-white mb-1">
              {stats.processing}
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">En Proceso</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-900 dark:text-white mb-1">
              ${stats.totalSpent.toFixed(2)}
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300">Total Gastado</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
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
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filter === "todos" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("todos")}
                className={filter === "todos" ? "bg-gradient-to-r from-purple-600 to-blue-600" : ""}
              >
                Todos
              </Button>
              <Button
                variant={filter === "processing" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("processing")}
                className={filter === "processing" ? "bg-blue-600" : ""}
              >
                En Proceso
              </Button>
              <Button
                variant={filter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("completed")}
                className={filter === "completed" ? "bg-green-600" : ""}
              >
                Completados
              </Button>
            </div>
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
              <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {searchTerm || filter !== "todos" ? "No hay pedidos con este filtro" : "No tienes pedidos aún"}
              </p>
              {!searchTerm && filter === "todos" && (
                <Link href="/dashboard/pedidos/nuevo">
                  <Button className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600">
                    Crear tu primer pedido
                  </Button>
                </Link>
              )}
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
                      Fecha
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
                    <tr key={order.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
                        {new Date(order.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${Number(order.price).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Button variant="ghost" size="sm">
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
    </div>
  );
}
