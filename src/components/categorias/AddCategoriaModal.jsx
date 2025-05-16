"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Tag, Save, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export const AddCategoriaModal = ({ isOpen, onClose, onSave, categoria }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    activo: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  useEffect(() => {
    if (isOpen && categoria) {
      setFormData({
        nombre: categoria.nombre || "",
        descripcion: categoria.descripcion || "",
        activo: categoria.activo !== undefined ? categoria.activo : true,
      })
    } else if (isOpen) {
      setFormData({
        nombre: "",
        descripcion: "",
        activo: true,
      })
    }
  }, [categoria, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const handleSwitchChange = (checked) => {
    setFormData((prev) => ({ ...prev, activo: checked }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    // Si estamos editando una categoría activa y la estamos desactivando,
    // y tiene productos asociados, mostrar diálogo de confirmación
    if (categoria && categoria.activo && !formData.activo && categoria.productos > 0) {
      setShowConfirmDialog(true)
      return
    }

    setIsSubmitting(true)
    try {
      const categoriaData = {
        ...formData,
        id: categoria?.id,
      }

      await onSave(categoriaData)
      onClose()
    } catch (error) {
      console.error("Error al guardar categoría:", error)
      throw error // Propagamos el error para que lo maneje el componente padre
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDesactivar = async () => {
    setShowConfirmDialog(false)
    setIsSubmitting(true)
    try {
      const categoriaData = {
        ...formData,
        id: categoria?.id,
      }

      await onSave(categoriaData)
      onClose()
    } catch (error) {
      console.error("Error al guardar categoría:", error)
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
            <h2 className="text-xl font-semibold flex items-center gap-2 text-orange-600">
              <Tag size={20} />
              {categoria ? "Editar Categoría" : "Agregar Nueva Categoría"}
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

            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="nombre" className="text-sm">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Accesorios, Repuestos, etc."
                  className={
                    errors.nombre
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "border-orange-200 focus-visible:ring-orange-500"
                  }
                />
                {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="descripcion" className="text-sm">
                  Descripción
                </Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción detallada de la categoría"
                  rows={3}
                  className="resize-none border-orange-200 focus-visible:ring-orange-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="activo" checked={formData.activo} onCheckedChange={handleSwitchChange} />
                <Label htmlFor="activo" className="text-sm">
                  Categoría activa
                </Label>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 mt-2 border-t">
              <Badge variant="outline" className="bg-orange-50 text-xs border-orange-200 text-orange-700">
                {categoria ? "Editando categoría existente" : "Nueva categoría"}
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
                      {categoria ? "Actualizar" : "Guardar"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Diálogo de confirmación para desactivar categoría con productos */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta categoría tiene {categoria?.productos} productos asociados. Al desactivarla, estos productos no se
              mostrarán en las búsquedas filtradas por categoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDesactivar} className="bg-orange-600 hover:bg-orange-700">
              Desactivar de todos modos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
