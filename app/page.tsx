"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Users, Zap, Shield, BarChart3, Star, Rocket, CheckCircle2, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

// Generar posiciones de partículas una sola vez (reducido para mejor performance)
const particles = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 100,
  duration: 3 + Math.random() * 2,
  delay: Math.random() * 2,
}));

export default function HomePage() {
  const [mounted, setMounted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();
  
  const { scrollYProgress } = useScroll();
  const scaleProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  // Mover el hook useTransform antes de cualquier return condicional
  const scale = useTransform(scaleProgress, [0, 1], [1, 1.5]);

  // Verificar si el usuario está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
      setIsLoading(false);
    };
    checkAuth();
  }, [supabase.auth]);

  // Simular carga inicial para evitar flash de contenido vacío
  if (isLoading) {
    setTimeout(() => setIsLoading(false), 100);
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center animate-pulse shadow-lg shadow-purple-500/50">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-black to-blue-950" />
        <motion.div 
          className="absolute top-0 left-0 w-full h-full opacity-30"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)",
            scale: scale,
          }}
        />
        {mounted && (
          <div className="absolute inset-0">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute w-1 h-1 bg-purple-400 rounded-full"
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                }}
                animate={{
                  opacity: [0.2, 1, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: particle.duration,
                  repeat: Infinity,
                  delay: particle.delay,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-purple-500/20"
      >
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 md:gap-3"
            >
              <motion.div 
                className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </motion.div>
              <span className="text-lg md:text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                ViralizaTuRed
              </span>
            </motion.div>

            <div className="flex items-center gap-2 md:gap-4">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/30 text-sm md:text-base px-4 md:px-6">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Dashboard</span>
                      <span className="sm:hidden">Panel</span>
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 text-sm md:text-base px-3 md:px-4">
                      <span className="hidden sm:inline">Iniciar Sesión</span>
                      <span className="sm:hidden">Iniciar</span>
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/30 text-sm md:text-base px-3 md:px-6">
                      <span className="hidden sm:inline">Comenzar Gratis</span>
                      <span className="sm:hidden">Registro</span>
                      <ArrowRight className="w-4 h-4 ml-1 md:ml-2" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-12 md:pb-20 px-4 min-h-screen flex items-center">
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              <motion.div 
                className="inline-block"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="px-6 py-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 text-purple-300 rounded-full text-sm font-bold backdrop-blur-sm">
                  🚀 La Revolución del Marketing Digital
                </span>
              </motion.div>
            </motion.div>

            <motion.h1 
              className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 leading-tight"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.span 
                className="inline-block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{ backgroundSize: "200% 200%" }}
              >
                Impulsa
              </motion.span>
              <br />
              <motion.span 
                className="inline-block text-white"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Tus Redes Sociales
              </motion.span>
            </motion.h1>

            <motion.p 
              className="text-xl md:text-3xl text-gray-300 mb-12 max-w-4xl mx-auto font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Plataforma SMM profesional para <span className="text-purple-400 font-bold">impulsar tus redes sociales</span>.
              Instagram, TikTok, YouTube, Facebook, X (Twitter) y más. Seguidores, likes, comentarios, visualizaciones.
              <span className="text-blue-400 font-bold"> Crea tu cuenta, elige tu red social y realiza tu pedido al instante</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="lg" 
                    className="text-xl px-12 py-7 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-2xl shadow-purple-500/50 rounded-2xl font-bold"
                  >
                    {isAuthenticated ? (
                      <>
                        <LayoutDashboard className="w-6 h-6 mr-3" />
                        Ir al Dashboard
                      </>
                    ) : (
                      <>
                        <Rocket className="w-6 h-6 mr-3" />
                        Comenzar Ahora
                      </>
                    )}
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1 }}
              className="mt-24 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-3xl" />
              <div className="relative bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-purple-500/30 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                  {[
                    { value: "50K+", label: "Clientes Satisfechos", icon: Users },
                    { value: "10M+", label: "Servicios Entregados", icon: TrendingUp },
                    { value: "24/7", label: "Soporte Activo", icon: Star },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                      className="text-center"
                    >
                      <stat.icon className="w-8 h-8 mx-auto mb-3 text-purple-400" />
                      <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        {stat.value}
                      </div>
                      <div className="text-purple-300 mt-2 text-lg">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 px-4">
        <div className="container mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="text-center mb-20">
              <motion.h2 
                className="text-5xl md:text-7xl font-black mb-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Todo lo que necesitas para{" "}
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  dominar
                </span>
              </motion.h2>
              <motion.p 
                className="text-2xl text-gray-400"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Herramientas de nivel empresarial al alcance de tu mano
              </motion.p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20 blur-3xl" />
        <div className="container mx-auto max-w-5xl relative z-10">
          <ScrollReveal>
            <motion.div 
              className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-xl rounded-3xl p-12 md:p-20 border border-purple-500/30 shadow-2xl text-center overflow-hidden relative"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 10, repeat: Infinity }}
                style={{ backgroundSize: "200% 200%" }}
              />
              
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50"
                >
                  <Rocket className="w-10 h-10 text-white" />
                </motion.div>

                <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
                  ¿Listo para{" "}
                  <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    dominar
                  </span>{" "}
                  tu red?
                </h2>
                
                <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto">
                  Únete a <span className="text-purple-400 font-bold">50,000+</span> clientes que confían en nuestros servicios para crecer en redes sociales
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
                  <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        size="lg" 
                        className="text-xl px-12 py-7 bg-white text-purple-600 hover:bg-gray-100 shadow-2xl rounded-2xl font-bold"
                      >
                        {isAuthenticated ? (
                          <>
                            <LayoutDashboard className="w-6 h-6 mr-3" />
                            Ir al Dashboard
                          </>
                        ) : (
                          <>
                            Comenzar Gratis <ArrowRight className="w-6 h-6 ml-3" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </Link>
                </div>

                <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                  {["Sin tarjeta de crédito", "Registro rápido", "Soporte 24/7"].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      {item}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-4 border-t border-purple-500/20">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  ViralizaTuRed
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Panel SMM profesional para impulsar tus redes sociales. Instagram, TikTok, YouTube, Facebook, X (Twitter). 
                Servicios de seguidores, likes, comentarios, visualizaciones y más. Resultados garantizados.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-white mb-2 text-lg">Contacto</h3>
              <a href="mailto:ac20102003@gmail.com" className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                ac20102003@gmail.com
              </a>
              <a href="https://wa.me/593963924479?text=Hola,%20me%20podrías%20ayudar%20con%20...." target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp Soporte
              </a>
              <p className="text-gray-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Lun - Dom: 24/7
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-white mb-2 text-lg">Recursos</h3>
              <a href="/recursos#nosotros" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                Sobre Nosotros
              </a>
              <a href="/recursos#guias" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                Guías y Tutoriales
              </a>
              <a href="/recursos#faq" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                Preguntas Frecuentes
              </a>
            </div>
          </div>

          <div className="border-t border-purple-500/20 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 ViralizaTuRed. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-xs text-gray-500">
              <a href="/legal#terminos" className="hover:text-purple-400 transition-colors">Términos de Servicio</a>
              <a href="/legal#privacidad" className="hover:text-purple-400 transition-colors">Política de Privacidad</a>
              <a href="/legal#cookies" className="hover:text-purple-400 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Componente ScrollReveal para animaciones al hacer scroll
function ScrollReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 75 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 75 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Componente FeatureCard con animaciones avanzadas
function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, rotateX: 45 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 50, rotateX: 45 }}
      transition={{ 
        duration: 0.6,
        delay: index * 0.1,
        ease: "easeOut"
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -10, scale: 1.02 }}
      className="relative group"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl"
        animate={{
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
      
      <Card className="relative h-full bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl border-2 border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="relative z-10">
          <motion.div 
            className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/50"
            animate={{
              rotate: isHovered ? 360 : 0,
              scale: isHovered ? 1.1 : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            {feature.icon}
          </motion.div>
          
          <CardTitle className="text-2xl font-bold text-white mb-3">
            {feature.title}
          </CardTitle>
          
          <CardDescription className="text-gray-400 text-base leading-relaxed">
            {feature.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </motion.div>
  );
}

const features = [
  {
    icon: <Users className="w-8 h-8 text-white" />,
    title: "Seguidores & Suscriptores",
    description: "Aumenta tus seguidores en Instagram, TikTok, X (Twitter), Facebook. Suscriptores para YouTube. Perfiles reales y activos que impulsan tu credibilidad.",
  },
  {
    icon: <Star className="w-8 h-8 text-white" />,
    title: "Likes & Reacciones",
    description: "Likes para tus posts y videos en Instagram, Facebook, TikTok, YouTube. Reacciones auténticas que mejoran tu alcance orgánico.",
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-white" />,
    title: "Visualizaciones",
    description: "Aumenta las vistas de tus videos en YouTube, TikTok, Instagram Reels, Facebook Videos. Incrementa tu visibilidad y posicionamiento.",
  },
  {
    icon: <Zap className="w-8 h-8 text-white" />,
    title: "Comentarios Personalizados",
    description: "Comentarios reales y personalizados para tus publicaciones. Aumenta el engagement y la interacción con tu audiencia en todas las plataformas.",
  },
  {
    icon: <Shield className="w-8 h-8 text-white" />,
    title: "100% Seguro",
    description: "Métodos seguros certificados que protegen tu cuenta. Solo necesitas la URL pública de tu perfil o post, nunca tu contraseña.",
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-white" />,
    title: "Sistema Automatizado",
    description: "Crea tu cuenta, selecciona la categoría (red social), ingresa la URL del perfil o post, realiza tu pedido. Todo automático y rápido.",
  },
];
