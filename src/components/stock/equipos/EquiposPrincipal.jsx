"use client"

import { useState, useEffect, useContext } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { AnimatePresence } from "framer-motion"
import { EquipmentHeader } from "./EquipmentHeader"
import { EquipmentTable } from "./EquipmentTable"
import { AddEquipmentModal } from "./AddEquipmentModal"
import {
  getEquipos,
  searchEquipos,
  createEquipo,
  updateEquipo,
  deleteEquipo,
  adaptEquipoToFrontend,
} from "@/services/equiposService"
import { getPuntosVenta } from "@/services/puntosVentaService"
import { DollarContext } from "@/context/DollarContext"

export const EquiposPrincipal = () => {
  const [equipments, setEquipments] = useState([])
  const [filteredEquipments, setFilteredEquipments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [imeiSearch, setImeiSearch] = useState("")
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [dateRange, setDateRange] = useState(["", ""])
  const [pointOfSale, setPointOfSale] = useState("todos")
  const [showDetails, setShowDetails] = useState(null)
  const [batteryRange, setBatteryRange] = useState([0, 100])
  const [puntosVenta, setPuntosVenta] = useState([])
  const [incluirVendidos, setIncluirVendidos] = useState(true)
  const [soloCanjes, setSoloCanjes] = useState(false)
  const { dollarPrice } = useContext(DollarContext)

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

  // Cargar equipos
  useEffect(() => {
    const fetchEquipments = async () => {
      setIsLoading(true)
      try {
        const data = await getEquipos()
        const adaptedData = data.map(adaptEquipoToFrontend)
        setEquipments(adaptedData)
        setFilteredEquipments(adaptedData)
      } catch (err) {
        console.error("Error al cargar equipos:", err)
        toast.error("Error al cargar equipos")
      } finally {
        setIsLoading(false)
      }
    }
    fetchEquipments()
  }, [])

  // Recargar equipos cuando cambia el precio del dólar
  useEffect(() => {
    if (dollarPrice > 0) {
      const fetchEquipments = async () => {
        try {
          const data = await getEquipos()
          const adaptedData = data.map(adaptEquipoToFrontend)
          setEquipments(adaptedData)
          setFilteredEquipments(adaptedData)
        } catch (err) {
          console.error("Error al recargar equipos:", err)
        }
      }
      fetchEquipments()
    }
  }, [dollarPrice])

  // Filtrar equipos
  useEffect(() => {
    const applyFilters = async () => {
      setIsLoading(true)
      try {
        // Si no hay filtros activos, mostrar todos los equipos
        if (
          !searchTerm &&
          !imeiSearch &&
          priceRange[0] === 0 &&
          priceRange[1] === 5000 &&
          dateRange[0] === "" &&
          dateRange[1] === "" &&
          pointOfSale === "todos" &&
          batteryRange[0] === 0 &&
          batteryRange[1] === 100 &&
          incluirVendidos &&
          !soloCanjes
        ) {
          setFilteredEquipments(equipments)
          setIsLoading(false)
          return
        }

        // Filtrar localmente si solo hay búsqueda por IMEI
        if (imeiSearch && !searchTerm) {
          const filtered = equipments.filter(
            (equipo) => equipo.imei && equipo.imei.toLowerCase().includes(imeiSearch.toLowerCase()),
          )
          setFilteredEquipments(filtered)
          setIsLoading(false)
          return
        }

        // Preparar parámetros para la búsqueda
        const params = {
          query: searchTerm,
          imei: imeiSearch,
          min_precio: priceRange[0],
          max_precio: priceRange[1],
          min_bateria: batteryRange[0],
          max_bateria: batteryRange[1],
          fecha_inicio: dateRange[0] || undefined,
          fecha_fin: dateRange[1] || undefined,
          incluir_vendidos: incluirVendidos.toString(),
          solo_canjes: soloCanjes.toString(),
        }

        // Agregar punto de venta si no es "todos"
        if (pointOfSale !== "todos") {
          const puntoVenta = puntosVenta.find((pv) => pv.nombre === pointOfSale)
          if (puntoVenta) {
            params.punto_venta_id = puntoVenta.id
          }
        }

        // Buscar equipos con los filtros
        const data = await searchEquipos(params)
        const adaptedData = data.map(adaptEquipoToFrontend)
        setFilteredEquipments(adaptedData)
      } catch (err) {
        console.error("Error al filtrar equipos:", err)
        toast.error("Error al filtrar equipos")
        setFilteredEquipments(equipments)
      } finally {
        setIsLoading(false)
      }
    }

    // Aplicar filtros con un pequeño retraso para evitar demasiadas llamadas
    const timer = setTimeout(() => {
      applyFilters()
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
    equipments,
    puntosVenta,
  ])

  const handleAddEquipment = async (newEq) => {
    try {
      // Convertir el punto de venta de nombre a ID
      const puntoVenta = puntosVenta.find((pv) => pv.nombre === newEq.pointOfSale)
      if (!puntoVenta) {
        console.error(
          "Punto de venta no encontrado:",
          newEq.pointOfSale,
          "Puntos disponibles:",
          puntosVenta.map((p) => p.nombre),
        )
        throw new Error(
          `Punto de venta "${newEq.pointOfSale}" no encontrado. Por favor seleccione un punto de venta válido.`,
        )
      }

      // Preparar datos para el backend
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

      // Crear equipo en el backend
      const response = await createEquipo(equipoData)

      // Obtener el equipo creado y adaptarlo
      const createdEquipo = await getEquipos()
      const newEquipos = createdEquipo.map(adaptEquipoToFrontend)

      // Actualizar estado
      setEquipments(newEquipos)
      toast.success("Equipo agregado exitosamente")
      return response
    } catch (err) {
      console.error("Error al agregar equipo:", err)
      toast.error(err.message || "Error al agregar equipo")
      throw err
    }
  }

  const handleUpdateEquipment = async (updated) => {
    try {
      // Convertir el punto de venta de nombre a ID
      const puntoVenta = puntosVenta.find((pv) => pv.nombre === updated.pointOfSale)
      if (!puntoVenta) {
        console.error(
          "Punto de venta no encontrado:",
          updated.pointOfSale,
          "Puntos disponibles:",
          puntosVenta.map((p) => p.nombre),
        )
        throw new Error(
          `Punto de venta "${updated.pointOfSale}" no encontrado. Por favor seleccione un punto de venta válido.`,
        )
      }

      // Preparar datos para el backend
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
        es_canje: updated.es_canje || false,
        cliente_canje_id: updated.cliente_canje_id || null,
        venta_canje_id: updated.venta_canje_id || null,
        // No enviamos tipo_cambio, el servidor lo manejará
      }

      // Actualizar equipo en el backend
      await updateEquipo(updated.id, equipoData)

      // Obtener equipos actualizados
      const updatedEquipos = await getEquipos()
      const newEquipos = updatedEquipos.map(adaptEquipoToFrontend)

      // Actualizar estado
      setEquipments(newEquipos)
      toast.success("Equipo actualizado correctamente")
      return updated
    } catch (err) {
      console.error("Error al actualizar equipo:", err)
      toast.error(err.message || "Error al actualizar equipo")
      throw err
    }
  }

  const handleDeleteEquipment = async (id) => {
    try {
      // Eliminar equipo en el backend
      await deleteEquipo(id)

      // Actualizar estado
      setEquipments((prev) => prev.filter((e) => e.id !== id))
      toast.success("Equipo eliminado")
      return true
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
        totalEquipment={filteredEquipments.length}
        puntosVenta={puntosVenta}
        incluirVendidos={incluirVendidos}
        setIncluirVendidos={setIncluirVendidos}
        soloCanjes={soloCanjes}
        setSoloCanjes={setSoloCanjes}
      />

      <EquipmentTable
        equipments={filteredEquipments}
        isLoading={isLoading}
        onEdit={openEditModal}
        onDelete={handleDeleteEquipment}
        showDetails={showDetails}
        toggleDetails={toggleDetails}
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
