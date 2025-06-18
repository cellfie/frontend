const API_URL = "https://api.sistemacellfierm22.site/api" 

// Obtener todos los pagos
export const getPagos = async (params = {}) => {
  try {
    // Construir la URL con los parámetros de búsqueda
    const queryParams = new URLSearchParams()

    if (params.fecha_inicio) queryParams.append("fecha_inicio", params.fecha_inicio)
    if (params.fecha_fin) queryParams.append("fecha_fin", params.fecha_fin)
    if (params.cliente_id) queryParams.append("cliente_id", params.cliente_id)
    if (params.punto_venta_id) queryParams.append("punto_venta_id", params.punto_venta_id)
    if (params.tipo_referencia) queryParams.append("tipo_referencia", params.tipo_referencia)
    if (params.anulados !== undefined) queryParams.append("anulados", params.anulados)

    const url = `${API_URL}/pagos?${queryParams.toString()}`

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener pagos")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getPagos:", error)
    throw error
  }
}

// Obtener un pago por ID
export const getPagoById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/pagos/${id}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener el pago")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getPagoById:", error)
    throw error
  }
}

// Crear un nuevo pago
export const createPago = async (pagoData) => {
  try {
    // Asegurarse de que todos los campos necesarios estén presentes
    if (!pagoData.punto_venta_id) {
      pagoData.punto_venta_id = 1 // Punto de venta por defecto
    }

    const response = await fetch(`${API_URL}/pagos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pagoData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al crear el pago")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en createPago:", error)
    throw error
  }
}

// Anular un pago
export const anularPago = async (id, motivo) => {
  try {
    const response = await fetch(`${API_URL}/pagos/${id}/anular`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ motivo }),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al anular el pago")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en anularPago:", error)
    throw error
  }
}

// Obtener tipos de pago
export const getTiposPago = async () => {
  return [
    { id: 1, nombre: "Efectivo", descripcion: "Pago en efectivo" },
    { id: 2, nombre: "Transferencia", descripcion: "Pago por transferencia bancaria" },
    { id: 3, nombre: "Tarjeta de crédito", descripcion: "Pago con tarjeta de crédito" },
    { id: 4, nombre: "Cuenta corriente", descripcion: "Pago con cuenta corriente del cliente" },
  ]
}

// Modificar la función adaptPagoToFrontend para usar el nuevo campo tipo_pago:
export const adaptPagoToFrontend = (pago) => {
  return {
    id: pago.id,
    monto: pago.monto,
    fecha: pago.fecha,
    tipoReferencia: pago.tipo_referencia,
    referenciaId: pago.referencia_id,
    notas: pago.notas,
    anulado: pago.anulado === 1,
    fechaAnulacion: pago.fecha_anulacion,
    motivoAnulacion: pago.motivo_anulacion,
    cliente: pago.cliente_id
      ? {
          id: pago.cliente_id,
          nombre: pago.cliente_nombre,
          telefono: pago.cliente_telefono,
        }
      : null,
    usuario: {
      id: pago.usuario_id,
      nombre: pago.usuario_nombre,
    },
    puntoVenta: {
      id: pago.punto_venta_id,
      nombre: pago.punto_venta_nombre,
    },
    tipoPago: {
      nombre: pago.tipo_pago_nombre,
    },
  }
}
