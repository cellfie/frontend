/**
 * Métodos de pago que usan la misma UX que tarjeta (interés/cuotas solo informativos).
 * Debe alinearse con los nombres en `getTiposPago` (ej. "Tarjeta de crédito", "ViuMi").
 */
export function esMetodoPagoConCalculadoraFinanciacion(nombreTipoPago) {
  const n = String(nombreTipoPago || "").toLowerCase()
  return n.includes("tarjeta") || n.includes("viumi")
}
