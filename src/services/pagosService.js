const API_URL = "https://api.sistemacellfierm22.site/api"

// Obtener todos los pagos
export const getPagos = async (params = {}) => {
  try {
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
    if (!pagoData.punto_venta_id) {
      pagoData.punto_venta_id = 1
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

// ✅ MEJORA: Obtener tipos de pago desde la API
export const getTiposPago = async () => {
  try {
    const response = await fetch(`${API_URL}/ventas-equipos/tipos-pago`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      console.warn("API de tipos de pago no disponible, usando valores por defecto")
      return [
        { id: 1, nombre: "Efectivo", descripcion: "Pago en efectivo", requiere_cliente: false },
        { id: 2, nombre: "Transferencia", descripcion: "Pago por transferencia bancaria", requiere_cliente: false },
        { id: 3, nombre: "Tarjeta de crédito", descripcion: "Pago con tarjeta de crédito", requiere_cliente: false },
        { id: 4, nombre: "Tarjeta de débito", descripcion: "Pago con tarjeta de débito", requiere_cliente: false },
        {
          id: 5,
          nombre: "Cuenta corriente",
          descripcion: "Pago con cuenta corriente del cliente",
          requiere_cliente: true,
        },
      ]
    }

    return await response.json()
  } catch (error) {
    console.error("Error al obtener tipos de pago:", error)
    return [
      { id: 1, nombre: "Efectivo", descripcion: "Pago en efectivo", requiere_cliente: false },
      { id: 2, nombre: "Transferencia", descripcion: "Pago por transferencia bancaria", requiere_cliente: false },
      { id: 3, nombre: "Tarjeta de crédito", descripcion: "Pago con tarjeta de crédito", requiere_cliente: false },
      { id: 4, nombre: "Tarjeta de débito", descripcion: "Pago con tarjeta de débito", requiere_cliente: false },
      {
        id: 5,
        nombre: "Cuenta corriente",
        descripcion: "Pago con cuenta corriente del cliente",
        requiere_cliente: true,
      },
    ]
  }
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
