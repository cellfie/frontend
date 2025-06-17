"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NumericFormat } from "react-number-format"
import {
  CreditCard,
  DollarSign,
  Smartphone,
  Building2,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Calculator,
  Receipt,
  Settings,
} from "lucide-react"
import { toast } from "react-toastify"

// Función para formatear moneda
const formatearMonedaARS = (valor) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(valor)
}

const PaymentMethodsModal = ({
  total,
  dollarPrice,
  tiposPago,
  cliente,
  cuentaCorrienteInfo,
  pagos,
  setPagos,
  marcarComoIncompleta,
  setMarcarComoIncompleta,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [nuevoPago, setNuevoPago] = useState({
    tipo_pago_id: "",
    tipo_pago_nombre: "",
    monto_usd: "",
    monto_ars: "",
    notas: "",
  })

  // Calcular totales
  const totalPagadoUSD = pagos.reduce((sum, p) => sum + Number(p.monto_usd), 0)
  const totalPagadoARS = pagos.reduce((sum, p) => sum + Number(p.monto_ars), 0)
  const saldoPendienteUSD = total - totalPagadoUSD
  const saldoPendienteARS = total * dollarPrice - totalPagadoARS
  const pagoCompleto = Math.abs(saldoPendienteUSD) <= 0.01

  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setNuevoPago({
        tipo_pago_id: "",
        tipo_pago_nombre: "",
        monto_usd: "",
        monto_ars: "",
        notas: "",
      })
    }
  }, [isOpen])

  // Actualizar monto ARS cuando cambia USD
  const handleMontoUSDChange = (values) => {
    const montoUSD = Number(values.value) || 0
    const montoARS = montoUSD * dollarPrice
    setNuevoPago((prev) => ({
      ...prev,
      monto_usd: values.value,
      monto_ars: montoARS.toFixed(2),
    }))
  }

  // Actualizar monto USD cuando cambia ARS
  const handleMontoARSChange = (values) => {
    const montoARS = Number(values.value) || 0
    const montoUSD = montoARS / dollarPrice
    setNuevoPago((prev) => ({
      ...prev,
      monto_ars: values.value,
      monto_usd: montoUSD.toFixed(2),
    }))
  }

  // Seleccionar tipo de pago
  const handleTipoPagoChange = (tipoId) => {
    const tipo = tiposPago.find((t) => t.id.toString() === tipoId)
    if (tipo) {
      setNuevoPago((prev) => ({
        ...prev,
        tipo_pago_id: tipoId,
        tipo_pago_nombre: tipo.nombre,
        notas: `Pago con ${tipo.nombre.toLowerCase()}`,
      }))
    }
  }

  // Agregar pago
  const agregarPago = () => {
    // Validaciones
    if (!nuevoPago.tipo_pago_nombre) {
      toast.error("Debe seleccionar un tipo de pago")
      return
    }

    if (!nuevoPago.monto_usd || Number(nuevoPago.monto_usd) <= 0) {
      toast.error("El monto debe ser mayor a 0")
      return
    }

    // Validar cuenta corriente
    if (nuevoPago.tipo_pago_nombre.toLowerCase().includes("cuenta corriente")) {
      if (!cliente.id) {
        toast.error("Debe seleccionar un cliente para pagos con cuenta corriente")
        return
      }

      if (cuentaCorrienteInfo && cuentaCorrienteInfo.limite_credito) {
        const saldoActual = cuentaCorrienteInfo.saldo || 0
        const nuevoSaldo = saldoActual + Number(nuevoPago.monto_ars)

        if (nuevoSaldo > cuentaCorrienteInfo.limite_credito) {
          const disponible = cuentaCorrienteInfo.limite_credito - saldoActual
          toast.error(`Excede el límite de crédito. Disponible: ${formatearMonedaARS(disponible)}`)
          return
        }
      }
    }

    const pago = {
      id: Date.now(),
      tipo_pago_id: nuevoPago.tipo_pago_id,
      tipo_pago_nombre: nuevoPago.tipo_pago_nombre,
      monto_usd: Number(nuevoPago.monto_usd),
      monto_ars: Number(nuevoPago.monto_ars),
      notas: nuevoPago.notas || "",
    }

    setPagos((prev) => [...prev, pago])

    // Resetear formulario
    setNuevoPago({
      tipo_pago_id: "",
      tipo_pago_nombre: "",
      monto_usd: "",
      monto_ars: "",
      notas: "",
    })

    toast.success("Pago agregado correctamente")
  }

  // Eliminar pago
  const eliminarPago = (pagoId) => {
    setPagos((prev) => prev.filter((p) => p.id !== pagoId))
    toast.info("Pago eliminado")
  }

  // Pagar el saldo restante
  const pagarSaldoRestante = () => {
    if (saldoPendienteUSD > 0) {
      setNuevoPago((prev) => ({
        ...prev,
        monto_usd: saldoPendienteUSD.toFixed(2),
        monto_ars: saldoPendienteARS.toFixed(2),
      }))
    }
  }

  // Obtener icono del tipo de pago
  const getPaymentIcon = (nombre) => {
    const nombreLower = nombre.toLowerCase()
    if (nombreLower.includes("efectivo")) return DollarSign
    if (nombreLower.includes("transferencia")) return Smartphone
    if (nombreLower.includes("tarjeta")) return CreditCard
    if (nombreLower.includes("cuenta")) return Building2
    return CreditCard
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings size={16} />
          Configurar Pagos
          {pagos.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {pagos.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <Receipt size={20} />
            Configurar Métodos de Pago
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Columna izquierda - Agregar pago */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus size={16} className="text-orange-600" />
                  Agregar Método de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tipo de pago */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de Pago</Label>
                  <Select value={nuevoPago.tipo_pago_id} onValueChange={handleTipoPagoChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposPago.map((tipo) => {
                        const IconComponent = getPaymentIcon(tipo.nombre)
                        const isDisabled = tipo.requiere_cliente && !cliente.id

                        return (
                          <SelectItem key={tipo.id} value={tipo.id.toString()} disabled={isDisabled}>
                            <div className="flex items-center gap-2">
                              <IconComponent size={16} />
                              <span>{tipo.nombre}</span>
                              {isDisabled && (
                                <Badge variant="outline" className="text-xs">
                                  Req. cliente
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Montos */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Monto USD</Label>
                    <NumericFormat
                      value={nuevoPago.monto_usd}
                      onValueChange={handleMontoUSDChange}
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      fixedDecimalScale={true}
                      allowNegative={false}
                      placeholder="0,00"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Monto ARS</Label>
                    <NumericFormat
                      value={nuevoPago.monto_ars}
                      onValueChange={handleMontoARSChange}
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      fixedDecimalScale={true}
                      allowNegative={false}
                      placeholder="0,00"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Notas */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Notas (opcional)</Label>
                  <Input
                    value={nuevoPago.notas}
                    onChange={(e) => setNuevoPago((prev) => ({ ...prev, notas: e.target.value }))}
                    placeholder="Descripción del pago"
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-2">
                  <Button onClick={agregarPago} className="flex-1 bg-orange-600 hover:bg-orange-700">
                    <Plus size={16} className="mr-1" />
                    Agregar
                  </Button>
                  {saldoPendienteUSD > 0 && (
                    <Button variant="outline" onClick={pagarSaldoRestante} className="flex-1">
                      Resto
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Información de cuenta corriente */}
            {cliente.id && cuentaCorrienteInfo && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                    <Building2 size={16} />
                    Cuenta Corriente - {cliente.nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Saldo actual:</span>
                    <span className="font-medium">{formatearMonedaARS(cuentaCorrienteInfo.saldo || 0)}</span>
                  </div>
                  {cuentaCorrienteInfo.limite_credito && (
                    <>
                      <div className="flex justify-between">
                        <span>Límite de crédito:</span>
                        <span className="font-medium">{formatearMonedaARS(cuentaCorrienteInfo.limite_credito)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Disponible:</span>
                        <span className="font-medium text-green-600">
                          {formatearMonedaARS(cuentaCorrienteInfo.limite_credito - (cuentaCorrienteInfo.saldo || 0))}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Columna derecha - Resumen */}
          <div className="space-y-4">
            {/* Pagos agregados */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calculator size={16} className="text-orange-600" />
                    Pagos Configurados
                  </span>
                  <Badge variant="secondary">{pagos.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pagos.length > 0 ? (
                  <ScrollArea className="max-h-[200px]">
                    <div className="space-y-3">
                      {pagos.map((pago) => {
                        const IconComponent = getPaymentIcon(pago.tipo_pago_nombre)
                        return (
                          <div key={pago.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <IconComponent size={16} className="text-gray-600" />
                              <div>
                                <p className="font-medium text-sm">{pago.tipo_pago_nombre}</p>
                                <p className="text-xs text-gray-500">${pago.monto_usd.toFixed(2)} USD</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => eliminarPago(pago.id)}
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-sm">No hay métodos de pago configurados</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumen de totales */}
            <Card className="bg-gray-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Receipt size={16} className="text-orange-600" />
                  Resumen de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total de la venta:</span>
                    <span className="font-medium">${total.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total pagado:</span>
                    <span className="font-medium">${totalPagadoUSD.toFixed(2)} USD</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {saldoPendienteUSD > 0.01
                        ? "Saldo pendiente:"
                        : saldoPendienteUSD < -0.01
                          ? "Exceso:"
                          : "Estado:"}
                    </span>
                    <div className="flex items-center gap-2">
                      {pagoCompleto ? (
                        <>
                          <CheckCircle2 size={16} className="text-green-500" />
                          <span className="font-medium text-green-600">Completo</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} className="text-amber-500" />
                          <span className="font-medium text-amber-600">
                            ${Math.abs(saldoPendienteUSD).toFixed(2)} USD
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Opción de venta incompleta */}
                {!pagoCompleto && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="incompleta"
                        checked={marcarComoIncompleta}
                        onCheckedChange={setMarcarComoIncompleta}
                      />
                      <Label htmlFor="incompleta" className="text-sm">
                        Marcar como venta incompleta
                      </Label>
                    </div>
                    {marcarComoIncompleta && (
                      <p className="text-xs text-amber-600 mt-1">La venta se registrará con estado "pendiente"</p>
                    )}
                  </div>
                )}

                {/* Estado visual */}
                <div
                  className={`p-3 rounded-lg border ${
                    pagoCompleto
                      ? "bg-green-50 border-green-200"
                      : marcarComoIncompleta
                        ? "bg-amber-50 border-amber-200"
                        : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {pagoCompleto ? (
                      <>
                        <CheckCircle2 size={16} className="text-green-600" />
                        <span className="text-green-800 font-medium text-sm">Pago completo</span>
                      </>
                    ) : marcarComoIncompleta ? (
                      <>
                        <AlertCircle size={16} className="text-amber-600" />
                        <span className="text-amber-800 font-medium text-sm">Venta incompleta</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} className="text-red-600" />
                        <span className="text-red-800 font-medium text-sm">Pago incompleto</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cerrar
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            className="bg-orange-600 hover:bg-orange-700"
            disabled={pagos.length === 0 && !marcarComoIncompleta}
          >
            <CheckCircle2 size={16} className="mr-1" />
            Confirmar Configuración
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PaymentMethodsModal
