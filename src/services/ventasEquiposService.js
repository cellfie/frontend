const API_URL = "https://api.sistemacellfierm22.site/api"

// Función para formatear fechas de Argentina (suma 3 horas)
const formatearFechaArgentina = (fechaString) => {
  if (!fechaString) return ""

  try {
    let fecha

    if (fechaString.includes("T") || fechaString.includes("+")) {
      fecha = new Date(fechaString)
    } else {
      fecha = new Date(fechaString + " GMT-0300")
    }

    if (isNaN(fecha.getTime())) return ""

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

export const getVentasEquipos = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams()

    if (params.fecha_inicio) queryParams.append("fecha_inicio", params.fecha_inicio)
    if (params.fecha_fin) queryParams.append("fecha_fin", params.fecha_fin)
    if (params.cliente_id) queryParams.append("cliente_id", params.cliente_id)
    if (params.punto_venta_id) queryParams.append("punto_venta_id", params.punto_venta_id)
    if (params.anuladas !== undefined) queryParams.append("anuladas", params.anuladas)
    if (params.estado_pago) queryParams.append("estado_pago", params.estado_pago)

    const url = `${API_URL}/ventas-equipos?${queryParams.toString()}`

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener ventas de equipos")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getVentasEquipos:", error)
    throw error
  }
}

export const getVentaEquipoById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/ventas-equipos/${id}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener la venta de equipo")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getVentaEquipoById:", error)
    throw error
  }
}

// ✅ MEJORA: Crear una nueva venta de equipo con mejor validación de pagos
export const createVentaEquipo = async (ventaData) => {
  try {
    console.log("Datos enviados al backend:", ventaData)

    // ✅ MEJORA: Validación mejorada de pagos múltiples
    if (!ventaData.pagos || !Array.isArray(ventaData.pagos)) {
      throw new Error("Los pagos deben ser un array")
    }

    // Validar que cada pago tenga los campos requeridos
    for (const pago of ventaData.pagos) {
      if (!pago.tipo_pago_nombre) {
        throw new Error("Cada pago debe tener un tipo de pago válido")
      }
      if (!pago.monto_usd || pago.monto_usd <= 0) {
        throw new Error("Cada pago debe tener un monto USD mayor a 0")
      }
    }

    // ✅ MEJORA: Calcular total de pagos y validar
    const totalPagos = ventaData.pagos.reduce((sum, p) => sum + Number(p.monto_usd), 0)
    const diferencia = Math.abs(totalPagos - ventaData.total)

    if (diferencia > 0.01 && !ventaData.marcar_como_incompleta) {
      throw new Error(
        `El total de pagos (${totalPagos.toFixed(2)} USD) no coincide con el total de la venta (${ventaData.total.toFixed(2)} USD)`,
      )
    }

    const backendData = {
      cliente_id: ventaData.cliente_id,
      punto_venta_id: ventaData.punto_venta_id,
      equipo_id: ventaData.equipo_id,
      porcentaje_interes: ventaData.porcentaje_interes || 0,
      porcentaje_descuento: ventaData.porcentaje_descuento || 0,
      plan_canje: ventaData.plan_canje || null,
      notas: ventaData.notas || "",
      tipo_cambio: ventaData.tipo_cambio,
      pagos: ventaData.pagos.map((p) => ({
        monto_usd: p.monto_usd,
        monto_ars: p.monto_ars,
        tipo_pago: p.tipo_pago_nombre,
        notas_pago: p.notas_pago || "",
      })),
      marcar_como_incompleta: ventaData.marcar_como_incompleta || false,
    }

    console.log("Datos adaptados para backend:", backendData)

    const response = await fetch(`${API_URL}/ventas-equipos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al crear la venta de equipo")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en createVentaEquipo:", error)
    throw error
  }
}

export const anularVentaEquipo = async (id, motivo) => {
  try {
    const response = await fetch(`${API_URL}/ventas-equipos/${id}/anular`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ motivo }),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al anular la venta de equipo")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en anularVentaEquipo:", error)
    throw error
  }
}

// Nueva función para registrar un pago adicional a una venta de equipo
export const registrarPagoAdicionalVentaEquipo = async (ventaId, pagoData) => {
  try {
    const response = await fetch(`${API_URL}/ventas-equipos/${ventaId}/pagos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pagoData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al registrar el pago adicional")
    }
    return await response.json()
  } catch (error) {
    console.error("Error en registrarPagoAdicionalVentaEquipo:", error)
    throw error
  }
}

// Función para adaptar los datos del backend al formato que espera el frontend
export const adaptVentaEquipoToFrontend = (venta) => {
  return {
    id: venta.id,
    numeroFactura: venta.numero_factura,
    fecha: formatearFechaArgentina(venta.fecha),
    precioUSD: venta.precio_usd,
    precioARS: venta.precio_ars,
    tipoCambio: venta.tipo_cambio,
    porcentajeInteres: venta.porcentaje_interes,
    montoInteres: venta.monto_interes,
    porcentajeDescuento: venta.porcentaje_descuento,
    montoDescuento: venta.monto_descuento,
    totalUSD: venta.total_usd,
    totalARS: venta.total_ars,
    anulada: venta.anulada === 1,
    fechaAnulacion: venta.fecha_anulacion ? formatearFechaArgentina(venta.fecha_anulacion) : null,
    motivoAnulacion: venta.motivo_anulacion,
    estadoPago: venta.estado_pago,
    montoPagadoUSD: venta.monto_pagado_usd,
    montoPagadoARS: venta.monto_pagado_ars,
    saldoPendienteUSD: venta.saldo_pendiente_usd,
    saldoPendienteARS: venta.saldo_pendiente_ars,
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
    equipo: {
      id: venta.equipo_id,
      marca: venta.marca,
      modelo: venta.modelo,
      memoria: venta.memoria,
      color: venta.color,
      bateria: venta.bateria,
      descripcion: venta.descripcion,
      imei: venta.imei,
      tipoCambio: venta.equipo_tipo_cambio,
      tipoCambioOriginal: venta.equipo_tipo_cambio_original,
    },
    planCanje: venta.plan_canje
      ? {
          id: venta.plan_canje.id,
          marca: venta.plan_canje.marca,
          modelo: venta.plan_canje.modelo,
          memoria: venta.plan_canje.memoria,
          color: venta.plan_canje.color,
          bateria: venta.plan_canje.bateria,
          precio: venta.plan_canje.precio,
          descripcion: venta.plan_canje.descripcion,
          imei: venta.plan_canje.imei,
          fechaIngreso: venta.plan_canje.fecha_ingreso ? formatearFechaArgentina(venta.plan_canje.fecha_ingreso) : null,
        }
      : null,
    pagos: venta.pagos_info
      ? venta.pagos_info.map((pago) => ({
          id: pago.id,
          montoUSD: pago.monto_usd,
          montoARS: pago.monto_ars,
          fecha: formatearFechaArgentina(pago.fecha),
          anulado: pago.anulado === 1,
          tipoPago: pago.tipo_pago,
          notas: pago.notas,
          puntoVentaNombre: pago.punto_venta_nombre,
          usuarioNombre: pago.usuario_nombre,
        }))
      : [],
    notas: venta.notas,
  }
}
