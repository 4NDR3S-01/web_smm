'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ApiProvider } from '@/lib/types/database';
import { PROVIDER_TYPE_LABELS } from '@/lib/constants/api';

export default function ProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  
  // Estados para el modal de agregar proveedor
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [newProviderId, setNewProviderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    key: '',
    type: 'standard' as 'standard' | 'indusrabbit' | 'yoyomedia' | 'instasmm' | 'realfans',
    description: '',
    status: true,
  });

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      const response = await fetch('/api/admin/providers');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function testConnection(providerId: string) {
    setTestingId(providerId);
    try {
      const response = await fetch(`/api/admin/providers/${providerId}/test`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
        alert(`❌ Error: ${errorData.error || response.statusText}`);
        return;
      }
      
      const data = await response.json();

      if (data.success) {
        alert(`✅ Conexión exitosa!\nBalance: $${data.balance}`);
        await loadProviders(); // Recargar para ver balance actualizado
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error al probar conexión:', error);
      alert('Error al probar conexión');
    } finally {
      setTestingId(null);
    }
  }

  async function handleCreateProvider(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
        toast.error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success('¡Proveedor creado exitosamente!', {
          description: 'Ahora debes sincronizar los servicios para que aparezcan en tu catálogo',
        });
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          url: '',
          key: '',
          type: 'standard',
          description: '',
          status: true,
        });
        await loadProviders();
        
        // Mostrar diálogo para sincronizar servicios
        setNewProviderId(data.provider.id);
        setShowSyncDialog(true);
      } else {
        toast.error(data.error || 'Error al crear proveedor');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear proveedor');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Cargando proveedores...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Proveedores API</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>+ Agregar Proveedor</Button>
      </div>

      {providers.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="text-gray-600 dark:text-gray-400 mb-4">No hay proveedores configurados</div>
          <Button onClick={() => setIsAddModalOpen(true)}>Agregar el primero</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {providers.map((provider) => (
            <Card key={provider.id} className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {provider.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        provider.status
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {provider.status ? 'Activo' : 'Inactivo'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                      {PROVIDER_TYPE_LABELS[provider.type] || provider.type}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{provider.url}</p>

                  {provider.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {provider.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-6 mt-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Balance:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        ${provider.balance?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Servicios:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        {provider.no_current_services || 0}
                      </span>
                    </div>
                    {provider.last_sync_at && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Última sync:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {new Date(provider.last_sync_at).toLocaleString('es-ES')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnection(provider.id)}
                    disabled={testingId === provider.id}
                  >
                    {testingId === provider.id ? 'Probando...' : 'Test'}
                  </Button>
                  <Link href={`/admin/proveedores/${provider.id}`}>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </Link>
                  <Link href={`/admin/servicios/sincronizar?provider=${provider.id}`}>
                    <Button size="sm">Sincronizar</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal para agregar proveedor */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Proveedor API</DialogTitle>
            <DialogDescription>
              Complete los detalles del proveedor. La conexión será verificada al guardar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProvider} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nombre del Proveedor *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Proveedor Principal"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="url">API URL *</Label>
                <Input
                  id="url"
                  required
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://api.proveedor.com/api/v2"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="key">API Key *</Label>
                <Input
                  id="key"
                  required
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="Tu API key del proveedor"
                  type="password"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ⚠️ La API será validada al guardar. Se verificará la conexión y se obtendrá el balance inicial.
                </p>
              </div>

              <div>
                <Label htmlFor="type">Tipo de Proveedor *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: typeof formData.type) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="indusrabbit">IndusRabbit</SelectItem>
                    <SelectItem value="yoyomedia">YoYoMedia</SelectItem>
                    <SelectItem value="instasmm">InstaSMM</SelectItem>
                    <SelectItem value="realfans">RealFans</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Estado *</Label>
                <Select
                  value={formData.status ? 'active' : 'inactive'}
                  onValueChange={(value) => setFormData({ ...formData, status: value === 'active' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del proveedor (opcional)"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creando y verificando...' : 'Crear Proveedor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Sincronización después de crear proveedor */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¡Proveedor Creado con Éxito! 🎉</DialogTitle>
            <DialogDescription>
              El proveedor ha sido registrado y validado correctamente.
              <br />
              <strong>Siguiente paso:</strong> Debes sincronizar los servicios para que aparezcan en tu catálogo.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  ¿Qué es sincronizar servicios?
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  La sincronización importa todos los servicios disponibles del proveedor a tu base de datos.
                  Estos servicios aparecerán en tu catálogo y tus clientes podrán hacer pedidos.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSyncDialog(false)}
              className="w-full sm:w-auto"
            >
              Sincronizar después
            </Button>
            <Button
              onClick={() => {
                setShowSyncDialog(false);
                router.push(`/admin/servicios/sincronizar?provider=${newProviderId}`);
              }}
              className="w-full sm:w-auto"
            >
              Sincronizar Ahora →
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
