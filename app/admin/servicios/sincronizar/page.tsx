'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { 
  Download, 
  Search, 
  Filter,
  CheckSquare,
  Square,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface EnrichedService {
  api_service_id: string;
  name: string;
  description: string;
  type: string;
  original_price: number;
  suggested_price: number;
  min_quantity: number;
  max_quantity: number;
  refill: boolean;
  cancel: boolean;
  is_imported: boolean;
  existing_id?: string;
  existing_category_id?: string;
  existing_is_active?: boolean;
  existing_price?: number;
}

interface ServiceSelection {
  api_service_id: string;
  category_id?: string;
  custom_price?: number;
}

export default function SyncServicesPage() {
  const searchParams = useSearchParams();
  const preselectedProvider = searchParams.get('provider');

  // Estados principales
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedProvider, setSelectedProvider] = useState(preselectedProvider || '');
  const [providerInfo, setProviderInfo] = useState<{ id: string; name: string; markup_percentage: number } | null>(null);
  const [markupPercentage, setMarkupPercentage] = useState<number>(20);
  
  // Estados de servicios
  const [services, setServices] = useState<EnrichedService[]>([]);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [categoryAssignments, setCategoryAssignments] = useState<Map<string, string>>(new Map());
  const [customPrices, setCustomPrices] = useState<Map<string, number>>(new Map());
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'imported'>('all');
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // Cargar proveedores y categorías
  useEffect(() => {
    loadInitialData();
  }, []);

  // Ya no cargamos automáticamente, el usuario debe hacer clic en "Cargar Servicios"

  const loadInitialData = async () => {
    try {
      const [providersRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/providers'),
        fetch('/api/admin/categories'),
      ]);

      if (providersRes.ok) {
        const data = await providersRes.json();
        setProviders(data.providers || []);
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
    }
  };

  const loadProviderServices = async () => {
    if (!selectedProvider) return;

    setLoading(true);
    setServices([]);
    setSelectedServices(new Set());
    setCategoryAssignments(new Map());
    setCustomPrices(new Map());
    setCurrentPage(1); // Reset to first page

    try {
      const response = await fetch(
        `/api/admin/sync/preview?providerId=${selectedProvider}&markup=${markupPercentage}`
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Error al cargar servicios');
        return;
      }

      const data = await response.json();
      setProviderInfo(data.provider);
      setServices(data.services);
      // Si no se ha configurado antes, usar el del proveedor
      if (markupPercentage === 20) {
        setMarkupPercentage(data.provider.markup_percentage);
      }

      // Pre-seleccionar servicios nuevos (no importados)
      const newServices = new Set<string>(
        data.services
          .filter((s: EnrichedService) => !s.is_imported)
          .map((s: EnrichedService) => String(s.api_service_id))
      );
      setSelectedServices(newServices);

      toast.success(`${data.stats.total} servicios cargados`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar servicios del proveedor');
    } finally {
      setLoading(false);
    }
  };

  // Filtros
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      // Filtro de búsqueda
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchName = service.name.toLowerCase().includes(search);
        const matchId = String(service.api_service_id).includes(search);
        if (!matchName && !matchId) return false;
      }

      // Filtro por tipo
      if (filterType !== 'all' && service.type !== filterType) {
        return false;
      }

      // Filtro por estado
      if (filterStatus === 'new' && service.is_imported) return false;
      if (filterStatus === 'imported' && !service.is_imported) return false;

      return true;
    });
  }, [services, searchTerm, filterType, filterStatus]);

  // Paginación
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredServices.slice(startIndex, endIndex);
  }, [filteredServices, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterStatus]);

  // Estadísticas
  const stats = useMemo(() => {
    const selectedData = services.filter(s => selectedServices.has(String(s.api_service_id)));
    
    return {
      total: filteredServices.length,
      selected: selectedServices.size,
      newToImport: selectedData.filter(s => !s.is_imported).length,
      toUpdate: selectedData.filter(s => s.is_imported).length,
    };
  }, [filteredServices, selectedServices, services]);

  // Obtener tipos únicos para el filtro
  const serviceTypes = useMemo(() => {
    const types = new Set(services.map(s => s.type));
    return Array.from(types).sort((a, b) => a.localeCompare(b));
  }, [services]);

  // Handlers
  const toggleSelectAll = () => {
    if (selectedServices.size === filteredServices.length) {
      setSelectedServices(new Set());
    } else {
      const allIds = new Set(filteredServices.map(s => String(s.api_service_id)));
      setSelectedServices(allIds);
    }
  };

  const toggleService = (serviceId: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  const setCategory = (serviceId: string, categoryId: string) => {
    const newAssignments = new Map(categoryAssignments);
    if (categoryId === 'none') {
      newAssignments.delete(serviceId);
    } else {
      newAssignments.set(serviceId, categoryId);
    }
    setCategoryAssignments(newAssignments);
  };

  // Función para asignar precio personalizado (por si se necesita en el futuro)
  // const setPrice = (serviceId: string, price: number) => {
  //   const newPrices = new Map(customPrices);
  //   newPrices.set(serviceId, price);
  //   setCustomPrices(newPrices);
  // };

  const assignCategoryToSelected = (categoryId: string) => {
    const newAssignments = new Map(categoryAssignments);
    selectedServices.forEach(serviceId => {
      if (categoryId === 'none') {
        newAssignments.delete(serviceId);
      } else {
        newAssignments.set(serviceId, categoryId);
      }
    });
    setCategoryAssignments(newAssignments);
    toast.success(`Categoría asignada a ${selectedServices.size} servicios`);
  };

  const handleImport = async () => {
    if (selectedServices.size === 0) {
      toast.error('Selecciona al menos un servicio para importar');
      return;
    }

    setImporting(true);

    try {
      const servicesToImport: ServiceSelection[] = Array.from(selectedServices).map(
        serviceId => ({
          api_service_id: serviceId,
          category_id: categoryAssignments.get(serviceId),
          custom_price: customPrices.get(serviceId),
        })
      );

      const response = await fetch('/api/admin/sync/selective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProvider,
          services: servicesToImport,
          markupPercentage: markupPercentage, // Pass the custom markup percentage
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Error al importar servicios');
        return;
      }

      // Mostrar resultados
      if (data.stats.created === 0 && data.stats.updated === 0 && data.stats.errors > 0) {
        // Solo errores, sin éxitos
        toast.error(`No se pudo importar ningún servicio. ${data.stats.errors} errores`);
        if (data.errors && data.errors.length > 0) {
          console.error('Errores de importación:', data.errors);
        }
      } else {
        // Algunos éxitos
        const successMsg = [];
        if (data.stats.created > 0) successMsg.push(`✅ ${data.stats.created} creados`);
        if (data.stats.updated > 0) successMsg.push(`🔄 ${data.stats.updated} actualizados`);
        if (data.stats.errors > 0) successMsg.push(`⚠️ ${data.stats.errors} errores`);
        
        toast.success(successMsg.join(' • '));
        
        if (data.errors && data.errors.length > 0) {
          console.warn('Algunos servicios tuvieron errores:', data.errors);
          toast.warning(`Revisa la consola para ver los ${data.errors.length} errores`);
        }

        // Actualizar estado local en lugar de recargar todo
        const importedIds = new Set(servicesToImport.map(s => String(s.api_service_id)));
        setServices(prevServices => 
          prevServices.map(service => {
            const serviceId = String(service.api_service_id);
            if (importedIds.has(serviceId)) {
              return { ...service, is_imported: true };
            }
            return service;
          })
        );

        // Limpiar selecciones
        setSelectedServices(new Set());
        setCategoryAssignments(new Map());
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al importar servicios');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/servicios">
            <Button variant="ghost" size="sm" className="mb-4">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Volver a Servicios
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Importar Servicios
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Selecciona los servicios que deseas importar y organízalos por categoría
              </p>
            </div>
          </div>
        </div>

        {/* Selector de Proveedor */}
        {!services.length && (
          <Card className="p-6 mb-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="provider">Proveedor de API</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="markup">Margen de Ganancia (%)</Label>
                  <Input
                    id="markup"
                    type="number"
                    min="0"
                    max="500"
                    step="0.1"
                    value={markupPercentage}
                    onChange={(e) => setMarkupPercentage(Number.parseFloat(e.target.value) || 20)}
                    placeholder="20"
                    className="text-center font-semibold"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Ej: 20% = Precio + 20%
                  </p>
                </div>
              </div>

              {selectedProvider && !loading && (
                <div className="flex justify-end pt-2">
                  <Button onClick={loadProviderServices}>
                    <Download className="w-4 h-4 mr-2" />
                    Cargar Servicios
                  </Button>
                </div>
              )}

              {selectedProvider && loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">
                    Cargando servicios del proveedor...
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Panel de servicios */}
        {services.length > 0 && (
          <>
            {/* Info del proveedor */}
            <Card className="p-4 mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>{providerInfo?.name}</strong> - Margen: {providerInfo?.markup_percentage}%
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Servicios: <strong>{services.length}</strong> disponibles •{' '}
                      <strong className="text-green-600 dark:text-green-400">{services.filter(s => !s.is_imported).length}</strong> nuevos •{' '}
                      <strong className="text-gray-600 dark:text-gray-400">{services.filter(s => s.is_imported).length}</strong> ya importados
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="markup-adjust" className="text-sm text-blue-900 dark:text-blue-100 whitespace-nowrap">
                      Ajustar margen:
                    </Label>
                    <Input
                      id="markup-adjust"
                      type="number"
                      min="0"
                      max="500"
                      step="0.1"
                      value={markupPercentage}
                      onChange={(e) => setMarkupPercentage(Number.parseFloat(e.target.value) || 20)}
                      className="w-20 text-center font-semibold"
                    />
                    <span className="text-sm text-blue-900 dark:text-blue-100">%</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={loadProviderServices}
                      disabled={loading}
                      className="bg-white hover:bg-blue-50"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Recalcular
                        </>
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setServices([]);
                      setSelectedProvider('');
                      setMarkupPercentage(20);
                    }}
                    className="bg-white hover:bg-blue-50"
                  >
                    Cambiar Proveedor
                  </Button>
                </div>
              </div>
            </Card>

            {/* Barra de herramientas */}
            <Card className="p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Búsqueda */}
                <div className="md:col-span-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar servicios..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filtro por tipo */}
                <div className="md:col-span-3">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      {serviceTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por estado */}
                <div className="md:col-span-3">
                  <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | 'new' | 'imported')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="new">Solo nuevos</SelectItem>
                      <SelectItem value="imported">Ya importados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Botón seleccionar todos */}
                <div className="md:col-span-2">
                  <Button
                    variant="outline"
                    onClick={toggleSelectAll}
                    className="w-full"
                    title={`Seleccionar todos los ${filteredServices.length} servicios filtrados`}
                  >
                    {selectedServices.size === filteredServices.length ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Deseleccionar
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Todos
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Acciones masivas */}
              {selectedServices.size > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.selected} servicios seleccionados ({stats.newToImport} nuevos, {stats.toUpdate} a actualizar)
                    </p>
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm">Asignar categoría a seleccionados:</Label>
                      <Select onValueChange={assignCategoryToSelected}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin categoría</SelectItem>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Info de paginación */}
            {filteredServices.length > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                <p>
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredServices.length)} de {filteredServices.length} servicios
                </p>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Por página:</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Tabla de servicios */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left w-12">
                        <input
                          type="checkbox"
                          checked={selectedServices.size === filteredServices.length && filteredServices.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Servicio
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Min/Max
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Categoría
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedServices.map(service => {
                      const serviceId = String(service.api_service_id);
                      const isSelected = selectedServices.has(serviceId);
                      const assignedCategory = categoryAssignments.get(serviceId);
                      const customPrice = customPrices.get(serviceId);

                      return (
                        <tr
                          key={service.api_service_id}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleService(serviceId)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-4 py-3">
                            {service.is_imported ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Importado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Nuevo
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {service.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {service.api_service_id}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {service.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                ${customPrice || service.suggested_price}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Original: ${service.original_price}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {service.min_quantity} / {service.max_quantity.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={
                                assignedCategory || 
                                service.existing_category_id || 
                                'none'
                              }
                              onValueChange={value => setCategory(serviceId, value)}
                              disabled={!isSelected}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Sin categoría" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sin categoría</SelectItem>
                                {categories.map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredServices.length === 0 && (
                <div className="text-center py-12">
                  <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No se encontraron servicios con los filtros aplicados
                  </p>
                </div>
              )}
            </Card>

            {/* Controles de paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  Primera
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Última
                </Button>
              </div>
            )}

            {/* Botón de importar */}
            {stats.selected > 0 && (
              <div className="mt-6 sticky bottom-6">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {stats.selected} servicios seleccionados
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {stats.newToImport} nuevos • {stats.toUpdate} actualizaciones
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleImport}
                      disabled={importing}
                      className="min-w-40"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Importar Servicios
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
