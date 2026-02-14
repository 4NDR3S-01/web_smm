'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Send,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  response?: string;
  response_at?: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [response, setResponse] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [statusFilter, tickets]);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/admin/tickets');
      const data = await response.json();
      
      if (data.tickets) {
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    // Ordenar por fecha (más recientes primero)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredTickets(filtered);
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Estado actualizado');
        await fetchTickets();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus as any });
        }
      } else {
        toast.error(data.error || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !response.trim()) {
      toast.error('Escribe una respuesta');
      return;
    }

    setResponding(true);
    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Respuesta enviada');
        setResponse('');
        await fetchTickets();
        setSelectedTicket(null);
      } else {
        toast.error(data.error || 'Error al enviar respuesta');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar respuesta');
    } finally {
      setResponding(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      open: { variant: 'default', label: 'Abierto' },
      in_progress: { variant: 'secondary', label: 'En Proceso' },
      resolved: { variant: 'default', label: 'Resuelto' },
      closed: { variant: 'outline', label: 'Cerrado' },
    };
    const config = variants[status] || variants.open;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    const labels: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority] || colors.low}`}>
        {labels[priority] || priority}
      </span>
    );
  };

  const stats = {
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    total: tickets.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Tickets</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Administra las solicitudes de soporte de los usuarios
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Abiertos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.open}
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Proceso</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.inProgress}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resueltos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.resolved}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.total}
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            Todos
          </Button>
          <Button
            variant={statusFilter === 'open' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('open')}
          >
            Abiertos
          </Button>
          <Button
            variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('in_progress')}
          >
            En Proceso
          </Button>
          <Button
            variant={statusFilter === 'resolved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('resolved')}
          >
            Resueltos
          </Button>
          <Button
            variant={statusFilter === 'closed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('closed')}
          >
            Cerrados
          </Button>
        </div>
      </Card>

      {/* Lista de Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna de tickets */}
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No hay tickets para mostrar</p>
            </Card>
          ) : (
            filteredTickets.map((ticket) => (
              <Card
                key={ticket.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${
                  selectedTicket?.id === ticket.id ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{ticket.subject}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {ticket.user.full_name} ({ticket.user.email})
                    </p>
                  </div>
                  {getPriorityBadge(ticket.priority)}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
                  {ticket.message}
                </p>
                <div className="flex items-center justify-between">
                  {getStatusBadge(ticket.status)}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(ticket.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Columna de detalles y respuesta */}
        {selectedTicket ? (
          <div className="space-y-4 lg:sticky lg:top-4">
            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTicket.subject}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedTicket.user.full_name} - {selectedTicket.user.email}
                  </p>
                </div>
                {getPriorityBadge(selectedTicket.priority)}
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={selectedTicket.status === 'open' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'open')}
                  >
                    Abierto
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedTicket.status === 'in_progress' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                  >
                    En Proceso
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedTicket.status === 'resolved' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                  >
                    Resuelto
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedTicket.status === 'closed' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                  >
                    Cerrado
                  </Button>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mensaje:</p>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              {selectedTicket.response && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4 bg-blue-50 dark:bg-blue-900/20 -mx-6 -mb-4 px-6 pb-4 rounded-b-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Respuesta:</p>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedTicket.response}</p>
                  {selectedTicket.response_at && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Respondido el {new Date(selectedTicket.response_at).toLocaleString('es-ES')}
                    </p>
                  )}
                </div>
              )}
            </Card>

            {selectedTicket.status !== 'closed' && (
              <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Responder al ticket</h3>
                <textarea
                  className="w-full min-h-[150px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Escribe tu respuesta aquí..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                />
                <Button
                  className="mt-4 w-full"
                  onClick={handleSendResponse}
                  disabled={responding || !response.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {responding ? 'Enviando...' : 'Enviar Respuesta'}
                </Button>
              </Card>
            )}
          </div>
        ) : (
          <Card className="p-12 text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Selecciona un ticket para ver los detalles y responder
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
