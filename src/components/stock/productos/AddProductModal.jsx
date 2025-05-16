import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Package, Save, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { getCategorias } from "../../../services/categoriasService"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NumericFormat } from "react-number-format"

export const AddProductModal = ({ isOpen, onClose, onSave, product, puntosVenta = [], defaultPuntoVentaId = null }) => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    price: "",
    stock: "",
    punto_venta_id: "",
    categoria_id: "0",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [categorias, setCategorias] = useState([])
  const [key, setKey] = useState(0) // Clave para forzar re-renderizado

  // Cargar categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const data = await getCategorias()
        setCategorias(data)
      } catch (error) {
        console.error("Error al cargar categorías:", error)
      }
    }

    fetchCategorias()
  }, [])

  // Modificar el useEffect para manejar correctamente el precio al cargar el producto

  // Este useEffect se ejecuta cuando se abre el modal o cambia el producto
  useEffect(() => {
    if (isOpen) {
      if (product) {
        // Convertir los IDs a string para que funcionen con el componente Select
        const punto_venta_id = product.punto_venta_id ? product.punto_venta_id.toString() : ""
        const categoria_id = product.categoria_id ? product.categoria_id.toString() : "0"

        // Para el precio, guardamos el valor numérico directamente
        const newFormData = {
          name: product.name || "",
          code: product.code || "",
          description: product.description || "",
          price: product.price, // Guardamos el precio como número
          stock: product.stock?.toString() || "",
          punto_venta_id: punto_venta_id,
          categoria_id: categoria_id,
        }
        setFormData(newFormData)

        // Forzar re-renderizado para asegurar que los selects se actualicen
        setKey((prevKey) => prevKey + 1)
      } else {
        // Si estamos creando un nuevo producto
        const defaultPuntoVenta =
          defaultPuntoVentaId ||
          (puntosVenta.length > 0 ? puntosVenta.find((pv) => pv.id === 1)?.id || puntosVenta[0].id : "")

        setFormData({
          name: "",
          code: "",
          description: "",
          price: "",
          stock: "",
          punto_venta_id: defaultPuntoVenta.toString(),
          categoria_id: "0",
        })
      }
    }
  }, [product, isOpen, puntosVenta, defaultPuntoVentaId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  // Modificar la función validateForm para incluir la validación de precio máximo
  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido"
    if (!formData.code.trim()) newErrors.code = "El código es requerido"

    // Validar que el precio sea un número positivo y no exceda el límite
    const price = formData.price
    const PRECIO_MAXIMO = 99999999.99

    if (isNaN(price) || price <= 0) {
      newErrors.price = "El precio debe ser un número positivo"
    } else if (price > PRECIO_MAXIMO) {
      newErrors.price = `El precio no puede ser mayor a $99.999.999,99`
    }

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

  // Modificar la función handleSubmit para manejar correctamente el precio

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      // Preparar los datos para enviar al backend
      const productData = {
        ...formData,
        // El precio ya está como número gracias al onValueChange del NumericFormat
        price: formData.price,
        stock: Number.parseInt(formData.stock),
        id: product?.id,
        // Convertir "0" a null para la categoría
        categoria_id: formData.categoria_id === "0" ? null : Number(formData.categoria_id),
        punto_venta_id: Number(formData.punto_venta_id),
      }

      // Usamos onSave para manejar el éxito, el toast se mostrará en el componente padre
      await onSave(productData)
      onClose()
    } catch (error) {
      console.error("Error al guardar producto:", error)
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
              {product ? "Editar Producto" : "Agregar Nuevo Producto"}
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
                    <Package className="h-3.5 w-3.5 mr-1 text-gray-400" /> INFORMACIÓN DEL PRODUCTO
                  </h3>
                </div>
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
                <Label htmlFor="price" className="text-sm">
                  Precio ($) <span className="text-red-500">*</span>
                </Label>
                <NumericFormat
                  id="price"
                  name="price"
                  value={formData.price}
                  onValueChange={(values) => {
                    // Usamos el valor formateado directamente para evitar problemas de conversión
                    const { formattedValue, floatValue } = values
                    // Verificar si el valor excede el límite
                    const PRECIO_MAXIMO = 99999999.99

                    // Guardamos el valor numérico real, no el string formateado
                    setFormData((prev) => ({ ...prev, price: floatValue }))

                    // Mostrar error si excede el límite
                    if (floatValue > PRECIO_MAXIMO) {
                      setErrors((prev) => ({ ...prev, price: `El precio no puede ser mayor a $99.999.999,99` }))
                    } else if (errors.price) {
                      setErrors((prev) => ({ ...prev, price: "" }))
                    }
                  }}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="$ "
                  decimalScale={2}
                  isAllowed={(values) => {
                    const { floatValue } = values
                    return floatValue === undefined || floatValue <= 99999999.99
                  }}
                  className={`w-full h-9 px-3 py-2 border rounded-md ${
                    errors.price ? "border-red-500 focus-visible:ring-red-500" : "border-orange-200"
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2`}
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
                <Label htmlFor="categoria_id" className="text-sm">
                  Categoría
                </Label>
                <Select
                  key={`categoria-${key}`}
                  value={formData.categoria_id}
                  onValueChange={(value) => handleSelectChange("categoria_id", value)}
                  defaultValue={formData.categoria_id}
                >
                  <SelectTrigger className="border-orange-200 focus-visible:ring-orange-500 h-9">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sin categoría</SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id.toString()}>
                        {categoria.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  disabled={product !== null} // Deshabilitar si estamos editando un producto existente
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
                {product && (
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
                {product ? "Editando producto existente" : "Nuevo producto"}
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
                      {product ? "Actualizar" : "Guardar"} Producto
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
