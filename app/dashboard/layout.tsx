import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InactivityProvider } from "@/components/providers/InactivityProvider";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
        <DashboardSidebar user={user} profile={profile} />
        
        <div className="lg:pl-64">
          <DashboardHeader user={user} profile={profile} />
          
          <main className="p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </InactivityProvider>
  );
}
