const API_URL = "https://api.sistemacellfierm22.site/api"

// Cache mejorado para ventas con mejor gestión
const cache = new Map()
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutos

// CORREGIDO: Función para formatear fecha argentina con suma de 3 horas
const formatearFechaArgentina = (fechaString) => {
  if (!fechaString) return ""

  try {
    let fecha

    // Mejor manejo de diferentes formatos de fecha
    if (fechaString.includes("T") || fechaString.includes("+")) {
      fecha = new Date(fechaString)
    } else {
      // Para fechas simples, crear fecha local sin conversión UTC
      const [datePart, timePart] = fechaString.split(" ")
      if (datePart) {
        const [year, month, day] = datePart.split("-")
        const [hour = 0, minute = 0, second = 0] = (timePart || "00:00:00").split(":")
        fecha = new Date(year, month - 1, day, hour, minute, second)
      } else {
        fecha = new Date(fechaString)
      }
    }

    if (isNaN(fecha.getTime())) return ""

    // NUEVO: Sumar 3 horas para corregir el desfase
    fecha.setHours(fecha.getHours() + 3)

    return fecha.toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    return ""
  }
}

export { formatearFechaArgentina }

// CORREGIDO: Función principal de paginación con filtro de método de pago mejorado
export const getVentasPaginadas = async (page = 1, limit = 50, filters = {}) => {
  try {
    // Limpiar filtros vacíos o undefined
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([key, value]) =>
          value !== undefined &&
          value !== null &&
          value !== "" &&
          value !== "todos" && // NUEVO: Excluir "todos" del filtro
          !(Array.isArray(value) && value.length === 0),
      ),
    )

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...cleanFilters,
    })

    const cacheKey = `ventas_paginadas_${queryParams.toString()}`

    // Verificar cache
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log("Datos obtenidos desde cache:", cacheKey)
        return cached.data
      } else {
        // Eliminar entrada expirada
        cache.delete(cacheKey)
      }
    }

    console.log("Realizando petición al backend:", `${API_URL}/ventas/paginadas?${queryParams}`)

    const response = await fetch(`${API_URL}/ventas/paginadas?${queryParams}`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Error de conexión" }))
      throw new Error(errorData.message || `Error HTTP: ${response.status}`)
    }

    const data = await response.json()

    // VALIDACIÓN: Verificar estructura de respuesta
    if (!data || typeof data !== "object") {
      throw new Error("Respuesta inválida del servidor")
    }

    if (!Array.isArray(data.ventas)) {
      throw new Error("Formato de ventas inválido en la respuesta")
    }

    if (!data.pagination || typeof data.pagination !== "object") {
      throw new Error("Información de paginación faltante")
    }

    // MEJORADO: Validar información de paginación
    const pagination = {
      currentPage: Number(data.pagination.currentPage) || 1,
      totalPages: Number(data.pagination.totalPages) || 1,
      totalItems: Number(data.pagination.totalItems) || 0,
      itemsPerPage: Number(data.pagination.itemsPerPage) || limit,
      hasNextPage: Boolean(data.pagination.hasNextPage),
      hasPrevPage: Boolean(data.pagination.hasPrevPage),
      startItem: Number(data.pagination.startItem) || 1,
      endItem: Number(data.pagination.endItem) || 0,
    }

    const result = {
      ventas: data.ventas,
      pagination,
      debug: data.debug || null, // Información de debug del backend
    }

    // Guardar en cache
    cache.set(cacheKey, { data: result, timestamp: Date.now() })

    console.log("Respuesta procesada:", {
      ventasCount: data.ventas.length,
      pagination,
      cacheKey,
      appliedFilters: data.debug?.appliedFilters || {},
    })

    return result
  } catch (error) {
    console.error("Error en getVentasPaginadas:", error)

    // MEJORADO: Proporcionar información más detallada del error
    const errorMessage = error.message || "Error desconocido al obtener ventas"
    const enhancedError = new Error(`Error al obtener ventas paginadas: ${errorMessage}`)
    enhancedError.originalError = error
    enhancedError.filters = filters
    enhancedError.page = page
    enhancedError.limit = limit

    throw enhancedError
  }
}

// NUEVA FUNCIÓN: Obtener métodos de pago únicos para el filtro
export const getMetodosPagoVentas = async () => {
  try {
    const cacheKey = "metodos_pago_ventas"

    // Verificar cache
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log("Métodos de pago obtenidos desde cache")
        return cached.data
      } else {
        cache.delete(cacheKey)
      }
    }

    console.log("Obteniendo métodos de pago desde el backend...")

    const response = await fetch(`${API_URL}/ventas/metodos-pago`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Error de conexión" }))
      throw new Error(errorData.message || "Error al obtener métodos de pago")
    }

    const data = await response.json()

    // Validar que sea un array
    if (!Array.isArray(data)) {
      throw new Error("Formato de métodos de pago inválido")
    }

    // Guardar en cache
    cache.set(cacheKey, { data, timestamp: Date.now() })

    console.log("Métodos de pago obtenidos:", data.length)
    return data
  } catch (error) {
    console.error("Error en getMetodosPagoVentas:", error)
    throw error
  }
}

// MEJORADO: Búsqueda rápida con mejor manejo de errores
export const searchVentasRapido = async (query, limit = 10) => {
  try {
    if (!query || query.length < 2) {
      return []
    }

    const queryParams = new URLSearchParams({
      q: query.trim(),
      limit: limit.toString(),
    })

    const response = await fetch(`${API_URL}/ventas/search-rapido?${queryParams}`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Error de conexión" }))
      throw new Error(errorData.message || "Error en búsqueda rápida de ventas")
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error en searchVentasRapido:", error)
    throw error
  }
}

// MEJORADO: Búsqueda por producto con validación
export const searchVentasByProducto = async (productoQuery, limit = 20) => {
  try {
    if (!productoQuery || productoQuery.length < 2) {
      return []
    }

    const queryParams = new URLSearchParams({
      producto_query: productoQuery.trim(),
      limit: limit.toString(),
    })

    const response = await fetch(`${API_URL}/ventas/search-by-producto?${queryParams}`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Error de conexión" }))
      throw new Error(errorData.message || "Error en búsqueda de ventas por producto")
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error en searchVentasByProducto:", error)
    throw error
  }
}

// MEJORADO: Función para limpiar cache con opciones
export const clearVentasCache = (pattern = null) => {
  if (pattern) {
    // Limpiar solo entradas que coincidan con el patrón
    for (const [key] of cache) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  } else {
    // Limpiar todo el cache
    cache.clear()
  }
  console.log(`Cache limpiado${pattern ? ` (patrón: ${pattern})` : " (completo)"}`)
}

// CORREGIDO: Función getVentas usando la paginación mejorada
export const getVentas = async (filters = {}) => {
  try {
    // Para obtener todas las ventas, usar un límite alto y página 1
    const result = await getVentasPaginadas(1, 10000, filters)
    return result.ventas || []
  } catch (error) {
    console.error("Error en getVentas:", error)
    throw error
  }
}

// MEJORADO: Obtener venta por ID con mejor cache y validación
export const getVentaById = async (id) => {
  try {
    if (!id || isNaN(Number(id))) {
      throw new Error("ID de venta inválido")
    }

    const cacheKey = `venta_detalle_${id}`

    // Verificar cache
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data
      } else {
        cache.delete(cacheKey)
      }
    }

    const response = await fetch(`${API_URL}/ventas/${id}`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Venta no encontrada")
      }
      const errorData = await response.json().catch(() => ({ message: "Error de conexión" }))
      throw new Error(errorData.message || "Error al obtener la venta")
    }

    const data = await response.json()

    // Validar estructura de respuesta
    if (!data || typeof data !== "object" || !data.id) {
      throw new Error("Datos de venta inválidos")
    }

    // Guardar en cache
    cache.set(cacheKey, { data, timestamp: Date.now() })

    return data
  } catch (error) {
    console.error("Error en getVentaById:", error)
    throw error
  }
}

// MEJORADO: Obtener devoluciones con validación
export const getDevolucionesByVenta = async (id) => {
  try {
    if (!id || isNaN(Number(id))) {
      throw new Error("ID de venta inválido")
    }

    const response = await fetch(`${API_URL}/ventas/${id}/devoluciones`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Venta no encontrada")
      }
      const errorData = await response.json().catch(() => ({ message: "Error de conexión" }))
      throw new Error(errorData.message || "Error al obtener devoluciones de la venta")
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error en getDevolucionesByVenta:", error)
    throw error
  }
}

// MEJORADO: Crear venta con mejor validación
export const createVenta = async (ventaData) => {
  try {
    // Validaciones básicas
    if (!ventaData || typeof ventaData !== "object") {
      throw new Error("Datos de venta inválidos")
    }

    if (!ventaData.punto_venta_id) {
      throw new Error("Punto de venta es requerido")
    }

    if (!Array.isArray(ventaData.pagos) || ventaData.pagos.length === 0) {
      throw new Error("Se requiere al menos un método de pago")
    }

    if (!Array.isArray(ventaData.productos) || ventaData.productos.length === 0) {
      throw new Error("Se requiere al menos un producto")
    }

    const backendData = {
      cliente_id: ventaData.cliente_id || null,
      punto_venta_id: Number(ventaData.punto_venta_id),
      pagos: ventaData.pagos.map((pago) => ({
        monto: Number(pago.monto),
        tipo_pago: pago.tipo_pago,
      })),
      porcentaje_interes: Number(ventaData.porcentaje_interes) || 0,
      porcentaje_descuento: Number(ventaData.porcentaje_descuento) || 0,
      productos: ventaData.productos.map((p) => ({
        id: Number(p.id),
        cantidad: Number(p.cantidad),
        precio: Number(p.precio || p.price),
        descuento: p.descuento || p.discount || null,
      })),
      notas: ventaData.notas || "",
    }

    const response = await fetch(`${API_URL}/ventas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(backendData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Error de conexión" }))
      throw new Error(errorData.message || "Error al crear la venta")
    }

    const result = await response.json()

    // Limpiar cache después de crear venta
    clearVentasCache("ventas_paginadas")
    clearVentasCache("metodos_pago_ventas") // NUEVO: Limpiar cache de métodos de pago

    return result
  } catch (error) {
    console.error("Error en createVenta:", error)
    throw error
  }
}

// MEJORADO: Anular venta con validación
export const anularVenta = async (id, motivo) => {
  try {
    if (!id || isNaN(Number(id))) {
      throw new Error("ID de venta inválido")
    }

    if (!motivo || motivo.trim().length === 0) {
      throw new Error("El motivo de anulación es requerido")
    }

    const response = await fetch(`${API_URL}/ventas/${id}/anular`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ motivo: motivo.trim() }),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Error de conexión" }))
      throw new Error(errorData.message || "Error al anular la venta")
    }

    const result = await response.json()

    // Limpiar cache después de anular venta
    clearVentasCache()

    return result
  } catch (error) {
    console.error("Error en anularVenta:", error)
    throw error
  }
}

// MEJORADO: Estadísticas con validación
export const getEstadisticasVentas = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams()

    if (params.fecha_inicio) {
      queryParams.append("fecha_inicio", params.fecha_inicio)
    }
    if (params.fecha_fin) {
      queryParams.append("fecha_fin", params.fecha_fin)
    }
    if (params.punto_venta_id) {
      queryParams.append("punto_venta_id", params.punto_venta_id.toString())
    }

    const url = `${API_URL}/ventas/estadisticas?${queryParams.toString()}`
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Error de conexión" }))
      throw new Error(errorData.message || "Error al obtener estadísticas de ventas")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error en getEstadisticasVentas:", error)
    throw error
  }
}

// CORREGIDO: Función de adaptación mejorada para el frontend con métodos de pago
export const adaptVentaToFrontend = (venta) => {
  if (!venta || typeof venta !== "object") {
    console.warn("Venta inválida recibida para adaptación:", venta)
    return null
  }

  try {
    return {
      id: Number(venta.id) || 0,
      numeroFactura: venta.numero_factura || "",
      fecha: venta.fecha || "",
      fechaCreacion: venta.fecha_creacion || venta.fecha,
      fechaActualizacion: venta.fecha_actualizacion || null,
      subtotal: Number(venta.subtotal) || 0,
      porcentajeInteres: Number(venta.porcentaje_interes) || 0,
      montoInteres: Number(venta.monto_interes) || 0,
      porcentajeDescuento: Number(venta.porcentaje_descuento) || 0,
      montoDescuento: Number(venta.monto_descuento) || 0,
      total: Number(venta.total) || 0,
      anulada: Boolean(venta.anulada === 1 || venta.anulada === true),
      fechaAnulacion: venta.fecha_anulacion || null,
      motivoAnulacion: venta.motivo_anulacion || null,
      tieneDevoluciones: Boolean(venta.tiene_devoluciones === 1 || venta.tiene_devoluciones === true),
      productosNombres: venta.productos_nombres || "",
      cantidadProductos: Number(venta.cantidad_productos) || 0,

      // CORREGIDO: Información del cliente
      cliente: venta.cliente_id
        ? {
            id: Number(venta.cliente_id),
            nombre: venta.cliente_nombre || "Cliente eliminado",
            telefono: venta.cliente_telefono || null,
          }
        : null,

      // CORREGIDO: Información del usuario
      usuario: {
        id: Number(venta.usuario_id) || 0,
        nombre: venta.usuario_nombre || "Usuario eliminado",
      },

      // CORREGIDO: Información del punto de venta
      puntoVenta: {
        id: Number(venta.punto_venta_id) || 0,
        nombre: venta.punto_venta_nombre || "Punto de venta eliminado",
      },

      // CORREGIDO: Información del tipo de pago general (para compatibilidad)
      tipoPago: {
        nombre: venta.tipo_pago_nombre || "N/A",
      },

      // NUEVO: Información de métodos de pago reales
      metodosPagoReales: venta.metodos_pago_reales || null,
      cantidadMetodosPago: Number(venta.cantidad_metodos_pago) || 0,

      // CORREGIDO: Array de pagos individuales
      pagos: Array.isArray(venta.pagos)
        ? venta.pagos.map((pago) => ({
            id: Number(pago.id) || 0,
            monto: Number(pago.monto) || 0,
            fecha: pago.fecha || "",
            anulado: Boolean(pago.anulado === 1 || pago.anulado === true),
            tipo_pago_nombre: pago.tipo_pago_nombre || pago.tipo_pago || "N/A",
            notas: pago.notas || "",
          }))
        : [],

      // CORREGIDO: Detalles de productos
      detalles: Array.isArray(venta.detalles)
        ? venta.detalles.map((detalle) => ({
            id: Number(detalle.id) || 0,
            producto: {
              id: Number(detalle.producto_id) || 0,
              codigo: detalle.producto_codigo || "N/A",
              nombre: detalle.producto_nombre || "Producto eliminado",
            },
            cantidad: Number(detalle.cantidad) || 0,
            cantidadDevuelta: Number(detalle.cantidad_devuelta) || 0,
            precioUnitario: Number(detalle.precio_unitario) || 0,
            precioConDescuento: Number(detalle.precio_con_descuento) || 0,
            subtotal: Number(detalle.subtotal) || 0,
            devuelto: Boolean(detalle.devuelto === 1 || detalle.devuelto === true),
            es_reemplazo: Boolean(detalle.es_reemplazo === 1 || detalle.es_reemplazo === true),
          }))
        : [],

      notas: venta.notas || "",
    }
  } catch (error) {
    console.error("Error al adaptar venta:", error, venta)
    return null
  }
}

// NUEVO: Función para obtener información del cache
export const getCacheInfo = () => {
  const entries = Array.from(cache.entries()).map(([key, value]) => ({
    key,
    timestamp: value.timestamp,
    age: Date.now() - value.timestamp,
    expired: Date.now() - value.timestamp > CACHE_DURATION,
  }))

  return {
    totalEntries: cache.size,
    entries,
    cacheSize: cache.size,
    cacheDuration: CACHE_DURATION,
  }
}

// NUEVO: Función para limpiar cache expirado
export const cleanExpiredCache = () => {
  const now = Date.now()
  let cleaned = 0

  for (const [key, value] of cache) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key)
      cleaned++
    }
  }

  console.log(`Cache limpiado: ${cleaned} entradas expiradas eliminadas`)
  return cleaned
}

// NUEVA FUNCIÓN: Construir filtros para la consulta
export const buildVentasFilters = (filters) => {
  const cleanFilters = {}

  // Filtro de búsqueda general
  if (filters.search && filters.search.trim()) {
    cleanFilters.search = filters.search.trim()
  }

  // Filtro de punto de venta
  if (filters.punto_venta_id && filters.punto_venta_id !== "todos") {
    cleanFilters.punto_venta_id = filters.punto_venta_id
  }

  // CORREGIDO: Filtro de método de pago
  if (filters.tipo_pago && filters.tipo_pago !== "todos") {
    cleanFilters.tipo_pago = filters.tipo_pago
  }

  // Filtro de anuladas
  if (filters.anuladas !== undefined) {
    cleanFilters.anuladas = filters.anuladas
  }

  // Filtro de producto
  if (filters.producto_id) {
    cleanFilters.producto_id = filters.producto_id
  }

  if (filters.producto_nombre && filters.producto_nombre.trim()) {
    cleanFilters.producto_nombre = filters.producto_nombre.trim()
  }

  // Filtros de fecha
  if (filters.fecha_inicio) {
    cleanFilters.fecha_inicio = filters.fecha_inicio
  }

  if (filters.fecha_fin) {
    cleanFilters.fecha_fin = filters.fecha_fin
  }

  // Filtros de ordenamiento
  if (filters.sort_by) {
    cleanFilters.sort_by = filters.sort_by
  }

  if (filters.sort_order) {
    cleanFilters.sort_order = filters.sort_order
  }

  return cleanFilters
}

// NUEVA FUNCIÓN: Validar filtros antes de enviar
export const validateVentasFilters = (filters) => {
  const errors = []

  // Validar fechas
  if (filters.fecha_inicio && filters.fecha_fin) {
    const fechaInicio = new Date(filters.fecha_inicio)
    const fechaFin = new Date(filters.fecha_fin)

    if (fechaInicio > fechaFin) {
      errors.push("La fecha de inicio no puede ser mayor que la fecha de fin")
    }

    // Validar que no sea un rango muy amplio (más de 1 año)
    const diffTime = Math.abs(fechaFin - fechaInicio)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays > 365) {
      errors.push("El rango de fechas no puede ser mayor a 1 año")
    }
  }

  // Validar punto de venta
  if (filters.punto_venta_id && isNaN(Number(filters.punto_venta_id)) && filters.punto_venta_id !== "todos") {
    errors.push("ID de punto de venta inválido")
  }

  // Validar producto
  if (filters.producto_id && isNaN(Number(filters.producto_id))) {
    errors.push("ID de producto inválido")
  }

  return errors
}
