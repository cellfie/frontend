import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

// Componente para proteger rutas que requieren autenticación
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { currentUser, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Si todavía está cargando, mostrar un indicador de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  // Si se requiere un rol específico y el usuario no lo tiene, redirigir a una página de acceso denegado
  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to="/acceso-denegado" replace />
  }

  // Si está autenticado y tiene los permisos necesarios, mostrar el contenido protegido
  return children
}

export default ProtectedRoute
