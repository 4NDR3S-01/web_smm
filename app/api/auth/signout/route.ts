import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  // Obtener la URL de origen de la solicitud
  const origin = request.headers.get('origin') || 'http://localhost:3000';
  
  return NextResponse.redirect(new URL("/", origin));
}
