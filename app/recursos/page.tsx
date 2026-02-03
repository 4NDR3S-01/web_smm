"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Book, HelpCircle, FileText, ArrowLeft, Mail } from "lucide-react";

export default function RecursosPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#1a0b2e]/20 via-transparent to-[#1a0b2e]/20 pointer-events-none" />
      
      <div className="relative z-10">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-[#000000]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
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
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Centro de Recursos
          </h1>
          <p className="text-gray-400 text-base sm:text-lg mb-8 sm:mb-12">
            Encuentra toda la información que necesitas para aprovechar al máximo nuestro panel SMM
          </p>

          {/* Navegación rápida */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-12 lg:mb-16">
            <a href="#nosotros" className="flex items-center gap-3 p-4 bg-purple-950/30 border border-purple-500/30 rounded-xl hover:bg-purple-950/50 transition-colors">
              <Book className="w-6 h-6 text-purple-400" />
              <span className="font-semibold">Sobre Nosotros</span>
            </a>
            <a href="#guias" className="flex items-center gap-3 p-4 bg-purple-950/30 border border-purple-500/30 rounded-xl hover:bg-purple-950/50 transition-colors">
              <FileText className="w-6 h-6 text-purple-400" />
              <span className="font-semibold">Guías</span>
            </a>
            <a href="#faq" className="flex items-center gap-3 p-4 bg-purple-950/30 border border-purple-500/30 rounded-xl hover:bg-purple-950/50 transition-colors">
              <HelpCircle className="w-6 h-6 text-purple-400" />
              <span className="font-semibold">Preguntas Frecuentes</span>
            </a>
          </div>

          {/* Sobre Nosotros Section */}
          <section id="nosotros" className="mb-8 sm:mb-12 lg:mb-16 scroll-mt-24">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Book className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Sobre Nosotros</h2>
            </div>
            
            <div className="space-y-6 text-gray-300 leading-relaxed">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Nuestra Misión</h3>
                <p>
                  En ViralizaTuRed, nos dedicamos a ayudar a creadores de contenido, empresas y emprendedores a alcanzar su máximo potencial en redes sociales. Ofrecemos servicios de marketing digital de alta calidad que impulsan el crecimiento orgánico y sostenible de tu presencia online.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">¿Por qué elegirnos?</h3>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong className="text-white">Servicios confiables:</strong> Más de 10,000 clientes satisfechos confían en nosotros</li>
                  <li><strong className="text-white">Entrega rápida:</strong> La mayoría de pedidos se procesan en menos de 24 horas</li>
                  <li><strong className="text-white">Soporte 24/7:</strong> Estamos disponibles para ayudarte en cualquier momento</li>
                  <li><strong className="text-white">Garantía total:</strong> Todos nuestros servicios incluyen garantía de reposición</li>
                  <li><strong className="text-white">Seguridad primero:</strong> Métodos seguros que protegen tu cuenta</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Nuestros Valores</h3>
                <p>
                  Nos regimos por la transparencia, calidad y compromiso con nuestros clientes. Creemos en el crecimiento auténtico y sostenible, por eso solo ofrecemos servicios que cumplen con las políticas de las plataformas y garantizan resultados reales.
                </p>
              </div>
            </div>
          </section>

          {/* Guías Section */}
          <section id="guias" className="mb-8 sm:mb-12 lg:mb-16 scroll-mt-24">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Guías de Uso</h2>
            </div>
            
            <div className="space-y-6 text-gray-300 leading-relaxed">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Primeros Pasos</h3>
                <ol className="list-decimal list-inside ml-4 space-y-2">
                  <li><strong className="text-white">Crea tu cuenta:</strong> Regístrate con tu correo electrónico</li>
                  <li><strong className="text-white">Conecta tus redes:</strong> Vincula tus cuentas de redes sociales</li>
                  <li><strong className="text-white">Configura tu panel:</strong> Personaliza tu dashboard según tus necesidades</li>
                  <li><strong className="text-white">Comienza a crecer:</strong> Utiliza nuestras herramientas para aumentar tu presencia</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Funciones Principales</h3>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong className="text-white">Gestión de Pedidos:</strong> Administra y monitorea todos tus servicios en un solo lugar</li>
                  <li><strong className="text-white">Servicios Disponibles:</strong> Explora nuestra amplia gama de servicios para redes sociales</li>
                  <li><strong className="text-white">Historial y Análisis:</strong> Revisa estadísticas y el progreso de tus campañas</li>
                  <li><strong className="text-white">Soporte 24/7:</strong> Accede a ayuda en cualquier momento que lo necesites</li>
                </ul>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="mb-8 sm:mb-12 lg:mb-16 scroll-mt-24">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Preguntas Frecuentes</h2>
            </div>
            
            <div className="space-y-6 text-gray-300 leading-relaxed">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  ¿Qué es un panel SMM?
                </h3>
                <p>
                  Un panel SMM (Social Media Marketing) es una plataforma que te permite gestionar y potenciar tu presencia en redes sociales mediante servicios automatizados como aumento de seguidores, likes, visualizaciones y más.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  ¿Es seguro usar los servicios?
                </h3>
                <p>
                  Sí, nuestros servicios son seguros y cumplen con las políticas de las redes sociales. Utilizamos métodos orgánicos y graduales para garantizar la seguridad de tu cuenta.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  ¿Cuánto tiempo tardan en completarse los pedidos?
                </h3>
                <p>
                  El tiempo de entrega varía según el servicio solicitado. La mayoría de pedidos comienzan a procesarse en minutos y se completan en 24-72 horas. Servicios específicos pueden tener diferentes tiempos de entrega que se indican en su descripción.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  ¿Qué métodos de pago aceptan?
                </h3>
                <p>
                  Aceptamos múltiples métodos de pago incluyendo tarjetas de crédito/débito, transferencias bancarias y métodos de pago digital. Todos los pagos son procesados de forma segura.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  ¿Ofrecen garantía en los servicios?
                </h3>
                <p>
                  Sí, todos nuestros servicios incluyen garantía. Si experimentas alguna caída en el servicio contratado durante el período de garantía, lo reponemos sin costo adicional.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  ¿Necesito proporcionar mi contraseña?
                </h3>
                <p>
                  No, nunca solicitamos tu contraseña. Solo necesitamos el nombre de usuario o URL pública de tu perfil para procesar los pedidos. Nunca compartas tus contraseñas con nadie.
                </p>
              </div>
            </div>
          </section>

          {/* Contact CTA */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-3xl" />
            <div className="relative bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl rounded-xl p-8 border border-purple-500/30 text-center">
              <Mail className="w-12 h-12 text-white mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-3">
                ¿Necesitas más ayuda?
              </h2>
              <p className="text-white/90 mb-6">
                Nuestro equipo está disponible para responder todas tus preguntas
              </p>
              <a
                href="mailto:contacto@viralizatured.com"
                className="inline-block bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
              >
                Contáctanos
              </a>
            </div>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
}
