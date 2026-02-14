/**
 * API Route (Cron Job): /api/cron/sync-services
 * Sincronización automática de servicios de todos los proveedores
 * Frecuencia: Cada 6 horas
 */

import { NextRequest, NextResponse } from 'next/server';
import { autoSyncAllProviders } from '@/lib/services/sync.service';

export async function GET(request: NextRequest) {
  try {
    // Verificar autorización del cron job
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('Starting automatic provider sync...');

    // Ejecutar sincronización automática de todos los proveedores
    await autoSyncAllProviders();

    console.log('Automatic provider sync completed');

    return NextResponse.json({
      success: true,
      message: 'Sincronización automática completada',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in sync-services cron:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}
