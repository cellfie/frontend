"use client"
import { DollarSign, CheckCircle, XCircle, TrendingUp, CalendarDays, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"
import { getTiposPago } from "@/services/pagosService"
import { NumericFormat } from "react-number-format"

const PagoDialog = ({
  open,
  setOpen,
  formPago,
  setFormPago,
  registrarPagoEnCuenta,
  clienteSeleccionado,
  procesandoPago,
  estadoPago,
  formatearPrecio,
}) => {
  const [tiposPago, setTiposPago] = useState([])
  const [cargandoTipos, setCargandoTipos] = useState(false)

  // Estados para cálculo de tarjeta de crédito
  const [interesTarjeta, setInteresTarjeta] = useState(0)
  const [cuotasTarjeta, setCuotasTarjeta] = useState(1)

  // Cargar tipos de pago al abrir el diálogo
  useEffect(() => {
    if (open) {
      cargarTiposPago()

      // Asegurarse de que siempre haya un tipo de pago seleccionado
      if (!formPago.tipo_pago) {
        setFormPago((prev) => ({
          ...prev,
          tipo_pago: "Efectivo", // Valor predeterminado
        }))
      }

      // Resetear valores de tarjeta al abrir
      setInteresTarjeta(0)
      setCuotasTarjeta(1)
    }
  }, [open, formPago.tipo_pago, setFormPago])

  const cargarTiposPago = async () => {
    setCargandoTipos(true)
    try {
      const tipos = await getTiposPago()

      // Filtrar los tipos de pago para excluir "Cuenta corriente" o cualquier tipo que contenga "cuenta"
      const tiposFiltrados = tipos.filter((tipo) => !tipo.nombre.toLowerCase().includes("cuenta"))

      setTiposPago(tiposFiltrados)

      // Establecer el primer tipo de pago como predeterminado si no hay uno seleccionado
      // o si el tipo seleccionado es "Cuenta corriente"
      if (!formPago.tipo_pago || formPago.tipo_pago.toLowerCase().includes("cuenta")) {
        if (tiposFiltrados.length > 0) {
          setFormPago((prev) => ({
            ...prev,
            tipo_pago: tiposFiltrados[0].nombre,
          }))
        }
      }
    } catch (error) {
      console.error("Error al cargar tipos de pago:", error)
    } finally {
      setCargandoTipos(false)
    }
  }

  // Validar que el monto sea un número válido y no exceda el saldo
  const validarMonto = (valor) => {
    if (!valor) return false

    // Convertir el valor formateado a un número
    const montoNumerico =
      typeof valor === "string"
        ? Number.parseFloat(valor.replace(/\./g, "").replace(",", ".").replace(/\$ /g, ""))
        : Number.parseFloat(valor)

    if (isNaN(montoNumerico) || montoNumerico <= 0) return false

    // Verificar que no exceda el saldo de la cuenta corriente
    const saldoCliente = clienteSeleccionado?.cuentaCorriente?.saldo || 0
    return montoNumerico <= saldoCliente
  }

  // Verificar si el tipo de pago es tarjeta de crédito
  const esTarjetaCredito = () => {
    return formPago.tipo_pago && formPago.tipo_pago.toLowerCase().includes("tarjeta")
  }

  // Calcular monto con interés
  const calcularMontoConInteres = () => {
    const montoNumerico =
      typeof formPago.monto === "string"
        ? Number.parseFloat(formPago.monto.replace(/\./g, "").replace(",", ".").replace(/\$ /g, ""))
        : Number.parseFloat(formPago.monto)

    if (isNaN(montoNumerico) || montoNumerico <= 0) return 0

    return montoNumerico * (1 + interesTarjeta / 100)
  }

  // Calcular monto por cuota
  const calcularMontoPorCuota = () => {
    const montoConInteres = calcularMontoConInteres()
    return cuotasTarjeta > 0 ? montoConInteres / cuotasTarjeta : 0
  }

  // Resetear valores de tarjeta cuando cambia el tipo de pago
  useEffect(() => {
    if (!esTarjetaCredito()) {
      setInteresTarjeta(0)
      setCuotasTarjeta(1)
    }
  }, [formPago.tipo_pago])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-green-600 flex items-center gap-2">
            <DollarSign size={18} />
            Registrar Pago
          </DialogTitle>
          <DialogDescription>Registra un pago para reducir el saldo de la cuenta corriente</DialogDescription>
        </DialogHeader>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto py-4 px-1">
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded border">
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Cliente:</span>
                  <span className="font-medium">{clienteSeleccionado?.nombre}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Saldo actual:</span>
                  <span className="font-medium text-red-600">
                    {clienteSeleccionado?.cuentaCorriente && formatearPrecio(clienteSeleccionado.cuentaCorriente.saldo)}
                  </span>
                </div>
              </div>
            </div>

            {/* Estado del pago */}
            {estadoPago.exito && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 flex items-start gap-2">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Pago registrado</p>
                  <p className="text-sm">{estadoPago.mensaje}</p>
                </div>
              </div>
            )}

            {estadoPago.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-start gap-2">
                <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error al registrar pago</p>
                  <p className="text-sm">{estadoPago.mensaje}</p>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="monto">
                Monto a pagar <span className="text-red-500">*</span>
              </Label>
              <NumericFormat
                id="monto"
                value={formPago.monto}
                onValueChange={(values) => {
                  const { value } = values
                  setFormPago({ ...formPago, monto: value })
                }}
                thousandSeparator="."
                decimalSeparator=","
                prefix="$ "
                decimalScale={2}
                placeholder="$ 0,00"
                disabled={estadoPago.exito || procesandoPago}
                className="w-full px-3 py-2 border rounded-md border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <p className="text-xs text-gray-500">
                Máximo:{" "}
                {clienteSeleccionado?.cuentaCorriente && formatearPrecio(clienteSeleccionado.cuentaCorriente.saldo)}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tipo_pago">
                Tipo de pago <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formPago.tipo_pago || "Efectivo"}
                onValueChange={(value) => setFormPago({ ...formPago, tipo_pago: value })}
                disabled={estadoPago.exito || procesandoPago || cargandoTipos}
              >
                <SelectTrigger id="tipo_pago">
                  <SelectValue placeholder="Selecciona un tipo de pago" />
                </SelectTrigger>
                <SelectContent>
                  {tiposPago.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.nombre}>
                      {tipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Selecciona el método con el que se realizará el pago a la cuenta corriente
              </p>
            </div>

            {/* Sección de cálculo para tarjeta de crédito */}
            {esTarjetaCredito() && formPago.monto && validarMonto(formPago.monto) && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-5 w-5 text-orange-600" />
                  <h3 className="font-medium text-orange-800">Calculadora de Tarjeta de Crédito</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-sm flex items-center gap-1 mb-2">
                      <TrendingUp size={14} className="text-orange-600" />
                      Interés (%)
                    </Label>
                    <NumericFormat
                      value={interesTarjeta}
                      onValueChange={(values) => setInteresTarjeta(Number(values.value) || 0)}
                      suffix=" %"
                      decimalScale={2}
                      decimalSeparator=","
                      allowNegative={false}
                      disabled={estadoPago.exito || procesandoPago}
                      className="w-full px-3 py-2 border rounded-md border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="0,00 %"
                    />
                  </div>

                  <div>
                    <Label className="text-sm flex items-center gap-1 mb-2">
                      <CalendarDays size={14} className="text-orange-600" />
                      Número de cuotas
                    </Label>
                    <NumericFormat
                      value={cuotasTarjeta}
                      onValueChange={(values) => setCuotasTarjeta(Number(values.value) || 1)}
                      allowDecimal={false}
                      allowNegative={false}
                      disabled={estadoPago.exito || procesandoPago}
                      className="w-full px-3 py-2 border rounded-md border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="1"
                      isAllowed={(values) => {
                        const { floatValue } = values
                        return floatValue === undefined || floatValue >= 1
                      }}
                    />
                  </div>
                </div>

                {(interesTarjeta > 0 || cuotasTarjeta > 1) && (
                  <>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <h4 className="font-medium text-orange-800 text-sm">Resumen del financiamiento:</h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="bg-white p-3 rounded-md border border-orange-200">
                          <div className="text-gray-600 text-xs">Monto original</div>
                          <div className="font-medium text-gray-800">
                            {formatearPrecio(
                              typeof formPago.monto === "string"
                                ? Number.parseFloat(
                                    formPago.monto.replace(/\./g, "").replace(",", ".").replace(/\$ /g, ""),
                                  )
                                : Number.parseFloat(formPago.monto),
                            )}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-md border border-orange-200">
                          <div className="text-gray-600 text-xs">Total con interés</div>
                          <div className="font-medium text-orange-700">
                            {formatearPrecio(calcularMontoConInteres())}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-md border border-orange-200">
                          <div className="text-gray-600 text-xs">{cuotasTarjeta} cuota(s) de</div>
                          <div className="font-medium text-orange-700">{formatearPrecio(calcularMontoPorCuota())}</div>
                        </div>
                      </div>

                      {interesTarjeta > 0 && (
                        <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded-md">
                          <strong>Nota:</strong> Este cálculo es solo informativo. El interés mostrado es el que se
                          aplicaría si el cliente pagara con tarjeta de crédito en {cuotasTarjeta} cuota
                          {cuotasTarjeta > 1 ? "s" : ""}.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notas">Notas (opcional)</Label>
              <Textarea
                id="notas"
                value={formPago.notas}
                onChange={(e) => setFormPago({ ...formPago, notas: e.target.value })}
                placeholder="Detalles adicionales sobre el pago"
                disabled={estadoPago.exito || procesandoPago}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={procesandoPago}>
            {estadoPago.exito ? "Cerrar" : "Cancelar"}
          </Button>
          {!estadoPago.exito && (
            <Button
              onClick={registrarPagoEnCuenta}
              disabled={!validarMonto(formPago.monto) || procesandoPago}
              className="bg-green-600 hover:bg-green-700"
            >
              {procesandoPago ? (
                <>
                  <span className="mr-1">Procesando</span>
                  <span className="animate-spin">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </span>
                </>
              ) : (
                <>
                  <DollarSign className="mr-1 h-4 w-4" /> Registrar Pago
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PagoDialog
