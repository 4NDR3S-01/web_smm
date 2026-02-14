'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface Client {
  id: string;
  full_name: string;
  email: string;
  role: string;
  balance: number;
}

interface EditClientModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly client: Client | null;
}

export default function EditClientModal({ isOpen, onClose, onSuccess, client }: EditClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'cliente',
    password: '', // Opcional - solo si se quiere cambiar
  });

  useEffect(() => {
    if (client) {
      setFormData({
        full_name: client.full_name,
        email: client.email,
        role: client.role,
        password: '',
      });
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: Record<string, string> = {
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
      };

      // Solo incluir password si se proporcionó uno nuevo
      if (formData.password.trim()) {
        if (formData.password.length < 6) {
          toast.error('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Cliente actualizado exitosamente');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Error al actualizar cliente');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Editar Cliente</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="edit-full-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre Completo
            </label>
            <Input
              id="edit-full-name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div>
            <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div>
            <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nueva Contraseña
              {' '}
              <span className="text-xs text-gray-500">(Dejar vacío para mantener la actual)</span>
            </label>
            <Input
              id="edit-password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rol
            </label>
            <select
              id="edit-role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full h-10 border border-input rounded-md px-3 bg-background"
              required
            >
              <option value="cliente">Cliente</option>
              <option value="distribuidor">Distribuidor</option>
              <option value="soporte">Soporte</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>

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
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar Cliente'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
