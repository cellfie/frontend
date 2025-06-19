const API_URL = "https://api.sistemacellfierm22.site/api"

// Cache simple para ventas
const cache = new Map()
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutos

const formatearFechaArgentina = (fechaString) => {
  if (!fechaString) return ""

  try {
    let fecha
    if (fechaString.includes("T") || fechaString.includes("+")) {
      fecha = new Date(fechaString)
    } else {
      // Asumir que si no tiene T o +, es una fecha que podría necesitar ajuste de zona horaria local
      // Esta lógica puede ser compleja dependiendo del formato exacto que envíe el backend
      // Si el backend envía fechas en UTC, new Date() las interpretará correctamente.
      // Si el backend envía fechas ya en "hora local" pero sin info de zona, puede haber problemas.
      // La corrección de +3 horas aquí es una solución específica que podría no ser universal.
      fecha = new Date(fechaString + " GMT-0300") // Intenta forzar GMT-3 si es una fecha simple
    }

    if (isNaN(fecha.getTime())) return ""
    // La corrección de +3 horas aquí podría ser redundante o incorrecta si la fecha ya está bien.
    // Es mejor que el backend envíe fechas en ISO 8601 (con 'Z' o offset)
    // y que el frontend las formatee sin manipulaciones de horas manuales.
    // fecha.setHours(fecha.getHours() + 3); // Comentado para revisión, puede causar doble ajuste.

    return fecha.toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires", // Asegura la zona horaria correcta para la visualización
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

export const getVentasPaginadas = async (page = 1, limit = 50, filters = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    })

    const cacheKey = `ventas_${queryParams.toString()}`
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data
      }
    }

    const response = await fetch(`${API_URL}/ventas/paginadas?${queryParams}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener ventas paginadas")
    }

    const data = await response.json()
    cache.set(cacheKey, { data, timestamp: Date.now() })
    return data
  } catch (error) {
    console.error("Error en getVentasPaginadas:", error)
    throw error
  }
}

export const searchVentasRapido = async (query) => {
  try {
    if (!query || query.length < 2) {
      return []
    }

    const response = await fetch(`${API_URL}/ventas/search-rapido?q=${encodeURIComponent(query)}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error en búsqueda rápida de ventas")
    }
    return await response.json()
  } catch (error) {
    console.error("Error en searchVentasRapido:", error)
    throw error
  }
}

export const searchVentasByProducto = async (productoQuery) => {
  try {
    if (!productoQuery || productoQuery.length < 2) {
      return []
    }

    const response = await fetch(
      `${API_URL}/ventas/search-by-producto?producto_query=${encodeURIComponent(productoQuery)}`,
      {
        method: "GET",
        credentials: "include",
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error en búsqueda de ventas por producto")
    }
    return await response.json()
  } catch (error) {
    console.error("Error en searchVentasByProducto:", error)
    throw error
  }
}

export const clearVentasCache = () => {
  cache.clear()
}

export const getVentas = async (filters = {}) => {
  try {
    const result = await getVentasPaginadas(1, 1000, filters)
    return result.ventas || []
  } catch (error) {
    console.error("Error en getVentas:", error)
    throw error
  }
}

export const getVentaById = async (id) => {
  try {
    const cacheKey = `venta_${id}`
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data
      }
    }

    const response = await fetch(`${API_URL}/ventas/${id}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener la venta")
    }

    const data = await response.json()
    cache.set(cacheKey, { data, timestamp: Date.now() })
    return data
  } catch (error) {
    console.error("Error en getVentaById:", error)
    throw error
  }
}

export const getDevolucionesByVenta = async (id) => {
  try {
    const response = await fetch(`${API_URL}/ventas/${id}/devoluciones`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener devoluciones de la venta")
    }
    return await response.json()
  } catch (error) {
    console.error("Error en getDevolucionesByVenta:", error)
    throw error
  }
}

export const createVenta = async (ventaData) => {
  try {
    const backendData = {
      cliente_id: ventaData.cliente_id,
      punto_venta_id: ventaData.punto_venta_id,
      pagos: ventaData.pagos,
      porcentaje_interes: ventaData.porcentaje_interes || 0,
      porcentaje_descuento: ventaData.porcentaje_descuento || 0,
      productos: ventaData.productos.map((p) => ({
        id: p.id,
        cantidad: p.cantidad,
        precio: p.precio || p.price,
        descuento: p.descuento || p.discount,
      })),
      notas: ventaData.notas || "",
    }

    const response = await fetch(`${API_URL}/ventas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al crear la venta")
    }

    clearVentasCache()
    return await response.json()
  } catch (error) {
    console.error("Error en createVenta:", error)
    throw error
  }
}

export const anularVenta = async (id, motivo) => {
  try {
    const response = await fetch(`${API_URL}/ventas/${id}/anular`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ motivo }),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al anular la venta")
    }

    clearVentasCache()
    return await response.json()
  } catch (error) {
    console.error("Error en anularVenta:", error)
    throw error
  }
}

export const getEstadisticasVentas = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (params.fecha_inicio) queryParams.append("fecha_inicio", params.fecha_inicio)
    if (params.fecha_fin) queryParams.append("fecha_fin", params.fecha_fin)
    if (params.punto_venta_id) queryParams.append("punto_venta_id", params.punto_venta_id)

    const url = `${API_URL}/ventas/estadisticas?${queryParams.toString()}`
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener estadísticas de ventas")
    }
    return await response.json()
  } catch (error) {
    console.error("Error en getEstadisticasVentas:", error)
    throw error
  }
}

export const adaptVentaToFrontend = (venta) => {
  return {
    id: venta.id,
    numeroFactura: venta.numero_factura,
    fecha: venta.fecha,
    fechaCreacion: venta.fecha_creacion,
    fechaActualizacion: venta.fecha_actualizacion,
    subtotal: Number.parseFloat(venta.subtotal) || 0,
    porcentajeInteres: Number.parseFloat(venta.porcentaje_interes) || 0,
    montoInteres: Number.parseFloat(venta.monto_interes) || 0,
    porcentajeDescuento: Number.parseFloat(venta.porcentaje_descuento) || 0,
    montoDescuento: Number.parseFloat(venta.monto_descuento) || 0,
    total: Number.parseFloat(venta.total) || 0,
    anulada: venta.anulada === 1 || venta.anulada === true,
    fechaAnulacion: venta.fecha_anulacion,
    motivoAnulacion: venta.motivo_anulacion,
    tieneDevoluciones: venta.tiene_devoluciones === 1 || venta.tiene_devoluciones === true,
    productosNombres: venta.productos_nombres,
    cantidadProductos: Number.parseInt(venta.cantidad_productos, 10) || 0,
    cliente: venta.cliente_id
      ? {
          id: venta.cliente_id,
          nombre: venta.cliente_nombre || "Cliente eliminado",
          telefono: venta.cliente_telefono,
        }
      : null,
    usuario: {
      id: venta.usuario_id || 0,
      nombre: venta.usuario_nombre || "Usuario eliminado",
    },
    puntoVenta: {
      id: venta.punto_venta_id || 0,
      nombre: venta.punto_venta_nombre || "Punto de venta eliminado",
    },
    tipoPago: {
      nombre: venta.tipo_pago_nombre || "N/A", // Este es el nombre general de la venta (ej. "Múltiple")
    },
    // CORRECCIÓN AQUÍ: Cambiar 'tipoPagoNombre' a 'tipo_pago_nombre'
    pagos: Array.isArray(venta.pagos)
      ? venta.pagos.map((pago) => ({
          id: pago.id,
          monto: Number.parseFloat(pago.monto) || 0,
          fecha: pago.fecha,
          anulado: pago.anulado === 1 || pago.anulado === true,
          tipo_pago_nombre: pago.tipo_pago_nombre || "N/A", // Asegura que el nombre de la propiedad sea el esperado
        }))
      : [],
    detalles: Array.isArray(venta.detalles)
      ? venta.detalles.map((detalle) => ({
          id: detalle.id,
          producto: {
            id: detalle.producto_id,
            codigo: detalle.producto_codigo || "N/A",
            nombre: detalle.producto_nombre || "Producto eliminado",
          },
          cantidad: Number.parseInt(detalle.cantidad, 10) || 0,
          cantidadDevuelta: Number.parseInt(detalle.cantidad_devuelta, 10) || 0,
          precioUnitario: Number.parseFloat(detalle.precio_unitario) || 0,
          precioConDescuento: Number.parseFloat(detalle.precio_con_descuento) || 0,
          subtotal: Number.parseFloat(detalle.subtotal) || 0,
          devuelto: detalle.devuelto === 1 || detalle.devuelto === true,
          es_reemplazo: detalle.es_reemplazo === 1 || detalle.es_reemplazo === true,
        }))
      : [],
    notas: venta.notas || "",
  }
}
