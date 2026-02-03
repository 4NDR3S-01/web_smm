"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, UserPlus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Usuario ya autenticado, redirigir al dashboard
          router.push("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router, supabase.auth]);

  // Mostrar loading mientras verifica autenticación
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      // 1. Crear usuario con Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (signUpError) {
        toast.error("Error al crear cuenta", {
          description: signUpError.message,
        });
        return;
      }

      if (!authData.user) {
        toast.error("Error al crear cuenta", {
          description: "No se pudo crear el usuario.",
        });
        return;
      }

      // El perfil se crea automáticamente mediante el trigger on_auth_user_created
      // No necesitamos insertarlo manualmente aquí

      toast.success("¡Cuenta creada exitosamente!", {
        description: "Por favor verifica tu email para confirmar tu cuenta.",
      });

      // Redirigir a login o dashboard según configuración de Supabase
      router.push("/login");
    } catch (error) {
      console.error("Error en registro:", error);
      toast.error("Error inesperado", {
        description: "Ocurrió un error al crear tu cuenta. Intenta nuevamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-black to-blue-950" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-blue-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
          <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-pink-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float" style={{ animationDelay: "4s" }}></div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <motion.div 
            className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50"
            whileHover={{ scale: 1.1, rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>
          <span className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            ViralizaTuRed
          </span>
        </Link>

        <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl md:text-3xl font-bold text-center text-white">Crear Cuenta</CardTitle>
            <CardDescription className="text-center text-sm md:text-base text-gray-400">
              Completa el formulario para comenzar gratis
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-300">Nombre Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Juan Pérez"
                  className="bg-black/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500"
                  {...register("fullName")}
                  disabled={isLoading}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-400">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  className="bg-black/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500"
                  {...register("email")}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-black/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500"
                  {...register("password")}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="bg-black/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/30" 
                size="lg" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Crear Cuenta
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-400 text-center">
                Al registrarte, aceptas nuestros{" "}
                <Link href="#" className="text-purple-400 hover:text-purple-300 transition-colors">
                  Términos de Servicio
                </Link>{" "}
                y{" "}
                <Link href="#" className="text-purple-400 hover:text-purple-300 transition-colors">
                  Política de Privacidad
                </Link>
              </p>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-400">¿Ya tienes cuenta? </span>
              <Link
                href="/login"
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                Inicia sesión
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
