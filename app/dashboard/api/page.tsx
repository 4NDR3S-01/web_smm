'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function APIPage() {
  const [apiInfo, setApiInfo] = useState<{
    apiKey?: string;
    apiStatus: boolean;
  }>({ apiStatus: false });
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchApiInfo();
  }, []);

  const fetchApiInfo = async () => {
    try {
      const response = await fetch('/api/user/api-info');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setApiInfo(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar información de API');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (apiInfo.apiKey && !confirm('¿Estás seguro? Esto invalidará tu API key actual.')) {
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/user/api-generate', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
        toast.error(errorData.error || 'Error al generar API key');
        return;
      }
      
      const data = await response.json();

      if (data.success) {
        toast.success('API key generada exitosamente');
        await fetchApiInfo();
      } else {
        toast.error(data.error || 'Error al generar API key');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al generar API key');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const endpoint = apiInfo.apiStatus ? '/api/user/api-disable' : '/api/user/api-enable';
      const response = await fetch(endpoint, { method: 'POST' });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
        toast.error(errorData.error || 'Error al cambiar estado de API');
        return;
      }
      
      const data = await response.json();

      if (data.success) {
        toast.success(`API ${apiInfo.apiStatus ? 'deshabilitada' : 'habilitada'}`);
        await fetchApiInfo();
      } else {
        toast.error(data.error || 'Error al cambiar estado de API');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cambiar estado de API');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const maskedKey = (key: string) => {
    if (!key) return '';
    return `${key.slice(0, 8)}${'*'.repeat(key.length - 16)}${key.slice(-8)}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/v2` : '/api/v2';

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">API para Distribuidores</h1>
        <p className="text-muted-foreground mt-2">
          Integra nuestros servicios en tu aplicación usando nuestra API REST
        </p>
      </div>

      {/* API Key Card */}
      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Tu API Key</h2>
            <p className="text-sm text-muted-foreground">
              Usa esta clave para autenticarte en las peticiones API
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              apiInfo.apiStatus 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {apiInfo.apiStatus ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>

        {apiInfo.apiKey ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 p-3 rounded font-mono text-sm break-all">
                {showKey ? apiInfo.apiKey : maskedKey(apiInfo.apiKey)}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(apiInfo.apiKey!)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGenerateKey}
                disabled={generating}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                Regenerar Key
              </Button>
              <Button
                variant={apiInfo.apiStatus ? 'destructive' : 'default'}
                onClick={handleToggleStatus}
              >
                {apiInfo.apiStatus ? 'Deshabilitar' : 'Habilitar'} API
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No tienes una API key generada aún
            </p>
            <Button onClick={handleGenerateKey} disabled={generating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              Generar API Key
            </Button>
          </div>
        )}
      </Card>

      {/* Documentación */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Documentación</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Endpoint Base</h3>
            <code className="block bg-gray-100 p-3 rounded">
              {apiUrl}
            </code>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Método de Autenticación</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Todas las peticiones requieren el parámetro <code className="bg-gray-100 px-2 py-1 rounded">key</code> con tu API key
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-2">1. Obtener Lista de Servicios</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Retorna todos los servicios disponibles con sus precios y límites
            </p>
            <div className="bg-gray-100 p-4 rounded space-y-2">
              <p className="text-sm"><strong>Método:</strong> GET</p>
              <p className="text-sm"><strong>Ejemplo:</strong></p>
              <code className="block text-sm">
                {apiUrl}?key=YOUR_API_KEY&action=services
              </code>
              <p className="text-sm mt-2"><strong>Respuesta:</strong></p>
              <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
{`[
  {
    "service": "uuid-servicio",
    "name": "Instagram Followers",
    "type": "default",
    "category": "Instagram",
    "rate": "1.50",
    "min": 100,
    "max": 10000,
    "refill": true,
    "cancel": false
  }
]`}
              </pre>
            </div>
          </div>

          {/* Add Order */}
          <div>
            <h3 className="font-semibold mb-2">2. Crear Pedido</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Crea un nuevo pedido para un servicio específico
            </p>
            <div className="bg-gray-100 p-4 rounded space-y-2">
              <p className="text-sm"><strong>Método:</strong> POST o GET</p>
              <p className="text-sm"><strong>Parámetros:</strong></p>
              <ul className="text-sm list-disc list-inside space-y-1">
                <li><code>service</code>: ID del servicio</li>
                <li><code>link</code>: URL objetivo</li>
                <li><code>quantity</code>: Cantidad a ordenar</li>
                <li><code>comments</code>: (Opcional) Para servicios de comentarios</li>
              </ul>
              <p className="text-sm mt-2"><strong>Ejemplo:</strong></p>
              <code className="block text-sm">
                {apiUrl}?key=YOUR_API_KEY&action=add&service=SERVICE_ID&link=https://instagram.com/user&quantity=1000
              </code>
              <p className="text-sm mt-2"><strong>Respuesta:</strong></p>
              <pre className="text-xs bg-white p-2 rounded">
{`{
  "order": "abc12345"
}`}
              </pre>
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="font-semibold mb-2">3. Consultar Estado de Pedido</h3>
            <div className="bg-gray-100 p-4 rounded space-y-2">
              <p className="text-sm"><strong>Método:</strong> GET</p>
              <p className="text-sm"><strong>Un pedido:</strong></p>
              <code className="block text-sm">
                {apiUrl}?key=YOUR_API_KEY&action=status&order=ORDER_ID
              </code>
              <p className="text-sm mt-2"><strong>Múltiples pedidos:</strong></p>
              <code className="block text-sm">
                {apiUrl}?key=YOUR_API_KEY&action=status&orders=ORDER_ID1,ORDER_ID2
              </code>
              <p className="text-sm mt-2"><strong>Respuesta:</strong></p>
              <pre className="text-xs bg-white p-2 rounded">
{`{
  "charge": "1.50",
  "start_count": "1000",
  "status": "completed",
  "remains": "0",
  "currency": "USD"
}`}
              </pre>
            </div>
          </div>

          {/* Balance */}
          <div>
            <h3 className="font-semibold mb-2">4. Consultar Saldo</h3>
            <div className="bg-gray-100 p-4 rounded space-y-2">
              <p className="text-sm"><strong>Método:</strong> GET</p>
              <code className="block text-sm">
                {apiUrl}?key=YOUR_API_KEY&action=balance
              </code>
              <p className="text-sm mt-2"><strong>Respuesta:</strong></p>
              <pre className="text-xs bg-white p-2 rounded">
{`{
  "balance": "150.00",
  "currency": "USD"
}`}
              </pre>
            </div>
          </div>

          {/* Estados de Pedido */}
          <div>
            <h3 className="font-semibold mb-2">Estados de Pedido</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div><code className="bg-gray-100 px-2 py-1 rounded">awaiting</code> - En espera</div>
              <div><code className="bg-gray-100 px-2 py-1 rounded">pending</code> - Pendiente</div>
              <div><code className="bg-gray-100 px-2 py-1 rounded">inprogress</code> - En progreso</div>
              <div><code className="bg-gray-100 px-2 py-1 rounded">processing</code> - Procesando</div>
              <div><code className="bg-green-100 px-2 py-1 rounded">completed</code> - Completado</div>
              <div><code className="bg-yellow-100 px-2 py-1 rounded">partial</code> - Parcial</div>
              <div><code className="bg-red-100 px-2 py-1 rounded">canceled</code> - Cancelado</div>
              <div><code className="bg-red-100 px-2 py-1 rounded">error</code> - Error</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Notas Importantes */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Notas Importantes
        </h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Mantén tu API key segura y no la compartas públicamente</li>
          <li>La API key puede ser regenerada en cualquier momento (invalida la anterior)</li>
          <li>Deshabilitar el acceso API no elimina tu key, solo la desactiva temporalmente</li>
          <li>Los precios mostrados son específicos para tu cuenta</li>
          <li>Asegúrate de tener saldo suficiente antes de crear pedidos</li>
        </ul>
      </Card>
    </div>
  );
}
