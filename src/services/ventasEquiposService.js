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

// Obtener todas las ventas de equipos
export const getVentasEquipos = async (params = {}) => {
  try {
    // Construir la URL con los parámetros de búsqueda
    const queryParams = new URLSearchParams()

    if (params.fecha_inicio) queryParams.append("fecha_inicio", params.fecha_inicio)
    if (params.fecha_fin) queryParams.append("fecha_fin", params.fecha_fin)
    if (params.cliente_id) queryParams.append("cliente_id", params.cliente_id)
    if (params.punto_venta_id) queryParams.append("punto_venta_id", params.punto_venta_id)
    if (params.anuladas !== undefined) queryParams.append("anuladas", params.anuladas)

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

// Obtener una venta de equipo por ID
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

// Crear una nueva venta de equipo
export const createVentaEquipo = async (ventaData) => {
  try {
    // Adaptar los datos del frontend al formato que espera el backend
    const backendData = {
      cliente_id: ventaData.cliente_id,
      punto_venta_id: ventaData.punto_venta_id,
      tipo_pago: ventaData.tipo_pago,
      equipo_id: ventaData.equipo_id,
      porcentaje_interes: ventaData.porcentaje_interes || 0,
      porcentaje_descuento: ventaData.porcentaje_descuento || 0,
      plan_canje: ventaData.plan_canje || null,
      notas: ventaData.notas || "",
      tipo_cambio: ventaData.tipo_cambio, // Agregar el tipo de cambio actual
    }

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

// Anular una venta de equipo
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

// Función para adaptar los datos del backend al formato que espera el frontend
export const adaptVentaEquipoToFrontend = (venta) => {
  return {
    id: venta.id,
    numeroFactura: venta.numero_factura,
    fecha: formatearFechaArgentina(venta.fecha), // Usar la función de formateo con corrección de timezone
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
      nombre: venta.tipo_pago,
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
          fechaIngreso: venta.plan_canje.fecha_ingreso,
        }
      : null,
    pagos: venta.pagos
      ? venta.pagos.map((pago) => ({
          id: pago.id,
          monto: pago.monto,
          fecha: formatearFechaArgentina(pago.fecha), // También formatear fechas de pagos
          anulado: pago.anulado === 1,
          tipoPago: {
            nombre: pago.tipo_pago,
          },
        }))
      : [],
  }
}
