const API_URL = "https://api.sistemacellfierm22.site/api"

// FUNCIÓN ACTUALIZADA: Formatear fechas SIN conversión de zona horaria
const formatearFechaArgentina = (fechaString) => {
  if (!fechaString) return ""

  // Crear fecha directamente desde el string de la base de datos
  // Ya no aplicamos conversión de zona horaria porque las fechas se guardan correctamente
  const fecha = new Date(fechaString)

  // Verificar si la fecha es válida
  if (isNaN(fecha.getTime())) return ""

  // Formatear directamente sin conversión de zona horaria
  // porque las fechas ya están guardadas en la zona horaria correcta
  return fecha.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

// Exportar la función para usar en otros componentes
export { formatearFechaArgentina }

// Obtener todas las ventas
export const getVentas = async (params = {}) => {
  try {
    // Construir la URL con los parámetros de búsqueda
    const queryParams = new URLSearchParams()

    if (params.fecha_inicio) queryParams.append("fecha_inicio", params.fecha_inicio)
    if (params.fecha_fin) queryParams.append("fecha_fin", params.fecha_fin)
    if (params.cliente_id) queryParams.append("cliente_id", params.cliente_id)
    if (params.punto_venta_id) queryParams.append("punto_venta_id", params.punto_venta_id)
    if (params.anuladas !== undefined) queryParams.append("anuladas", params.anuladas)

    const url = `${API_URL}/ventas?${queryParams.toString()}`

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener ventas")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getVentas:", error)
    throw error
  }
}

// Obtener una venta por ID
export const getVentaById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/ventas/${id}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener la venta")
    }

    return await response.json()
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
      tipo_pago: ventaData.tipo_pago, // Enviamos el nombre del tipo de pago
      porcentaje_interes: ventaData.porcentaje_interes || 0, // Siempre será 0 ya que el interés es solo visual
      porcentaje_descuento: ventaData.porcentaje_descuento || 0,
      productos: ventaData.productos.map((p) => ({
        id: p.id,
        cantidad: p.cantidad,
        precio: p.precio || p.price,
        descuento: p.descuento || p.discount,
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
    cliente: venta.cliente_id
      ? {
          id: venta.cliente_id,
          nombre: venta.cliente_nombre,
          telefono: venta.cliente_telefono,
        }
      : null,
    usuario: {
      id: venta.usuario_id,
      nombre: venta.usuario_nombre,
    },
    puntoVenta: {
      id: venta.punto_venta_id,
      nombre: venta.punto_venta_nombre,
    },
    tipoPago: {
      nombre: venta.tipo_pago_nombre,
    },
    detalles: venta.detalles
      ? venta.detalles.map((detalle) => ({
          id: detalle.id,
          producto: {
            id: detalle.producto_id,
            codigo: detalle.producto_codigo,
            nombre: detalle.producto_nombre,
          },
          cantidad: detalle.cantidad,
          cantidadDevuelta: detalle.cantidad_devuelta || 0,
          precioUnitario: detalle.precio_unitario,
          precioConDescuento: detalle.precio_con_descuento,
          subtotal: detalle.subtotal,
          devuelto: detalle.devuelto === 1,
        }))
      : [],
  }
}
