"use client"

import { useNavigate } from "react-router-dom"
import { Shield, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

const AccesoDenegadoPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-full bg-red-100">
            <Shield className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
        <p className="text-gray-600 mb-6">
          No tienes permisos suficientes para acceder a esta sección. Por favor, contacta con un administrador si crees
          que deberías tener acceso.
        </p>

        <div className="flex justify-center">
          <Button onClick={() => navigate("/")} className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2">
            <Home className="h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AccesoDenegadoPage
