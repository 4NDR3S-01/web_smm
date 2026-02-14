'use client';

import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface Client {
  id: string;
  full_name: string;
  balance: number;
}

interface BalanceModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly client: Client | null;
}

export default function BalanceModal({ isOpen, onClose, onSuccess, client }: BalanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const numAmount = Number.parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    if (action === 'subtract' && numAmount > client.balance) {
      toast.error('El monto no puede ser mayor al balance actual');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/clients/${client.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          amount: numAmount,
          description,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Balance ${action === 'add' ? 'agregado' : 'retirado'} exitosamente`);
        setAmount('');
        setDescription('');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Error al actualizar balance');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestionar Balance</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Cliente</p>
          <p className="font-semibold text-lg text-gray-900 dark:text-white">{client.full_name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Balance actual</p>
          <p className="font-bold text-2xl text-blue-600 dark:text-blue-400">${client.balance.toFixed(2)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Acción
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAction('add')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  action === 'add'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">Agregar</span>
              </button>
              <button
                type="button"
                onClick={() => setAction('subtract')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  action === 'subtract'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Minus className="h-5 w-5" />
                <span className="font-medium">Retirar</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="balance-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monto
            </label>
            <Input
              id="balance-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label htmlFor="balance-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
              {' '}
              <span className="text-xs text-gray-500">(Opcional)</span>
            </label>
            <Input
              id="balance-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Recarga manual"
            />
          </div>

          {action === 'subtract' && Number.parseFloat(amount) > client.balance && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">
                ⚠️ El monto excede el balance actual
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={loading}
              variant={action === 'subtract' ? 'destructive' : 'default'}
            >
              {loading ? 'Procesando...' : (action === 'add' ? 'Agregar Fondos' : 'Retirar Fondos')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
