const API_URL = "http://localhost:4486/api"

// Obtener todo el inventario
export const getInventario = async () => {
  try {
    const response = await fetch(`${API_URL}/inventario`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener inventario")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getInventario:", error)
    throw error
  }
}

// Obtener inventario por producto
export const getInventarioByProducto = async (productoId) => {
  try {
    const response = await fetch(`${API_URL}/inventario/producto/${productoId}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener inventario del producto")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getInventarioByProducto:", error)
    throw error
  }
}

// Actualizar inventario
export const updateInventario = async (inventarioData) => {
  try {
    console.log("Actualizando inventario con datos:", inventarioData)

    const response = await fetch(`${API_URL}/inventario/actualizar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inventarioData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al actualizar inventario")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en updateInventario:", error)
    throw error
  }
}


