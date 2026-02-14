'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ApiProvider } from '@/lib/types/database';
import { PROVIDER_TYPE_LABELS } from '@/lib/constants/api';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      const response = await fetch('/api/admin/providers');
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
      const data = await response.json();

      if (data.success) {
        alert(`✅ Conexión exitosa!\nBalance: $${data.balance}`);
        await loadProviders(); // Recargar para ver balance actualizado
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('Error al probar conexión');
    } finally {
      setTestingId(null);
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
        <Link href="/admin/proveedores/nuevo">
          <Button>+ Agregar Proveedor</Button>
        </Link>
      </div>

      {providers.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="text-gray-600 dark:text-gray-400 mb-4">No hay proveedores configurados</div>
          <Link href="/admin/proveedores/nuevo">
            <Button>Agregar el primero</Button>
          </Link>
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
    </div>
  );
}
