'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiProvider, ServiceCategory } from '@/lib/types/database';
import { RefreshCw, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { toast } from 'sonner';

interface SyncOptions {
  syncNewPrice: boolean;
  syncOriginalPrice: boolean;
  syncStatus: boolean;
  syncName: boolean;
  syncDescription: boolean;
  syncMin: boolean;
  syncMax: boolean;
  syncDripfeed: boolean;
}

export default function SyncServicesPage() {
  const searchParams = useSearchParams();
  const preselectedProvider = searchParams.get('provider');

  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedProvider, setSelectedProvider] = useState(preselectedProvider || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [markupPercentage, setMarkupPercentage] = useState(20);
  const [syncMode, setSyncMode] = useState<'all' | 'current'>('all');
  const [importLimit, setImportLimit] = useState<string>('all');
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [syncOptions, setSyncOptions] = useState<SyncOptions>({
    syncNewPrice: false,
    syncOriginalPrice: true,
    syncStatus: false,
    syncName: false,
    syncDescription: false,
    syncMin: true,
    syncMax: false,
    syncDripfeed: true,
  });

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
      toast.error('Por favor selecciona un proveedor');
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
          syncMode,
          importLimit: importLimit === 'all' ? undefined : Number.parseInt(importLimit, 10),
          syncOptions: showAdvanced ? syncOptions : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
        toast.error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        setResult({
          success: false,
          error: errorData.error || `Error ${response.status}: ${response.statusText}`,
        });
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success('Sincronización completada exitosamente');
        setResult({
          success: true,
          stats: data.stats,
          provider: data.provider,
          errors: data.errors,
        });
      } else {
        toast.error(data.error || 'Error al sincronizar');
        setResult({
          success: false,
          error: data.error,
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al sincronizar');
      setResult({
        success: false,
        error: error.message || 'Error al sincronizar',
      });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sincronizar Servicios
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Importa y sincroniza servicios desde proveedores API
        </p>
      </div>

      {/* Formulario Principal */}
      <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="space-y-5">
          {/* Seleccionar Proveedor */}
          <div>
            <Label htmlFor="provider" className="text-sm font-medium">
              Proveedor API *
            </Label>
            <Select
              value={selectedProvider}
              onValueChange={setSelectedProvider}
              disabled={syncing}
            >
              <SelectTrigger id="provider" className="mt-1">
                <SelectValue placeholder="Selecciona un proveedor..." />
              </SelectTrigger>
              <SelectContent>
                {providers
                  .filter((p) => p.status)
                  .map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name} - {provider.no_current_services || 0} servicios
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Solo proveedores activos aparecen en la lista
            </p>
          </div>

          {/* Modo de Sincronización */}
          <div>
            <Label className="text-sm font-medium">Modo de Sincronización *</Label>
            <div className="mt-2 space-y-2">
              <label
                htmlFor="syncModeAll"
                className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <input
                  id="syncModeAll"
                  type="radio"
                  name="syncMode"
                  value="all"
                  checked={syncMode === 'all'}
                  onChange={(e) => setSyncMode(e.target.value as 'all' | 'current')}
                  disabled={syncing}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    Todos los Servicios
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Sincroniza servicios existentes y agrega nuevos automáticamente
                  </div>
                </div>
                <span className="sr-only">Seleccionar modo: Todos los Servicios</span>
              </label>
              <label
                htmlFor="syncModeCurrent"
                className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <input
                  id="syncModeCurrent"
                  type="radio"
                  name="syncMode"
                  value="current"
                  checked={syncMode === 'current'}
                  onChange={(e) => setSyncMode(e.target.value as 'all' | 'current')}
                  disabled={syncing}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    Solo Servicios Actuales
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Actualiza únicamente los servicios que ya existen en tu sistema
                  </div>
                </div>
                <span className="sr-only">Seleccionar modo: Solo Servicios Actuales</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoría Destino */}
            <div>
              <Label htmlFor="category" className="text-sm font-medium">
                Categoría Destino
              </Label>
              <Select
                value={selectedCategory || 'none'}
                onValueChange={(value) => setSelectedCategory(value === 'none' ? '' : value)}
                disabled={syncing}
              >
                <SelectTrigger id="category" className="mt-1">
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categories
                    .filter((c) => c.is_active)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Opcional: asigna a una categoría
              </p>
            </div>

            {/* Límite de Importación */}
            {syncMode === 'all' && (
              <div>
                <Label htmlFor="limit" className="text-sm font-medium">
                  Límite de Importación
                </Label>
                <Select
                  value={importLimit}
                  onValueChange={setImportLimit}
                  disabled={syncing}
                >
                  <SelectTrigger id="limit" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 servicios</SelectItem>
                    <SelectItem value="50">50 servicios</SelectItem>
                    <SelectItem value="100">100 servicios</SelectItem>
                    <SelectItem value="200">200 servicios</SelectItem>
                    <SelectItem value="500">500 servicios</SelectItem>
                    <SelectItem value="all">Todos los servicios</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Cantidad máxima a importar
                </p>
              </div>
            )}
          </div>

          {/* Markup Percentage */}
          <div>
            <Label htmlFor="markup" className="text-sm font-medium">
              Margen de Ganancia (%)
            </Label>
            <Input
              id="markup"
              type="number"
              min="0"
              max="500"
              step="1"
              value={markupPercentage}
              onChange={(e) => setMarkupPercentage(Number.parseInt(e.target.value, 10) || 0)}
              disabled={syncing}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Porcentaje que se agregará al precio del proveedor (0-500%)
            </p>
          </div>

          {/* Opciones Avanzadas */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              disabled={syncing}
            >
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span>Opciones Avanzadas de Sincronización</span>
            </button>
            
            {showAdvanced && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Selecciona qué datos deseas sincronizar con el proveedor:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={syncOptions.syncNewPrice}
                      onChange={(e) =>
                        setSyncOptions({ ...syncOptions, syncNewPrice: e.target.checked })
                      }
                      disabled={syncing}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Sincronizar Precio Final
                    </span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={syncOptions.syncOriginalPrice}
                      onChange={(e) =>
                        setSyncOptions({ ...syncOptions, syncOriginalPrice: e.target.checked })
                      }
                      disabled={syncing}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Sincronizar Precio Original
                    </span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={syncOptions.syncStatus}
                      onChange={(e) =>
                        setSyncOptions({ ...syncOptions, syncStatus: e.target.checked })
                      }
                      disabled={syncing}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Sincronizar Estado del Servicio
                    </span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={syncOptions.syncName}
                      onChange={(e) =>
                        setSyncOptions({ ...syncOptions, syncName: e.target.checked })
                      }
                      disabled={syncing}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Sincronizar Nombre del Servicio
                    </span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={syncOptions.syncDescription}
                      onChange={(e) =>
                        setSyncOptions({ ...syncOptions, syncDescription: e.target.checked })
                      }
                      disabled={syncing}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Sincronizar Descripción
                    </span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={syncOptions.syncMin}
                      onChange={(e) =>
                        setSyncOptions({ ...syncOptions, syncMin: e.target.checked })
                      }
                      disabled={syncing}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Sincronizar Cantidad Mínima
                    </span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={syncOptions.syncMax}
                      onChange={(e) =>
                        setSyncOptions({ ...syncOptions, syncMax: e.target.checked })
                      }
                      disabled={syncing}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Sincronizar Cantidad Máxima
                    </span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={syncOptions.syncDripfeed}
                      onChange={(e) =>
                        setSyncOptions({ ...syncOptions, syncDripfeed: e.target.checked })
                      }
                      disabled={syncing}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Sincronizar Dripfeed
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Botón de Sincronización */}
          <div className="pt-4">
            <Button
              onClick={handleSync}
              disabled={syncing || !selectedProvider}
              className="w-full"
              size="lg"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Iniciar Sincronización
                </>
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
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                result.success
                  ? 'bg-green-100 dark:bg-green-800'
                  : 'bg-red-100 dark:bg-red-800'
              }`}
            >
              {result.success ? (
                <svg
                  className="h-4 w-4 text-green-600 dark:text-green-300"
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
                  className="h-4 w-4 text-red-600 dark:text-red-300"
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
                  result.success
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-red-900 dark:text-red-100'
                }`}
              >
                {result.success
                  ? 'Sincronización Completada'
                  : 'Error en la Sincronización'}
              </h3>

              {result.success ? (
                <div className="mt-2 space-y-3">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Proveedor: <strong>{result.provider?.name}</strong>
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Total API
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {result.stats.total}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Nuevos
                      </p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {result.stats.newServices}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Actualizados
                      </p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {result.stats.updatedServices}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Errores
                      </p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {result.stats.errors}
                      </p>
                    </div>
                  </div>

                  {result.errors && result.errors.length > 0 && (
                    <details className="mt-3">
                      <summary className="text-sm text-yellow-800 dark:text-yellow-300 cursor-pointer hover:underline">
                        Ver errores ({result.errors.length})
                      </summary>
                      <ul className="mt-2 text-xs text-yellow-700 dark:text-yellow-400 space-y-1 list-disc list-inside max-h-40 overflow-y-auto">
                        {result.errors.slice(0, 20).map((error: string, i: number) => (
                          <li key={`error-${i}-${error.slice(0, 10)}`}>{error}</li>
                        ))}
                        {result.errors.length > 20 && (
                          <li className="italic">
                            y {result.errors.length - 20} errores más...
                          </li>
                        )}
                      </ul>
                    </details>
                  )}
                </div>
              ) : (
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                  {result.error}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Información */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              ¿Cómo funciona la sincronización?
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1.5 list-disc list-inside">
              <li>
                Obtiene la lista de servicios desde la API del proveedor seleccionado
              </li>
              <li>
                <strong>Modo "Todos":</strong> crea nuevos servicios y actualiza los existentes
              </li>
              <li>
                <strong>Modo "Actuales":</strong> solo actualiza servicios que ya tienes
              </li>
              <li>
                Aplica el margen de ganancia automáticamente a los precios base
              </li>
              <li>
                Las opciones avanzadas permiten control granular de qué datos sincronizar
              </li>
              <li className="pt-1 text-blue-800 dark:text-blue-200 font-medium">
                💡 Tip: La sincronización automática se ejecuta cada 6 horas para mantener los precios actualizados
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
