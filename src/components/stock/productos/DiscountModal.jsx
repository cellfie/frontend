import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, PercentCircle, AlertCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

// Función para formatear precio en formato de moneda argentina
const formatPrice = (price) => {
  const numPrice = typeof price === "number" ? price : Number(price)
  if (isNaN(numPrice)) return "$ 0,00"

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(numPrice)
}

export const DiscountModal = ({ isOpen, onClose, onSave, product }) => {
  const [formData, setFormData] = useState({
    productId: "",
    percentage: "10",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (product) {
      setFormData({
        productId: product.id,
        percentage: product.discount?.percentage?.toString() || "10",
        startDate: product.discount?.startDate || new Date().toISOString().split("T")[0],
        endDate:
          product.discount?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      })
    }
  }, [product, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const validateForm = () => {
    const newErrors = {}
    const percentage = Number.parseFloat(formData.percentage)
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      newErrors.percentage = "El porcentaje debe ser un número entre 1 y 100"
    }

    const startDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)

    if (isNaN(startDate.getTime())) {
      newErrors.startDate = "La fecha de inicio no es válida"
    }

    if (isNaN(endDate.getTime())) {
      newErrors.endDate = "La fecha de fin no es válida"
    }

    if (startDate > endDate) {
      newErrors.endDate = "La fecha de fin debe ser posterior a la fecha de inicio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      const discountData = {
        ...formData,
        percentage: Number.parseFloat(formData.percentage),
      }
      await onSave(discountData)
      onClose()
    } catch (error) {
      console.error("Error al guardar descuento:", error)
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
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
          <div className="bg-[#131321] text-white p-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-orange-500">
              <PercentCircle size={20} />
              Aplicar Descuento
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

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="product" className="text-sm">
                  Producto
                </Label>
                <Badge variant="outline" className="bg-gray-50 text-xs">
                  ID: {product?.id}
                </Badge>
              </div>
              <div className="p-2 border rounded-md bg-orange-50 border-orange-200">
                <div className="font-medium">{product?.name}</div>
                <div className="text-sm text-gray-500">{product?.code}</div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="percentage" className="text-sm">
                Porcentaje de descuento (%) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="percentage"
                  name="percentage"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={formData.percentage}
                  onChange={handleChange}
                  placeholder="10"
                  className={`pr-8 ${errors.percentage ? "border-red-500 focus-visible:ring-red-500" : "border-orange-200 focus-visible:ring-orange-500"}`}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Precio con descuento:{" "}
                <span className="font-medium text-orange-600">
                  {product
                    ? formatPrice(Number(product.price) * (1 - Number.parseInt(formData.percentage || 0) / 100))
                    : "$ 0,00"}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  (Precio original: {product?.price ? formatPrice(Number(product.price)) : "$ 0,00"})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="startDate" className="text-sm">
                  Fecha de inicio <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={`pl-9 ${errors.startDate ? "border-red-500 focus-visible:ring-red-500" : "border-orange-200 focus-visible:ring-orange-500"}`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="endDate" className="text-sm">
                  Fecha de fin <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    className={`pl-9 ${errors.endDate ? "border-red-500 focus-visible:ring-red-500" : "border-orange-200 focus-visible:ring-orange-500"}`}
                  />
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-orange-50 p-2 rounded border border-orange-100 flex items-start">
              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                El descuento estará activo desde el{" "}
                <span className="font-medium">{new Date(formData.startDate).toLocaleDateString()}</span> hasta el{" "}
                <span className="font-medium">{new Date(formData.endDate).toLocaleDateString()}</span>. Durante este
                período, el producto se mostrará con un cartel de descuento.
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 mt-2 border-t">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-orange-50 text-xs border-orange-200 text-orange-700">
                  {product?.discount ? "Modificando descuento existente" : "Nuevo descuento"}
                </Badge>
                {product?.discount && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      onSave({ productId: product.id, removeDiscount: true })
                      onClose()
                    }}
                    size="sm"
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Eliminar descuento
                  </Button>
                )}
              </div>
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
                  className="bg-orange-600 hover:bg-orange-700 gap-1"
                  size="sm"
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-1">Aplicando</span>
                      <span className="animate-spin">
                        <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                      <PercentCircle className="h-3.5 w-3.5" />
                      Aplicar Descuento
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
