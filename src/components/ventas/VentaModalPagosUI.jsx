"use client"

import {
  Wallet,
  Landmark,
  CreditCard,
  Smartphone,
  BookOpen,
  DollarSign,
  Trash2,
  TrendingUp,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { NumericFormat } from "react-number-format"
import { cn } from "@/lib/utils"

function parseMontoFormatted(str) {
  const s = String(str || "")
    .replace(/\$\s?/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim()
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

function resolveTipoIcon(tipo) {
  if (tipo?.icono) return tipo.icono
  const n = (tipo?.nombre || "").toLowerCase()
  if (n.includes("transferencia")) return Landmark
  if (n.includes("tarjeta")) return CreditCard
  if (n.includes("viumi")) return Smartphone
  if (n.includes("cuenta")) return BookOpen
  if (n.includes("efectivo")) return Wallet
  return DollarSign
}

function cuentaCorrienteDeshabilitada(tipo, clienteId) {
  const n = (tipo?.nombre || "").toLowerCase()
  return n.includes("cuenta") && !clienteId
}

/**
 * UI unificada y responsiva para el modal de cobro (ventas productos / equipos).
 * Mantiene la misma lógica de negocio; solo presentación.
 */
export function VentaModalPagosUI({
  resumenSlot,
  tiposPago = [],
  tipoSeleccionadoId,
  onTipoChange,
  montoPago,
  onMontoChange,
  onAddPago,
  onRellenarRestante,
  restante,
  totalVenta,
  totalPagado,
  pagos = [],
  onRemovePago,
  onPagoTarjetaChange,
  clienteId,
  formatearMonedaARS,
  extraBannerSlot,
  tituloMetodo = "Cobrar",
  subtituloMetodo = "Elegí método, monto y tocá agregar.",
  montoInputId = "venta-modal-monto",
}) {
  const absRest = Math.abs(restante)
  const listo = absRest <= 0.01 && pagos.length > 0
  const falta = restante > 0.009
  const hayVuelto = restante < -0.009
  const pctBarra = totalVenta > 0 ? Math.min(100, (totalPagado / totalVenta) * 100) : 0

  const puedeRellenar = falta && restante > 0
  const addDisabled = !tipoSeleccionadoId || parseMontoFormatted(montoPago) <= 0

  return (
    <div className="flex flex-col min-h-0 max-h-[min(82vh,760px)]">
      {/* Barra de estado: siempre visible, ideal en celular */}
      <div
        className={cn(
          "shrink-0 rounded-xl px-3 py-3 sm:px-4 text-white shadow-sm",
          listo ? "bg-gradient-to-r from-emerald-600 to-teal-600" : "bg-gradient-to-r from-orange-600 to-amber-600",
        )}
      >
        <div className="flex flex-wrap items-end justify-between gap-2 gap-y-1">
          <div>
            <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-white/90">Total venta</p>
            <p className="text-xl sm:text-2xl font-bold tabular-nums leading-tight">{formatearMonedaARS(totalVenta)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-white/90">
              {hayVuelto ? "Vuelto" : falta ? "Falta cobrar" : listo ? "Listo" : "Pagado"}
            </p>
            <p
              className={cn(
                "text-lg sm:text-xl font-bold tabular-nums",
                hayVuelto && "text-amber-100",
                falta && "text-white",
                listo && "text-emerald-100",
              )}
            >
              {formatearMonedaARS(absRest)}
            </p>
          </div>
        </div>
        <div className="mt-2 h-2 rounded-full bg-black/20 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", listo ? "bg-emerald-200" : "bg-white/90")}
            style={{ width: `${pctBarra}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] sm:text-xs text-white/90">
          {listo ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Podés confirmar la venta.
            </>
          ) : falta ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Sumá pagos hasta cubrir el total.
            </>
          ) : pagos.length === 0 ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Agregá al menos un pago.
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Ajustá montos o eliminá un pago si pasaste del total.
            </>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-1 sm:px-0 pt-3 sm:pt-4 space-y-4">
        {/* Resumen pedido / equipo */}
        <section className="rounded-xl border border-gray-200/80 bg-slate-50/80 p-3 sm:p-4 shadow-sm max-h-[38vh] sm:max-h-none overflow-y-auto">
          {resumenSlot}
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{tituloMetodo}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{subtituloMetodo}</p>
          </div>

          {/* Métodos: rejilla táctil */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tiposPago.map((tipo) => {
              const disabled = cuentaCorrienteDeshabilitada(tipo, clienteId)
              const Icon = resolveTipoIcon(tipo)
              const selected = tipoSeleccionadoId === tipo.id.toString()
              return (
                <button
                  key={tipo.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && onTipoChange(tipo.id.toString())}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-3 min-h-[4.25rem] transition-all active:scale-[0.98]",
                    disabled && "opacity-40 cursor-not-allowed border-gray-100 bg-gray-50",
                    !disabled && !selected && "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/40",
                    !disabled && selected && "border-orange-500 bg-orange-50 shadow-sm ring-2 ring-orange-200",
                  )}
                >
                  <Icon className={cn("h-5 w-5", selected ? "text-orange-600" : "text-gray-600")} />
                  <span className={cn("text-[11px] sm:text-xs font-medium text-center leading-tight px-0.5", selected ? "text-orange-800" : "text-gray-800")}>
                    {tipo.nombre}
                  </span>
                  {disabled && <span className="text-[9px] text-red-600 font-medium">Cliente</span>}
                </button>
              )
            })}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 space-y-3 shadow-sm">
            <Label htmlFor={montoInputId} className="text-sm font-medium text-gray-800">
              Monto de este pago
            </Label>
            <NumericFormat
              id={montoInputId}
              value={montoPago}
              onValueChange={(values) => onMontoChange(values.formattedValue)}
              thousandSeparator="."
              decimalSeparator=","
              prefix="$ "
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              className="w-full text-lg sm:text-xl font-semibold h-12 sm:h-11 rounded-lg border border-input px-3"
              customInput={Input}
              placeholder="$ 0,00"
            />

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:flex-1 border-orange-200 text-orange-700 hover:bg-orange-50 h-11"
                onClick={onRellenarRestante}
                disabled={!puedeRellenar}
              >
                Usar todo el restante
              </Button>
              <Button
                type="button"
                className="w-full sm:flex-1 h-11 bg-orange-600 hover:bg-orange-700 text-white shadow-md"
                onClick={onAddPago}
                disabled={addDisabled}
              >
                Agregar pago
              </Button>
            </div>
          </div>
        </section>

        {/* Pagos agregados */}
        <section className="space-y-2 pb-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Pagos agregados</h3>
            <span className="text-xs text-gray-500">{pagos.length} ítem{pagos.length !== 1 ? "s" : ""}</span>
          </div>

          {pagos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 py-8 px-4 text-center">
              <p className="text-sm text-gray-500">Todavía no hay pagos.</p>
              <p className="text-xs text-gray-400 mt-1">Elegí método, monto y tocá &quot;Agregar pago&quot;.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {pagos.map((pago) => {
                const Icon = pago.icono || resolveTipoIcon({ nombre: pago.tipo_pago_nombre })
                return (
                  <li
                    key={pago.id}
                    className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm"
                  >
                    <div className="flex items-stretch gap-2 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{pago.tipo_pago_nombre}</p>
                        <p className="text-base font-bold text-orange-700 tabular-nums">{formatearMonedaARS(pago.monto)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        onClick={() => onRemovePago(pago.id)}
                        aria-label="Quitar pago"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>

                    {pago.esTarjeta && (
                      <div className="border-t border-gray-100 bg-amber-50/50 px-3 py-3 space-y-3">
                        <p className="text-[11px] font-medium text-amber-900/80 uppercase tracking-wide">
                          Referencia tarjeta / ViuMi (solo informativo)
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1 text-gray-700">
                              <TrendingUp className="h-3.5 w-3.5" /> Interés %
                            </Label>
                            <NumericFormat
                              value={pago.interesTarjeta}
                              onValueChange={(values) =>
                                onPagoTarjetaChange(pago.id, "interesTarjeta", Number(values.value))
                              }
                              suffix=" %"
                              decimalScale={2}
                              className="h-10 text-sm"
                              customInput={Input}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1 text-gray-700">
                              <CalendarDays className="h-3.5 w-3.5" /> Cuotas
                            </Label>
                            <NumericFormat
                              value={pago.cuotasTarjeta}
                              onValueChange={(values) =>
                                onPagoTarjetaChange(pago.id, "cuotasTarjeta", Number(values.value) || 1)
                              }
                              allowDecimal={false}
                              className="h-10 text-sm"
                              customInput={Input}
                              isAllowed={(values) => {
                                const { floatValue } = values
                                return floatValue === undefined || floatValue >= 1
                              }}
                            />
                          </div>
                        </div>
                        {pago.interesTarjeta > 0 && pago.cuotasTarjeta > 0 && (
                          <div className="text-xs space-y-1 rounded-lg bg-white/80 border border-amber-100 p-2.5">
                            <div className="flex justify-between gap-2">
                              <span className="text-gray-600">Con interés:</span>
                              <span className="font-semibold text-amber-900 tabular-nums">
                                {formatearMonedaARS(pago.monto * (1 + pago.interesTarjeta / 100))}
                              </span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-gray-600">{pago.cuotasTarjeta} cuota(s):</span>
                              <span className="font-semibold text-amber-900 tabular-nums">
                                {formatearMonedaARS(
                                  (pago.monto * (1 + pago.interesTarjeta / 100)) / pago.cuotasTarjeta,
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          <div className="rounded-xl bg-slate-100/90 border border-slate-200/80 p-3 sm:p-3.5 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Suma de pagos</span>
              <span className="font-semibold tabular-nums text-gray-900">{formatearMonedaARS(totalPagado)}</span>
            </div>
            <Separator className="bg-slate-200/80" />
            <div className="flex justify-between text-sm font-medium">
              <span className={falta ? "text-red-700" : hayVuelto ? "text-blue-700" : "text-emerald-700"}>
                {hayVuelto ? "Vuelto a entregar" : falta ? "Falta cobrar" : "Cubierto"}
              </span>
              <span
                className={cn(
                  "tabular-nums",
                  falta && "text-red-700",
                  hayVuelto && "text-blue-700",
                  listo && "text-emerald-700",
                )}
              >
                {formatearMonedaARS(absRest)}
              </span>
            </div>
          </div>
        </section>

        {extraBannerSlot ? <div className="pb-2">{extraBannerSlot}</div> : null}
      </div>
    </div>
  )
}
