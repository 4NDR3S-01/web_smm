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
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || API_PROVIDER_CONFIG.BASE_URL;
    this.apiKey = apiKey || API_PROVIDER_CONFIG.API_KEY;
  }

  /**
   * Realiza una petición a la API del proveedor
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, string | number> = {}
  ): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);
    
    // Agregar API key y parámetros
    url.searchParams.append('key', this.apiKey);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_PROVIDER_CONFIG.TIMEOUT);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
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
      const response = await this.request<ApiServiceResponse[]>(
        API_PROVIDER_CONFIG.ENDPOINTS.SERVICES,
        { action: 'services' }
      );
      return response;
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
      const response = await this.request<ApiBalanceResponse>(
        API_PROVIDER_CONFIG.ENDPOINTS.BALANCE,
        { action: 'balance' }
      );
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
  }): Promise<ApiOrderResponse> {
    try {
      const response = await this.request<ApiOrderResponse>(
        API_PROVIDER_CONFIG.ENDPOINTS.ADD_ORDER,
        {
          action: 'add',
          service: params.service,
          link: params.link,
          quantity: params.quantity,
          ...(params.runs && { runs: params.runs }),
          ...(params.interval && { interval: params.interval }),
        }
      );
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
      const response = await this.request<ApiStatusResponse>(
        API_PROVIDER_CONFIG.ENDPOINTS.STATUS,
        {
          action: 'status',
          order: orderId,
        }
      );
      return response;
    } catch (error) {
      console.error('Error fetching order status from API:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de múltiples pedidos
   * Útil para sincronización masiva
   */
  async getMultipleOrderStatus(orderIds: string[]): Promise<Record<string, ApiStatusResponse>> {
    try {
      const response = await this.request<Record<string, ApiStatusResponse>>(
        API_PROVIDER_CONFIG.ENDPOINTS.STATUS,
        {
          action: 'status',
          orders: orderIds.join(','),
        }
      );
      return response;
    } catch (error) {
      console.error('Error fetching multiple order statuses from API:', error);
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
 * Usar esta instancia en todo el código
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
