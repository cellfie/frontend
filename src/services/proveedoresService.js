const API_URL = "https://api.sistemacellfierm22.site/api"

// Obtener todos los proveedores
export const getProveedores = async () => {
  try {
    const response = await fetch(`${API_URL}/proveedores`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener proveedores")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getProveedores:", error)
    throw error
  }
}

// Obtener un proveedor por ID
export const getProveedorById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/proveedores/${id}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener el proveedor")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getProveedorById:", error)
    throw error
  }
}

// Buscar proveedores
export const searchProveedores = async (query) => {
  try {
    if (!query || query.trim().length < 2) {
      return []
    }

    const response = await fetch(`${API_URL}/proveedores/search?query=${encodeURIComponent(query)}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      if (response.status === 500) {
        console.error("Error del servidor al buscar proveedores")
        return []
      }
      const errorData = await response.json().catch(() => ({ message: "Error desconocido" }))
      throw new Error(errorData.message || "Error al buscar proveedores")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en searchProveedores:", error)
    return []
  }
}

// Crear un nuevo proveedor
export const createProveedor = async (proveedorData) => {
  try {
    const response = await fetch(`${API_URL}/proveedores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(proveedorData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al crear el proveedor")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en createProveedor:", error)
    throw error
  }
}

// Actualizar un proveedor existente
export const updateProveedor = async (id, proveedorData) => {
  try {
    const response = await fetch(`${API_URL}/proveedores/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(proveedorData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al actualizar el proveedor")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en updateProveedor:", error)
    throw error
  }
}

// Eliminar un proveedor
export const deleteProveedor = async (id) => {
  try {
    const response = await fetch(`${API_URL}/proveedores/${id}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al eliminar el proveedor")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en deleteProveedor:", error)
    throw error
  }
}

