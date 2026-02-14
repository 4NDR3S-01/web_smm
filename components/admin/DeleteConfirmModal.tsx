'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface Client {
  id: string;
  full_name: string;
  email: string;
}

interface DeleteConfirmModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly client: Client | null;
}

export default function DeleteConfirmModal({ isOpen, onClose, onSuccess, client }: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen || !client) return null;

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== 'eliminar') {
      toast.error('Debes escribir "eliminar" para confirmar');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Cliente eliminado exitosamente');
        setConfirmText('');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Error al eliminar cliente');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Eliminar Cliente</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
            <p className="text-sm text-red-700 dark:text-red-400 mb-2">
              <strong>¡Atención!</strong> Esta acción no se puede deshacer.
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              Se eliminará permanentemente toda la información del cliente.
            </p>
          </div>

          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Cliente a eliminar:</p>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-semibold text-gray-900 dark:text-white">{client.full_name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{client.email}</p>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-delete" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Para confirmar, escribe <span className="font-bold text-red-600 dark:text-red-400">eliminar</span>
            </label>
            <input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escribe 'eliminar'"
              className="w-full h-10 border border-input rounded-md px-3 bg-background"
            />
          </div>
        </div>

        <div className="flex gap-3">
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
            type="button"
            variant="destructive"
            onClick={handleDelete}
            className="flex-1"
            disabled={loading || confirmText.toLowerCase() !== 'eliminar'}
          >
            {loading ? 'Eliminando...' : 'Eliminar Cliente'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
