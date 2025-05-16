import { createContext, useContext, useState, useEffect } from "react"
import { getCurrentUser, logout } from "../services/authService"

// Crear el contexto
const AuthContext = createContext()

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Verificar si hay un usuario autenticado al cargar la aplicación
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Intentar obtener el usuario actual desde la API
        const user = await getCurrentUser()
        setCurrentUser(user)
      } catch (error) {
        console.error("Error al verificar el estado de autenticación:", error)
        setError(error)
      } finally {
        setLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  // Función para actualizar el usuario actual
  const updateUser = (user) => {
    setCurrentUser(user)
  }

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await logout()
      setCurrentUser(null)
      return true
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      setError(error)
      return false
    }
  }

  // Valores que se proporcionarán a través del contexto
  const value = {
    currentUser,
    loading,
    error,
    updateUser,
    logout: handleLogout,
    isAuthenticated: !!currentUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
