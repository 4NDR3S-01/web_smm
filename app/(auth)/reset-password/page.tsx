"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    // Verificar si hay una sesión de recuperación
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsValidToken(!!session);
    });
  }, [supabase]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast.error("Error al restablecer contraseña", {
          description: error.message,
        });
        return;
      }

      toast.success("¡Contraseña actualizada!", {
        description: "Tu contraseña ha sido restablecida exitosamente.",
      });

      // Redirigir a login
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (error) {
      console.error("Error al restablecer contraseña:", error);
      toast.error("Error inesperado", {
        description: "Ocurrió un error al restablecer la contraseña. Intenta nuevamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Verificando...</p>
        </div>
      </div>
    );
  }

  if (isValidToken === false) {
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
          className="w-full max-w-md relative z-10"
        >
          <Card className="border-2 border-red-500/30 bg-gradient-to-br from-red-900/20 to-purple-900/20 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-red-400">
                Enlace Inválido o Expirado
              </CardTitle>
              <CardDescription className="text-center text-gray-400">
                El enlace de recuperación no es válido o ha expirado. Por favor solicita uno nuevo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/forgot-password">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/30" size="lg">
                  Solicitar Nuevo Enlace
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full border-purple-500/30 bg-black/50 text-white hover:bg-purple-900/30">
                  Volver a Iniciar Sesión
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

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
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <motion.div 
            className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>
          <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            <span className="hidden sm:inline">ViralizaTuRed</span>
          </span>
        </Link>

        <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center text-white">
              Nueva Contraseña
            </CardTitle>
            <CardDescription className="text-center text-base text-gray-400">
              Ingresa tu nueva contraseña segura
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Nueva Contraseña</Label>
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

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                  <strong>Requisitos:</strong> Mínimo 6 caracteres, una mayúscula y un número.
                </p>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/30" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Restableciendo...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Restablecer Contraseña
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <Link
                href="/login"
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                Volver a iniciar sesión
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
