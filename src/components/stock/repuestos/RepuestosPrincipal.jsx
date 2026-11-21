"use client"

import { useState, useEffect, useMemo } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { AnimatePresence } from "framer-motion"
import { RepuestoHeader } from "./RepuestoHeader"
import { RepuestoTable } from "./RepuestoTable"
import { AddRepuestoModal } from "./AddRepuestoModal"
import {
  getRepuestos,
  createRepuesto,
  updateRepuesto,
  deleteRepuesto,
  adaptRepuestoToFrontend,
} from "../../../services/repuestosService"
import { getPuntosVenta } from "../../../services/puntosVentaService"

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export const RepuestosPrincipal = () => {
  const [repuestos, setRepuestos] = useState([])
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

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Cargar puntos de venta
  useEffect(() => {
    const fetchPuntosVenta = async () => {
      try {
        const data = await getPuntosVenta()
        setPuntosVenta(data)

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

  // Cargar repuestos (una sola vez; el filtrado es local)
  useEffect(() => {
    const fetchRepuestos = async () => {
      setIsLoading(true)
      try {
        const data = await getRepuestos()
        const list = Array.isArray(data) ? data : []
        const adaptedRepuestos = list.map(adaptRepuestoToFrontend)

        if (adaptedRepuestos.length > 0) {
          const stocks = adaptedRepuestos.map((p) => Number(p.stock)).filter((n) => Number.isFinite(n))
          const maxPositivo = stocks.length ? Math.max(0, ...stocks) : 0
          const maxStock = maxPositivo > 0 ? maxPositivo : 100
          setMaxStockAvailable(maxStock)
          setStockRange([0, maxStock])
        }

        setRepuestos(adaptedRepuestos)
      } catch (error) {
        console.error("Error al cargar repuestos:", error)
        toast.error("Error al cargar repuestos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRepuestos()
  }, [])

  // Filtrado local: evita llamadas a /search en cada tecla (y el toast de error)
  const filteredRepuestos = useMemo(() => {
    const term = (debouncedSearchTerm || "").trim().toLowerCase()
    const [minStock, maxStock] = stockRange
    const filtrarPorStock = minStock > 0 || maxStock < maxStockAvailable

    return repuestos.filter((r) => {
      if (term) {
        const nombre = (r.name || "").toLowerCase()
        const desc = (r.description || "").toLowerCase()
        if (!nombre.includes(term) && !desc.includes(term)) return false
      }

      if (pointOfSale !== "todos") {
        if ((r.pointOfSale || "") !== pointOfSale) return false
      }

      if (filtrarPorStock) {
        const stock = Number(r.stock)
        const s = Number.isFinite(stock) ? stock : 0
        // Incluir negativos cuando el mínimo es 0 (sin filtro inferior real)
        if (minStock > 0 && s < minStock) return false
        if (maxStock < maxStockAvailable && s > maxStock) return false
      }

      return true
    })
  }, [repuestos, debouncedSearchTerm, stockRange, pointOfSale, maxStockAvailable])

  const refreshRepuestos = async () => {
    const updatedRepuestos = await getRepuestos()
    const list = Array.isArray(updatedRepuestos) ? updatedRepuestos : []
    const adaptedRepuestos = list.map(adaptRepuestoToFrontend)
    setRepuestos(adaptedRepuestos)

    if (adaptedRepuestos.length > 0) {
      const stocks = adaptedRepuestos.map((p) => Number(p.stock)).filter((n) => Number.isFinite(n))
      const maxPositivo = stocks.length ? Math.max(0, ...stocks) : 0
      const maxStock = maxPositivo > 0 ? maxPositivo : 100
      setMaxStockAvailable(maxStock)
      setStockRange((prev) => {
        // Mantener filtro de stock solo si seguía en el rango “completo”
        if (prev[0] === 0 && prev[1] === maxStockAvailable) return [0, maxStock]
        return [Math.min(prev[0], maxStock), Math.min(prev[1], maxStock)]
      })
    }

    return adaptedRepuestos
  }

  const handleAddRepuesto = async (newRepuesto) => {
    try {
      setIsLoading(true)
      const result = await createRepuesto(newRepuesto)
      await refreshRepuestos()
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

      await updateRepuesto(updatedRepuesto.id, {
        code: updatedRepuesto.code,
        name: updatedRepuesto.name,
        marca: updatedRepuesto.marca,
        modelo: updatedRepuesto.modelo,
        description: updatedRepuesto.description,
        stock: Number(updatedRepuesto.stock),
        price: updatedRepuesto.price,
      })

      await refreshRepuestos()
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
      await deleteRepuesto(repuestoId)
      toast.success("Repuesto eliminado")
      await refreshRepuestos()
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
