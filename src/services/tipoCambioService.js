const API_URL = "http://localhost:4486/api"

export const getTipoCambio = async () => {
  try {
    const res = await fetch(`${API_URL}/tipo-cambio`, {
      credentials: "include",
    })

    if (!res.ok) {
      // Instead of throwing an error, return a default value
      console.warn("Error al obtener el tipo de cambio. Usando valor por defecto.")
      return 0
    }

    const data = await res.json()
    return Number.parseFloat(data.valor) || 0
  } catch (error) {
    console.error("Error en getTipoCambio:", error)
    return 0 // Valor por defecto en caso de error
  }
}

export const setTipoCambio = async (valor) => {
  try {
    const res = await fetch(`${API_URL}/tipo-cambio`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor: Number.parseFloat(valor) }),
      credentials: "include",
    })

    if (!res.ok) {
      throw new Error("Error al actualizar el tipo de cambio")
    }

    return await res.json()
  } catch (error) {
    console.error("Error en setTipoCambio:", error)
    throw error
  }
}
