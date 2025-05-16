"use client"

import { useState, useEffect } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { AnimatePresence } from "framer-motion"
import { CategoriasHeader } from "./CategoriasHeader"
import { CategoriasTable } from "./CategoriasTable"
import { AddCategoriaModal } from "./AddCategoriaModal"
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  adaptCategoriaToFrontend,
} from "../../services/categoriasService"

export const CategoriasPrincipal = () => {
  const [categorias, setCategorias] = useState([])
  const [filteredCategorias, setFilteredCategorias] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [mostrarInactivas, setMostrarInactivas] = useState(false)

  // Cargar categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      setIsLoading(true)
      try {
        const data = await getCategorias(mostrarInactivas)
        const adaptedData = data.map(adaptCategoriaToFrontend)
        setCategorias(adaptedData)
        setFilteredCategorias(adaptedData)
      } catch (err) {
        console.error("Error al cargar categorías:", err)
        toast.error("Error al cargar categorías")
      } finally {
        setIsLoading(false)
      }
    }
    fetchCategorias()
  }, [mostrarInactivas])

  // Filtrar categorías
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...categorias]

      // Filtrar por término de búsqueda
      if (searchTerm) {
        filtered = filtered.filter(
          (cat) =>
            cat.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cat.descripcion && cat.descripcion.toLowerCase().includes(searchTerm.toLowerCase())),
        )
      }

      setFilteredCategorias(filtered)
    }

    applyFilters()
  }, [searchTerm, categorias])

  const handleAddCategoria = async (newCat) => {
    try {
      const response = await createCategoria({
        nombre: newCat.nombre,
        descripcion: newCat.descripcion,
        activo: newCat.activo ? 1 : 0,
      })

      // Obtener todas las categorías nuevamente para asegurar datos actualizados
      const data = await getCategorias(mostrarInactivas)
      const adaptedData = data.map(adaptCategoriaToFrontend)
      setCategorias(adaptedData)

      toast.success("Categoría agregada exitosamente")
      return response
    } catch (err) {
      console.error("Error al agregar categoría:", err)
      toast.error(err.message || "Error al agregar categoría")
      throw err
    }
  }

  const handleUpdateCategoria = async (updated) => {
    try {
      const response = await updateCategoria(updated.id, {
        nombre: updated.nombre,
        descripcion: updated.descripcion,
        activo: updated.activo ? 1 : 0,
      })

      // Obtener todas las categorías nuevamente para asegurar datos actualizados
      const data = await getCategorias(mostrarInactivas)
      const adaptedData = data.map(adaptCategoriaToFrontend)
      setCategorias(adaptedData)

      toast.success("Categoría actualizada correctamente")
      return response
    } catch (err) {
      console.error("Error al actualizar categoría:", err)
      toast.error(err.message || "Error al actualizar categoría")
      throw err
    }
  }

  const handleDeleteCategoria = async (id) => {
    try {
      const response = await deleteCategoria(id)

      // Si la categoría fue eliminada o desactivada, actualizar la lista
      if (response.eliminada || response.desactivada) {
        // Obtener todas las categorías nuevamente
        const data = await getCategorias(mostrarInactivas)
        const adaptedData = data.map(adaptCategoriaToFrontend)
        setCategorias(adaptedData)

        toast.success(response.message)
        return true
      }

      return false
    } catch (err) {
      console.error("Error al eliminar categoría:", err)
      toast.error(err.message || "Error al eliminar categoría")
      throw err
    }
  }

  const handleToggleActive = async (categoria) => {
    try {
      const response = await updateCategoria(categoria.id, {
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        activo: !categoria.activo ? 1 : 0,
      })

      // Obtener todas las categorías nuevamente
      const data = await getCategorias(mostrarInactivas)
      const adaptedData = data.map(adaptCategoriaToFrontend)
      setCategorias(adaptedData)

      toast.success(`Categoría ${!categoria.activo ? "activada" : "desactivada"} correctamente`)
      return response
    } catch (err) {
      console.error("Error al cambiar estado de categoría:", err)
      toast.error(err.message || "Error al cambiar estado de categoría")
      throw err
    }
  }

  const openAddModal = () => {
    setEditingCategoria(null)
    setShowModal(true)
  }

  const openEditModal = (cat) => {
    setEditingCategoria(cat)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategoria(null)
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <CategoriasHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        mostrarInactivas={mostrarInactivas}
        setMostrarInactivas={setMostrarInactivas}
        onAddClick={openAddModal}
        totalCategorias={filteredCategorias.length}
      />

      <CategoriasTable
        categorias={filteredCategorias}
        isLoading={isLoading}
        onEdit={openEditModal}
        onDelete={handleDeleteCategoria}
        onToggleActive={handleToggleActive}
      />

      <AnimatePresence>
        {showModal && (
          <AddCategoriaModal
            isOpen={showModal}
            onClose={closeModal}
            onSave={editingCategoria ? handleUpdateCategoria : handleAddCategoria}
            categoria={editingCategoria}
          />
        )}
      </AnimatePresence>

      {/* React-Toastify */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={3}
      />
    </div>
  )
}
