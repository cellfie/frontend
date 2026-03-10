const API_URL = "https://api.sistemacellfierm22.site/api"

// Obtener la caja actual de un punto de venta (sesión abierta + totales)
export const getCajaActual = async (puntoVentaId) => {
  const params = new URLSearchParams({ punto_venta_id: puntoVentaId.toString() })

  const response = await fetch(`${API_URL}/caja/actual?${params}`, {
    method: "GET",
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error al obtener caja actual" }))
    throw new Error(errorData.message || "Error al obtener caja actual")
  }

  return await response.json()
}

// Abrir caja
export const abrirCaja = async ({ punto_venta_id, monto_apertura, notas_apertura }) => {
  const response = await fetch(`${API_URL}/caja/abrir`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      punto_venta_id: Number(punto_venta_id),
      monto_apertura: Number(monto_apertura || 0),
      notas_apertura: notas_apertura || "",
    }),
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error al abrir caja" }))
    throw new Error(errorData.message || "Error al abrir caja")
  }

  return await response.json()
}

// Cerrar caja
export const cerrarCaja = async (sesionId, { monto_cierre, notas_cierre }) => {
  const response = await fetch(`${API_URL}/caja/${sesionId}/cerrar`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      monto_cierre: Number(monto_cierre || 0),
      notas_cierre: notas_cierre || "",
    }),
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error al cerrar caja" }))
    throw new Error(errorData.message || "Error al cerrar caja")
  }

  return await response.json()
}

// Registrar movimiento manual de caja
export const registrarMovimientoCaja = async (movimientoData) => {
  const response = await fetch(`${API_URL}/caja/movimientos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      caja_sesion_id: Number(movimientoData.caja_sesion_id),
      tipo: movimientoData.tipo, // 'ingreso' | 'egreso'
      concepto: movimientoData.concepto,
      monto: Number(movimientoData.monto),
      metodo_pago: movimientoData.metodo_pago || "",
      origen: movimientoData.origen || "general",
    }),
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error al registrar movimiento de caja" }))
    throw new Error(errorData.message || "Error al registrar movimiento de caja")
  }

  return await response.json()
}

// Historial de sesiones de caja
export const getSesionesCaja = async (page = 1, limit = 20, filters = {}) => {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "" && value !== "todos",
    ),
  )

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...cleanFilters,
  })

  const response = await fetch(`${API_URL}/caja/sesiones?${params.toString()}`, {
    method: "GET",
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error al obtener sesiones de caja" }))
    throw new Error(errorData.message || "Error al obtener sesiones de caja")
  }

  const data = await response.json()

  if (!data || !Array.isArray(data.sesiones)) {
    throw new Error("Respuesta inválida del servidor de sesiones de caja")
  }

  return data
}

// Historial de movimientos de caja para una sesión
export const getMovimientosCaja = async (
  cajaSesionId,
  page = 1,
  limit = 20,
  tipo = "todos",
  origen = "todos",
) => {
  const params = new URLSearchParams({
    caja_sesion_id: cajaSesionId.toString(),
    page: page.toString(),
    limit: limit.toString(),
  })

  if (tipo && tipo !== "todos") {
    params.append("tipo", tipo)
  }

  if (origen && origen !== "todos") {
    params.append("origen", origen)
  }

  const response = await fetch(`${API_URL}/caja/movimientos?${params.toString()}`, {
    method: "GET",
    credentials: "include",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error al obtener movimientos de caja" }))
    throw new Error(errorData.message || "Error al obtener movimientos de caja")
  }

  const data = await response.json()

  if (!data || !Array.isArray(data.movimientos)) {
    throw new Error("Respuesta inválida del servidor de movimientos de caja")
  }

  return data
}

// Movimientos completos por tab (ventas + manuales unificados)
export const getMovimientosCompletosCaja = async (
  cajaSesionId,
  origen = "ventas_productos",
  page = 1,
  limit = 50,
) => {
  const params = new URLSearchParams({
    origen,
    page: page.toString(),
    limit: limit.toString(),
  })
  const response = await fetch(
    `${API_URL}/caja/sesion/${cajaSesionId}/movimientos-completos?${params.toString()}`,
    { method: "GET", credentials: "include" },
  )
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Error al obtener movimientos" }))
    throw new Error(errorData.message || "Error al obtener movimientos")
  }
  const data = await response.json()
  if (!data || !Array.isArray(data.movimientos)) {
    throw new Error("Respuesta inválida del servidor de movimientos")
  }
  return data
}
