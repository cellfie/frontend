// reparacionesService.js
const API_URL = "https://api.sistemacellfierm22.site/api"

// Obtener todas las reparaciones
export const getReparaciones = async (params = {}) => {
  try {
    // Construir la URL con los parámetros de búsqueda
    const queryParams = new URLSearchParams()

    if (params.fecha_inicio) queryParams.append("fecha_inicio", params.fecha_inicio)
    if (params.fecha_fin) queryParams.append("fecha_fin", params.fecha_fin)
    if (params.cliente_id) queryParams.append("cliente_id", params.cliente_id)
    if (params.punto_venta_id) queryParams.append("punto_venta_id", params.punto_venta_id)
    if (params.estado) queryParams.append("estado", params.estado)

    const url = `${API_URL}/reparaciones?${queryParams.toString()}`

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener reparaciones")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getReparaciones:", error)
    throw error
  }
}

// Obtener una reparación por ID
export const getReparacionById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/reparaciones/${id}/completa`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener la reparación")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getReparacionById:", error)
    throw error
  }
}

// Crear una nueva reparación
export const createReparacion = async (reparacionData) => {
  try {
    const response = await fetch(`${API_URL}/reparaciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reparacionData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al crear la reparación")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en createReparacion:", error)
    throw error
  }
}

// Actualizar una reparación existente
export const updateReparacion = async (id, reparacionData) => {
  try {
    const response = await fetch(`${API_URL}/reparaciones/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reparacionData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al actualizar la reparación")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en updateReparacion:", error)
    throw error
  }
}

// Actualizar el estado de una reparación
export const updateEstadoReparacion = async (id, estado, notas = "") => {
  try {
    const response = await fetch(`${API_URL}/reparaciones/${id}/estado`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ estado, notas }),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al actualizar el estado de la reparación")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en updateEstadoReparacion:", error)
    throw error
  }
}

// Cancelar una reparación
export const cancelarReparacion = async (id, motivo = "") => {
  try {
    const response = await fetch(`${API_URL}/reparaciones/${id}/cancelar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ motivo }),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al cancelar la reparación")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en cancelarReparacion:", error)
    throw error
  }
}

// Registrar un pago para una reparación
export const registrarPagoReparacion = async (id, pagoData) => {
  try {
    const response = await fetch(`${API_URL}/reparaciones/${id}/pago`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pagoData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al registrar el pago")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en registrarPagoReparacion:", error)
    throw error
  }
}

// Obtener estadísticas de reparaciones
export const getEstadisticasReparaciones = async (params = {}) => {
  try {
    // Construir la URL con los parámetros de búsqueda
    const queryParams = new URLSearchParams()

    if (params.fecha_inicio) queryParams.append("fecha_inicio", params.fecha_inicio)
    if (params.fecha_fin) queryParams.append("fecha_fin", params.fecha_fin)
    if (params.punto_venta_id) queryParams.append("punto_venta_id", params.punto_venta_id)

    const url = `${API_URL}/reparaciones/estadisticas?${queryParams.toString()}`

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener estadísticas de reparaciones")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getEstadisticasReparaciones:", error)
    throw error
  }
}

// Función para adaptar los datos del backend al formato que espera el frontend
export const adaptReparacionToFrontend = (reparacion) => {
  return {
    id: reparacion.id,
    numeroTicket: reparacion.numero_ticket,
    fechaIngreso: reparacion.fecha_ingreso,
    estado: reparacion.estado,
    notas: reparacion.notas || "",
    fechaEntrega: reparacion.fecha_entrega,
    total: reparacion.total || 0,
    totalPagado: reparacion.total_pagado || 0,
    saldoPendiente: reparacion.saldo_pendiente || 0,
    cliente: reparacion.cliente_id
      ? {
          id: reparacion.cliente_id,
          nombre: reparacion.cliente_nombre,
          telefono: reparacion.cliente_telefono,
          dni: reparacion.cliente_dni || "",
        }
      : null,
    usuario: reparacion.usuario_id
      ? {
          id: reparacion.usuario_id,
          nombre: reparacion.usuario_nombre,
        }
      : null,
    puntoVenta: reparacion.punto_venta_id
      ? {
          id: reparacion.punto_venta_id,
          nombre: reparacion.punto_venta_nombre,
        }
      : null,
    equipo: reparacion.equipo
      ? {
          id: reparacion.equipo.id,
          marca: reparacion.equipo.marca,
          modelo: reparacion.equipo.modelo || "",
          imei: reparacion.equipo.imei || "",
          password: reparacion.equipo.password || "",
          descripcion: reparacion.equipo.descripcion || "",
        }
      : null,
    detalles: reparacion.detalles
      ? reparacion.detalles.map((detalle) => ({
          id: detalle.id,
          descripcion: detalle.descripcion,
          precio: detalle.precio,
          completado: detalle.completado === 1,
          fechaCompletado: detalle.fecha_completado,
        }))
      : [],
    pagos: reparacion.pagos
      ? reparacion.pagos.map((pago) => ({
          id: pago.id,
          monto: pago.monto,
          metodoPago: pago.metodo_pago,
          fechaPago: pago.fecha_pago,
          usuarioId: pago.usuario_id,
          usuarioNombre: pago.usuario_nombre || null,
          referenciaCuentaCorriente: pago.referencia_cuenta_corriente,
        }))
      : [],
    historialAcciones: reparacion.historial_acciones
      ? reparacion.historial_acciones.map((accion) => ({
          id: accion.id,
          tipo: accion.tipo_accion,
          usuario: accion.usuario_nombre,
          fecha: accion.fecha,
          hora:
            accion.hora || new Date(accion.fecha).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
          detalles: accion.detalles || "",
        }))
      : [],
  }
}

// Obtener los estados posibles de una reparación
export const getEstadosReparacion = () => {
  return [
    { id: "pendiente", nombre: "Pendiente", color: "bg-orange-500" },
    { id: "terminada", nombre: "Terminada", color: "bg-blue-500" },
    { id: "entregada", nombre: "Entregada", color: "bg-green-500" },
    { id: "cancelada", nombre: "Cancelada", color: "bg-red-500" },
  ]
}

// Obtener los métodos de pago para reparaciones
export const getMetodosPagoReparacion = () => {
  return [
    { id: "efectivo", nombre: "Efectivo" },
    { id: "tarjeta", nombre: "Tarjeta" },
    { id: "transferencia", nombre: "Transferencia" },
    { id: "cuentaCorriente", nombre: "Cuenta Corriente" },
  ]
}

// Añadir una nueva función para obtener el historial de acciones
export const getHistorialAccionesReparacion = async (id) => {
  try {
    const response = await fetch(`${API_URL}/reparaciones/${id}/historial`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener el historial de acciones")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getHistorialAccionesReparacion:", error)
    throw error
  }
}
