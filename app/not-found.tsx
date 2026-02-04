"use client";

import { motion } from "framer-motion";
import { Home, Search, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-pink-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float" style={{ animationDelay: "4s" }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center relative z-10"
      >
        {/* 404 Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/50">
              <AlertTriangle className="w-16 h-16 text-white" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 border-4 border-dashed border-purple-500/30 rounded-full"
            />
          </div>
        </motion.div>

        {/* 404 Text */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-8xl md:text-9xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4"
        >
          404
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-3xl md:text-4xl font-bold text-white mb-4"
        >
          Página No Encontrada
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg text-gray-400 mb-8 max-w-md mx-auto"
        >
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/30 w-full sm:w-auto"
            >
              <Home className="w-5 h-5 mr-2" />
              Volver al Inicio
            </Button>
          </Link>

          <Link href="/dashboard">
            <Button 
              size="lg"
              variant="outline"
              className="border-purple-500/50 bg-purple-900/20 hover:bg-purple-900/40 text-white w-full sm:w-auto"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Ir al Dashboard
            </Button>
          </Link>
        </motion.div>

        {/* Helpful Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 pt-8 border-t border-gray-700"
        >
          <p className="text-sm text-gray-500 mb-4">Enlaces útiles:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
              Iniciar Sesión
            </Link>
            <span className="text-gray-600">•</span>
            <Link href="/register" className="text-purple-400 hover:text-purple-300 transition-colors">
              Registrarse
            </Link>
            <span className="text-gray-600">•</span>
            <Link href="/recursos" className="text-purple-400 hover:text-purple-300 transition-colors">
              Recursos
            </Link>
            <span className="text-gray-600">•</span>
            <Link href="/legal" className="text-purple-400 hover:text-purple-300 transition-colors">
              Términos Legales
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
