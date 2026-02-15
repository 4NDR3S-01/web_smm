'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiProvider, ServiceCategory } from '@/lib/types/database';

export default function SyncServicesPage() {
  const searchParams = useSearchParams();
  const preselectedProvider = searchParams.get('provider');

  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedProvider, setSelectedProvider] = useState(preselectedProvider || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [markupPercentage, setMarkupPercentage] = useState(20);
  const [autoImport, setAutoImport] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [providersRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/providers'),
        fetch('/api/admin/categories').catch(() => ({ json: async () => ({ categories: [] }) })),
      ]);

      const providersData = await providersRes.json();
      const categoriesData = await categoriesRes.json();

      setProviders(providersData.providers || []);
      setCategories(categoriesData.categories || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async function handleSync() {
    if (!selectedProvider) {
      alert('Por favor selecciona un proveedor');
      return;
    }

    setSyncing(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProvider,
          categoryId: selectedCategory || undefined,
          markupPercentage,
          autoImport,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
        setResult({
          success: false,
          error: errorData.error || `Error ${response.status}: ${response.statusText}`,
        });
        return;
      }

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          stats: data.stats,
          provider: data.provider,
          errors: data.errors,
        });
      } else {
        setResult({
          success: false,
          error: data.error,
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Error al sincronizar',
      });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Sincronizar Servicios
        </h2>
        <p className="text-gray-600 mt-1">
          Importa servicios desde un proveedor API externo
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {/* Seleccionar Proveedor */}
          <div>
            <Label htmlFor="provider">Proveedor API *</Label>
            <select
              id="provider"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={syncing}
            >
              <option value="">Selecciona un proveedor...</option>
              {providers
                .filter((p) => p.status)
                .map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} - {provider.no_current_services || 0}{' '}
                    servicios
                  </option>
                ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Solo proveedores activos aparecen en la lista
            </p>
          </div>

          {/* Seleccionar Categoría (Opcional) */}
          <div>
            <Label htmlFor="category">
              Categoría Destino (opcional)
            </Label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={syncing}
            >
              <option value="">Sin categoría específica</option>
              {categories
                .filter((c) => c.is_active)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Asigna los servicios importados a una categoría
            </p>
          </div>

          {/* Markup Percentage */}
          <div>
            <Label htmlFor="markup">Margen de Ganancia (%)</Label>
            <Input
              id="markup"
              type="number"
              min="0"
              max="100"
              value={markupPercentage}
              onChange={(e) => setMarkupPercentage(Number(e.target.value))}
              disabled={syncing}
            />
            <p className="text-sm text-gray-500 mt-1">
              Porcentaje que se agregará al precio del proveedor
            </p>
          </div>

          {/* Auto Import */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoImport"
              checked={autoImport}
              onChange={(e) => setAutoImport(e.target.checked)}
              disabled={syncing}
              className="rounded border-gray-300"
            />
            <Label htmlFor="autoImport" className="font-normal">
              Importar servicios nuevos automáticamente
            </Label>
          </div>

          {/* Botón de Sincronización */}
          <div className="pt-4">
            <Button
              onClick={handleSync}
              disabled={syncing || !selectedProvider}
              className="w-full"
            >
              {syncing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sincronizando...
                </>
              ) : (
                'Iniciar Sincronización'
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Resultado de la Sincronización */}
      {result && (
        <Card
          className={`p-6 ${
            result.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center ${
                result.success ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              {result.success ? (
                <svg
                  className="h-4 w-4 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3
                className={`font-semibold ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {result.success
                  ? 'Sincronización Completada'
                  : 'Error en la Sincronización'}
              </h3>

              {result.success ? (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-green-800">
                    Proveedor: <strong>{result.provider?.name}</strong>
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600">Total API</p>
                      <p className="text-xl font-bold text-gray-900">
                        {result.stats.total}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600">Nuevos</p>
                      <p className="text-xl font-bold text-green-600">
                        {result.stats.newServices}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600">Actualizados</p>
                      <p className="text-xl font-bold text-blue-600">
                        {result.stats.updatedServices}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600">Errores</p>
                      <p className="text-xl font-bold text-red-600">
                        {result.stats.errors}
                      </p>
                    </div>
                  </div>

                  {result.errors && result.errors.length > 0 && (
                    <details className="mt-3">
                      <summary className="text-sm text-yellow-800 cursor-pointer">
                        Ver errores ({result.errors.length})
                      </summary>
                      <ul className="mt-2 text-xs text-yellow-700 space-y-1 list-disc list-inside">
                        {result.errors.slice(0, 10).map((error: string, i: number) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              ) : (
                <p className="text-sm text-red-800 mt-1">{result.error}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Información */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <svg
            className="h-5 w-5 text-blue-600 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="font-medium text-blue-900">
              ¿Cómo funciona la sincronización?
            </h4>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>
                Obtiene la lista de servicios desde la API del proveedor
              </li>
              <li>Crea nuevos servicios si no existen en tu catálogo</li>
              <li>
                Actualiza precios, límites y disponibilidad de servicios
                existentes
              </li>
              <li>
                Aplica el margen de ganancia automáticamente a los precios
              </li>
              <li>También se ejecuta automáticamente cada 6 horas</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
