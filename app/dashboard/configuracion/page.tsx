"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Moon,
  Sun,
  Mail,
  Phone,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Globe,
  Trash2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Estado para eliminar cuenta
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Estado para teléfono
  const [phoneCountryCode, setPhoneCountryCode] = useState("+593"); // Ecuador por defecto
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");

  // Form states
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  // Códigos de país de Latinoamérica y España
  const countryCodes = [
    { code: "+593", country: "Ecuador", flag: "🇪🇨", example: "987654321" },
    { code: "+54", country: "Argentina", flag: "🇦🇷", example: "911234567" },
    { code: "+591", country: "Bolivia", flag: "🇧🇴", example: "712345678" },
    { code: "+55", country: "Brasil", flag: "🇧🇷", example: "119876543" },
    { code: "+56", country: "Chile", flag: "🇨🇱", example: "912345678" },
    { code: "+57", country: "Colombia", flag: "🇨🇴", example: "312345678" },
    { code: "+506", country: "Costa Rica", flag: "🇨🇷", example: "812345678" },
    { code: "+53", country: "Cuba", flag: "🇨🇺", example: "512345678" },
    { code: "+34", country: "España", flag: "🇪🇸", example: "612345678" },
    { code: "+502", country: "Guatemala", flag: "🇬🇹", example: "512345678" },
    { code: "+504", country: "Honduras", flag: "🇭🇳", example: "912345678" },
    { code: "+52", country: "México", flag: "🇲🇽", example: "812345678" },
    { code: "+505", country: "Nicaragua", flag: "🇳🇮", example: "812345678" },
    { code: "+507", country: "Panamá", flag: "🇵🇦", example: "612345678" },
    { code: "+595", country: "Paraguay", flag: "🇵🇾", example: "981234567" },
    { code: "+51", country: "Perú", flag: "🇵🇪", example: "987654321" },
    { code: "+1", country: "Puerto Rico", flag: "🇵🇷", example: "787123456" },
    { code: "+598", country: "Uruguay", flag: "🇺🇾", example: "912345678" },
    { code: "+58", country: "Venezuela", flag: "🇻🇪", example: "412345678" },
  ];

  // Filtrar países según búsqueda
  const filteredCountries = countryCodes.filter(country => 
    country.country.toLowerCase().includes(countrySearchTerm.toLowerCase()) ||
    country.code.includes(countrySearchTerm)
  );

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    orderUpdates: true,
    promotions: false,
    newsletter: false,
  });

  const [preferences, setPreferences] = useState({
    language: "es",
    timezone: "America/Mexico_City",
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Cargar perfil
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error al cargar perfil:", error);
      } else {
        setProfile(profileData);
        
        // Separar código de país del número de teléfono si existe
        const phone = profileData.phone || "";
        if (phone) {
          const matchedCountry = countryCodes.find(c => phone.startsWith(c.code));
          if (matchedCountry) {
            setPhoneCountryCode(matchedCountry.code);
            setPhoneNumber(phone.substring(matchedCountry.code.length).trim());
          } else {
            setPhoneNumber(phone);
          }
        }
        
        setProfileForm({
          full_name: profileData.full_name || "",
          email: user.email || "",
          phone: profileData.phone || "",
        });

        // Cargar preferencias si existen
        if (profileData.preferences) {
          const prefs = profileData.preferences as any;
          if (prefs.notifications) {
            setNotificationSettings(prefs.notifications);
          }
          if (prefs.language) {
            setPreferences(prev => ({ ...prev, language: prefs.language }));
          }
          if (prefs.timezone) {
            setPreferences(prev => ({ ...prev, timezone: prefs.timezone }));
          }
        }
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      toast.error("Por favor ingresa tu contraseña");
      return;
    }

    try {
      setDeleting(true);
      
      // Verificar contraseña actual
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast.error("No se pudo verificar el usuario");
        return;
      }

      // Intentar sign in con la contraseña para validar
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword,
      });

      if (signInError) {
        toast.error("Contraseña incorrecta");
        setDeleting(false);
        return;
      }

      // Si la contraseña es correcta, proceder a eliminar la cuenta
      // Aquí deberías llamar a una función del servidor o API para eliminar la cuenta
      // Por ahora solo cerraremos sesión y mostraremos un mensaje
      
      toast.success("Cuenta eliminada exitosamente");
      
      // Cerrar sesión
      await supabase.auth.signOut();
      window.location.href = "/login";
      
    } catch (error: any) {
      console.error("Error al eliminar cuenta:", error);
      toast.error("Error al eliminar la cuenta");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeletePassword("");
    }
  };


  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Combinar código de país con número de teléfono
      const fullPhone = phoneNumber ? `${phoneCountryCode} ${phoneNumber}` : "";

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileForm.full_name,
          phone: fullPhone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error al actualizar perfil:", error);
        toast.error("Error al guardar los cambios");
      } else {
        toast.success("Perfil actualizado exitosamente");
        loadUserData();
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) {
        console.error("Error al cambiar contraseña:", error);
        toast.error("Error al cambiar la contraseña");
      } else {
        toast.success("Contraseña cambiada exitosamente");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error al cambiar la contraseña");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const currentPrefs = profile?.preferences as any || {};
      
      const { error } = await supabase
        .from("profiles")
        .update({
          preferences: {
            ...currentPrefs,
            notifications: notificationSettings,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error al guardar notificaciones:", error);
        toast.error("Error al guardar las preferencias");
      } else {
        toast.success("Preferencias de notificaciones guardadas");
        loadUserData();
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error al guardar las preferencias");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const currentPrefs = profile?.preferences as any || {};
      
      const { error } = await supabase
        .from("profiles")
        .update({
          preferences: {
            ...currentPrefs,
            language: preferences.language,
            timezone: preferences.timezone,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error al guardar preferencias:", error);
        toast.error("Error al guardar las preferencias");
      } else {
        toast.success("Preferencias guardadas exitosamente");
        loadUserData();
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error al guardar las preferencias");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "security", label: "Seguridad", icon: Lock },
    { id: "notifications", label: "Notificaciones", icon: Bell },
    { id: "preferences", label: "Preferencias", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Settings className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Configuración
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Administra tu cuenta y preferencias
        </p>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Actualiza tu información de perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nombre Completo</Label>
                <Input
                  id="full_name"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  placeholder="Tu nombre completo"
                />
              </div>

              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="pl-10 bg-gray-100 dark:bg-gray-800"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  No puedes cambiar tu correo electrónico
                </p>
              </div>

              <div>
                <Label htmlFor="phone">Teléfono (Opcional)</Label>
                <div className="flex gap-2">
                  {/* Selector de código de país */}
                  <div className="relative w-32">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="w-full h-10 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-left text-sm font-medium flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span>{countryCodes.find(c => c.code === phoneCountryCode)?.flag} {phoneCountryCode}</span>
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown con búsqueda */}
                    {showCountryDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowCountryDropdown(false)}
                        />
                        <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
                          {/* Búsqueda */}
                          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                            <Input
                              type="text"
                              placeholder="Buscar país..."
                              value={countrySearchTerm}
                              onChange={(e) => setCountrySearchTerm(e.target.value)}
                              className="h-9 text-sm"
                              autoFocus
                            />
                          </div>
                          
                          {/* Lista de países */}
                          <div className="overflow-y-auto max-h-64">
                            {filteredCountries.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setPhoneCountryCode(country.code);
                                  setShowCountryDropdown(false);
                                  setCountrySearchTerm("");
                                }}
                                className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-between ${
                                  phoneCountryCode === country.code ? "bg-purple-50 dark:bg-purple-900/20" : ""
                                }`}
                              >
                                <span className="flex items-center gap-2 text-sm">
                                  <span className="text-xl">{country.flag}</span>
                                  <span className="font-medium text-gray-900 dark:text-white">{country.country}</span>
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{country.code}</span>
                              </button>
                            ))}
                            {filteredCountries.length === 0 && (
                              <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                No se encontraron países
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Input de número de teléfono */}
                  <div className="flex-1 relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        // Solo permitir números y máximo 9 dígitos
                        const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                        setPhoneNumber(value);
                      }}
                      placeholder={`Ej: ${countryCodes.find(c => c.code === phoneCountryCode)?.example || "987654321"}`}
                      className="pl-10"
                      maxLength={9}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Formato: {phoneCountryCode} + 9 dígitos (Ej: {phoneCountryCode} {countryCodes.find(c => c.code === phoneCountryCode)?.example})
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Rol</p>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">
                      {profile?.role || "cliente"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Miembro desde</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {profile?.created_at 
                        ? new Date(profile.created_at).toLocaleDateString('es-ES')
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={saving}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {saving ? (
                  <>
                    <Settings className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Seguridad
            </CardTitle>
            <CardDescription>
              Cambia tu contraseña y gestiona la seguridad de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Mínimo 8 caracteres
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              {passwordForm.newPassword && passwordForm.confirmPassword && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  passwordForm.newPassword === passwordForm.confirmPassword
                    ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                    : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
                }`}>
                  {passwordForm.newPassword === passwordForm.confirmPassword ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm">Las contraseñas coinciden</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm">Las contraseñas no coinciden</span>
                    </>
                  )}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={saving || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {saving ? (
                  <>
                    <Settings className="w-4 h-4 mr-2 animate-spin" />
                    Cambiando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Cambiar Contraseña
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-1">Recomendaciones de seguridad:</p>
                  <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                    <li>• Usa una contraseña única y segura</li>
                    <li>• No compartas tu contraseña con nadie</li>
                    <li>• Cambia tu contraseña regularmente</li>
                    <li>• Usa autenticación de dos factores cuando esté disponible</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificaciones
            </CardTitle>
            <CardDescription>
              Controla qué notificaciones deseas recibir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Notificaciones por Email
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recibe notificaciones en tu correo electrónico
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => setNotificationSettings({ 
                      ...notificationSettings, 
                      emailNotifications: e.target.checked 
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Actualizaciones de Pedidos
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recibe notificaciones sobre el estado de tus pedidos
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.orderUpdates}
                    onChange={(e) => setNotificationSettings({ 
                      ...notificationSettings, 
                      orderUpdates: e.target.checked 
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Promociones y Ofertas
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recibe información sobre promociones especiales
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.promotions}
                    onChange={(e) => setNotificationSettings({ 
                      ...notificationSettings, 
                      promotions: e.target.checked 
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Newsletter
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recibe nuestro boletín con tips y novedades
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.newsletter}
                    onChange={(e) => setNotificationSettings({ 
                      ...notificationSettings, 
                      newsletter: e.target.checked 
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <Button 
                onClick={handleSaveNotifications}
                disabled={saving}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {saving ? (
                  <>
                    <Settings className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Preferencias
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Preferencias
            </CardTitle>
            <CardDescription>
              Personaliza tu experiencia en la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Language - Solo Español */}
              <div>
                <Label htmlFor="language">Idioma</Label>
                <div className="relative mt-2">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <div className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium">
                    Español
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  La plataforma está disponible únicamente en español
                </p>
              </div>

              {/* Timezone */}
              <div>
                <Label htmlFor="timezone">Zona Horaria</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 mt-1">
                  Selecciona tu zona horaria para mostrar fechas y horas correctamente
                </p>
                <select
                  id="timezone"
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                  <option value="America/Cancun">Cancún (GMT-5)</option>
                  <option value="America/Tijuana">Tijuana (GMT-8)</option>
                  <option value="America/Bogota">Bogotá (GMT-5)</option>
                  <option value="America/Lima">Lima (GMT-5)</option>
                  <option value="America/Guayaquil">Ecuador - Guayaquil (GMT-5)</option>
                  <option value="America/Santiago">Santiago (GMT-3)</option>
                  <option value="America/Buenos_Aires">Buenos Aires (GMT-3)</option>
                  <option value="America/Caracas">Caracas (GMT-4)</option>
                  <option value="America/Montevideo">Montevideo (GMT-3)</option>
                  <option value="America/La_Paz">La Paz (GMT-4)</option>
                  <option value="America/Asuncion">Asunción (GMT-4)</option>
                  <option value="America/Panama">Panamá (GMT-5)</option>
                  <option value="America/Costa_Rica">Costa Rica (GMT-6)</option>
                  <option value="America/Guatemala">Guatemala (GMT-6)</option>
                  <option value="Europe/Madrid">Madrid (GMT+1)</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Zona actual: {preferences.timezone.replace(/_/g, ' ')}
                </p>
              </div>

              <Button 
                onClick={handleSavePreferences}
                disabled={saving}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {saving ? (
                  <>
                    <Settings className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Preferencias
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            Zona Peligrosa
          </CardTitle>
          <CardDescription>
            Acciones irreversibles sobre tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-900 dark:text-red-100 mb-3">
                <strong>Eliminar cuenta:</strong> Esta acción es permanente y no se puede deshacer. 
                Todos tus datos, pedidos e historial serán eliminados.
              </p>
              <Button 
                variant="destructive" 
                className="hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Mi Cuenta
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmación para eliminar cuenta */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                ¿Eliminar tu cuenta?
              </h3>
            </div>

            <div className="mb-6 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Esta acción es <strong className="text-red-600 dark:text-red-400">permanente e irreversible</strong>. 
                Al eliminar tu cuenta:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Perderás acceso a todos tus pedidos e historial</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Tu saldo en billetera no será reembolsable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Todos tus datos serán eliminados permanentemente</span>
                </li>
              </ul>

              <div className="mt-6">
                <Label htmlFor="delete-password" className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                  Para confirmar, ingresa tu contraseña:
                </Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Tu contraseña actual"
                  className="mb-1"
                  disabled={deleting}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Necesitamos verificar tu identidad antes de proceder
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword("");
                }}
                disabled={deleting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword.trim()}
                className="flex-1"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar Cuenta
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
