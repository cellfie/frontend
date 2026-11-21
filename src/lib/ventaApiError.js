/** Timeout por defecto al guardar una venta (ms). */
export const VENTA_FETCH_TIMEOUT_MS = 20000

/**
 * Clasifica errores de guardado de venta para mensajes claros al usuario.
 * @returns {{ kind: 'network'|'timeout'|'uncertain'|'server'|'validation'|'unknown', message: string, noGuardada: boolean, estadoIncierto: boolean }}
 */
export function normalizarErrorGuardadoVenta(error, { entidad = "venta" } = {}) {
  const raw = String(error?.message || error || "")
  const lower = raw.toLowerCase()
  const nombre = entidad === "equipo" ? "venta de equipo" : "venta"

  if (
    error?.name === "AbortError" ||
    lower.includes("aborted") ||
    lower.includes("timeout") ||
    lower.includes("timed out")
  ) {
    return {
      kind: "uncertain",
      message: `No pudimos confirmar si la ${nombre} se guardó (tiempo de espera agotado). Revisá el Historial antes de volver a intentar. No asumas que se guardó.`,
      noGuardada: false,
      estadoIncierto: true,
    }
  }

  if (
    error instanceof TypeError ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("load failed") ||
    (typeof navigator !== "undefined" && navigator.onLine === false)
  ) {
    return {
      kind: "network",
      message: `Sin conexión con el servidor. La ${nombre} NO se guardó. Verificá internet e intentá de nuevo.`,
      noGuardada: true,
      estadoIncierto: false,
    }
  }

  if (lower.includes("error de conexión") || lower.includes("unexpected token")) {
    return {
      kind: "server",
      message: `No se pudo comunicar con el servidor. La ${nombre} NO se guardó.`,
      noGuardada: true,
      estadoIncierto: false,
    }
  }

  const msgServidor = raw && !lower.startsWith("error al") ? raw : null
  return {
    kind: "server",
    message: msgServidor
      ? `La ${nombre} NO se guardó: ${msgServidor}`
      : `La ${nombre} NO se guardó. Intentá de nuevo.`,
    noGuardada: true,
    estadoIncierto: false,
  }
}

/**
 * fetch con timeout. Si vence, aborta y lanza error de timeout.
 */
export async function fetchConTimeout(url, options = {}, timeoutMs = VENTA_FETCH_TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("timeout")
      timeoutError.name = "AbortError"
      throw timeoutError
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}
