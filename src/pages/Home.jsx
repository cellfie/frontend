"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState, useEffect, useContext, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import ReactTooltip from "react-tooltip"
import {
  Search,
  ShoppingBag,
  Smartphone,
  PenToolIcon as Tool,
  Edit,
  Check,
  X,
  Loader2,
  Trash2,
  Plus,
  Save,
  CheckCircle,
  Clock,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCurrentUser } from "../services/authService"
import { getVentas } from "../services/ventasService"
import { searchProductos } from "../services/productosService"
import { getVentasEquipos } from "../services/ventasEquiposService"
import { getNotas, createNota, deleteNota, toggleNotaCompletada } from "../services/notasService"
import { getReparaciones } from "../services/reparacionesService"
import { getTipoCambio } from "../services/tipoCambioService"
import { useNavigate } from "react-router-dom"
import { DollarContext } from "@/context/DollarContext"
import ReparacionesPendientes from "@/components/ReparacionesPedientes"

export default function Home() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [username, setUsername] = useState("Usuario")
  const [userInitials, setUserInitials] = useState("US")
  const { dollarPrice, updateDollarPrice, loading: loadingDollar } = useContext(DollarContext)
  const [editingDollar, setEditingDollar] = useState(false)
  const [tempDollarPrice, setTempDollarPrice] = useState(dollarPrice)

  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState("")
  const [notesLoading, setNotesLoading] = useState(false)
  const [ventasHoy, setVentasHoy] = useState({
    cantidad: 0,
    monto: 0,
    trend: "+0%",
    trendUp: true,
  })
  const [equiposVendidosHoy, setEquiposVendidosHoy] = useState({
    cantidad: 0,
    trend: "+0%",
    trendUp: true,
  })
  const [reparacionesPendientes, setReparacionesPendientes] = useState({
    cantidad: 0,
    trend: "0%",
    trendUp: true,
  })

  // Función para cargar el precio del dólar directamente desde la API
  const fetchDollarPrice = useCallback(async () => {
    try {
      const price = await getTipoCambio()
      if (price > 0) {
        updateDollarPrice(price)
        setTempDollarPrice(price)
      }
    } catch (error) {
      console.error("Error al obtener el precio del dólar:", error)
    }
  }, [updateDollarPrice])

  // Efecto para cargar el precio del dólar al iniciar
  useEffect(() => {
    fetchDollarPrice()
  }, [fetchDollarPrice])

  // Función para cargar las reparaciones pendientes
  const fetchReparacionesPendientes = useCallback(async () => {
    try {
      const params = {
        estado: "pendiente",
      }
      const reparacionesData = await getReparaciones(params)

      // Calcular el total de reparaciones pendientes
      const cantidad = reparacionesData.length

      // Actualizar el estado
      setReparacionesPendientes({
        cantidad,
        trend: "0%", // Este valor podría calcularse comparando con días anteriores
        trendUp: true,
      })
    } catch (error) {
      console.error("Error al obtener reparaciones pendientes:", error)
      toast.error("Error al cargar las reparaciones pendientes", {
        position: "bottom-right",
        autoClose: 3000,
      })
    }
  }, [])

  // Efecto para cargar las reparaciones pendientes
  useEffect(() => {
    fetchReparacionesPendientes()

    // Actualizar cada 5 minutos
    const interval = setInterval(fetchReparacionesPendientes, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [fetchReparacionesPendientes])

  // Datos para las estadísticas
  const stats = [
    {
      title: "Ventas Hoy",
      value: ventasHoy.cantidad.toString(),
      icon: ShoppingBag,
      color: "bg-orange-200 text-orange-600",
      trend: ventasHoy.trend,
      trendUp: ventasHoy.trendUp,
    },
    {
      title: "Reparaciones Pendientes",
      value: reparacionesPendientes.cantidad.toString(),
      icon: Tool,
      color: "bg-orange-200 text-orange-600",
      trend: reparacionesPendientes.trend,
      trendUp: reparacionesPendientes.trendUp,
    },
    {
      title: "Equipos Vendidos Hoy",
      value: equiposVendidosHoy.cantidad.toString(),
      icon: Smartphone,
      color: "bg-orange-200 text-orange-600",
      trend: equiposVendidosHoy.trend,
      trendUp: equiposVendidosHoy.trendUp,
    },
  ]

  // Efecto para cargar los datos del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getCurrentUser()
        if (userData) {
          setUsername(userData.nombre)

          // Generar iniciales a partir del nombre
          const initials = userData.nombre
            .split(" ")
            .map((name) => name.charAt(0))
            .join("")
            .toUpperCase()
            .substring(0, 2)

          setUserInitials(initials)
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error)
      }
    }

    fetchUserData()
  }, [])

  // Efecto para cargar las notas
  useEffect(() => {
    const fetchNotas = async () => {
      try {
        setNotesLoading(true)
        const notasData = await getNotas()
        setNotes(notasData)
      } catch (error) {
        console.error("Error al cargar notas:", error)
        toast.error("Error al cargar notas", {
          position: "bottom-right",
          autoClose: 3000,
        })
      } finally {
        setNotesLoading(false)
      }
    }

    fetchNotas()
  }, [])

  // Efecto para cargar las ventas de hoy
  useEffect(() => {
    const fetchVentasHoy = async () => {
      try {
        // Obtener la fecha de hoy en formato YYYY-MM-DD
        const today = new Date().toISOString().split("T")[0]

        // Obtener las ventas de hoy
        const params = {
          fecha_inicio: today,
          fecha_fin: today,
          anuladas: false,
        }

        const ventasData = await getVentas(params)

        // Calcular el total de ventas y el monto total
        const cantidad = ventasData.length
        const monto = ventasData.reduce((total, venta) => total + Number.parseFloat(venta.total), 0)

        // Actualizar el estado
        setVentasHoy({
          cantidad,
          monto,
          trend: "+20%", // Este valor podría calcularse comparando con días anteriores
          trendUp: true,
        })
      } catch (error) {
        console.error("Error al obtener ventas de hoy:", error)
        toast.error("Error al cargar las ventas de hoy", {
          position: "bottom-right",
          autoClose: 3000,
        })
      }
    }

    fetchVentasHoy()

    // Actualizar cada 5 minutos
    const interval = setInterval(fetchVentasHoy, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Efecto para cargar los equipos vendidos hoy
  useEffect(() => {
    const fetchEquiposVendidosHoy = async () => {
      try {
        // Obtener la fecha de hoy en formato YYYY-MM-DD
        const today = new Date().toISOString().split("T")[0]

        // Obtener las ventas de equipos de hoy
        const params = {
          fecha_inicio: today,
          fecha_fin: today,
          anuladas: false,
        }

        const equiposData = await getVentasEquipos(params)

        // Calcular el total de equipos vendidos
        const cantidad = equiposData.length

        // Actualizar el estado
        setEquiposVendidosHoy({
          cantidad,
          trend: "+15%", // Este valor podría calcularse comparando con días anteriores
          trendUp: true,
        })
      } catch (error) {
        console.error("Error al obtener equipos vendidos hoy:", error)
        toast.error("Error al cargar los equipos vendidos hoy", {
          position: "bottom-right",
          autoClose: 3000,
        })
      }
    }

    fetchEquiposVendidosHoy()

    // Actualizar cada 5 minutos
    const interval = setInterval(fetchEquiposVendidosHoy, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Efecto para la búsqueda
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchTerm.length > 1) {
        try {
          const results = await searchProductos({ query: searchTerm })
          setSearchResults(results)
          setShowResults(true)
        } catch (error) {
          console.error("Error al buscar productos:", error)
          setSearchResults([])
          setShowResults(false)
        }
      } else {
        setShowResults(false)
      }
    }

    fetchSearchResults()
  }, [searchTerm])

  // Función para manejar la selección de un producto
  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setIsSearchDialogOpen(true)
    setShowResults(false)
  }

  // Función para guardar el precio del dólar
  const saveDollarPrice = async () => {
    setIsLoading(true)
    try {
      // Convertir a número, si está vacío usar 0
      const numericValue = tempDollarPrice === "" ? 0 : Number.parseFloat(tempDollarPrice)
      await updateDollarPrice(numericValue)
      setEditingDollar(false)
      toast.success("Precio del dólar actualizado correctamente")
    } catch {
      toast.error("No se pudo actualizar el dólar")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para cancelar la edición del precio del dólar
  const cancelDollarEdit = () => {
    setTempDollarPrice(dollarPrice)
    setEditingDollar(false)
  }

  // Función para navegar a las diferentes secciones
  const navigateTo = (section) => {
    setIsLoading(true)

    if (section === "Registrar Venta") {
      navigate("/registrar/ventas-productos")
    } else if (section === "Venta de Equipos") {
      navigate("/registrar/ventas-equipos")
    } else if (section === "Registrar Reparación") {
      navigate("/registrar/reparacion")
    } else {
      setTimeout(() => {
        setIsLoading(false)
        toast.info(`Navegando a la sección: ${section}`, {
          position: "bottom-right",
          autoClose: 2000,
        })
      }, 500)
    }
  }

  // Función para agregar una nueva nota
  const addNote = async () => {
    if (newNote.trim() === "") return

    try {
      setNotesLoading(true)
      const response = await createNota({ texto: newNote })

      // Actualizar la lista de notas con la nueva nota
      setNotes([response.nota, ...notes])
      setNewNote("")

      toast.success("Nota agregada correctamente", {
        position: "bottom-right",
        autoClose: 2000,
      })
    } catch (error) {
      console.error("Error al agregar nota:", error)
      toast.error("Error al agregar nota", {
        position: "bottom-right",
        autoClose: 3000,
      })
    } finally {
      setNotesLoading(false)
    }
  }

  // Función para eliminar una nota
  const handleDeleteNote = async (id) => {
    try {
      setNotesLoading(true)
      await deleteNota(id)

      // Actualizar la lista de notas eliminando la nota
      setNotes(notes.filter((note) => note.id !== id))

      toast.info("Nota eliminada", {
        position: "bottom-right",
        autoClose: 2000,
      })
    } catch (error) {
      console.error("Error al eliminar nota:", error)
      toast.error("Error al eliminar nota", {
        position: "bottom-right",
        autoClose: 3000,
      })
    } finally {
      setNotesLoading(false)
    }
  }

  // Función para marcar una nota como completada o pendiente
  const handleToggleNoteStatus = async (id) => {
    try {
      setNotesLoading(true)
      const response = await toggleNotaCompletada(id)

      // Actualizar la lista de notas con la nota actualizada
      setNotes(notes.map((note) => (note.id === id ? response.nota : note)))

      toast.success(`Nota marcada como ${response.nota.completada ? "completada" : "pendiente"}`, {
        position: "bottom-right",
        autoClose: 2000,
      })
    } catch (error) {
      console.error("Error al actualizar estado de la nota:", error)
      toast.error("Error al actualizar estado de la nota", {
        position: "bottom-right",
        autoClose: 3000,
      })
    } finally {
      setNotesLoading(false)
    }
  }

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return ""

    // Crear la fecha a partir del string
    const date = new Date(dateString)

    // Formatear la fecha (día/mes/año)
    const formattedDate = date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

    // Formatear la hora (solo horas y minutos)
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const formattedTime = `${hours}:${minutes}`

    return `${formattedDate} ${formattedTime}`
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl bg-gray-200">
      <ToastContainer />
      <ReactTooltip id="my-tooltip" />

      {/* Overlay de carga */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-orange-600" />
          </div>
        </div>
      )}

      {/* Header con bienvenida, notificaciones y precio del dólar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-orange-200">
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback className="bg-orange-200 text-orange-600">{userInitials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight ">
                Bienvenido, <span className="text-orange-600">{username}</span>
              </h1>
              <p className="text-muted-foreground text-sm">
                {new Date().toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[#131321] p-3 rounded-lg border border-[#131321]"
          >
            <div className="flex items-center gap-2">
              <div>
                <p className="text-xs font-medium text-gray-100">Precio del Dólar</p>
                {editingDollar ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={tempDollarPrice}
                      onChange={(e) => {
                        // Permitir valores vacíos o números con hasta 2 decimales
                        const value = e.target.value
                        if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                          setTempDollarPrice(value)
                        }
                      }}
                      className="w-24 h-8 text-sm bg-gray-300 mt-2"
                    />
                    <Button size="icon" variant="ghost" onClick={saveDollarPrice} className="h-7 w-7">
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={cancelDollarEdit} className="h-7 w-7">
                      <X className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-orange-600">${dollarPrice.toFixed(2)}</span>
                    <Button
                      size="icon"
                      onClick={() => setEditingDollar(true)}
                      className="h-7 w-7 bg-[#131321] hover:bg-[#131321]"
                    >
                      <Edit className="h-3.5 w-3.5 text-gray-100 " />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-6 relative"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar productos"
            className="pl-10 py-6 text-base bg-white "
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Resultados de búsqueda */}
        <AnimatePresence>
          {showResults && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 mt-2 w-full bg-white rounded-lg border shadow-lg"
            >
              <div className="p-2">
                <p className="text-sm text-muted-foreground px-3 py-2 flex items-center gap-2">
                  <Search className="h-3.5 w-3.5" />
                  {searchResults.length} resultados encontrados
                </p>
                {searchResults.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="px-3 py-2 hover:bg-gray-300 rounded-md cursor-pointer flex justify-between items-center"
                    onClick={() => handleProductSelect(product)}
                  >
                    <div>
                      <p className="font-medium">{product.nombre}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs py-0 h-5">
                          {product.categoria || "Sin categoría"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Stock: {product.stock || 0}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#0b0044]">${product.precio?.toFixed(2) || "0.00"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {product.stock > 10 ? (
                          <span className="text-green-600">Disponible</span>
                        ) : product.stock > 0 ? (
                          <span className="text-amber-600">Stock bajo</span>
                        ) : (
                          <span className="text-red-600">Sin stock</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                {searchResults.length > 5 && (
                  <p className="text-sm text-center text-[#0b0044] p-2 border-t hover:bg-brand-50 cursor-pointer">
                    + {searchResults.length - 5} productos más
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tabs para cambiar entre vistas */}
      <Tabs defaultValue="overview" className="mb-6 " value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-4 bg-[#131321] text-gray-200">
          <TabsTrigger value="overview" className="data-[state=active]:text-orange-500">
            Vista General
          </TabsTrigger>
          <TabsTrigger value="repairs" className="data-[state=active]:text-orange-500">
            Reparaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Estadísticas rápidas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <Card className="overflow-hidden border-t-4 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.color}`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/*accesos rápidos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Accesos rápidos */}
            <Card className="lg:col-span-6 bg-[#131321]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-200">Accesos Rápidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                    <Card
                      className="cursor-pointer hover:border-[#0b0044] hover:bg-gray-100 transition-all duration-300"
                      onClick={() => navigateTo("Registrar Venta")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-orange-200 p-2 rounded-full">
                            <ShoppingBag className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">Registrar Venta</h3>
                            <p className="text-xs text-muted-foreground">Productos y accesorios</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                    <Card
                      className="cursor-pointer hover:border-[#0b0044] hover:bg-gray-100 transition-all duration-300"
                      onClick={() => navigateTo("Venta de Equipos")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-orange-200 p-2 rounded-full">
                            <Smartphone className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">Vender Equipo</h3>
                            <p className="text-xs text-muted-foreground">iPhones y smartphones</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                    <Card
                      className="cursor-pointer hover:border-[#0b0044] hover:bg-gray-100 transition-all duration-300"
                      onClick={() => navigateTo("Registrar Reparación")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-orange-200 p-2 rounded-full">
                            <Tool className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">Nueva Reparación</h3>
                            <p className="text-xs text-muted-foreground">Servicio técnico</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Save className="h-5 w-5 text-orange-600" />
                  Notas Rápidas
                </CardTitle>
                <CardDescription>Agrega recordatorios para productos a encargar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Agregar nueva nota (ej: comprar funda para Samsung A20)"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && addNote()}
                    disabled={notesLoading}
                  />
                  <Button onClick={addNote} className="bg-orange-600 hover:bg-orange-700" disabled={notesLoading}>
                    {notesLoading ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    Agregar
                  </Button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {notesLoading && notes.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-orange-600" />
                      <p>Cargando notas...</p>
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No hay notas. Agrega tu primera nota.</p>
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className={`flex items-start justify-between p-3 border rounded-md ${
                          note.completada ? "bg-gray-50 border-gray-200" : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleNoteStatus(note.id)}
                            className={`h-6 w-6 mt-0.5 ${
                              note.completada
                                ? "text-green-500 hover:text-green-700 hover:bg-green-50"
                                : "text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                            }`}
                            disabled={notesLoading}
                          >
                            {note.completada ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                          </Button>
                          <div className="flex-1">
                            <p className={`font-medium ${note.completada ? "line-through text-gray-500" : ""}`}>
                              {note.texto}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {note.usuario_nombre && (
                                <Badge variant="outline" className="text-xs py-0 h-5">
                                  {note.usuario_nombre}
                                </Badge>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Agregado: {note.fecha_creacion_formatted || formatDate(note.fecha_creacion)}
                                {note.completada && note.fecha_completada && (
                                  <>
                                    {" "}
                                    • Completado: {note.fecha_completada_formatted || formatDate(note.fecha_completada)}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteNote(note.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          disabled={notesLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="repairs" className="space-y-6">
          <Card>
            <CardContent>
              <ReparacionesPendientes showHeader={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de detalles del producto */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-orange-600">Detalles del Producto</DialogTitle>
            <DialogDescription>Información detallada del producto seleccionado.</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{selectedProduct.nombre}</h3>
                <Badge variant="outline" className="text-[#0b0044] border-[#0b0044]">
                  {selectedProduct.categoria || "Sin categoría"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Precio</p>
                  <p className="text-xl font-bold">${selectedProduct.precio?.toFixed(2) || "0.00"}</p>
                </div>

                <div className="p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Stock</p>
                  <p className="text-xl font-bold">{selectedProduct.stock || 0} unidades</p>
                </div>
              </div>

              <div className="p-4 rounded-lg ">
                <p className="text-sm text-muted-foreground">Precio en Dólares</p>
                <p className="text-xl font-bold">${((selectedProduct.precio || 0) / dollarPrice).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Basado en el tipo de cambio actual</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setIsSearchDialogOpen(false)}
              className="bg-gray-600 hover:bg-red-800 text-gray-100 hover:text-gray-100"
            >
              Cerrar
            </Button>
            <Button
              onClick={() => {
                toast.success("Producto agregado a la venta", {
                  position: "bottom-right",
                  autoClose: 3000,
                })
                setIsSearchDialogOpen(false)
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Agregar a Venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
