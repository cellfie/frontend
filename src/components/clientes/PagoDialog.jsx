"use client"
import { DollarSign, CheckCircle, XCircle } from "lucide-react"
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-green-600 flex items-center gap-2">
            <DollarSign size={18} />
            Registrar Pago
          </DialogTitle>
          <DialogDescription>Registra un pago para reducir el saldo de la cuenta corriente</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 p-3 rounded border mb-4">
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
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 flex items-start gap-2">
              <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Pago registrado</p>
                <p className="text-sm">{estadoPago.mensaje}</p>
              </div>
            </div>
          )}

          {estadoPago.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-start gap-2">
              <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Error al registrar pago</p>
                <p className="text-sm">{estadoPago.mensaje}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
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

        <DialogFooter>
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
