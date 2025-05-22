const API_URL = "https://api.sistemacellfierm22.site/api"

// Variable para controlar el tiempo entre solicitudes
let lastUpdateTime = 0
const MIN_UPDATE_INTERVAL = 5000 // 5 segundos mínimo entre actualizaciones

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
    // Verificar si ha pasado suficiente tiempo desde la última actualización
    const now = Date.now()
    if (now - lastUpdateTime < MIN_UPDATE_INTERVAL) {
      throw new Error("Por favor, espera unos segundos antes de actualizar nuevamente el tipo de cambio.")
    }

    // Asegurar que el valor es un número y tiene máximo 2 decimales
    const numericValue = Number.parseFloat(Number.parseFloat(valor).toFixed(2))

    if (isNaN(numericValue) || numericValue <= 0) {
      throw new Error("El valor debe ser un número mayor a cero")
    }

    // Actualizar el tiempo de la última solicitud
    lastUpdateTime = now

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

    const data = await res.json()

    // Si no hubo cambio, informamos pero no es un error
    if (data.noChange) {
      console.log("El tipo de cambio ya tiene ese valor.")
    }

    return data
  } catch (error) {
    console.error("Error en setTipoCambio:", error)
    throw error
  }
}
