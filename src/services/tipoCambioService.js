const API_URL = "https://api.sistemacellfierm22.site/api"

export const getTipoCambio = async () => {
  try {
    const res = await fetch(`${API_URL}/tipo-cambio`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
      console.warn("Error al obtener el tipo de cambio. Usando valor por defecto.")
      return 1000.0
    }

    const data = await res.json()
    return Number.parseFloat(data.valor) || 1000.0
  } catch (error) {
    console.error("Error en getTipoCambio:", error)
    return 1000.0 // Valor por defecto en caso de error
  }
}

export const setTipoCambio = async (valor, notas = "") => {
  try {
    // Validar entrada
    const numericValue = Number.parseFloat(valor)
    if (isNaN(numericValue) || numericValue <= 0) {
      throw new Error("El valor debe ser un número mayor a cero")
    }

    // Redondear a 2 decimales
    const roundedValue = Math.round(numericValue * 100) / 100

    const res = await fetch(`${API_URL}/tipo-cambio`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        valor: roundedValue,
        notas: notas,
      }),
      credentials: "include",
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || "Error al actualizar el tipo de cambio")
    }

    if (!data.success) {
      throw new Error(data.message || "Error en la respuesta del servidor")
    }

    return data
  } catch (error) {
    console.error("Error en setTipoCambio:", error)
    throw error
  }
}

// Función para formatear moneda argentina
export const formatCurrencyARS = (amount) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Función para formatear número con separadores argentinos
export const formatNumberARS = (amount) => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
