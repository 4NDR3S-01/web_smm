"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Sparkles,
  AlertCircle,
  Info,
  CheckCircle2,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Package,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { createOrderSchema, type CreateOrderFormData } from "@/lib/validations/order";
import type { Service, ServiceCategory, Profile } from "@/lib/types/database";
import { calculateClientPrice } from "@/lib/utils/pricing";

export default function NuevoPedidoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      quantity: 100,
    },
  });

  const quantity = watch("quantity");
  const serviceId = watch("serviceId");

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Cargar perfil
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setProfile(profileData);

        // Cargar categorías
        const { data: categoriesData } = await supabase
          .from("service_categories")
          .select("*")
          .eq("is_active", true)
          .order("name");

        setCategories(categoriesData || []);

        // Cargar servicios activos
        const { data: servicesData } = await supabase
          .from("services")
          .select("*")
          .eq("is_active", true)
          .order("name");

        setServices(servicesData || []);
        setFilteredServices(servicesData || []);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  // Filtrar servicios por categoría y búsqueda
  useEffect(() => {
    let filtered = services;

    if (selectedCategory) {
      filtered = filtered.filter(s => s.category_id === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  }, [selectedCategory, searchTerm, services]);

  // Calcular precio estimado
  useEffect(() => {
    if (selectedService && quantity) {
      // Usa la función de pricing que calcula correctamente el precio
      const total = calculateClientPrice(quantity, selectedService.price_per_1000);
      setEstimatedPrice(total);
    } else {
      setEstimatedPrice(0);
    }
  }, [selectedService, quantity]);

  // Actualizar servicio seleccionado
  useEffect(() => {
    if (serviceId) {
      const service = services.find(s => s.id === serviceId);
      setSelectedService(service || null);
    }
  }, [serviceId, services]);

  const onSubmit = async (data: CreateOrderFormData) => {
    if (!selectedService) {
      toast.error("Selecciona un servicio");
      return;
    }

    if (!profile) {
      toast.error("Error al cargar el perfil");
      return;
    }

    // Verificar saldo suficiente
    if (profile.balance < estimatedPrice) {
      toast.error("Saldo insuficiente", {
        description: `Necesitas $${estimatedPrice.toFixed(2)} pero solo tienes $${profile.balance.toFixed(2)}`,
        action: {
          label: "Recargar",
          onClick: () => router.push("/dashboard/billetera"),
        },
      });
      return;
    }

    // Verificar límites de cantidad
    if (data.quantity < selectedService.min_quantity) {
      toast.error(`La cantidad mínima es ${selectedService.min_quantity.toLocaleString()}`);
      return;
    }

    if (data.quantity > selectedService.max_quantity) {
      toast.error(`La cantidad máxima es ${selectedService.max_quantity.toLocaleString()}`);
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("No estás autenticado");
        return;
      }

      // Generar número de orden único
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

      // Crear pedido
      const { error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          service_id: selectedService.id,
          service_name: selectedService.name,
          service_type: selectedService.type,
          quantity: data.quantity,
          price: estimatedPrice,
          target_url: data.targetUrl,
          status: "pending",
          started_count: 0,
          notes: data.notes || null,
        });

      if (orderError) {
        console.error("Error al crear pedido:", orderError);
        toast.error("Error al crear el pedido", {
          description: orderError.message,
        });
        return;
      }

      // Crear transacción de retiro
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "withdrawal",
          amount: estimatedPrice,
          description: `Pedido: ${selectedService.name} - ${orderNumber}`,
          reference_id: orderNumber,
          status: "completed",
        });

      if (transactionError) {
        console.error("Error al crear transacción:", transactionError);
      }

      // Actualizar saldo del usuario
      const newBalance = profile.balance - estimatedPrice;
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", user.id);

      if (balanceError) {
        console.error("Error al actualizar saldo:", balanceError);
      }

      toast.success("¡Pedido creado exitosamente!", {
        description: `Número de orden: ${orderNumber}`,
        action: {
          label: "Ver pedido",
          onClick: () => router.push("/dashboard/pedidos"),
        },
      });

      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push("/dashboard/pedidos");
      }, 2000);

    } catch (error) {
      console.error("Error general:", error);
      toast.error("Error al procesar el pedido");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case "instagram": return Instagram;
      case "youtube": return Youtube;
      case "facebook": return Facebook;
      case "twitter": return Twitter;
      default: return Package;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Nuevo Pedido
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Selecciona un servicio y completa los detalles de tu pedido
          </p>
        </div>

        {/* Balance */}
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Saldo disponible</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-white">
              ${profile?.balance.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo - Categorías y Servicios */}
        <div className="lg:col-span-2 space-y-6">
          {/* Categorías */}
          <Card>
            <CardHeader>
              <CardTitle>Selecciona una Categoría</CardTitle>
              <CardDescription>Filtra los servicios por red social</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <Button
                  variant={selectedCategory === "" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("")}
                  className={selectedCategory === "" ? "bg-gradient-to-r from-purple-600 to-blue-600" : ""}
                >
                  Todos
                </Button>
                {categories.map((category) => {
                  const Icon = getCategoryIcon(category.slug);
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center gap-2 ${
                        selectedCategory === category.id
                          ? "bg-gradient-to-r from-purple-600 to-blue-600"
                          : ""
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {category.name}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Búsqueda */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de Servicios */}
          <Card>
            <CardHeader>
              <CardTitle>Servicios Disponibles</CardTitle>
              <CardDescription>
                {filteredServices.length} servicio(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredServices.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No se encontraron servicios
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 max-h-[600px] overflow-y-auto pr-2">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setValue("serviceId", service.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setValue("serviceId", service.id);
                        }
                      }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        serviceId === service.id
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {service.name}
                            </h3>
                            {serviceId === service.id && (
                              <CheckCircle2 className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                          {service.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {service.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <span className="font-semibold">Precio:</span>
                              ${service.price_per_1000.toFixed(2)} / 1000
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="font-semibold">Min:</span>
                              {service.min_quantity.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="font-semibold">Max:</span>
                              {service.max_quantity.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="font-semibold">Entrega:</span>
                              {service.delivery_time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel derecho - Formulario */}
        <div className="space-y-6">
          <Card className="sticky top-20 z-10 bg-white dark:bg-gray-950 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Detalles del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Servicio Seleccionado */}
                <div>
                  <Label className="text-sm font-medium">Servicio</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {selectedService ? (
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">
                          {selectedService.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          ${selectedService.price_per_1000.toFixed(2)} por 1000 unidades
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Selecciona un servicio de la lista
                      </p>
                    )}
                  </div>
                  <input type="hidden" {...register("serviceId")} />
                  {errors.serviceId && (
                    <p className="text-sm text-red-500 mt-1">{errors.serviceId.message}</p>
                  )}
                </div>

                {/* URL */}
                <div>
                  <Label htmlFor="targetUrl">URL del Perfil o Publicación *</Label>
                  <Input
                    id="targetUrl"
                    type="url"
                    placeholder="https://instagram.com/usuario"
                    {...register("targetUrl")}
                    className="mt-1"
                  />
                  {errors.targetUrl && (
                    <p className="text-sm text-red-500 mt-1">{errors.targetUrl.message}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <Info className="w-3 h-3 inline mr-1" />
                    Solo necesitamos la URL pública, nunca tu contraseña
                  </p>
                </div>

                {/* Cantidad */}
                <div>
                  <Label htmlFor="quantity">Cantidad *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    {...register("quantity", { valueAsNumber: true })}
                    className="mt-1"
                    min={selectedService?.min_quantity || 1}
                    max={selectedService?.max_quantity || 1000000}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>
                  )}
                  {selectedService && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Rango: {selectedService.min_quantity.toLocaleString()} -{" "}
                      {selectedService.max_quantity.toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Notas (Opcional) */}
                <div>
                  <Label htmlFor="notes">Notas (Opcional)</Label>
                  <textarea
                    id="notes"
                    {...register("notes")}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Información adicional sobre tu pedido..."
                  />
                  {errors.notes && (
                    <p className="text-sm text-red-500 mt-1">{errors.notes.message}</p>
                  )}
                </div>

                {/* Resumen de Precio */}
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Cantidad:</span>
                      <span className="font-semibold">{quantity?.toLocaleString() || 0}</span>
                    </div>
                    {selectedService && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Precio unitario:</span>
                        <span className="font-semibold">
                          ${(selectedService.price_per_1000 / 1000).toFixed(4)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-purple-600 dark:text-purple-400">
                        ${estimatedPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón Submit */}
                <Button
                  type="submit"
                  disabled={submitting || !selectedService}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Realizar Pedido
                    </>
                  )}
                </Button>

                {/* Advertencias */}
                {profile && estimatedPrice > profile.balance && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-red-900 dark:text-red-100">
                        Saldo insuficiente
                      </p>
                      <p className="text-red-700 dark:text-red-300">
                        Necesitas ${estimatedPrice.toFixed(2)} pero solo tienes $
                        {profile.balance.toFixed(2)}
                      </p>
                      <Link href="/dashboard/billetera">
                        <Button variant="link" className="p-0 h-auto text-red-600 dark:text-red-400">
                          Recargar saldo →
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </form>

              {/* Info adicional integrada en el formulario */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-semibold mb-2">Información importante:</p>
                    <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                      <li>• Los pedidos se procesan automáticamente</li>
                      <li>• El tiempo de entrega varía según el servicio</li>
                      <li>• Nunca solicitamos tu contraseña</li>
                      <li>• Puedes ver el progreso en tiempo real</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
