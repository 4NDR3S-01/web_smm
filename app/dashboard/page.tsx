import { Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InactivityProvider } from "@/components/providers/InactivityProvider";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener perfil del usuario con su rol
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <InactivityProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ViralizaTuRed
              </span>
            </Link>

            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border-2 border-purple-200 dark:border-purple-800">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              ¡Bienvenido, {profile?.full_name || user.email}!
            </h1>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="text-lg">
                Has iniciado sesión exitosamente en <strong>ViralizaTuRed</strong>
              </p>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <p className="font-semibold text-purple-900 dark:text-purple-100">
                  Rol: <span className="uppercase">{profile?.role || "Cliente"}</span>
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  Email: {user.email}
                </p>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl">
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  🚧 Dashboard en Construcción
                </h2>
                <p className="text-gray-700 dark:text-gray-300">
                  Este es el dashboard base. Próximamente se implementarán las funcionalidades específicas para cada rol:
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>✅ <strong>Cliente:</strong> Gestión de servicios SMM</li>
                  <li>✅ <strong>Distribuidor:</strong> Panel de revendedor</li>
                  <li>✅ <strong>Soporte:</strong> Sistema de tickets</li>
                  <li>✅ <strong>Administrador:</strong> Panel administrativo completo</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </InactivityProvider>
  );
}
