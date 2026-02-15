import type { 
  ApiServiceResponse, 
  ApiBalanceResponse, 
  ApiOrderResponse,
  ApiStatusResponse 
} from "../constants/api";
import { API_PROVIDER_CONFIG } from "../constants/api";

/**
 * Clase para manejar las llamadas a la API del proveedor SMM
 * Esta clase será utilizada por el panel de administrador para:
 * - Sincronizar servicios
 * - Crear pedidos en la API externa
 * - Consultar el estado de pedidos
 * - Obtener balance disponible
 */
export class SmmApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || API_PROVIDER_CONFIG.BASE_URL;
    this.apiKey = apiKey || API_PROVIDER_CONFIG.API_KEY;
  }

  /**
   * Realiza una petición POST a la API del proveedor (al estilo PHP)
   * Envía datos como application/x-www-form-urlencoded
   * 
   * Configuración compatible con el panel PHP:
   * - POST method con form-urlencoded body
   * - User-Agent específico para compatibilidad
   * - Timeout de 60 segundos (más generoso)
   */
  private async request<T>(
    action: string,
    params: Record<string, string | number> = {}
  ): Promise<T> {
    // Preparar los datos como form-urlencoded (igual que PHP cURL)
    const formData = new URLSearchParams();
    formData.append('key', this.apiKey);
    formData.append('action', action);
    
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos

    console.log(`[SmmApiClient] Petición: ${action} a ${this.baseUrl}`);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // User-Agent del panel PHP para máxima compatibilidad
          'User-Agent': 'Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0)',
        },
        body: formData.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Intentar leer el body incluso si hay error
      let responseText: string;
      try {
        responseText = await response.text();
        if (!response.ok) {
          console.error(`[SmmApiClient] Error ${response.status}:`, responseText.substring(0, 200));
        }
      } catch (readError) {
        throw new Error(`Error leyendo respuesta: ${readError}`);
      }

      if (!response.ok) {
        throw new Error(
          `API Error: ${response.status} ${response.statusText}. Response: ${responseText.substring(0, 200)}`
        );
      }

      // Intentar parsear JSON
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Error parseando JSON: ${parseError}. Response: ${responseText.substring(0, 200)}`);
      }
      
      // Manejar errores de la API
      if (data.error) {
        throw new Error(`API returned error: ${data.error}`);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout (60 segundos)');
        }
        console.error('[SmmApiClient] Error en petición:', error);
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  /**
   * Obtiene la lista de servicios disponibles del proveedor
   * Usado por el admin para sincronizar el catálogo
   */
  async getServices(): Promise<ApiServiceResponse[]> {
    try {
      const response = await this.request<ApiServiceResponse[]>('services');
      const services = Array.isArray(response) ? response : [];
      console.log(`[SmmApiClient] Obtenidos ${services.length} servicios del proveedor`);
      return services;
    } catch (error) {
      console.error('Error fetching services from API:', error);
      throw error;
    }
  }

  /**
   * Obtiene el balance disponible en la API del proveedor
   * Usado por el admin para verificar saldo disponible
   */
  async getBalance(): Promise<ApiBalanceResponse> {
    try {
      const response = await this.request<ApiBalanceResponse>('balance');
      return response;
    } catch (error) {
      console.error('Error fetching balance from API:', error);
      throw error;
    }
  }

  /**
   * Crea un pedido en la API del proveedor
   * Llamado automáticamente cuando un cliente hace un pedido
   */
  async createOrder(params: {
    service: string; // ID del servicio en la API
    link: string; // URL del perfil/post
    quantity: number;
    runs?: number; // Para drip-feed
    interval?: number; // Para drip-feed
    comments?: string; // Para custom comments
    usernames?: string; // Para mentions
    keywords?: string; // Para SEO
    username?: string; // Para mention likes / comment replies
    answer_number?: string; // Para polls
    min?: number; // Para subscriptions
    max?: number; // Para subscriptions
    posts?: number; // Para subscriptions
    old_posts?: number; // Para subscriptions
    delay?: number; // Para subscriptions
    expiry?: string; // Para subscriptions
  }): Promise<ApiOrderResponse> {
    try {
      const orderParams: Record<string, string | number> = {
        service: params.service,
        link: params.link,
      };

      // Agregar parámetros opcionales solo si existen
      if (params.quantity !== undefined) orderParams.quantity = params.quantity;
      if (params.runs) orderParams.runs = params.runs;
      if (params.interval) orderParams.interval = params.interval;
      if (params.comments) orderParams.comments = params.comments;
      if (params.usernames) orderParams.usernames = params.usernames;
      if (params.keywords) orderParams.keywords = params.keywords;
      if (params.username) orderParams.username = params.username;
      if (params.answer_number) orderParams.answer_number = params.answer_number;
      if (params.min) orderParams.min = params.min;
      if (params.max) orderParams.max = params.max;
      if (params.posts !== undefined) orderParams.posts = params.posts;
      if (params.old_posts) orderParams.old_posts = params.old_posts;
      if (params.delay) orderParams.delay = params.delay;
      if (params.expiry) orderParams.expiry = params.expiry;

      const response = await this.request<ApiOrderResponse>('add', orderParams);
      return response;
    } catch (error) {
      console.error('Error creating order in API:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de un pedido en la API del proveedor
   * Usado para actualizar el estado de pedidos locales
   */
  async getOrderStatus(orderId: string): Promise<ApiStatusResponse> {
    try {
      const response = await this.request<ApiStatusResponse>('status', {
        order: orderId,
      });
      return response;
    } catch (error) {
      console.error('Error fetching order status from API:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de múltiples pedidos
   */
  async getMultiOrderStatus(orderIds: string[]): Promise<Record<string, ApiStatusResponse>> {
    try {
      const response = await this.request<Record<string, ApiStatusResponse>>('status', {
        orders: orderIds.join(','),
      });
      return response;
    } catch (error) {
      console.error('Error fetching multi order status from API:', error);
      throw error;
    }
  }

  /**
   * Solicita un refill (relleno) para un pedido
   */
  async refillOrder(orderId: string): Promise<{ refill: string } | { error: string }> {
    try {
      const response = await this.request<{ refill: string } | { error: string }>('refill', {
        order: orderId,
      });
      return response;
    } catch (error) {
      console.error('Error requesting refill from API:', error);
      throw error;
    }
  }

  /**
   * Solicita refill para múltiples pedidos
   */
  async refillMultipleOrders(orderIds: string[]): Promise<Array<{ refill: string; order: string }>> {
    try {
      const response = await this.request<Array<{ refill: string; order: string }>>('refill', {
        orders: orderIds.join(','),
      });
      return response;
    } catch (error) {
      console.error('Error requesting multi refill from API:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de un refill
   */
  async getRefillStatus(refillId: string): Promise<{ status: string }> {
    try {
      const response = await this.request<{ status: string }>('refill_status', {
        refill: refillId,
      });
      return response;
    } catch (error) {
      console.error('Error fetching refill status from API:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de múltiples refills
   */
  async getMultiRefillStatus(refillIds: string[]): Promise<Record<string, { status: string }>> {
    try {
      const response = await this.request<Record<string, { status: string }>>('refill_status', {
        refills: refillIds.join(','),
      });
      return response;
    } catch (error) {
      console.error('Error fetching multi refill status from API:', error);
      throw error;
    }
  }

  /**
   * Cancela múltiples pedidos
   */
  async cancelOrders(orderIds: string[]): Promise<Array<{ order: string; cancel?: string; error?: string }>> {
    try {
      const response = await this.request<Array<{ order: string; cancel?: string; error?: string }>>('cancel', {
        orders: orderIds.join(','),
      });
      return response;
    } catch (error) {
      console.error('Error cancelling orders from API:', error);
      throw error;
    }
  }

  /**
   * Verifica si la conexión a la API es válida
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getBalance();
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

/**
 * Instancia singleton del cliente API
 * Esta instancia usa la configuración por defecto
 */
export const smmApiClient = new SmmApiClient();

/**
 * Hook para obtener el cliente API (para uso en componentes React)
 */
export function useSmmApiClient(): SmmApiClient {
  return smmApiClient;
}

/**
 * Función helper para reintentar peticiones fallidas
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = API_PROVIDER_CONFIG.MAX_RETRIES,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
