"use client"
import { useState, useEffect } from "react"
import { Settings, Plus, Minus, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NumericFormat } from "react-number-format"
import { getTiposAjuste, validarDatosAjuste } from "@/services/cuentasCorrientesService"

const AjusteDialog = ({
  open,
  setOpen,
  clienteSeleccionado,
  procesandoAjuste,
  estadoAjuste,
  onRegistrarAjuste,
  formatearPrecio,
}) => {
  const [tiposAjuste, setTiposAjuste] = useState([])
  const [formAjuste, setFormAjuste] = useState({
    tipo_ajuste: "",
    monto: "",
    motivo: "",
  })
  const [erroresValidacion, setErroresValidacion] = useState([])
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null)

  // Cargar tipos de ajuste al abrir el diálogo
  useEffect(() => {
    if (open) {
      const tipos = getTiposAjuste()
      setTiposAjuste(tipos)

      // Limpiar formulario al abrir
      setFormAjuste({
        tipo_ajuste: "",
        monto: "",
        motivo: "",
      })
      setErroresValidacion([])
      setTipoSeleccionado(null)
    }
  }, [open])

  // Actualizar tipo seleccionado cuando cambia el formulario
  useEffect(() => {
    if (formAjuste.tipo_ajuste) {
      const tipo = tiposAjuste.find((t) => t.id === formAjuste.tipo_ajuste)
      setTipoSeleccionado(tipo)
    } else {
      setTipoSeleccionado(null)
    }
  }, [formAjuste.tipo_ajuste, tiposAjuste])

  // Validar formulario en tiempo real
  useEffect(() => {
    if (formAjuste.tipo_ajuste || formAjuste.monto || formAjuste.motivo) {
      const datosAjuste = {
        cliente_id: clienteSeleccionado?.id,
        ...formAjuste,
      }
      const validacion = validarDatosAjuste(datosAjuste)
      setErroresValidacion(validacion.errores)
    }
  }, [formAjuste, clienteSeleccionado])

  // Manejar cambio en el formulario
  const handleFormChange = (campo, valor) => {
    setFormAjuste((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  // Validar que el monto sea válido
  const validarMonto = (valor) => {
    if (!valor) return false

    const montoNumerico =
      typeof valor === "string"
        ? Number.parseFloat(valor.replace(/\./g, "").replace(",", ".").replace(/\$ /g, ""))
        : Number.parseFloat(valor)

    if (isNaN(montoNumerico) || montoNumerico <= 0) return false

    // Si es un pago, verificar que no exceda el saldo
    if (formAjuste.tipo_ajuste === "pago") {
      const saldoCliente = clienteSeleccionado?.cuentaCorriente?.saldo || 0
      return montoNumerico <= saldoCliente
    }

    return true
  }

  // Manejar envío del formulario
  const handleSubmit = () => {
    const datosAjuste = {
      cliente_id: clienteSeleccionado?.id,
      ...formAjuste,
      punto_venta_id: 1, // Punto de venta por defecto
    }

    const validacion = validarDatosAjuste(datosAjuste)
    if (!validacion.esValido) {
      setErroresValidacion(validacion.errores)
      return
    }

    onRegistrarAjuste(datosAjuste)
  }

  // Obtener el color del badge según el tipo
  const getBadgeColor = (tipo) => {
    return tipo === "pago" ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"
  }

  // Obtener el icono según el tipo
  const getIcon = (tipo) => {
    return tipo === "pago" ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-blue-600 flex items-center gap-2">
            <Settings size={20} />
            Ajuste de Cuenta Corriente
          </DialogTitle>
          <DialogDescription>
            Registra un ajuste manual en la cuenta corriente del cliente. Puedes agregar cargos o registrar pagos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1">
          <div className="space-y-6">
            {/* Información del cliente */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Cliente:</span>
                    <span className="font-medium ml-2">{clienteSeleccionado?.nombre}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Saldo actual:</span>
                    <span
                      className={`font-medium ml-2 ${
                        clienteSeleccionado?.cuentaCorriente?.saldo > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {clienteSeleccionado?.cuentaCorriente &&
                        formatearPrecio(clienteSeleccionado.cuentaCorriente.saldo)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estado del ajuste */}
            {estadoAjuste.exito && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-700 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Ajuste registrado exitosamente</p>
                  <p className="text-sm mt-1">{estadoAjuste.mensaje}</p>
                </div>
              </div>
            )}

            {estadoAjuste.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-start gap-3">
                <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error al registrar ajuste</p>
                  <p className="text-sm mt-1">{estadoAjuste.mensaje}</p>
                </div>
              </div>
            )}

            {/* Errores de validación */}
            {erroresValidacion.length > 0 && !estadoAjuste.exito && !estadoAjuste.error && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Corrige los siguientes errores:</p>
                  <ul className="text-sm mt-1 list-disc list-inside">
                    {erroresValidacion.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Formulario */}
            <div className="space-y-4">
              {/* Tipo de ajuste */}
              <div className="space-y-2">
                <Label htmlFor="tipo_ajuste">
                  Tipo de ajuste <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formAjuste.tipo_ajuste}
                  onValueChange={(value) => handleFormChange("tipo_ajuste", value)}
                  disabled={estadoAjuste.exito || procesandoAjuste}
                >
                  <SelectTrigger id="tipo_ajuste">
                    <SelectValue placeholder="Selecciona el tipo de ajuste" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposAjuste.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        <div className="flex items-center gap-2">
                          {getIcon(tipo.id)}
                          <span>{tipo.nombre}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Descripción del tipo seleccionado */}
                {tipoSeleccionado && (
                  <div className="mt-2">
                    <Badge className={getBadgeColor(tipoSeleccionado.id)}>
                      {getIcon(tipoSeleccionado.id)}
                      <span className="ml-1">{tipoSeleccionado.nombre}</span>
                    </Badge>
                    <p className="text-xs text-gray-600 mt-1">{tipoSeleccionado.descripcion}</p>
                  </div>
                )}
              </div>

              {/* Monto */}
              <div className="space-y-2">
                <Label htmlFor="monto">
                  Monto <span className="text-red-500">*</span>
                </Label>
                <NumericFormat
                  id="monto"
                  value={formAjuste.monto}
                  onValueChange={(values) => {
                    const { value } = values
                    handleFormChange("monto", value)
                  }}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="$ "
                  decimalScale={2}
                  placeholder="$ 0,00"
                  disabled={estadoAjuste.exito || procesandoAjuste}
                  className="w-full px-3 py-2 border rounded-md border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                {formAjuste.tipo_ajuste === "pago" && clienteSeleccionado?.cuentaCorriente && (
                  <p className="text-xs text-gray-500">
                    Máximo: {formatearPrecio(clienteSeleccionado.cuentaCorriente.saldo)}
                  </p>
                )}
              </div>

              {/* Motivo */}
              <div className="space-y-2">
                <Label htmlFor="motivo">
                  Motivo del ajuste <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="motivo"
                  value={formAjuste.motivo}
                  onChange={(e) => handleFormChange("motivo", e.target.value)}
                  placeholder="Describe el motivo del ajuste (mínimo 5 caracteres)"
                  disabled={estadoAjuste.exito || procesandoAjuste}
                  className="min-h-[80px]"
                  maxLength={500}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Mínimo 5 caracteres</span>
                  <span>{formAjuste.motivo.length}/500</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={procesandoAjuste}>
            {estadoAjuste.exito ? "Cerrar" : "Cancelar"}
          </Button>
          {!estadoAjuste.exito && (
            <Button
              onClick={handleSubmit}
              disabled={
                !validarMonto(formAjuste.monto) ||
                !formAjuste.tipo_ajuste ||
                !formAjuste.motivo.trim() ||
                erroresValidacion.length > 0 ||
                procesandoAjuste
              }
              className={`${
                formAjuste.tipo_ajuste === "pago" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {procesandoAjuste ? (
                <>
                  <span className="mr-2">Procesando</span>
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
                  {formAjuste.tipo_ajuste === "pago" ? (
                    <Minus className="mr-2 h-4 w-4" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Registrar {tipoSeleccionado?.nombre || "Ajuste"}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AjusteDialog
