const API_URL = "https://api.sistemacellfierm22.site/api"

export const getTipoCambio = async () => {
  try {
    const res = await fetch(`${API_URL}/tipo-cambio`, {
      credentials: "include",
    })

    if (!res.ok) {
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

export const setTipoCambio = async (valor, notas = "") => {
  try {
    // Asegurar que el valor es un número y tiene máximo 2 decimales
    const numericValue = Number.parseFloat(Number.parseFloat(valor).toFixed(2))

    if (isNaN(numericValue) || numericValue <= 0) {
      throw new Error("El valor debe ser un número mayor a cero")
    }

    const res = await fetch(`${API_URL}/tipo-cambio`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        valor: numericValue,
        notas: notas,
      }),
      credentials: "include",
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || "Error al actualizar el tipo de cambio")
    }

    return await res.json()
  } catch (error) {
    console.error("Error en setTipoCambio:", error)
    throw error
  }
}
