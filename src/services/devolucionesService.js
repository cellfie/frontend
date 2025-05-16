const API_URL = "http://localhost:4486/api"

// Obtener todas las devoluciones con filtros opcionales
export const getDevoluciones = async (params = {}) => {
  try {
    // Construir la URL con los parámetros de búsqueda
    const queryParams = new URLSearchParams()

    if (params.fecha_inicio) queryParams.append("fecha_inicio", params.fecha_inicio)
    if (params.fecha_fin) queryParams.append("fecha_fin", params.fecha_fin)
    if (params.cliente_id) queryParams.append("cliente_id", params.cliente_id)
    if (params.punto_venta_id) queryParams.append("punto_venta_id", params.punto_venta_id)

    const url = `${API_URL}/devoluciones?${queryParams.toString()}`

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener devoluciones")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getDevoluciones:", error)
    throw error
  }
}

// Modificar la función getDevolucionesByVenta para manejar mejor la respuesta
export const getDevolucionesByVenta = async (ventaId) => {
  try {
    const response = await fetch(`${API_URL}/ventas/${ventaId}/devoluciones`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener devoluciones de la venta")
    }

    const devoluciones = await response.json()

    // Asegurarse de que los productos devueltos tengan la propiedad es_reemplazo
    return devoluciones.map((devolucion) => ({
      ...devolucion,
      productos_devueltos: devolucion.productos_devueltos.map((prod) => ({
        ...prod,
        es_reemplazo: prod.es_reemplazo === 1,
      })),
    }))
  } catch (error) {
    console.error("Error en getDevolucionesByVenta:", error)
    throw error
  }
}

// Obtener una devolución por ID
export const getDevolucionById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/devoluciones/${id}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener la devolución")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getDevolucionById:", error)
    throw error
  }
}

// Modificar la función createDevolucion para manejar productos de reemplazo
export const createDevolucion = async (devolucionData) => {
  try {
    // Asegurarse de que los productos devueltos tengan la propiedad es_reemplazo correctamente formateada
    // y que incluyan el producto_id
    const dataToSend = {
      ...devolucionData,
      productos_devueltos: devolucionData.productos_devueltos.map((prod) => ({
        producto_id: prod.producto_id || prod.id, // Asegurarse de que producto_id esté presente
        cantidad: prod.cantidad,
        tipo_devolucion: prod.tipo_devolucion || devolucionData.tipoDevolucion,
        es_reemplazo: prod.esReemplazo ? 1 : 0, // Cambiar esReemplazo a es_reemplazo
        detalle_venta_id: prod.detalleVentaId || null, // Asegurar que se envíe el ID del detalle de venta
      })),
    }

    console.log("Datos enviados al servidor:", JSON.stringify(dataToSend, null, 2))

    const response = await fetch(`${API_URL}/devoluciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al crear la devolución")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en createDevolucion:", error)
    throw error
  }
}

// Anular una devolución
export const anularDevolucion = async (id, motivo) => {
  try {
    const response = await fetch(`${API_URL}/devoluciones/${id}/anular`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ motivo }),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al anular la devolución")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en anularDevolucion:", error)
    throw error
  }
}

// Adaptar devolución para el frontend
export const adaptDevolucionToFrontend = (devolucion) => {
  return {
    id: devolucion.id,
    venta_id: devolucion.venta_id,
    fecha: devolucion.fecha,
    usuario_id: devolucion.usuario_id,
    usuario_nombre: devolucion.usuario_nombre,
    cliente_id: devolucion.cliente_id,
    cliente_nombre: devolucion.cliente_nombre,
    diferencia: devolucion.diferencia,
    tipo_pago: devolucion.tipo_pago,
    productos_devueltos: devolucion.productos_devueltos.map((prod) => ({
      id: prod.producto_id,
      producto_id: prod.producto_id,
      nombre: prod.producto_nombre,
      producto_nombre: prod.producto_nombre,
      cantidad: prod.cantidad,
      precio: prod.precio,
      tipo_devolucion: prod.tipo_devolucion,
      es_reemplazo: prod.es_reemplazo === 1,
    })),
    productos_reemplazo: devolucion.productos_reemplazo.map((prod) => ({
      id: prod.producto_id,
      producto_id: prod.producto_id,
      nombre: prod.producto_nombre,
      producto_nombre: prod.producto_nombre,
      cantidad: prod.cantidad,
      precio: prod.precio,
    })),
  }
}
