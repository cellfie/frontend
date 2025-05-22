const API_URL = "https://api.sistemacellfierm22.site/api"

// Almacenamiento local para cuando la API no esté disponible
let cachedDollarPrice = null

export const getTipoCambio = async () => {
  try {
    // Verificar si estamos offline
    if (!navigator.onLine) {
      console.warn("Sin conexión a internet. Usando valor en caché o localStorage.")

      // Intentar recuperar de localStorage
      try {
        const savedPrice = localStorage.getItem("dollarPrice")
        if (savedPrice) {
          const price = Number.parseFloat(savedPrice)
          cachedDollarPrice = price
          return price
        }
      } catch (e) {
        console.warn("No se pudo leer de localStorage:", e)
      }

      // Si tenemos un valor en caché, usarlo
      return cachedDollarPrice || 0.0
    }

    // Intentar obtener el precio desde la API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos de timeout

    const res = await fetch(`${API_URL}/tipo-cambio`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      console.warn("Error al obtener el tipo de cambio desde la API. Usando valor en caché o por defecto.")

      // Intentar recuperar de localStorage
      try {
        const savedPrice = localStorage.getItem("dollarPrice")
        if (savedPrice) {
          return Number.parseFloat(savedPrice)
        }
      } catch (e) {
        console.warn("No se pudo leer de localStorage:", e)
      }

      // Si tenemos un valor en caché, usarlo
      return cachedDollarPrice || 1000.0
    }

    const data = await res.json()
    const price = Number.parseFloat(data.valor) || 1000.0

    // Guardar en caché
    cachedDollarPrice = price

    // Guardar en localStorage como respaldo
    try {
      localStorage.setItem("dollarPrice", price.toString())
    } catch (e) {
      console.warn("No se pudo guardar en localStorage:", e)
    }

    return price
  } catch (error) {
    console.error("Error en getTipoCambio:", error)

    // Intentar recuperar de localStorage
    try {
      const savedPrice = localStorage.getItem("dollarPrice")
      if (savedPrice) {
        return Number.parseFloat(savedPrice)
      }
    } catch (e) {
      console.warn("No se pudo leer de localStorage:", e)
    }

    // Si tenemos un valor en caché, usarlo
    return cachedDollarPrice || 1000.0
  }
}

export const setTipoCambio = async (valor, notas = "") => {
  // Validar entrada
  const numericValue = Number.parseFloat(valor)
  if (isNaN(numericValue) || numericValue <= 0) {
    throw new Error("El valor debe ser un número mayor a cero")
  }

  // Redondear a 2 decimales
  const roundedValue = Math.round(numericValue * 100) / 100

  // Actualizar caché local inmediatamente
  cachedDollarPrice = roundedValue

  // Guardar en localStorage como respaldo
  try {
    localStorage.setItem("dollarPrice", roundedValue.toString())
  } catch (e) {
    console.warn("No se pudo guardar en localStorage:", e)
  }

  // Verificar si estamos offline
  if (!navigator.onLine) {
    console.warn("Sin conexión a internet. Guardando actualización para sincronizar más tarde.")

    try {
      localStorage.setItem(
        "pendingDollarUpdate",
        JSON.stringify({
          valor: roundedValue,
          notas: notas,
          timestamp: Date.now(),
        }),
      )
    } catch (e) {
      console.warn("No se pudo guardar en localStorage:", e)
    }

    return {
      success: true,
      message: "Tipo de cambio actualizado localmente. Se sincronizará cuando se restablezca la conexión.",
      valor: roundedValue,
      localOnly: true,
    }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos de timeout

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
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Si la respuesta no es exitosa, lanzar error pero mantener el valor en caché
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))

      // Guardar como pendiente para sincronizar más tarde
      try {
        localStorage.setItem(
          "pendingDollarUpdate",
          JSON.stringify({
            valor: roundedValue,
            notas: notas,
            timestamp: Date.now(),
          }),
        )
      } catch (e) {
        console.warn("No se pudo guardar en localStorage:", e)
      }

      throw new Error(errorData.message || "Error al actualizar el tipo de cambio en el servidor")
    }

    const data = await res.json()

    // Limpiar la actualización pendiente
    try {
      localStorage.removeItem("pendingDollarUpdate")
    } catch (e) {
      console.warn("No se pudo limpiar localStorage:", e)
    }

    return {
      ...data,
      success: true,
      valor: roundedValue,
      localOnly: false,
    }
  } catch (error) {
    console.error("Error en setTipoCambio:", error)

    // Guardar como pendiente para sincronizar más tarde
    try {
      localStorage.setItem(
        "pendingDollarUpdate",
        JSON.stringify({
          valor: roundedValue,
          notas: notas,
          timestamp: Date.now(),
        }),
      )
    } catch (e) {
      console.warn("No se pudo guardar en localStorage:", e)
    }

    // Retornar éxito parcial (solo local)
    return {
      success: true,
      message: "Tipo de cambio actualizado localmente. Se sincronizará cuando se restablezca la conexión.",
      valor: roundedValue,
      localOnly: true,
    }
  }
}

// Función para intentar sincronizar actualizaciones pendientes
export const syncPendingUpdates = async () => {
  // Verificar si estamos offline
  if (!navigator.onLine) {
    return null
  }

  try {
    const pendingUpdate = localStorage.getItem("pendingDollarUpdate")
    if (!pendingUpdate) return null

    const updateData = JSON.parse(pendingUpdate)

    // Si la actualización es muy antigua (más de 1 día), descartarla
    if (Date.now() - updateData.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem("pendingDollarUpdate")
      return null
    }

    // Intentar enviar la actualización pendiente
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos de timeout

    const res = await fetch(`${API_URL}/tipo-cambio`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        valor: updateData.valor,
        notas: updateData.notas || "Actualización pendiente sincronizada",
      }),
      credentials: "include",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      console.warn("No se pudo sincronizar la actualización pendiente. Se intentará más tarde.")
      return null
    }

    // Si llegamos aquí, la sincronización fue exitosa
    localStorage.removeItem("pendingDollarUpdate")
    return updateData.valor
  } catch (error) {
    console.warn("No se pudo sincronizar la actualización pendiente:", error)
    return null
  }
}

// Función para formatear moneda argentina
export const formatCurrencyARS = (amount) => {
  if (amount === null || amount === undefined) return "$0,00"

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Función para formatear número con separadores argentinos
export const formatNumberARS = (amount) => {
  if (amount === null || amount === undefined) return "0,00"

  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Función para parsear un número en formato argentino
export const parseNumberARS = (formattedNumber) => {
  if (!formattedNumber) return 0

  // Limpiar el valor ingresado (remover separadores de miles y cambiar coma por punto)
  const cleanValue = formattedNumber
    .replace(/\./g, "") // Remover puntos (separadores de miles)
    .replace(",", ".") // Cambiar coma por punto decimal
    .trim()

  return Number.parseFloat(cleanValue) || 0
}
