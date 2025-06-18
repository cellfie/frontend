const API_URL = "https://api.sistemacellfierm22.site/api"

// Función para formatear fechas de Argentina (suma 3 horas)
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

    // Sumar 3 horas para corregir el desfase
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
// Obtener todas las ventas de equipos (sin cambios funcionales directos aquí, pero los datos devueltos por el backend sí cambiaron)
export const getVentasEquipos = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (params.fecha_inicio) queryParams.append("fecha_inicio", params.fecha_inicio)
    if (params.fecha_fin) queryParams.append("fecha_fin", params.fecha_fin)
    if (params.cliente_id) queryParams.append("cliente_id", params.cliente_id)
    if (params.punto_venta_id) queryParams.append("punto_venta_id", params.punto_venta_id)
    if (params.anuladas !== undefined) queryParams.append("anuladas", params.anuladas)

    const url = `${API_URL}/ventas-equipos?${queryParams.toString()}`
    const response = await fetch(url, { method: "GET", credentials: "include" })
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

// Obtener una venta de equipo por ID (sin cambios funcionales directos aquí, pero los datos devueltos por el backend sí cambiaron)
export const getVentaEquipoById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/ventas-equipos/${id}`, { method: "GET", credentials: "include" })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener la venta de equipo")
    }
    return await response.json() // El backend ahora devuelve un array 'pagos' detallado
  } catch (error) {
    console.error("Error en getVentaEquipoById:", error)
    throw error
  }
}

// Crear una nueva venta de equipo (MODIFICADO)
export const createVentaEquipo = async (ventaData) => {
  try {
    // 'ventaData' ahora debe incluir un array 'pagos'
    // Ejemplo de ventaData esperado desde el formulario:
    // {
    //   cliente_id: 1,
    //   punto_venta_id: 1,
    //   equipo_id: 1,
    //   porcentaje_interes: 0,
    //   porcentaje_descuento: 0,
    //   plan_canje: null, // o { marca: 'Samsung', modelo: 'S10', precio: 100, ... }
    //   notas: "Alguna nota",
    //   pagos: [
    //     { tipo_pago: 'efectivo', monto_usd: 50, monto_ars: 50000, tipo_cambio_pago: 1000, descripcion: 'Pago en efectivo' },
    //     { tipo_pago: 'tarjeta', monto_usd: 30, monto_ars: 30000, tipo_cambio_pago: 1000, descripcion: 'Visa terminada en 1234' }
    //   ]
    // }

    // Ya no se envía 'tipo_pago' ni 'tipo_cambio' a nivel raíz de la venta.
    // El backend calculará el tipo_cambio de la venta y los totales.
    // Los pagos individuales llevan su propio 'tipo_cambio_pago'.
    const backendData = {
      cliente_id: ventaData.cliente_id,
      punto_venta_id: ventaData.punto_venta_id,
      equipo_id: ventaData.equipo_id,
      porcentaje_interes: ventaData.porcentaje_interes || 0,
      porcentaje_descuento: ventaData.porcentaje_descuento || 0,
      plan_canje: ventaData.plan_canje || null,
      notas: ventaData.notas || "",
      pagos: ventaData.pagos, // Enviar el array de pagos directamente
    }

    const response = await fetch(`${API_URL}/ventas-equipos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

// Anular una venta de equipo (sin cambios)
export const anularVentaEquipo = async (id, motivo) => {
  try {
    const response = await fetch(`${API_URL}/ventas-equipos/${id}/anular`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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

// Función para adaptar los datos del backend al formato que espera el frontend (MODIFICADO)
export const adaptVentaEquipoToFrontend = (venta) => {
  if (!venta) return null

  return {
    id: venta.id,
    numeroFactura: venta.numero_factura,
    fecha: formatearFechaArgentina(venta.fecha),
    precioUSD: venta.precio_usd,
    precioARS: venta.precio_ars,
    tipoCambio: venta.tipo_cambio, // Tipo de cambio general de la venta
    porcentajeInteres: venta.porcentaje_interes,
    montoInteres: venta.monto_interes,
    porcentajeDescuento: venta.porcentaje_descuento,
    montoDescuento: venta.monto_descuento,
    totalUSD: venta.total_usd,
    totalARS: venta.total_ars,
    anulada: venta.anulada === 1 || venta.anulada === true, // Asegurar que sea booleano
    fechaAnulacion: venta.fecha_anulacion ? formatearFechaArgentina(venta.fecha_anulacion) : null,
    motivoAnulacion: venta.motivo_anulacion,
    multiplesPagos: venta.multiples_pagos === 1 || venta.multiples_pagos === true, // Nueva propiedad
    estadoPago: venta.estado_pago, // Nueva propiedad
    totalPagadoUSD: venta.total_pagado_usd, // Nueva propiedad
    totalPagadoARS: venta.total_pagado_ars, // Nueva propiedad
    saldoPendienteUSD: venta.saldo_pendiente_usd, // Nueva propiedad
    saldoPendienteARS: venta.saldo_pendiente_ars, // Nueva propiedad
    fechaUltimoPago: venta.fecha_ultimo_pago ? formatearFechaArgentina(venta.fecha_ultimo_pago) : null, // Nueva propiedad
    notas: venta.notas,
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
    // 'tipoPago' a nivel raíz ya no existe, se maneja dentro de 'pagos'
    equipo: venta.equipo_id // Asegurarse que el backend siempre envíe los datos del equipo
      ? {
          id: venta.equipo_id,
          marca: venta.marca,
          modelo: venta.modelo,
          memoria: venta.memoria,
          color: venta.color,
          bateria: venta.bateria,
          descripcion: venta.equipo_descripcion, // Asegurarse que el alias sea consistente
          imei: venta.imei,
          tipoCambio: venta.equipo_tipo_cambio,
          tipoCambioOriginal: venta.equipo_tipo_cambio_original,
        }
      : null,
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
    // Adaptar el array de pagos detallado
    pagos: Array.isArray(venta.pagos)
      ? venta.pagos.map((pago) => ({
          id: pago.id,
          tipoPago: pago.tipo_pago, // El backend ahora devuelve el string directamente
          montoUSD: pago.monto_usd,
          montoARS: pago.monto_ars,
          tipoCambioPago: pago.tipo_cambio_pago, // Tipo de cambio específico del pago
          descripcion: pago.descripcion,
          fechaPago: formatearFechaArgentina(pago.fecha_pago),
          // movimientoCuentaId: pago.movimiento_cuenta_id, // Opcional si se necesita en el frontend
        }))
      : [],
  }
}