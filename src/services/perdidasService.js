const API_URL = "http://localhost:4486/api"

// Obtener todas las pérdidas con filtros opcionales
export const getPerdidas = async (params = {}) => {
  try {
    // Construir la URL con los parámetros de búsqueda
    const queryParams = new URLSearchParams()

    if (params.fecha_inicio) queryParams.append("fecha_inicio", params.fecha_inicio)
    if (params.fecha_fin) queryParams.append("fecha_fin", params.fecha_fin)
    if (params.producto_id) queryParams.append("producto_id", params.producto_id)
    if (params.repuesto_id) queryParams.append("repuesto_id", params.repuesto_id)
    if (params.tipo) queryParams.append("tipo", params.tipo)

    const url = `${API_URL}/perdidas?${queryParams.toString()}`

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener pérdidas")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getPerdidas:", error)
    throw error
  }
}

// Obtener una pérdida por ID
export const getPerdidaById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/perdidas/${id}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener la pérdida")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getPerdidaById:", error)
    throw error
  }
}

// Crear una nueva pérdida manual
export const createPerdidaManual = async (perdidaData) => {
  try {
    // Asegurarse de que los datos estén en el formato correcto
    const dataToSend = {
      tipo: perdidaData.tipo || "producto",
      cantidad: perdidaData.cantidad,
      motivo: perdidaData.motivo,
      punto_venta_id: perdidaData.punto_venta_id
    }
    
    // Agregar el ID correspondiente según el tipo
    if (perdidaData.tipo === "producto") {
      dataToSend.producto_id = perdidaData.producto_id;
    } else if (perdidaData.tipo === "repuesto") {
      dataToSend.repuesto_id = perdidaData.repuesto_id;
    }

    const response = await fetch(`${API_URL}/perdidas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al crear la pérdida")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en createPerdidaManual:", error)
    throw error
  }
}

// Eliminar una pérdida
export const deletePerdida = async (id) => {
  try {
    const response = await fetch(`${API_URL}/perdidas/${id}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al eliminar la pérdida")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en deletePerdida:", error)
    throw error
  }
}

// Adaptar pérdida para el frontend
export const adaptPerdidaToFrontend = (perdida) => {
  return {
    id: perdida.id,
    tipo: perdida.tipo || "producto",
    producto_id: perdida.producto_id,
    producto_codigo: perdida.producto_codigo,
    producto_nombre: perdida.producto_nombre,
    repuesto_id: perdida.repuesto_id,
    repuesto_codigo: perdida.repuesto_codigo,
    repuesto_nombre: perdida.repuesto_nombre,
    cantidad: perdida.cantidad,
    motivo: perdida.motivo,
    devolucion_id: perdida.devolucion_id,
    usuario_id: perdida.usuario_id,
    usuario_nombre: perdida.usuario_nombre,
    fecha: perdida.fecha,
    punto_venta_id: perdida.punto_venta_id,
    punto_venta_nombre: perdida.punto_venta_nombre,
  }
}