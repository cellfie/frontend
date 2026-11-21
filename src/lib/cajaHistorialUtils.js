/** Utilidades compartidas entre Caja (control) e Historial de sesiones. */

export const formatearMonedaARS = (valor) => {
  const numero = Number(valor) || 0
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(numero)
}

export const formatearFechaHora = (fechaString) => {
  if (!fechaString) return ""

  let fecha

  try {
    if (fechaString.includes("T") || fechaString.includes("Z") || fechaString.includes("+")) {
      fecha = new Date(fechaString)
    } else {
      const normalizada = fechaString.replace(" ", "T")
      fecha = new Date(`${normalizada}-03:00`)
    }
  } catch {
    return ""
  }

  if (Number.isNaN(fecha.getTime())) return ""

  return fecha.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

/** Tolerancia en pesos para considerar cierre "perfecto" (redondeos). */
export const DIF_CIERRE_EPS = 0.02

/**
 * Ingresos/egresos de caja_movimientos para el balance de caja.
 * Usa el total global (todos los orígenes) y, si falta, suma movimientos_por_origen.
 * Así un egreso/retiro siempre baja el saldo teórico aunque el origen venga mal.
 */
export const obtenerMovimientosManualesCaja = (totales) => {
  const globalIng = Number(totales?.movimientos?.ingresos) || 0
  const globalEgr = Number(totales?.movimientos?.egresos) || 0
  const porOrigen = totales?.movimientos_por_origen || {}

  let sumaIng = 0
  let sumaEgr = 0
  Object.values(porOrigen).forEach((o) => {
    if (!o || typeof o !== "object") return
    sumaIng += Number(o.ingresos) || 0
    sumaEgr += Number(o.egresos) || 0
  })

  // Preferir el mayor por si alguno de los agregados viene incompleto
  return {
    ingresos: Math.max(globalIng, sumaIng),
    egresos: Math.max(globalEgr, sumaEgr),
  }
}

/** Balance teórico de sesión: apertura + cobros/ventas + ingresos manuales − egresos. */
export const calcularSaldoTeoricoCaja = ({
  montoApertura = 0,
  ventasProductos = 0,
  ventasEquipos = 0,
  reparaciones = 0,
  pagosCuentaCorriente = 0,
  ingresosManuales = 0,
  egresosManuales = 0,
} = {}) =>
  (Number(montoApertura) || 0) +
  (Number(ventasProductos) || 0) +
  (Number(ventasEquipos) || 0) +
  (Number(reparaciones) || 0) +
  (Number(pagosCuentaCorriente) || 0) +
  (Number(ingresosManuales) || 0) -
  (Number(egresosManuales) || 0)

export const interpretarCierreCaja = (diferencia) => {
  const d = Number(diferencia)
  if (!Number.isFinite(d)) return { tipo: "sin_datos", label: "Sin datos", descripcion: "" }
  if (Math.abs(d) <= DIF_CIERRE_EPS) {
    return {
      tipo: "perfecto",
      label: "Cierre perfecto",
      descripcion:
        "El dinero contado coincide con el saldo teórico: apertura más ventas y cobros de la sesión (menos egresos).",
    }
  }
  if (d > 0) {
    return {
      tipo: "sobrante",
      label: "Sobrante",
      descripcion: "Hay más dinero contado que el saldo teórico calculado con el balance total de la sesión.",
    }
  }
  return {
    tipo: "faltante",
    label: "Faltante",
    descripcion: "Falta dinero en caja respecto del saldo teórico (apertura + ingresos − egresos).",
  }
}
