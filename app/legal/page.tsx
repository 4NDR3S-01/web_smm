"use client";

import { ArrowLeft, Shield, FileText, Cookie } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#1a0b2e]/20 via-transparent to-[#1a0b2e]/20 pointer-events-none" />
      
      <div className="relative z-10">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-[#000000]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Información Legal
          </h1>
          <p className="text-gray-400 text-base sm:text-lg mb-8 sm:mb-12">
            Última actualización: 3 de febrero de 2026
          </p>

          {/* Navegación rápida */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-12 lg:mb-16">
            <a href="#terminos" className="flex items-center gap-3 p-4 bg-purple-950/30 border border-purple-500/30 rounded-xl hover:bg-purple-950/50 transition-colors">
              <FileText className="w-6 h-6 text-purple-400" />
              <span className="font-semibold">Términos de Servicio</span>
            </a>
            <a href="#privacidad" className="flex items-center gap-3 p-4 bg-purple-950/30 border border-purple-500/30 rounded-xl hover:bg-purple-950/50 transition-colors">
              <Shield className="w-6 h-6 text-purple-400" />
              <span className="font-semibold">Política de Privacidad</span>
            </a>
            <a href="#cookies" className="flex items-center gap-3 p-4 bg-purple-950/30 border border-purple-500/30 rounded-xl hover:bg-purple-950/50 transition-colors">
              <Cookie className="w-6 h-6 text-purple-400" />
              <span className="font-semibold">Política de Cookies</span>
            </a>
          </div>

          {/* Términos de Servicio */}
          <section id="terminos" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-8 h-8 text-purple-400" />
              <h2 className="text-3xl md:text-4xl font-bold">Términos de Servicio</h2>
            </div>
            
            <div className="space-y-6 text-gray-300 leading-relaxed">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">1. Aceptación de los Términos</h3>
                <p>
                  Al acceder y utilizar ViralizaTuRed, usted acepta estar sujeto a estos términos de servicio. 
                  Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">2. Descripción del Servicio</h3>
                <p>
                  ViralizaTuRed es una plataforma de servicios SMM (Social Media Marketing) que permite a los usuarios 
                  impulsar sus perfiles y contenido en redes sociales. Los usuarios crean una cuenta, seleccionan la 
                  categoría (red social a impulsar: Instagram, TikTok, YouTube, Facebook, X/Twitter, etc.), ingresan 
                  la URL del perfil o publicación que desean promocionar, y realizan su pedido. Los servicios incluyen: 
                  seguidores, likes, comentarios, visualizaciones, suscriptores, reacciones y otros tipos de engagement 
                  para múltiples plataformas de redes sociales.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">3. Uso Aceptable</h3>
                <p>
                  Los usuarios se comprometen a:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Proporcionar URLs válidas y públicas de perfiles o publicaciones a impulsar</li>
                  <li>No compartir credenciales de acceso (nunca solicitamos contraseñas)</li>
                  <li>Proporcionar información precisa de la red social y tipo de servicio requerido</li>
                  <li>No utilizar el servicio para actividades ilegales, fraudulentas o que violen derechos de terceros</li>
                  <li>No intentar eludir las medidas de seguridad del sistema</li>
                  <li>Cumplir con los términos de servicio de las plataformas de redes sociales</li>
                  <li>Ser el propietario legítimo del perfil o tener autorización para promocionarlo</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">4. Pagos y Reembolsos</h3>
                <p>
                  Todos los servicios deben pagarse por adelantado. Las políticas de reembolso se aplican según lo 
                  especificado en cada servicio individual. Los reembolsos se procesarán dentro de 7-14 días hábiles.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">5. Limitación de Responsabilidad</h3>
                <p>
                  ViralizaTuRed no se hace responsable de las acciones tomadas por plataformas de terceros contra 
                  las cuentas de los usuarios. Nuestros servicios se proporcionan &quot;tal cual&quot; sin garantías de ningún tipo.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">6. Modificaciones del Servicio</h3>
                <p>
                  Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto de nuestros 
                  servicios en cualquier momento sin previo aviso.
                </p>
              </div>
            </div>
          </section>

          {/* Política de Privacidad */}
          <section id="privacidad" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-purple-400" />
              <h2 className="text-3xl md:text-4xl font-bold">Política de Privacidad</h2>
            </div>
            
            <div className="space-y-6 text-gray-300 leading-relaxed">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">1. Información que Recopilamos</h3>
                <p>
                  Recopilamos la siguiente información:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li><strong>Información de cuenta:</strong> Nombre, correo electrónico, nombre de usuario</li>
                  <li><strong>Información de pago:</strong> Datos de facturación procesados de forma segura</li>
                  <li><strong>Datos de uso:</strong> Información sobre cómo utiliza nuestros servicios</li>
                  <li><strong>Datos técnicos:</strong> Dirección IP, tipo de navegador, sistema operativo</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">2. Uso de la Información</h3>
                <p>
                  Utilizamos su información para:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Proporcionar y mejorar nuestros servicios</li>
                  <li>Procesar transacciones y enviar confirmaciones</li>
                  <li>Comunicarnos con usted sobre actualizaciones y ofertas</li>
                  <li>Proteger contra fraudes y abusos</li>
                  <li>Cumplir con obligaciones legales</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">3. Compartir Información</h3>
                <p>
                  No vendemos ni alquilamos su información personal a terceros. Podemos compartir información con:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Proveedores de servicios que nos ayudan a operar nuestro negocio</li>
                  <li>Autoridades cuando sea requerido por ley</li>
                  <li>En caso de fusión o adquisición empresarial</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">4. Seguridad de los Datos</h3>
                <p>
                  Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal, 
                  incluyendo encriptación SSL, almacenamiento seguro y acceso restringido a datos sensibles.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">5. Sus Derechos</h3>
                <p>
                  Usted tiene derecho a:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Acceder a su información personal</li>
                  <li>Corregir datos inexactos</li>
                  <li>Solicitar la eliminación de sus datos</li>
                  <li>Oponerse al procesamiento de sus datos</li>
                  <li>Retirar el consentimiento en cualquier momento</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">6. Retención de Datos</h3>
                <p>
                  Conservamos su información personal solo durante el tiempo necesario para cumplir con los 
                  propósitos descritos en esta política o según lo requiera la ley.
                </p>
              </div>
            </div>
          </section>

          {/* Política de Cookies */}
          <section id="cookies" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <Cookie className="w-8 h-8 text-purple-400" />
              <h2 className="text-3xl md:text-4xl font-bold">Política de Cookies</h2>
            </div>
            
            <div className="space-y-6 text-gray-300 leading-relaxed">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">1. ¿Qué son las Cookies?</h3>
                <p>
                  Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita nuestro 
                  sitio web. Nos ayudan a proporcionar una mejor experiencia de usuario y a entender cómo se utiliza 
                  nuestro servicio.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">2. Tipos de Cookies que Utilizamos</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-white">Cookies Esenciales</p>
                    <p className="text-sm">
                      Necesarias para el funcionamiento básico del sitio, como autenticación y seguridad.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Cookies de Rendimiento</p>
                    <p className="text-sm">
                      Nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web mediante la 
                      recopilación de información de forma anónima.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Cookies de Funcionalidad</p>
                    <p className="text-sm">
                      Permiten recordar sus preferencias y proporcionar características mejoradas y personalizadas.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Cookies de Marketing</p>
                    <p className="text-sm">
                      Se utilizan para rastrear a los visitantes en los sitios web con el fin de mostrar anuncios 
                      relevantes y atractivos.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">3. Cookies de Terceros</h3>
                <p>
                  Utilizamos servicios de terceros que pueden establecer cookies en su dispositivo:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Google Analytics para análisis de tráfico</li>
                  <li>Stripe para procesamiento de pagos</li>
                  <li>Supabase para autenticación y base de datos</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">4. Control de Cookies</h3>
                <p>
                  Puede controlar y/o eliminar las cookies según desee. Puede eliminar todas las cookies que ya 
                  están en su dispositivo y configurar la mayoría de los navegadores para evitar que se coloquen. 
                  Sin embargo, si hace esto, es posible que tenga que ajustar manualmente algunas preferencias cada 
                  vez que visite un sitio.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">5. Duración de las Cookies</h3>
                <p>
                  Las cookies pueden ser de sesión (se eliminan cuando cierra el navegador) o persistentes 
                  (permanecen en su dispositivo durante un período establecido o hasta que las elimine manualmente).
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">6. Actualización de la Política</h3>
                <p>
                  Podemos actualizar esta Política de Cookies ocasionalmente. Le notificaremos sobre cambios 
                  significativos publicando la nueva política en esta página con una nueva fecha de &quot;última actualización&quot;.
                </p>
              </div>
            </div>
          </section>

          {/* Contacto */}
          <section className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">¿Tienes preguntas?</h3>
            <p className="text-gray-400 mb-6">
              Si tienes alguna pregunta sobre nuestras políticas, no dudes en contactarnos.
            </p>
            <Link href="mailto:ac20102003@gmail.com">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Contactar Soporte
              </motion.button>
            </Link>
          </section>
        </motion.div>
      </div>      </div>    </div>
  );
}
