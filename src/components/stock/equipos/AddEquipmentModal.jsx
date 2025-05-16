import { useState, useEffect, useContext } from "react"
import { motion } from "framer-motion"
import { X, Smartphone, AlertCircle, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarContext } from "@/context/DollarContext"

export const AddEquipmentModal = ({ isOpen, onClose, onSave, equipment, puntosVenta = [] }) => {
  const [formData, setFormData] = useState({
    marca: "",
    modelo: "",
    memoria: "",
    color: "",
    bateria: "",
    precio: "",
    descripcion: "",
    imei: "",
    fechaIngreso: "",
    pointOfSale: puntosVenta.length > 0 ? puntosVenta[0].nombre : "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const { dollarPrice } = useContext(DollarContext)

  useEffect(() => {
    if (equipment) {
      setFormData({
        marca: equipment.marca || "",
        modelo: equipment.modelo || "",
        memoria: equipment.memoria || "",
        color: equipment.color || "",
        bateria: equipment.bateria?.toString() || "",
        precio: equipment.precio?.toString() || "",
        descripcion: equipment.descripcion || "",
        imei: equipment.imei || "",
        fechaIngreso: equipment.fechaIngreso
          ? equipment.fechaIngreso.includes("T")
            ? equipment.fechaIngreso.split("T")[0]
            : equipment.fechaIngreso
          : "",
        pointOfSale:
          equipment.puntoVenta?.nombre ||
          (typeof equipment.pointOfSale === "string"
            ? equipment.pointOfSale
            : puntosVenta.length > 0
              ? puntosVenta[0].nombre
              : ""),
      })
    } else {
      // Si es un nuevo equipo, establecer la fecha de hoy por defecto
      const today = new Date().toISOString().split("T")[0]
      setFormData((prev) => ({
        ...prev,
        fechaIngreso: today,
        pointOfSale: puntosVenta.length > 0 ? puntosVenta[0].nombre : "",
      }))
    }
  }, [equipment, isOpen, puntosVenta])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.marca.trim()) newErrors.marca = "La marca es requerida"
    if (!formData.modelo.trim()) newErrors.modelo = "El modelo es requerido"
    if (!formData.imei.trim()) newErrors.imei = "El IMEI es requerido"
    const precio = Number.parseFloat(formData.precio)
    if (isNaN(precio) || precio <= 0) {
      newErrors.precio = "El precio debe ser un número positivo"
    }
    if (!formData.fechaIngreso) {
      newErrors.fechaIngreso = "La fecha de ingreso es requerida"
    }
    if (!formData.pointOfSale) {
      newErrors.pointOfSale = "El punto de venta es requerido"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      const data = {
        ...formData,
        precio: Number.parseFloat(formData.precio),
        id: equipment?.id,
      }
      await onSave(data)
      onClose()
    } catch (err) {
      console.error("Error al guardar equipo:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calcular el precio en pesos argentinos usando el tipo de cambio actual
  const precioARS = () => {
    const precio = Number.parseFloat(formData.precio) || 0
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(precio * dollarPrice)
  }

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  }
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  }
  if (!isOpen) return null

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/50 z-40"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={overlayVariants}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
          <div className="bg-[#131321] text-white p-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-orange-600">
              <Smartphone size={20} />
              {equipment ? "Editar Equipo" : "Agregar Nuevo Equipo"}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-2 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-red-800">Por favor corrige los siguientes errores:</p>
                  <ul className="text-xs text-red-700 mt-0.5 list-disc list-inside">
                    {Object.values(errors).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              <div className="col-span-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-medium text-gray-500 flex items-center">
                    <Smartphone className="h-3.5 w-3.5 mr-1 text-gray-400" /> INFORMACIÓN DEL EQUIPO
                  </h3>
                  {dollarPrice > 0 && (
                    <div className="text-xs text-gray-500 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
                      <DollarSign className="h-3 w-3 text-orange-500" />
                      <span>
                        Tipo de cambio actual:{" "}
                        <span className="font-medium text-orange-600">${dollarPrice.toFixed(2)}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="marca" className="text-sm">
                  Marca <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="marca"
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange}
                  className={
                    errors.marca
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "border-orange-200 focus-visible:ring-orange-500"
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="modelo" className="text-sm">
                  Modelo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="modelo"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange}
                  className={
                    errors.modelo
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "border-orange-200 focus-visible:ring-orange-500"
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="precio" className="text-sm">
                  Precio (USD) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="precio"
                    name="precio"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio}
                    onChange={handleChange}
                    className={
                      errors.precio
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-orange-200 focus-visible:ring-orange-500"
                    }
                  />
                  {formData.precio && (
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Precio en ARS: {precioARS()}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="memoria" className="text-sm">
                  Memoria (GB)
                </Label>
                <Input
                  id="memoria"
                  name="memoria"
                  value={formData.memoria}
                  onChange={handleChange}
                  className="border-orange-200 focus-visible:ring-orange-500"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="color" className="text-sm">
                  Color
                </Label>
                <Input
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="border-orange-200 focus-visible:ring-orange-500"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="bateria" className="text-sm">
                  Batería (%)
                </Label>
                <div className="relative">
                  <Input
                    id="bateria"
                    name="bateria"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.bateria}
                    onChange={handleChange}
                    className="border-orange-200 focus-visible:ring-orange-500 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        Number.parseInt(formData.bateria || 0) >= 80
                          ? "bg-green-500"
                          : Number.parseInt(formData.bateria || 0) >= 60
                            ? "bg-orange-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${formData.bateria || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="imei" className="text-sm">
                  IMEI <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="imei"
                  name="imei"
                  value={formData.imei}
                  onChange={handleChange}
                  className={
                    errors.imei
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "border-orange-200 focus-visible:ring-orange-500"
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="fechaIngreso" className="text-sm">
                  Fecha de Ingreso <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fechaIngreso"
                  name="fechaIngreso"
                  type="date"
                  value={formData.fechaIngreso}
                  onChange={handleChange}
                  className={
                    errors.fechaIngreso
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "border-orange-200 focus-visible:ring-orange-500"
                  }
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm">
                  Punto de Venta <span className="text-red-500">*</span>
                </Label>
                {puntosVenta.length > 0 ? (
                  <Select
                    value={formData.pointOfSale}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, pointOfSale: value }))}
                  >
                    <SelectTrigger
                      className={
                        errors.pointOfSale
                          ? "border-red-500 focus-visible:ring-red-500"
                          : "border-orange-200 focus-visible:ring-orange-500"
                      }
                    >
                      <SelectValue placeholder="Seleccionar punto de venta" />
                    </SelectTrigger>
                    <SelectContent>
                      {puntosVenta
                        .sort((a, b) => a.id - b.id)
                        .map((pv) => (
                          <SelectItem key={pv.id} value={pv.nombre}>
                             {pv.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-red-500">No hay puntos de venta disponibles</div>
                )}
              </div>

              <div className="space-y-1 col-span-3">
                <Label htmlFor="descripcion" className="text-sm">
                  Descripción
                </Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={2}
                  className="resize-none border-orange-200 focus-visible:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 mt-2 border-t">
              <Badge variant="outline" className="bg-orange-50 text-xs border-orange-200 text-orange-700">
                {equipment ? "Editando equipo existente" : "Nuevo equipo"}
              </Badge>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  size="sm"
                  className="text-red-500 hover:text-red-700 gap-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 gap-1"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span> Guardando...
                    </>
                  ) : (
                    <>{equipment ? "Actualizar" : "Guardar"} Equipo</>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}
