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

export const interpretarCierreCaja = (diferencia) => {
  const d = Number(diferencia)
  if (!Number.isFinite(d)) return { tipo: "sin_datos", label: "Sin datos", descripcion: "" }
  if (Math.abs(d) <= DIF_CIERRE_EPS) {
    return {
      tipo: "perfecto",
      label: "Cierre perfecto",
      descripcion: "El dinero contado coincide con el saldo teórico de la caja (movimientos registrados).",
    }
  }
  if (d > 0) {
    return {
      tipo: "sobrante",
      label: "Sobrante",
      descripcion: "Hay más dinero en caja de lo que indican los movimientos registrados.",
    }
  }
  return {
    tipo: "faltante",
    label: "Faltante",
    descripcion: "Falta dinero en caja respecto del saldo teórico según movimientos registrados.",
  }
}
