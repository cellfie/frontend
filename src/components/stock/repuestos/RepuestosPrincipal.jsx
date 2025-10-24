"use client"

import { useState, useEffect } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { AnimatePresence } from "framer-motion"
import { RepuestoHeader } from "./RepuestoHeader"
import { RepuestoTable } from "./RepuestoTable"
import { AddRepuestoModal } from "./AddRepuestoModal"
import {
  getRepuestos,
  searchRepuestos,
  createRepuesto,
  updateRepuesto,
  deleteRepuesto,
  adaptRepuestoToFrontend,
} from "../../../services/repuestosService"
import { getPuntosVenta } from "../../../services/puntosVentaService"

export const RepuestosPrincipal = () => {
  const [repuestos, setRepuestos] = useState([])
  const [filteredRepuestos, setFilteredRepuestos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRepuestos, setSelectedRepuestos] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingRepuesto, setEditingRepuesto] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [stockRange, setStockRange] = useState([0, 100])
  const [pointOfSale, setPointOfSale] = useState("todos")
  const [showDetails, setShowDetails] = useState(null)
  const [puntosVenta, setPuntosVenta] = useState([])
  const [selectedPuntoVentaId, setSelectedPuntoVentaId] = useState(null)
  const [maxStockAvailable, setMaxStockAvailable] = useState(100)

  // Cargar puntos de venta
  useEffect(() => {
    const fetchPuntosVenta = async () => {
      try {
        const data = await getPuntosVenta()
        setPuntosVenta(data)

        // Establecer el punto de venta por defecto (ID 1 o el primero disponible)
        if (data.length > 0) {
          const defaultPuntoVenta = data.find((pv) => pv.id === 1) || data[0]
          setSelectedPuntoVentaId(defaultPuntoVenta.id)
        }
      } catch (error) {
        console.error("Error al cargar puntos de venta:", error)
        toast.error("Error al cargar puntos de venta")
      }
    }

    fetchPuntosVenta()
  }, [])

  // Cargar repuestos
  useEffect(() => {
    const fetchRepuestos = async () => {
      setIsLoading(true)
      try {
        const data = await getRepuestos()
        // Adaptar los datos del backend al formato que espera el frontend
        const adaptedRepuestos = data.map(adaptRepuestoToFrontend)

        // Calculate maximum stock available
        if (adaptedRepuestos.length > 0) {
          const maxStock = Math.max(...adaptedRepuestos.map((p) => p.stock))
          setMaxStockAvailable(maxStock > 0 ? maxStock : 100)
          setStockRange([0, maxStock > 0 ? maxStock : 100])
        }

        setRepuestos(adaptedRepuestos)
        setFilteredRepuestos(adaptedRepuestos)
      } catch (error) {
        console.error("Error al cargar repuestos:", error)
        toast.error("Error al cargar repuestos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRepuestos()
  }, [])

  // Filtrar repuestos
  useEffect(() => {
    const applyFilters = async () => {
      setIsLoading(true)
      try {
        if (searchTerm || stockRange[0] > 0 || stockRange[1] < maxStockAvailable || pointOfSale !== "todos") {
          // Preparar parámetros para la búsqueda
          const params = {}
          if (searchTerm) params.query = searchTerm
          if (stockRange[0] > 0) params.min_stock = stockRange[0]
          if (stockRange[1] < maxStockAvailable) params.max_stock = stockRange[1]

          // Si se selecciona un punto de venta específico
          if (pointOfSale !== "todos") {
            const puntoVenta = puntosVenta.find((pv) => pv.nombre === pointOfSale)
            if (puntoVenta) params.punto_venta_id = puntoVenta.id
          }

          // Realizar la búsqueda con los filtros
          const data = await searchRepuestos(params)
          const adaptedRepuestos = data.map(adaptRepuestoToFrontend)
          setFilteredRepuestos(adaptedRepuestos)
        } else {
          // Si no hay filtros, mostrar todos los repuestos
          setFilteredRepuestos(repuestos)
        }
      } catch (error) {
        console.error("Error al filtrar repuestos:", error)
        toast.error("Error al filtrar repuestos")
      } finally {
        setIsLoading(false)
      }
    }

    applyFilters()
  }, [searchTerm, stockRange, pointOfSale, repuestos, puntosVenta, maxStockAvailable])

  const handleAddRepuesto = async (newRepuesto) => {
    try {
      setIsLoading(true)
      const result = await createRepuesto(newRepuesto)

      // Obtener todos los repuestos actualizados
      const updatedRepuestos = await getRepuestos()
      const adaptedRepuestos = updatedRepuestos.map(adaptRepuestoToFrontend)

      setRepuestos(adaptedRepuestos)
      toast.success("Repuesto agregado exitosamente")
      return result
    } catch (error) {
      console.error("Error al agregar repuesto:", error)
      toast.error(error.message || "Error al agregar repuesto")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRepuesto = async (updatedRepuesto) => {
    try {
      setIsLoading(true)

      // Log para depuración
      console.log("Repuesto a actualizar:", updatedRepuesto)

      // Actualizar el repuesto sin cambiar el punto de venta
      await updateRepuesto(updatedRepuesto.id, {
        code: updatedRepuesto.code,
        name: updatedRepuesto.name,
        marca: updatedRepuesto.marca,
        modelo: updatedRepuesto.modelo,
        description: updatedRepuesto.description,
        stock: Number(updatedRepuesto.stock),
        price: updatedRepuesto.price, // Campo agregado para enviar el precio
        // No incluimos punto_venta_id aquí, se mantendrá el original en el backend
      })

      // Actualizar la lista de repuestos
      const updatedRepuestos = await getRepuestos()
      const adaptedRepuestos = updatedRepuestos.map(adaptRepuestoToFrontend)

      // Log para depuración
      console.log("Repuestos actualizados:", adaptedRepuestos)

      setRepuestos(adaptedRepuestos)
      setFilteredRepuestos((prev) => {
        // Actualizar también los repuestos filtrados para reflejar los cambios inmediatamente
        return prev.map((p) =>
          p.id === updatedRepuesto.id ? adaptedRepuestos.find((ap) => ap.id === updatedRepuesto.id) : p,
        )
      })

      toast.success("Repuesto actualizado correctamente")
      return updatedRepuesto
    } catch (error) {
      console.error("Error al actualizar repuesto:", error)
      toast.error(error.message || "Error al actualizar repuesto")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRepuesto = async (repuestoId) => {
    try {
      setIsLoading(true)

      // Eliminar el repuesto completo
      await deleteRepuesto(repuestoId)
      toast.success("Repuesto eliminado")

      // Actualizar la lista de repuestos
      const updatedRepuestos = await getRepuestos()
      const adaptedRepuestos = updatedRepuestos.map(adaptRepuestoToFrontend)

      setRepuestos(adaptedRepuestos)
      return true
    } catch (error) {
      console.error("Error al eliminar repuesto:", error)
      toast.error(error.message || "Error al eliminar repuesto")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingRepuesto(null)
    setShowModal(true)
  }

  const openEditModal = (repuesto) => {
    // Guardar una copia profunda del repuesto para poder comparar después
    setEditingRepuesto(JSON.parse(JSON.stringify(repuesto)))
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingRepuesto(null)
  }

  const toggleRepuestoSelection = (repuestoId) => {
    setSelectedRepuestos((prev) =>
      prev.includes(repuestoId) ? prev.filter((id) => id !== repuestoId) : [...prev, repuestoId],
    )
  }

  const toggleSelectAll = (isSelected) => {
    setSelectedRepuestos(isSelected ? filteredRepuestos.map((p) => p.id) : [])
  }

  const handleExportSelected = () => {
    // Implementar exportación real si es necesario
    console.log("Exportando repuestos:", selectedRepuestos)
    toast.info(`Exportando ${selectedRepuestos.length} repuesto(s)`)
  }

  const toggleDetails = (repuestoId) => {
    setShowDetails((prev) => (prev === repuestoId ? null : repuestoId))
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <RepuestoHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        stockRange={stockRange}
        setStockRange={setStockRange}
        pointOfSale={pointOfSale}
        setPointOfSale={setPointOfSale}
        onAddClick={openAddModal}
        totalRepuestos={filteredRepuestos.length}
        puntosVenta={puntosVenta}
        maxStockAvailable={maxStockAvailable}
      />

      <RepuestoTable
        repuestos={filteredRepuestos}
        isLoading={isLoading}
        selectedRepuestos={selectedRepuestos}
        toggleRepuestoSelection={toggleRepuestoSelection}
        toggleSelectAll={toggleSelectAll}
        onExport={handleExportSelected}
        onEdit={openEditModal}
        onDelete={handleDeleteRepuesto}
        showDetails={showDetails}
        toggleDetails={toggleDetails}
      />

      <AnimatePresence>
        {showModal && (
          <AddRepuestoModal
            isOpen={showModal}
            onClose={closeModal}
            onSave={editingRepuesto ? handleUpdateRepuesto : handleAddRepuesto}
            repuesto={editingRepuesto}
            puntosVenta={puntosVenta}
            defaultPuntoVentaId={selectedPuntoVentaId}
          />
        )}
      </AnimatePresence>

      {/* React-Toastify - Solo un contenedor */}
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
