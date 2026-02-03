import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  // Obtener la URL de origen de la solicitud
  const origin = request.headers.get('origin') || request.headers.get('referer') || 'http://localhost:3000';
  
  // Asegurar que la URL termine correctamente
  const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  
  return NextResponse.redirect(`${baseUrl}/login`);
}
