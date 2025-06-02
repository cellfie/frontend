"use client"

import { useState, useEffect, useContext } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { AnimatePresence } from "framer-motion"
import { EquipmentHeader } from "./EquipmentHeader"
import { EquipmentTable } from "./EquipmentTable"
import { AddEquipmentModal } from "./AddEquipmentModal"
import { PaginationControls } from "@/lib/PaginationControls"
import {
  getEquiposPaginados,
  createEquipo,
  updateEquipo,
  deleteEquipo,
  adaptEquipoToFrontend,
} from "@/services/equiposService"
import { getPuntosVenta } from "@/services/puntosVentaService"
import { DollarContext } from "@/context/DollarContext"

export const EquiposPrincipal = () => {
  const [equipments, setEquipments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [imeiSearch, setImeiSearch] = useState("")
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [dateRange, setDateRange] = useState({ from: null, to: null })
  const [pointOfSale, setPointOfSale] = useState("todos")
  const [showDetails, setShowDetails] = useState(null)
  const [batteryRange, setBatteryRange] = useState([0, 100])
  const [puntosVenta, setPuntosVenta] = useState([])
  const [incluirVendidos, setIncluirVendidos] = useState(true)
  const [soloCanjes, setSoloCanjes] = useState(false)
  const { dollarPrice } = useContext(DollarContext)

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalEquipments, setTotalEquipments] = useState(0)
  const [itemsPerPage] = useState(50)

  // Cargar puntos de venta
  useEffect(() => {
    const fetchPuntosVenta = async () => {
      try {
        const data = await getPuntosVenta()
        setPuntosVenta(data)
      } catch (err) {
        console.error("Error al cargar puntos de venta:", err)
      }
    }
    fetchPuntosVenta()
  }, [])

  // Función para formatear fecha local sin conversión UTC
  const formatLocalDate = (date) => {
    if (!date) return null
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const seconds = String(date.getSeconds()).padStart(2, "0")
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  // Función para construir filtros
  const buildFilters = () => {
    const filters = {
      page: currentPage,
      limit: itemsPerPage,
    }

    if (searchTerm) filters.query = searchTerm
    if (imeiSearch) filters.imei = imeiSearch
    if (pointOfSale !== "todos") {
      const puntoVenta = puntosVenta.find((pv) => pv.nombre === pointOfSale)
      if (puntoVenta) filters.punto_venta_id = puntoVenta.id
    }
    if (priceRange[0] > 0) filters.min_precio = priceRange[0]
    if (priceRange[1] < 5000) filters.max_precio = priceRange[1]
    if (batteryRange[0] > 0) filters.min_bateria = batteryRange[0]
    if (batteryRange[1] < 100) filters.max_bateria = batteryRange[1]

    // Formatear fechas correctamente
    if (dateRange.from) {
      const fechaInicio = new Date(dateRange.from)
      fechaInicio.setHours(0, 0, 0, 0)
      filters.fecha_inicio = formatLocalDate(fechaInicio)
    }

    if (dateRange.to) {
      const fechaFin = new Date(dateRange.to)
      fechaFin.setHours(23, 59, 59, 999)
      filters.fecha_fin = formatLocalDate(fechaFin)
    }

    filters.incluir_vendidos = incluirVendidos.toString()
    filters.solo_canjes = soloCanjes.toString()

    return filters
  }

  // Cargar equipos con paginación
  const fetchEquipments = async (resetPage = false) => {
    setIsLoading(true)
    try {
      const page = resetPage ? 1 : currentPage
      const filters = { ...buildFilters(), page }

      const response = await getEquiposPaginados(filters)
      const adaptedData = response.equipos.map(adaptEquipoToFrontend)

      setEquipments(adaptedData)
      setTotalPages(response.pagination.totalPages)
      setTotalEquipments(response.pagination.total)

      if (resetPage) {
        setCurrentPage(1)
      }
    } catch (err) {
      console.error("Error al cargar equipos:", err)
      toast.error("Error al cargar equipos")
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar equipos inicialmente
  useEffect(() => {
    fetchEquipments()
  }, [currentPage])

  // Aplicar filtros con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEquipments(true) // Reset page when filters change
    }, 500)

    return () => clearTimeout(timer)
  }, [
    searchTerm,
    imeiSearch,
    priceRange,
    dateRange,
    pointOfSale,
    batteryRange,
    incluirVendidos,
    soloCanjes,
    puntosVenta,
  ])

  // Recargar equipos cuando cambia el precio del dólar
  useEffect(() => {
    if (dollarPrice > 0) {
      fetchEquipments()
    }
  }, [dollarPrice])

  const handleAddEquipment = async (newEq) => {
    try {
      const puntoVenta = puntosVenta.find((pv) => pv.nombre === newEq.pointOfSale)
      if (!puntoVenta) {
        throw new Error(`Punto de venta "${newEq.pointOfSale}" no encontrado.`)
      }

      const equipoData = {
        marca: newEq.marca,
        modelo: newEq.modelo,
        memoria: newEq.memoria,
        color: newEq.color,
        bateria: Number.parseInt(newEq.bateria) || 0,
        precio: Number.parseFloat(newEq.precio),
        descripcion: newEq.descripcion,
        imei: newEq.imei,
        fecha_ingreso: newEq.fechaIngreso,
        punto_venta_id: puntoVenta.id,
        tipo_cambio: dollarPrice || 1200,
        es_canje: newEq.es_canje || false,
        cliente_canje_id: newEq.cliente_canje_id || null,
        venta_canje_id: newEq.venta_canje_id || null,
      }

      await createEquipo(equipoData)
      await fetchEquipments()
      toast.success("Equipo agregado exitosamente")
    } catch (err) {
      console.error("Error al agregar equipo:", err)
      toast.error(err.message || "Error al agregar equipo")
      throw err
    }
  }

  const handleUpdateEquipment = async (updated) => {
    try {
      const puntoVenta = puntosVenta.find((pv) => pv.nombre === updated.pointOfSale)
      if (!puntoVenta) {
        throw new Error(`Punto de venta "${updated.pointOfSale}" no encontrado.`)
      }

      const equipoData = {
        marca: updated.marca,
        modelo: updated.modelo,
        memoria: updated.memoria,
        color: updated.color,
        bateria: Number.parseInt(updated.bateria) || 0,
        precio: Number.parseFloat(updated.precio),
        descripcion: updated.descripcion,
        imei: updated.imei,
        fecha_ingreso: updated.fechaIngreso,
        punto_venta_id: puntoVenta.id,
      }

      await updateEquipo(updated.id, equipoData)
      await fetchEquipments()
      toast.success("Equipo actualizado correctamente")
    } catch (err) {
      console.error("Error al actualizar equipo:", err)
      toast.error(err.message || "Error al actualizar equipo")
      throw err
    }
  }

  const handleDeleteEquipment = async (id) => {
    try {
      await deleteEquipo(id)
      await fetchEquipments()
      toast.success("Equipo eliminado")
    } catch (err) {
      console.error("Error al eliminar equipo:", err)
      toast.error(err.message || "Error al eliminar equipo")
      throw err
    }
  }

  const openAddModal = () => {
    setEditingEquipment(null)
    setShowModal(true)
  }

  const openEditModal = (eq) => {
    setEditingEquipment(eq)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingEquipment(null)
  }

  const toggleDetails = (id) => setShowDetails((prev) => (prev === id ? null : id))

  return (
    <div className="container mx-auto px-4 py-4">
      <EquipmentHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        imeiSearch={imeiSearch}
        setImeiSearch={setImeiSearch}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        dateRange={dateRange}
        setDateRange={setDateRange}
        pointOfSale={pointOfSale}
        setPointOfSale={setPointOfSale}
        batteryRange={batteryRange}
        setBatteryRange={setBatteryRange}
        onAddClick={openAddModal}
        totalEquipment={totalEquipments}
        puntosVenta={puntosVenta}
        incluirVendidos={incluirVendidos}
        setIncluirVendidos={setIncluirVendidos}
        soloCanjes={soloCanjes}
        setSoloCanjes={setSoloCanjes}
      />

      <EquipmentTable
        equipments={equipments}
        isLoading={isLoading}
        onEdit={openEditModal}
        onDelete={handleDeleteEquipment}
        showDetails={showDetails}
        toggleDetails={toggleDetails}
      />

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalEquipments}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
      />

      <AnimatePresence>
        {showModal && (
          <AddEquipmentModal
            isOpen={showModal}
            onClose={closeModal}
            onSave={editingEquipment ? handleUpdateEquipment : handleAddEquipment}
            equipment={editingEquipment}
            puntosVenta={puntosVenta}
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
