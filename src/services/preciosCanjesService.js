const API_URL = "https://api.sistemacellfierm22.site/api" 

// Modificar la función getPreciosCanjes para eliminar la inferencia de categoría
export const getPreciosCanjes = async () => {
  try {
    const response = await fetch(`${API_URL}/precios-canjes`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener precios de canjes")
    }

    // Convertir explícitamente los valores a números
    const data = await response.json()
    return data.map((item) => ({
      ...item,
      precioNormal: Number(item.precioNormal),
      precioCellfie: Number(item.precioCellfie),
    }))
  } catch (error) {
    console.error("Error en getPreciosCanjes:", error)
    throw error
  }
}

// Modificar la función createPrecioCanje para eliminar la categoría
export const createPrecioCanje = async (precioData) => {
  try {
    const response = await fetch(`${API_URL}/precios-canjes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(precioData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al crear precio de canje")
    }

    const data = await response.json()
    // Convertir explícitamente los valores a números
    return {
      ...data,
      precioNormal: Number(data.precioNormal),
      precioCellfie: Number(data.precioCellfie),
    }
  } catch (error) {
    console.error("Error en createPrecioCanje:", error)
    throw error
  }
}

// Eliminar un precio de canje
export const deletePrecioCanje = async (id) => {
  try {
    const response = await fetch(`${API_URL}/precios-canjes/${id}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al eliminar precio de canje")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en deletePrecioCanje:", error)
    throw error
  }
}
