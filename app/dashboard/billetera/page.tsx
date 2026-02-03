"use client";

import { useState, useEffect } from "react";
import { CreditCard, Plus, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Transaction } from "@/lib/types/database";
import { PRESET_AMOUNTS, TRANSACTION_TYPES, DATE_FORMAT, LOCALE } from "@/lib/constants/app";

export default function BilleteraPage() {
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [amount, setAmount] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // Cargar perfil del usuario
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error al cargar perfil:", profileError);
        } else {
          setProfile(profileData);
        }

        // Cargar transacciones
        const { data: transactionsData, error: transError } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (transError) {
          console.error("Error al cargar transacciones:", transError);
        } else {
          setTransactions(transactionsData || []);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calcular estadísticas de transacciones
  const stats = {
    income: transactions
      .filter(t => t.type === TRANSACTION_TYPES.DEPOSIT || t.type === TRANSACTION_TYPES.REFUND)
      .reduce((sum, t) => sum + Number(t.amount), 0),
    expenses: transactions
      .filter(t => t.type === TRANSACTION_TYPES.WITHDRAWAL)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
  };

  const getTransactionDisplayAmount = (transaction: Transaction) => {
    if (transaction.type === TRANSACTION_TYPES.DEPOSIT || transaction.type === TRANSACTION_TYPES.REFUND) {
      return Number(transaction.amount);
    } else {
      return -Math.abs(Number(transaction.amount));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(LOCALE, DATE_FORMAT.LONG);
  };

  const getTransactionDescription = (transaction: Transaction) => {
    if (transaction.description) return transaction.description;
    
    if (transaction.type === TRANSACTION_TYPES.DEPOSIT) return 'Recarga de saldo';
    if (transaction.type === TRANSACTION_TYPES.REFUND) return 'Reembolso';
    return 'Retiro';
  };

  const getTransactionStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'completed': 'Completado',
      'pending': 'Pendiente',
      'failed': 'Fallido',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Cargando billetera...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Billetera
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona tu saldo y revisa tu historial de transacciones
        </p>
      </div>

      {/* Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-purple-100 mb-2 text-sm">Saldo Disponible</p>
                <h2 className="text-5xl font-bold">${profile?.balance?.toFixed(2) || "0.00"}</h2>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Wallet className="w-8 h-8" />
              </div>
            </div>
            <Button 
              onClick={() => setShowAddFunds(true)}
              className="w-full bg-white text-purple-600 hover:bg-gray-100"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Fondos
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5 text-green-700 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">Ingresos</p>
                  <p className="text-xl font-bold text-green-900 dark:text-white">
                    ${stats.income.toFixed(2)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">Total</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-red-700 dark:text-red-300" />
                </div>
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300">Gastos</p>
                  <p className="text-xl font-bold text-red-900 dark:text-white">
                    ${stats.expenses.toFixed(2)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400">Total</p>
            </CardContent>
          </Card>

          <Card className="col-span-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Total Transacciones</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-white">
                    {transactions.length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Funds Modal (Simple version) */}
      {showAddFunds && (
        <Card className="border-2 border-purple-300 dark:border-purple-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Agregar Fondos
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAddFunds(false)}
              >
                ✕
              </Button>
            </CardTitle>
            <CardDescription>
              Selecciona el monto que deseas recargar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {PRESET_AMOUNTS.map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    className="h-16 text-lg font-semibold hover:bg-purple-50 dark:hover:bg-purple-900"
                    onClick={() => setAmount(value.toString())}
                  >
                    ${value}
                  </Button>
                ))}
              </div>

              <div>
                <label htmlFor="custom-amount" className="block text-sm font-medium mb-2">O ingresa un monto personalizado</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="custom-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                  />
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12">
                Continuar al Pago
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
          <CardDescription>
            {transactions.length > 0 
              ? `Últimas ${transactions.length} transacciones` 
              : "No hay transacciones aún"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No tienes transacciones aún
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Las transacciones aparecerán aquí cuando realices recargas o pedidos
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const displayAmount = getTransactionDisplayAmount(transaction);
                const isPositive = displayAmount > 0;
                
                return (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isPositive 
                          ? 'bg-green-100 dark:bg-green-900' 
                          : 'bg-red-100 dark:bg-red-900'
                      }`}>
                        {isPositive ? (
                          <ArrowDownRight className="w-6 h-6 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowUpRight className="w-6 h-6 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {getTransactionDescription(transaction)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        isPositive
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {displayAmount > 0 ? '+' : ''}${Math.abs(displayAmount).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {getTransactionStatusLabel(transaction.status)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
