/**
 * API v2 para Distribuidores
 * Endpoint: POST/GET /api/v2
 * 
 * Actions soportadas:
 * - services: Lista de servicios con precios personalizados
 * - add: Crear nuevo pedido
 * - status: Consultar estado de pedido(s)
 * - balance: Consultar saldo disponible
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByApiKey } from '@/lib/services/api-key.service';
import { createClient } from '@/lib/supabase/server';
import { createOrder } from '@/lib/services/order.service';
import { getUserPrice } from '@/lib/services/pricing.service';

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const apiKey = searchParams.get('key') || '';
  const action = searchParams.get('action') || '';

  // Validar API key
  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key is required' },
      { status: 401 }
    );
  }

  const user = await getUserByApiKey(apiKey);
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid API key or API access disabled' },
      { status: 401 }
    );
  }

  // Validar action
  if (!action) {
    return NextResponse.json(
      { error: 'Action parameter is required' },
      { status: 400 }
    );
  }

  // Enrutar según action
  switch (action) {
    case 'services':
      return await handleServices(user.id);
    
    case 'add':
      return await handleAddOrder(user, searchParams);
    
    case 'status':
      return await handleStatus(user.id, searchParams);
    
    case 'balance':
      return await handleBalance(user.id);
    
    default:
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
  }
}

/**
 * ACTION: services
 * Retorna lista de servicios activos con precios personalizados
 */
async function handleServices(userId: string) {
  try {
    const supabase = await createClient();
    
    const { data: services } = await supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        type,
        category:categories (
          id,
          name
        ),
        price_per_1000,
        min_quantity,
        max_quantity,
        refill,
        cancel
      `)
      .eq('is_active', true)
      .order('name');
    
    if (!services) {
      return NextResponse.json([]);
    }

    // Formatear respuesta similar al panel PHP
    const formattedServices = await Promise.all(
      services.map(async (service: any) => {
        // Obtener precio personalizado si existe
        const customPrice = await getUserPrice(userId, service.id);
        
        return {
          service: service.id,
          name: service.name,
          type: service.type,
          category: service.category?.name || 'N/A',
          rate: customPrice.toFixed(2),
          min: service.min_quantity,
          max: service.max_quantity,
          refill: service.refill || false,
          cancel: service.cancel || false,
          description: service.description || '',
        };
      })
    );

    return NextResponse.json(formattedServices);
  } catch (error) {
    console.error('Error in services action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * ACTION: add
 * Crear nuevo pedido
 */
async function handleAddOrder(user: any, params: URLSearchParams) {
  try {
    const serviceId = params.get('service');
    const link = params.get('link');
    const quantityStr = params.get('quantity');
    const comments = params.get('comments') || undefined;

    if (!serviceId || !link || (!quantityStr && !comments)) {
      return NextResponse.json(
        { error: 'Missing required parameters: service, link, and quantity/comments are required' },
        { status: 400 }
      );
    }

    // Obtener información del servicio
    const supabase = await createClient();
    const { data: service } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('is_active', true)
      .single();

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found or inactive' },
        { status: 404 }
      );
    }

    // Calcular quantity según tipo de servicio
    let quantity = 0;
    
    if (service.type === 'custom_comments' || service.type === 'custom_comments_package') {
      if (!comments) {
        return NextResponse.json(
          { error: 'Comments are required for this service type' },
          { status: 400 }
        );
      }
      const lines = comments.split('\n').filter((line: string) => line.trim() !== '');
      quantity = lines.length;
    } else {
      quantity = Number.parseInt(quantityStr || '0', 10);
    }

    // Validar quantity
    if (quantity < service.min_quantity) {
      return NextResponse.json(
        { error: `Quantity must be at least ${service.min_quantity}` },
        { status: 400 }
      );
    }

    if (quantity > service.max_quantity) {
      return NextResponse.json(
        { error: `Quantity cannot exceed ${service.max_quantity}` },
        { status: 400 }
      );
    }

    // Crear pedido
    const result = await createOrder({
      userId: user.id,
      serviceId: service.id,
      serviceName: service.name,
      serviceType: service.type,
      quantity,
      targetUrl: link,
      notes: comments,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create order' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      order: result.order?.id.slice(0, 8), // ID corto para API
    });
  } catch (error) {
    console.error('Error in add action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * ACTION: status
 * Consultar estado de uno o varios pedidos
 */
async function handleStatus(userId: string, params: URLSearchParams) {
  try {
    const orderId = params.get('order');
    const orderIds = params.get('orders');

    if (!orderId && !orderIds) {
      return NextResponse.json(
        { error: 'Order ID or Order IDs parameter is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Single order
    if (orderId) {
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('uid', userId)
        .eq('id', orderId)
        .single();

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        charge: order.price.toFixed(2),
        start_count: order.started_count || 0,
        status: order.status,
        remains: order.remains || 0,
        currency: 'USD',
      });
    }

    // Multiple orders
    if (orderIds) {
      const ids = orderIds.split(',').map((id: string) => id.trim());
      
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('uid', userId)
        .in('id', ids);

      if (!orders || orders.length === 0) {
        return NextResponse.json({});
      }

      const result: Record<string, any> = {};
      orders.forEach((order: any) => {
        result[order.id] = {
          charge: order.price.toFixed(2),
          start_count: order.started_count || 0,
          status: order.status,
          remains: order.remains || 0,
          currency: 'USD',
        };
      });

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in status action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * ACTION: balance
 * Retorna el saldo disponible del usuario
 */
async function handleBalance(userId: string) {
  try {
    const supabase = await createClient();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      balance: profile.balance.toFixed(2),
      currency: 'USD',
    });
  } catch (error) {
    console.error('Error in balance action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
