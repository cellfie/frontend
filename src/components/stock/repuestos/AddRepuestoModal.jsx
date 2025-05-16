"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Package, Save, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const AddRepuestoModal = ({
  isOpen,
  onClose,
  onSave,
  repuesto,
  puntosVenta = [],
  defaultPuntoVentaId = null,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    marca: "",
    modelo: "",
    description: "",
    stock: "",
    punto_venta_id: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [key, setKey] = useState(0) // Clave para forzar re-renderizado

  // Este useEffect se ejecuta cuando se abre el modal o cambia el repuesto
  useEffect(() => {
    if (isOpen) {
      if (repuesto) {
        // Convertir los IDs a string para que funcionen con el componente Select
        const punto_venta_id = repuesto.punto_venta_id ? repuesto.punto_venta_id.toString() : ""

        const newFormData = {
          name: repuesto.name || "",
          code: repuesto.code || "",
          marca: repuesto.marca || "",
          modelo: repuesto.modelo || "",
          description: repuesto.description || "",
          stock: repuesto.stock?.toString() || "",
          punto_venta_id: punto_venta_id,
        }

        console.log("Cargando datos del repuesto:", newFormData)
        setFormData(newFormData)

        // Forzar re-renderizado para asegurar que los selects se actualicen
        setKey((prevKey) => prevKey + 1)
      } else {
        // Si estamos creando un nuevo repuesto
        const defaultPuntoVenta =
          defaultPuntoVentaId ||
          (puntosVenta.length > 0 ? puntosVenta.find((pv) => pv.id === 1)?.id || puntosVenta[0].id : "")

        setFormData({
          name: "",
          code: "",
          marca: "",
          modelo: "",
          description: "",
          stock: "",
          punto_venta_id: defaultPuntoVenta.toString(),
        })
      }
    }
  }, [repuesto, isOpen, puntosVenta, defaultPuntoVentaId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido"
    if (!formData.code.trim()) newErrors.code = "El código es requerido"
    if (!formData.marca.trim()) newErrors.marca = "La marca es requerida"

    const stock = Number.parseInt(formData.stock)
    if (isNaN(stock) || stock < 0) {
      newErrors.stock = "El stock debe ser un número no negativo"
    }
    if (!formData.punto_venta_id) {
      newErrors.punto_venta_id = "El punto de venta es requerido"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      // Preparar los datos para enviar al backend
      const repuestoData = {
        ...formData,
        stock: Number.parseInt(formData.stock),
        id: repuesto?.id,
        punto_venta_id: Number(formData.punto_venta_id),
      }

      console.log("Datos a enviar:", repuestoData)

      // Usamos onSave para manejar el éxito, el toast se mostrará en el componente padre
      await onSave(repuestoData)
      onClose()
    } catch (error) {
      console.error("Error al guardar repuesto:", error)
      throw error // Propagamos el error para que lo maneje el componente padre
    } finally {
      setIsSubmitting(false)
    }
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
              <Package size={20} />
              {repuesto ? "Editar Repuesto" : "Agregar Nuevo Repuesto"}
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

            <div className="grid grid-cols-4 gap-x-3 gap-y-3">
              <div className="col-span-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-medium text-gray-500 flex items-center">
                    <Package className="h-3.5 w-3.5 mr-1 text-gray-400" /> INFORMACIÓN DEL REPUESTO
                  </h3>
                </div>
              </div>

              {/* Nombre y Código en la primera fila */}
              <div className="space-y-1 col-span-3">
                <Label htmlFor="name" className="text-sm">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={
                    errors.name
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "border-orange-200 focus-visible:ring-orange-500"
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="code" className="text-sm">
                  Código <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  maxLength={23}
                  className={
                    errors.code
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "border-orange-200 focus-visible:ring-orange-500"
                  }
                />
              </div>

              {/* Marca, Modelo, Stock y Punto de Venta en la misma fila */}
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
                  Modelo
                </Label>
                <Input
                  id="modelo"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange}
                  className="border-orange-200 focus-visible:ring-orange-500"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="stock" className="text-sm">
                  Stock <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="0"
                  className={
                    errors.stock
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "border-orange-200 focus-visible:ring-orange-500"
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="punto_venta_id" className="text-sm">
                  Punto de Venta <span className="text-red-500">*</span>
                </Label>
                <Select
                  key={`punto-venta-${key}`}
                  value={formData.punto_venta_id}
                  onValueChange={(value) => handleSelectChange("punto_venta_id", value)}
                  defaultValue={formData.punto_venta_id}
                  disabled={repuesto !== null} // Deshabilitar si estamos editando un repuesto existente
                >
                  <SelectTrigger
                    className={`h-9 ${
                      errors.punto_venta_id
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-orange-200 focus-visible:ring-orange-500"
                    }`}
                  >
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {puntosVenta.map((pv) => (
                      <SelectItem key={pv.id} value={pv.id.toString()}>
                        {pv.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {repuesto && (
                  <p className="text-xs text-amber-600 mt-1">
                    <span className="inline-flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      No modificable
                    </span>
                  </p>
                )}
              </div>

              {/* Descripción en la última fila */}
              <div className="space-y-1 col-span-4">
                <Label htmlFor="description" className="text-sm">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  className="resize-none border-orange-200 focus-visible:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 mt-2 border-t">
              <Badge variant="outline" className="bg-orange-50 text-xs border-orange-200 text-orange-700">
                {repuesto ? "Editando repuesto existente" : "Nuevo repuesto"}
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
                    <>
                      <Save className="h-3.5 w-3.5" />
                      {repuesto ? "Actualizar" : "Guardar"} Repuesto
                    </>
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
