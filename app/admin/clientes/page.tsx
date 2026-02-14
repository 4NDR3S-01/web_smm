'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AddClientModal from '@/components/admin/AddClientModal';
import EditClientModal from '@/components/admin/EditClientModal';
import BalanceModal from '@/components/admin/BalanceModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Key,
  Ban,
  CheckCircle,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  full_name: string;
  email: string;
  role: string;
  balance: number;
  api_status: boolean;
  created_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Estados para modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchTerm, roleFilter, clients]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients');
      const data = await response.json();
      
      if (data.clients) {
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por rol
    if (roleFilter !== 'all') {
      filtered = filtered.filter((client) => client.role === roleFilter);
    }

    setFilteredClients(filtered);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  const handleManageBalance = (client: Client) => {
    setSelectedClient(client);
    setIsBalanceModalOpen(true);
  };

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteModalOpen(true);
  };

  const handleToggleApiStatus = async (clientId: string, currentStatus: boolean) => {
    try {
      const action = currentStatus ? 'disable' : 'enable';
      const response = await fetch(`/api/admin/clients/${clientId}/api/${action}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`API ${currentStatus ? 'deshabilitada' : 'habilitada'}`);
        await fetchClients();
      } else {
        toast.error(data.error || 'Error al cambiar estado de API');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cambiar estado de API');
    }
  };

  const getRoleBadgeClass = (role: string) => {
    const classes: Record<string, string> = {
      administrador: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
      distribuidor: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
      soporte: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
      cliente: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };
    return classes[role] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Clientes</h1>
            <p className="text-muted-foreground mt-1">
              {filteredClients.length} cliente{filteredClients.length === 1 ? '' : 's'} encontrado{filteredClients.length === 1 ? '' : 's'}
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Agregar Cliente
          </Button>
        </div>
      </div>

      {/* Modales */}
      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchClients}
      />
      
      <EditClientModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedClient(null);
        }}
        onSuccess={fetchClients}
        client={selectedClient}
      />

      <BalanceModal
        isOpen={isBalanceModalOpen}
        onClose={() => {
          setIsBalanceModalOpen(false);
          setSelectedClient(null);
        }}
        onSuccess={fetchClients}
        client={selectedClient}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedClient(null);
        }}
        onSuccess={fetchClients}
        client={selectedClient}
      />

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full h-10 border border-input rounded-md px-3 bg-background"
            >
              <option value="all">Todos los roles</option>
              <option value="cliente">Cliente</option>
              <option value="distribuidor">Distribuidor</option>
              <option value="soporte">Soporte</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de Clientes */}
      <div className="grid gap-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{client.full_name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(client.role)}`}>
                    {client.role}
                  </span>
                  {client.api_status && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
                      <Key className="h-3 w-3" />
                      API Activa
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{client.email}</p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">${client.balance.toFixed(2)}</span>
                  </div>
                  <div className="text-muted-foreground">
                    Registrado: {new Date(client.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleManageBalance(client)}
                  title="Gestionar Balance"
                >
                  <Wallet className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditClient(client)}
                  title="Editar Cliente"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleApiStatus(client.id, client.api_status)}
                  title={client.api_status ? 'Desactivar API' : 'Activar API'}
                >
                  {client.api_status ? (
                    <Ban className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  onClick={() => handleDeleteClient(client)}
                  title="Eliminar Cliente"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No se encontraron clientes</p>
        </Card>
      )}
    </div>
  );
}
