'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {   
  Search, 
  Plus,
  Edit2, 
  Trash2, 
  Power,
  PowerOff,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  FolderPlus,
  Tag,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  type: string;
  price_per_1000: number;
  original_price?: number;
  min_quantity: number;
  max_quantity: number;
  is_active: boolean;
  category_id?: string;
  api_provider_id?: string;
  api_service_id?: string;
  add_type?: 'api' | 'manual';
}

export default function ServicesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Estados para crear/editar categorías
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
  });

  // Estados para crear nuevo servicio
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    type: 'seguidores',
    price_per_1000: 0,
    min_quantity: 10,
    max_quantity: 10000,
    is_active: true,
  });

  // Estados para editar servicio
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editServiceFormData, setEditServiceFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    type: 'seguidores',
    price_per_1000: 0,
    min_quantity: 10,
    max_quantity: 10000,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, servicesRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/admin/services'),
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
      }

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData.services || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!categoryFormData.name.trim()) {
      toast.error('El nombre de la categoría es requerido');
      return;
    }

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryFormData.name,
          description: categoryFormData.description,
          is_active: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error' }));
        toast.error(errorData.error || 'Error al crear categoría');
        return;
      }

      toast.success('Categoría creada exitosamente');
      setCategoryFormData({ name: '', description: '' });
      setIsAddingCategory(false);
      await loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear categoría');
    }
  };

  const handleUpdateCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCategoryName }),
      });

      if (!response.ok) {
        toast.error('Error al actualizar categoría');
        return;
      }

      toast.success('Categoría actualizada');
      setEditingCategoryId(null);
      await loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar categoría');
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${categoryName}"?`)) return;

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error' }));
        toast.error(errorData.error || 'Error al eliminar categoría');
        return;
      }

      toast.success('Categoría eliminada');
      await loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar categoría');
    }
  };

  const handleCreateService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!serviceFormData.name.trim()) {
      toast.error('El nombre del servicio es requerido');
      return;
    }

    if (!serviceFormData.price_per_1000 || serviceFormData.price_per_1000 <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }

    try {
      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: serviceFormData.name,
          description: serviceFormData.description || null,
          category_id: serviceFormData.category_id || null,
          type: serviceFormData.type,
          price_per_1000: Number.parseFloat(serviceFormData.price_per_1000.toString()),
          min_quantity: Number.parseInt(serviceFormData.min_quantity.toString(), 10),
          max_quantity: Number.parseInt(serviceFormData.max_quantity.toString(), 10),
          is_active: serviceFormData.is_active,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error' }));
        toast.error(errorData.error || 'Error al crear servicio');
        return;
      }

      toast.success('Servicio creado exitosamente');
      setServiceFormData({
        name: '',
        description: '',
        category_id: '',
        type: 'seguidores',
        price_per_1000: 0,
        min_quantity: 10,
        max_quantity: 10000,
        is_active: true,
      });
      setIsAddServiceOpen(false);
      await loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear servicio');
    }
  };

  const toggleServiceStatus = async (serviceId: string, newStatus: boolean) => {
    try {
      // Actualización optimista del estado
      setServices(prev => 
        prev.map(s => s.id === serviceId ? { ...s, is_active: newStatus } : s)
      );

      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (!response.ok) {
        // Revertir cambio si falla
        setServices(prev => 
          prev.map(s => s.id === serviceId ? { ...s, is_active: !newStatus } : s)
        );
        toast.error('Error al actualizar estado');
        return;
      }

      toast.success(`Servicio ${newStatus ? 'activado' : 'desactivado'}`);
    } catch (error) {
      // Revertir cambio si hay error
      setServices(prev => 
        prev.map(s => s.id === serviceId ? { ...s, is_active: !newStatus } : s)
      );
      console.error('Error:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const openEditServiceModal = (service: Service) => {
    setEditingService(service);
    setEditServiceFormData({
      name: service.name,
      description: service.description || '',
      category_id: service.category_id || '',
      type: service.type,
      price_per_1000: service.price_per_1000,
      min_quantity: service.min_quantity,
      max_quantity: service.max_quantity,
      is_active: service.is_active,
    });
    setIsEditServiceOpen(true);
  };

  const handleUpdateService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingService) return;

    try {
      const response = await fetch(`/api/admin/services/${editingService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editServiceFormData),
      });

      if (!response.ok) {
        toast.error('Error al actualizar servicio');
        return;
      }

      toast.success('Servicio actualizado exitosamente');
      setIsEditServiceOpen(false);
      setEditingService(null);
      await loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar servicio');
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(categoryId)) {
      newCollapsed.delete(categoryId);
    } else {
      newCollapsed.add(categoryId);
    }
    setCollapsedCategories(newCollapsed);
  };

  const collapseAll = () => {
    setCollapsedCategories(new Set(categories.map((c) => c.id)));
  };

  const expandAll = () => {
    setCollapsedCategories(new Set());
  };

  const getServicesByCategory = (categoryId: string) => {
    let categoryServices = services.filter((s) => s.category_id === categoryId);
    
    // Filtrar por búsqueda
    if (searchTerm) {
      categoryServices = categoryServices.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.api_service_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return categoryServices;
  };

  const getUncategorizedServices = () => {
    let uncategorized = services.filter((s) => !s.category_id);
    
    if (searchTerm) {
      uncategorized = uncategorized.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.api_service_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return uncategorized;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Cargando servicios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Servicios</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona tus categorías y servicios
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
            <DialogTrigger asChild>
              <Button>
                <Package className="w-4 h-4 mr-2" />
                Nuevo Servicio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Servicio</DialogTitle>
                <DialogDescription>
                  Agrega un nuevo servicio manual a tu panel
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateService} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="service-name">Nombre del Servicio *</Label>
                    <Input
                      id="service-name"
                      required
                      value={serviceFormData.name}
                      onChange={(e) =>
                        setServiceFormData({ ...serviceFormData, name: e.target.value })
                      }
                      placeholder="Ej: 1000 Seguidores Instagram"
                    />
                  </div>

                  <div>
                    <Label htmlFor="service-category">Categoría</Label>
                    <Select
                      value={serviceFormData.category_id || 'none'}
                      onValueChange={(value) =>
                        setServiceFormData({ ...serviceFormData, category_id: value === 'none' ? '' : value })
                      }
                    >
                      <SelectTrigger id="service-category">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin categoría</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="service-type">Tipo de Servicio *</Label>
                    <Select
                      value={serviceFormData.type}
                      onValueChange={(value) =>
                        setServiceFormData({ ...serviceFormData, type: value })
                      }
                    >
                      <SelectTrigger id="service-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seguidores">Seguidores</SelectItem>
                        <SelectItem value="likes">Likes</SelectItem>
                        <SelectItem value="vistas">Vistas</SelectItem>
                        <SelectItem value="comentarios">Comentarios</SelectItem>
                        <SelectItem value="suscriptores">Suscriptores</SelectItem>
                        <SelectItem value="reproducciones">Reproducciones</SelectItem>
                        <SelectItem value="shares">Shares</SelectItem>
                        <SelectItem value="guardados">Guardados</SelectItem>
                        <SelectItem value="menciones">Menciones</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="service-price">Precio por 1000 * ($)</Label>
                    <Input
                      id="service-price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={serviceFormData.price_per_1000}
                      onChange={(e) =>
                        setServiceFormData({
                          ...serviceFormData,
                          price_per_1000: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="service-min">Cantidad Mínima *</Label>
                    <Input
                      id="service-min"
                      type="number"
                      min="1"
                      required
                      value={serviceFormData.min_quantity}
                      onChange={(e) =>
                        setServiceFormData({
                          ...serviceFormData,
                          min_quantity: Number.parseInt(e.target.value, 10) || 10,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="service-max">Cantidad Máxima *</Label>
                    <Input
                      id="service-max"
                      type="number"
                      min="1"
                      required
                      value={serviceFormData.max_quantity}
                      onChange={(e) =>
                        setServiceFormData({
                          ...serviceFormData,
                          max_quantity: Number.parseInt(e.target.value, 10) || 10000,
                        })
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="service-description">Descripción</Label>
                    <Textarea
                      id="service-description"
                      value={serviceFormData.description}
                      onChange={(e) =>
                        setServiceFormData({ ...serviceFormData, description: e.target.value })
                      }
                      placeholder="Descripción del servicio (opcional)"
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="service-active"
                        checked={serviceFormData.is_active}
                        onChange={(e) =>
                          setServiceFormData({ ...serviceFormData, is_active: e.target.checked })
                        }
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <Label htmlFor="service-active" className="cursor-pointer">
                        Servicio activo
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddServiceOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <Save className="w-4 h-4 mr-2" />
                    Crear Servicio
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Modal para editar servicio */}
          <Dialog open={isEditServiceOpen} onOpenChange={setIsEditServiceOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Servicio</DialogTitle>
                <DialogDescription>
                  Modifica los datos del servicio existente
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleUpdateService} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="edit-service-name">Nombre del Servicio *</Label>
                    <Input
                      id="edit-service-name"
                      required
                      value={editServiceFormData.name}
                      onChange={(e) =>
                        setEditServiceFormData({ ...editServiceFormData, name: e.target.value })
                      }
                      placeholder="Ej: Seguidores Instagram"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-service-category">Categoría</Label>
                    <Select
                      value={editServiceFormData.category_id || "sin-categoria"}
                      onValueChange={(value) =>
                        setEditServiceFormData({
                          ...editServiceFormData,
                          category_id: value === "sin-categoria" ? "" : value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sin-categoria">Sin categoría</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit-service-type">Tipo *</Label>
                    <Select
                      value={editServiceFormData.type}
                      onValueChange={(value) =>
                        setEditServiceFormData({ ...editServiceFormData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seguidores">Seguidores</SelectItem>
                        <SelectItem value="likes">Likes</SelectItem>
                        <SelectItem value="vistas">Vistas</SelectItem>
                        <SelectItem value="comentarios">Comentarios</SelectItem>
                        <SelectItem value="shares">Shares</SelectItem>
                        <SelectItem value="suscriptores">Suscriptores</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit-service-price">Precio por 1000 *</Label>
                    <Input
                      id="edit-service-price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={editServiceFormData.price_per_1000}
                      onChange={(e) =>
                        setEditServiceFormData({
                          ...editServiceFormData,
                          price_per_1000: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-service-min">Cantidad Mínima *</Label>
                    <Input
                      id="edit-service-min"
                      type="number"
                      min="1"
                      required
                      value={editServiceFormData.min_quantity}
                      onChange={(e) =>
                        setEditServiceFormData({
                          ...editServiceFormData,
                          min_quantity: Number.parseInt(e.target.value, 10) || 10,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-service-max">Cantidad Máxima *</Label>
                    <Input
                      id="edit-service-max"
                      type="number"
                      min="1"
                      required
                      value={editServiceFormData.max_quantity}
                      onChange={(e) =>
                        setEditServiceFormData({
                          ...editServiceFormData,
                          max_quantity: Number.parseInt(e.target.value, 10) || 10000,
                        })
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="edit-service-description">Descripción</Label>
                    <Textarea
                      id="edit-service-description"
                      value={editServiceFormData.description}
                      onChange={(e) =>
                        setEditServiceFormData({ ...editServiceFormData, description: e.target.value })
                      }
                      placeholder="Descripción del servicio (opcional)"
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit-service-active"
                        checked={editServiceFormData.is_active}
                        onChange={(e) =>
                          setEditServiceFormData({ ...editServiceFormData, is_active: e.target.checked })
                        }
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <Label htmlFor="edit-service-active" className="cursor-pointer">
                        Servicio activo
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditServiceOpen(false);
                      setEditingService(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Link href="/admin/servicios/sincronizar">
            <Button variant="outline">
              <FolderPlus className="w-4 h-4 mr-2" />
              Importar Servicios
            </Button>
          </Link>
        </div>
      </div>

      {/* Gestión de Categorías */}
      <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Categorías
            </h3>
          </div>
          <Button
            size="sm"
            onClick={() => setIsAddingCategory(!isAddingCategory)}
            variant={isAddingCategory ? 'outline' : 'default'}
          >
            {isAddingCategory ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Categoría
              </>
            )}
          </Button>
        </div>

        {/* Formulario de nueva categoría */}
        {isAddingCategory && (
          <form onSubmit={handleCreateCategory} className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-category-name">Nombre *</Label>
                <Input
                  id="new-category-name"
                  required
                  value={categoryFormData.name}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, name: e.target.value })
                  }
                  placeholder="Ej: Instagram, Facebook, TikTok"
                />
              </div>
              <div>
                <Label htmlFor="new-category-description">Descripción</Label>
                <Input
                  id="new-category-description"
                  value={categoryFormData.description}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, description: e.target.value })
                  }
                  placeholder="Descripción opcional"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button type="submit" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Crear Categoría
              </Button>
            </div>
          </form>
        )}

        {/* Lista de categorías */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              {editingCategoryId === category.id ? (
                <div className="space-y-2">
                  <Input
                    value={editingCategoryName}
                    onChange={(e) => setEditingCategoryName(e.target.value)}
                    className="text-sm"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateCategory(category.id)}
                      className="flex-1"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingCategoryId(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {category.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {services.filter((s) => s.category_id === category.id).length} servicios
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingCategoryId(category.id);
                        setEditingCategoryName(category.name);
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {categories.length === 0 && !isAddingCategory && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No hay categorías. Crea la primera para organizar tus servicios.
          </div>
        )}
      </Card>

      {/* Barra de búsqueda y controles */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar servicios por nombre, ID de API..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={collapseAll} size="sm">
            <ChevronUp className="w-4 h-4 mr-2" />
            Contraer Todo
          </Button>
          <Button variant="outline" onClick={expandAll} size="sm">
            <ChevronDown className="w-4 h-4 mr-2" />
            Expandir Todo
          </Button>
        </div>
      </div>

      {/* Servicios organizados por categoría */}
      <div className="space-y-4">
        {categories.map((category) => {
          const categoryServices = getServicesByCategory(category.id);
          const isCollapsed = collapsedCategories.has(category.id);
          
          // Si hay búsqueda y no hay servicios en esta categoría, no mostrar
          if (searchTerm && categoryServices.length === 0) return null;

          return (
            <Card
              key={category.id}
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            >
              <div
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {category.name}
                  </h3>
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                    {categoryServices.length} servicios
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCategoryId(category.id);
                      setEditingCategoryName(category.name);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {isCollapsed ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {!isCollapsed && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Nombre
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Proveedor
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Precio / 1K
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Min / Max
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {categoryServices.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                              No hay servicios en esta categoría
                            </td>
                          </tr>
                        ) : (
                          categoryServices.map((service) => (
                            <tr
                              key={service.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                            >
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                #{service.id.slice(0, 8)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {service.name}
                                </div>
                                {service.api_service_id && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    API ID: {service.api_service_id}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center text-sm">
                                {service.add_type === 'api' ? (
                                  <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                    API
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                    Manual
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                                {service.type}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                  ${service.price_per_1000.toFixed(2)}
                                </div>
                                {service.original_price && (
                                  <div className={`text-xs ${
                                    service.original_price > service.price_per_1000
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                    Base: ${service.original_price.toFixed(2)}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                                {service.min_quantity.toLocaleString()} / {service.max_quantity.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => toggleServiceStatus(service.id, !service.is_active)}
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    service.is_active
                                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                  }`}
                                >
                                  {service.is_active ? (
                                    <>
                                      <Power className="w-3 h-3 mr-1" />
                                      Activo
                                    </>
                                  ) : (
                                    <>
                                      <PowerOff className="w-3 h-3 mr-1" />
                                      Inactivo
                                    </>
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => openEditServiceModal(service)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {/* Servicios sin categoría */}
        {(() => {
          const uncategorized = getUncategorizedServices();
          if (uncategorized.length === 0) return null;
          const isCollapsed = collapsedCategories.has('uncategorized');
          
          return (
            <Card
              key="uncategorized"
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
                onClick={() => toggleCategory('uncategorized')}
              >
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Sin Categoría
                  </h3>
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                    {uncategorized.length} servicios
                  </span>
                </div>
                {isCollapsed ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {!isCollapsed && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Nombre
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Proveedor
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Precio / 1K
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Min / Max
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {uncategorized.map((service) => (
                          <tr
                            key={service.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              #{service.id.slice(0, 8)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {service.name}
                              </div>
                              {service.api_service_id && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  API ID: {service.api_service_id}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              {service.add_type === 'api' ? (
                                <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                  API
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                  Manual
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                              {service.type}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                ${service.price_per_1000.toFixed(2)}
                              </div>
                              {service.original_price && (
                                <div className={`text-xs ${
                                  service.original_price > service.price_per_1000
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  Base: ${service.original_price.toFixed(2)}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                              {service.min_quantity.toLocaleString()} / {service.max_quantity.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => toggleServiceStatus(service.id, !service.is_active)}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  service.is_active
                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                }`}
                              >
                                {service.is_active ? (
                                  <>
                                    <Power className="w-3 h-3 mr-1" />
                                    Activo
                                  </>
                                ) : (
                                  <>
                                    <PowerOff className="w-3 h-3 mr-1" />
                                    Inactivo
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => openEditServiceModal(service)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          );
        })()}

        {categories.length === 0 && getUncategorizedServices().length === 0 && (
          <Card className="p-12 text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="text-gray-600 dark:text-gray-400 mb-4">
              No hay servicios. Importa servicios desde un proveedor API.
            </div>
            <Link href="/admin/servicios/sincronizar">
              <Button>
                <FolderPlus className="w-4 h-4 mr-2" />
                Importar Servicios
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
