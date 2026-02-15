'use client';

import { useState, useEffect } from 'react';
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
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Power,
  PowerOff,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  description: string;
  type: string;
  price_per_1000: number;
  min_quantity: number;
  max_quantity: number;
  is_active: boolean;
  category: {
    id: string;
    name: string;
  };
  api_provider: {
    id: string;
    name: string;
  } | null;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);
  
  // Estados para el modal de agregar servicio
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    type: 'default',
    price_per_1000: '',
    min_quantity: '10',
    max_quantity: '10000',
    delivery_time: '0-1 hora',
    is_active: true,
  });

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchTerm, statusFilter, categoryFilter, services]);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.services) {
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error:', error);
      setCategories([]);
    }
  };

  const filterServices = () => {
    let filtered = services;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter === 'active') {
      filtered = filtered.filter((service) => service.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((service) => !service.is_active);
    }

    // Filtrar por categoría
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((service) => service.category?.id === categoryFilter);
    }

    setFilteredServices(filtered);
  };

  const handleToggleStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/services/${serviceId}/toggle`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
        toast.error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success(`Servicio ${currentStatus ? 'desactivado' : 'activado'}`);
        await fetchServices();
      } else {
        toast.error(data.error || 'Error al cambiar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (serviceId: string, serviceName: string) => {
    if (!confirm(`¿Estás seguro de eliminar el servicio "${serviceName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
        toast.error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success('Servicio eliminado');
        await fetchServices();
      } else {
        toast.error(data.error || 'Error al eliminar servicio');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar servicio');
    }
  };

  const handleCreateService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price_per_1000: Number.parseFloat(formData.price_per_1000),
          min_quantity: Number.parseInt(formData.min_quantity),
          max_quantity: Number.parseInt(formData.max_quantity),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
        toast.error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success('Servicio creado exitosamente');
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          description: '',
          category_id: '',
          type: 'default',
          price_per_1000: '',
          min_quantity: '10',
          max_quantity: '10000',
          delivery_time: '0-1 hora',
          is_active: true,
        });
        await fetchServices();
      } else {
        toast.error(data.error || 'Error al crear servicio');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear servicio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeBadgeClass = (type: string) => {
    const classes: Record<string, string> = {
      default: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
      package: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
      subscriptions: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
      custom_comments: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
    };
    return classes[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Servicios</h1>
            <p className="text-muted-foreground mt-1">
              {filteredServices.length} servicio{filteredServices.length === 1 ? '' : 's'} encontrado{filteredServices.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/servicios/sincronizar">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Sincronizar
              </Button>
            </Link>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Servicio
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 border border-input rounded-md px-3 bg-background"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
          <div className="w-full md:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-10 border border-input rounded-md px-3 bg-background"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de Servicios */}
      <div className="grid gap-4">
        {filteredServices.map((service) => (
          <Card key={service.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{service.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeClass(service.type)}`}>
                    {service.type}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    service.is_active 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {service.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {service.description || 'Sin descripción'}
                </p>

                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Categoría:</span>{' '}
                    <span className="font-medium">{service.category?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Precio:</span>{' '}
                    <span className="font-medium">${service.price_per_1000}/1000</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Min:</span>{' '}
                    <span className="font-medium">{service.min_quantity}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max:</span>{' '}
                    <span className="font-medium">{service.max_quantity}</span>
                  </div>
                  {service.api_provider && (
                    <div>
                      <span className="text-muted-foreground">Proveedor:</span>{' '}
                      <span className="font-medium">{service.api_provider.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2">
                <Link href={`/admin/servicios/${service.id}/editar`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(service.id, service.is_active)}
                >
                  {service.is_active ? (
                    <PowerOff className="h-4 w-4" />
                  ) : (
                    <Power className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  onClick={() => handleDelete(service.id, service.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No se encontraron servicios</p>
        </Card>
      )}

      {/* Modal para agregar servicio */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Servicio</DialogTitle>
            <DialogDescription>
              Complete los detalles del nuevo servicio. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateService} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nombre del Servicio *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Instagram Seguidores"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del servicio..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category_id">Categoría *</Label>
                <Select
                  required
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Tipo de Servicio *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="package">Package</SelectItem>
                    <SelectItem value="subscriptions">Subscriptions</SelectItem>
                    <SelectItem value="custom_comments">Custom Comments</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price_per_1000">Precio por 1000 *</Label>
                <Input
                  id="price_per_1000"
                  type="number"
                  step="0.01"
                  required
                  value={formData.price_per_1000}
                  onChange={(e) => setFormData({ ...formData, price_per_1000: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="delivery_time">Tiempo de Entrega</Label>
                <Input
                  id="delivery_time"
                  value={formData.delivery_time}
                  onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                  placeholder="Ej: 0-1 hora"
                />
              </div>

              <div>
                <Label htmlFor="min_quantity">Cantidad Mínima *</Label>
                <Input
                  id="min_quantity"
                  type="number"
                  required
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="max_quantity">Cantidad Máxima *</Label>
                <Input
                  id="max_quantity"
                  type="number"
                  required
                  value={formData.max_quantity}
                  onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
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
                {isSubmitting ? 'Creando...' : 'Crear Servicio'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
