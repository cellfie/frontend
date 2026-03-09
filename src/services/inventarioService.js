const API_URL = "https://api.sistemacellfierm22.site/api" 

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

// Obtener movimientos de inventario (paginados)
export const getMovimientosInventario = async (page = 1, limit = 20, filters = {}) => {
  try {
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([, value]) => value !== undefined && value !== null && value !== "" && value !== "todos",
      ),
    )

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...cleanFilters,
    })

    const response = await fetch(`${API_URL}/inventario/movimientos?${queryParams.toString()}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Error al obtener movimientos de inventario" }))
      throw new Error(errorData.message || "Error al obtener movimientos de inventario")
    }

    const data = await response.json()

    if (!data || !Array.isArray(data.movimientos)) {
      throw new Error("Respuesta inválida del servidor de movimientos de inventario")
    }

    return data
  } catch (error) {
    console.error("Error en getMovimientosInventario:", error)
    throw error
  }
}

