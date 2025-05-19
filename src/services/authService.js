const API_URL = "https://api.sistemacellfierm22.site/api" // Ajusta esto a la URL de tu backend

// Función para registrar un nuevo usuario
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre: userData.username, // Adaptamos username a nombre que es lo que espera el backend
        password: userData.password,
      }),
      credentials: "include", // Importante para que las cookies se envíen/reciban
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al registrar usuario")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en el registro:", error)
    throw error
  }
}

// Función para iniciar sesión
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre: credentials.username, // Adaptamos username a nombre que es lo que espera el backend
        password: credentials.password,
      }),
      credentials: "include", // Importante para que las cookies se envíen/reciban
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Credenciales inválidas")
    }

    // El backend devuelve los datos del usuario pero guarda el token en una cookie
    const userData = await response.json()

    return userData // Devolvemos los datos del usuario (id, nombre, rol)
  } catch (error) {
    console.error("Error en el inicio de sesión:", error)
    throw error
  }
}

// Función para obtener el usuario actual (verificar sesión)
export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/check-session`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Importante para enviar la cookie con el token
    })

    if (!response.ok) {
      return null // No hay sesión activa o token expirado
    }

    const data = await response.json()
    return data.user // Devolvemos los datos del usuario del token
  } catch (error) {
    console.error("Error al obtener el usuario actual:", error)
    return null
  }
}

// Función para cerrar sesión
export const logout = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include", // Importante para enviar la cookie con el token
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al cerrar sesión")
    }

    return true
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
    throw error
  }
}

// Función para verificar si el token sigue siendo válido
export const verifyToken = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/check-session`, {
      method: "GET",
      credentials: "include",
    })

    return response.ok
  } catch (error) {
    console.error("Error al verificar el token:", error)
    return false
  }
}
