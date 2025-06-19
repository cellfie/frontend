const API_URL = "https://api.sistemacellfierm22.site/api"

// Cache simple para ventas
const cache = new Map()
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutos (menos que productos por ser más dinámico)

const formatearFechaArgentina = (fechaString) => {
  if (!fechaString) return ""

  try {
    // Manejar fechas que vienen de la base de datos
    let fecha

    if (fechaString.includes("T") || fechaString.includes("+")) {
      // La fecha ya tiene información de timezone
      fecha = new Date(fechaString)
    } else {
      // La fecha viene sin timezone desde MySQL, asumimos que está en Argentina
      // Agregamos el offset de Argentina (-03:00)
      fecha = new Date(fechaString + " GMT-0300")
    }

    if (isNaN(fecha.getTime())) return ""

    // SOLUCIÓN: Sumar 3 horas para corregir el desfase
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

// Exportar la función para usar en otros componentes
export { formatearFechaArgentina }

// NUEVA FUNCIÓN: Obtener ventas con paginación optimizada
export const getVentasPaginadas = async (page = 1, limit = 50, filters = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    })

    const cacheKey = `ventas_${queryParams.toString()}`

    // Verificar cache
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

    // Guardar en cache
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    })

    return data
  } catch (error) {
    console.error("Error en getVentasPaginadas:", error)
    throw error
  }
}

// NUEVA FUNCIÓN: Búsqueda rápida de ventas optimizada
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

// NUEVA FUNCIÓN: Búsqueda de ventas por producto
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

// Limpiar cache cuando sea necesario
export const clearVentasCache = () => {
  cache.clear()
}

// Obtener todas las ventas (optimizado para usar paginación)
export const getVentas = async (filters = {}) => {
  try {
    // Para mantener compatibilidad, obtener una página grande
    const result = await getVentasPaginadas(1, 1000, filters)
    return result.ventas || []
  } catch (error) {
    console.error("Error en getVentas:", error)
    throw error
  }
}

// Obtener una venta por ID
export const getVentaById = async (id) => {
  try {
    const cacheKey = `venta_${id}`

    // Verificar cache
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

    // Guardar en cache
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    })

    return data
  } catch (error) {
    console.error("Error en getVentaById:", error)
    throw error
  }
}

// Obtener devoluciones de una venta
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

// Crear una nueva venta
export const createVenta = async (ventaData) => {
  try {
    // Adaptar los datos del frontend al formato que espera el backend
    const backendData = {
      cliente_id: ventaData.cliente_id,
      punto_venta_id: ventaData.punto_venta_id,
      porcentaje_interes: ventaData.porcentaje_interes || 0,
      porcentaje_descuento: ventaData.porcentaje_descuento || 0,
      notas: ventaData.notas || "",
      productos: ventaData.productos.map((p) => ({
        id: p.id,
        cantidad: p.cantidad,
        precio: p.precio || p.price,
        descuento: p.descuento || p.discount,
      })),
      // MODIFICACIÓN: Enviar el array de pagos en lugar de un tipo_pago único
      pagos: ventaData.pagos.map((pago) => ({
        tipo_pago: pago.tipo_pago_nombre, // El backend espera el nombre del tipo de pago
        monto: pago.monto,
      })),
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

    // Limpiar cache después de crear
    clearVentasCache()

    return await response.json()
  } catch (error) {
    console.error("Error en createVenta:", error)
    throw error
  }
}

// Anular una venta
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

    // Limpiar cache después de anular
    clearVentasCache()

    return await response.json()
  } catch (error) {
    console.error("Error en anularVenta:", error)
    throw error
  }
}

// Obtener estadísticas de ventas
export const getEstadisticasVentas = async (params = {}) => {
  try {
    // Construir la URL con los parámetros de búsqueda
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

// Función para adaptar los datos del backend al formato que espera el frontend
export const adaptVentaToFrontend = (venta) => {
  return {
    id: venta.id,
    numeroFactura: venta.numero_factura,
    fecha: venta.fecha,
    fechaCreacion: venta.fecha_creacion,
    fechaActualizacion: venta.fecha_actualizacion,
    subtotal: venta.subtotal,
    porcentajeInteres: venta.porcentaje_interes,
    montoInteres: venta.monto_interes,
    porcentajeDescuento: venta.porcentaje_descuento,
    montoDescuento: venta.monto_descuento,
    total: venta.total,
    anulada: venta.anulada === 1,
    fechaAnulacion: venta.fecha_anulacion,
    motivoAnulacion: venta.motivo_anulacion,
    tieneDevoluciones: venta.tiene_devoluciones === 1,
    productosNombres: venta.productos_nombres,
    cantidadProductos: venta.cantidad_productos,
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
    // MODIFICACIÓN: Ahora el backend devuelve los pagos en un array
    pagos: venta.pagos
      ? venta.pagos.map((pago) => ({
          id: pago.id,
          monto: pago.monto,
          tipo_pago_nombre: pago.tipo_pago_nombre,
        }))
      : [],
    // Mantenemos tipoPago por compatibilidad, pero ahora puede ser "Múltiple"
    tipoPago: {
      nombre: venta.tipo_pago_nombre || "N/A",
    },
    detalles: venta.detalles
      ? venta.detalles.map((detalle) => ({
          id: detalle.id,
          producto: {
            id: detalle.producto_id,
            codigo: detalle.producto_codigo || "N/A",
            nombre: detalle.producto_nombre || "Producto eliminado",
          },
          cantidad: detalle.cantidad,
          cantidadDevuelta: detalle.cantidad_devuelta || 0,
          precioUnitario: detalle.precio_unitario,
          precioConDescuento: detalle.precio_con_descuento,
          subtotal: detalle.subtotal,
          devuelto: detalle.devuelto === 1,
          es_reemplazo: detalle.es_reemplazo === 1,
        }))
      : [],
  }
}
