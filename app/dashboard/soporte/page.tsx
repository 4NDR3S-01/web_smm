"use client";

import { useState, useEffect } from "react";
import { 
  LifeBuoy, 
  Plus, 
  MessageCircle, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Search,
  Send,
  Paperclip,
  X,
  ChevronDown,
  HelpCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

interface Ticket {
  id: string;
  ticket_number: string;
  user_id: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
}

const TICKET_CATEGORIES = [
  { value: "technical", label: "Problema Técnico" },
  { value: "payment", label: "Pagos y Facturación" },
  { value: "order", label: "Problemas con Pedidos" },
  { value: "account", label: "Cuenta y Acceso" },
  { value: "general", label: "Consulta General" },
  { value: "other", label: "Otro" },
];

const PRIORITY_LEVELS = [
  { value: "low", label: "Baja", color: "gray" },
  { value: "medium", label: "Media", color: "blue" },
  { value: "high", label: "Alta", color: "orange" },
  { value: "urgent", label: "Urgente", color: "red" },
];

export default function SoportePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("all");

  // Formulario nuevo ticket
  const [newTicketForm, setNewTicketForm] = useState({
    subject: "",
    category: "general",
    priority: "medium" as TicketPriority,
    description: "",
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error al cargar tickets:", error);
      } else {
        setTickets(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketMessages = async (ticketId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error al cargar mensajes:", error);
      } else {
        setMessages(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTicketForm.subject.trim() || !newTicketForm.description.trim()) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Generar número de ticket
      const ticketNumber = `TKT-${Date.now().toString().slice(-8)}`;

      const { data, error } = await supabase
        .from("support_tickets")
        .insert([{
          user_id: user.id,
          ticket_number: ticketNumber,
          subject: newTicketForm.subject,
          category: newTicketForm.category,
          priority: newTicketForm.priority,
          description: newTicketForm.description,
          status: "open",
        }])
        .select()
        .single();

      if (error) {
        console.error("Error al crear ticket:", error);
        toast.error("Error al crear el ticket");
      } else {
        toast.success("Ticket creado exitosamente");
        setShowNewTicket(false);
        setNewTicketForm({
          subject: "",
          category: "general",
          priority: "medium",
          description: "",
        });
        loadTickets();
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error al crear el ticket");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedTicket) return;

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from("ticket_messages")
        .insert([{
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: newMessage,
          is_staff: false,
        }]);

      if (error) {
        console.error("Error al enviar mensaje:", error);
        toast.error("Error al enviar el mensaje");
      } else {
        setNewMessage("");
        loadTicketMessages(selectedTicket.id);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error al enviar el mensaje");
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "open":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            <Clock className="w-3 h-3" /> Abierto
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
            <MessageCircle className="w-3 h-3" /> En Progreso
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            <CheckCircle2 className="w-3 h-3" /> Resuelto
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <X className="w-3 h-3" /> Cerrado
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    const level = PRIORITY_LEVELS.find(p => p.value === priority);
    if (!level) return null;

    const colorClasses = {
      gray: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
      blue: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      orange: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
      red: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${colorClasses[level.color as keyof typeof colorClasses]}`}>
        {level.label}
      </span>
    );
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    const matchesSearch = searchTerm === "" || 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LifeBuoy className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Cargando soporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Centro de Soporte
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Obtén ayuda con cualquier problema o consulta
          </p>
        </div>
        <Button
          onClick={() => setShowNewTicket(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-900 dark:text-white mb-1">
              {stats.total}
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300">Total Tickets</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-900 dark:text-white mb-1">
              {stats.open}
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">Abiertos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-900 dark:text-white mb-1">
              {stats.inProgress}
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">En Progreso</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-900 dark:text-white mb-1">
              {stats.resolved}
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">Resueltos</p>
          </CardContent>
        </Card>
      </div>

      {/* New Ticket Form */}
      {showNewTicket && (
        <Card className="border-2 border-purple-300 dark:border-purple-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Crear Nuevo Ticket
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowNewTicket(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              Describe tu problema o consulta y nuestro equipo te ayudará
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <Label htmlFor="subject">Asunto *</Label>
                <Input
                  id="subject"
                  value={newTicketForm.subject}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                  placeholder="Breve descripción del problema"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoría *</Label>
                  <select
                    id="category"
                    value={newTicketForm.category}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {TICKET_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="priority">Prioridad *</Label>
                  <select
                    id="priority"
                    value={newTicketForm.priority}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value as TicketPriority })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {PRIORITY_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción Detallada *</Label>
                <textarea
                  id="description"
                  value={newTicketForm.description}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                  rows={5}
                  placeholder="Describe tu problema con el mayor detalle posible..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Crear Ticket
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewTicket(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por número o asunto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
                className={filterStatus === "all" ? "bg-gradient-to-r from-purple-600 to-blue-600" : ""}
              >
                Todos
              </Button>
              <Button
                variant={filterStatus === "open" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("open")}
                className={filterStatus === "open" ? "bg-blue-600" : ""}
              >
                Abiertos
              </Button>
              <Button
                variant={filterStatus === "in_progress" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("in_progress")}
                className={filterStatus === "in_progress" ? "bg-yellow-600" : ""}
              >
                En Progreso
              </Button>
              <Button
                variant={filterStatus === "resolved" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("resolved")}
                className={filterStatus === "resolved" ? "bg-green-600" : ""}
              >
                Resueltos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Tickets</CardTitle>
          <CardDescription>
            {filteredTickets.length} ticket(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {searchTerm || filterStatus !== "all"
                  ? "No hay tickets con estos filtros"
                  : "No tienes tickets de soporte aún"}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                Crea un ticket si necesitas ayuda con algo
              </p>
              {!showNewTicket && (
                <Button
                  onClick={() => setShowNewTicket(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Ticket
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <div 
                  key={ticket.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedTicket(ticket);
                    loadTicketMessages(ticket.id);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-400">
                          {ticket.ticket_number}
                        </span>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {ticket.subject}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {ticket.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Creado: {new Date(ticket.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <ChevronDown className="w-5 h-5 text-gray-400 transform -rotate-90" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Modal (Simple) */}
      {selectedTicket && (
        <Card className="border-2 border-purple-300 dark:border-purple-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono">{selectedTicket.ticket_number}</span>
                {getStatusBadge(selectedTicket.status)}
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedTicket(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              {selectedTicket.subject}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Original Message */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Messages */}
              {messages.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.is_staff
                          ? 'bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <p className="text-sm font-semibold mb-1 text-gray-900 dark:text-white">
                        {msg.is_staff ? 'Equipo de Soporte' : 'Tú'}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {msg.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(msg.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              {selectedTicket.status !== "closed" && (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              )}

              {selectedTicket.status === "closed" && (
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Este ticket está cerrado. No se pueden enviar más mensajes.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
