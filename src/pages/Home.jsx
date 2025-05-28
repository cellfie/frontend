"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState, useEffect, useContext, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import ReactTooltip from "react-tooltip"
import { Search, ShoppingBag, Smartphone, PenToolIcon as Tool, Edit, Loader2, Trash2, Plus, Save, CheckCircle, Clock, DollarSign, Wifi, WifiOff, X } from 'lucide-react'
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
import { setTipoCambio, formatNumberARS, syncPendingUpdates, parseNumberARS } from "../services/tipoCambioService"
import { useNavigate } from "react-router-dom"
import { DollarContext } from "@/context/DollarContext"
import ReparacionesPendientes from "@/components/ReparacionesPedientes"

export default function Home() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [showAllResults, setShowAllResults] = useState(false)
  const [username, setUsername] = useState("Usuario")
  const [userInitials, setUserInitials] = useState("US")
  const {
    dollarPrice,
    updateDollarPrice,
    loading: loadingDollar,
    isOffline,
    refreshDollarPrice,
  } = useContext(DollarContext)

  // Estado para el diálogo de edición del dólar
  const [isDollarDialogOpen, setIsDollarDialogOpen] = useState(false)
  const [newDollarPrice, setNewDollarPrice] = useState("")
  const [isUpdatingDollar, setIsUpdatingDollar] = useState(false)
  const newDollarInputRef = useRef(null)

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

  // Monitorear el estado de la conexión y sincronizar cuando vuelve
  useEffect(() => {
    const handleOnline = () => {
      toast.success("Conexión restablecida", {
        position: "bottom-right",
        autoClose: 2000,
      })

      // Intentar sincronizar actualizaciones pendientes
      syncPendingUpdates().then((value) => {
        if (value) {
          toast.info("Sincronizando cambios pendientes...", {
            position: "bottom-right",
            autoClose: 2000,
          })
          refreshDollarPrice()
        }
      })
    }

    window.addEventListener("online", handleOnline)

    return () => {
      window.removeEventListener("online", handleOnline)
    }
  }, [refreshDollarPrice])

  // Efecto para enfocar el input cuando se abre el diálogo
  useEffect(() => {
    if (isDollarDialogOpen && newDollarInputRef.current) {
      setTimeout(() => {
        newDollarInputRef.current.focus()
        newDollarInputRef.current.select()
      }, 100)
    }
  }, [isDollarDialogOpen])

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

  // Función mejorada para obtener la fecha de hoy en formato YYYY-MM-DD en zona horaria Argentina
  const obtenerFechaHoyArgentina = () => {
    // Crear fecha actual
    const ahora = new Date();
    
    // Obtener la fecha en zona horaria de Argentina
    const fechaArgentina = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    
    // Formatear como YYYY-MM-DD
    const year = fechaArgentina.getFullYear();
    const month = String(fechaArgentina.getMonth() + 1).padStart(2, '0');
    const day = String(fechaArgentina.getDate()).padStart(2, '0');
    
    const fechaFormateada = `${year}-${month}-${day}`;
    
    console.log('Fecha actual (local):', ahora.toISOString());
    console.log('Fecha Argentina calculada:', fechaArgentina.toISOString());
    console.log('Fecha formateada para consulta:', fechaFormateada);
    
    return fechaFormateada;
  };

  // Efecto para cargar las ventas de hoy
  useEffect(() => {
    const fetchVentasHoy = async () => {
      try {
        // Obtener la fecha de hoy en formato YYYY-MM-DD en zona horaria Argentina
        const today = obtenerFechaHoyArgentina();
        
        console.log('Consultando ventas para la fecha:', today);

        // Obtener las ventas de hoy
        const params = {
          fecha_inicio: today,
          fecha_fin: today,
          anuladas: false,
        }

        console.log('Parámetros de consulta:', params);

        const ventasData = await getVentas(params)
        
        console.log('Ventas obtenidas:', ventasData);
        console.log('Cantidad de ventas:', ventasData.length);

        // Calcular el total de ventas y el monto total
        const cantidad = ventasData.length
        const monto = ventasData.reduce((total, venta) => total + Number.parseFloat(venta.total), 0)

        console.log('Cantidad calculada:', cantidad);
        console.log('Monto total:', monto);

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
        // Obtener la fecha de hoy en formato YYYY-MM-DD en zona horaria Argentina
        const today = obtenerFechaHoyArgentina();
        
        console.log('Consultando equipos vendidos para la fecha:', today);

        // Obtener las ventas de equipos de hoy
        const params = {
          fecha_inicio: today,
          fecha_fin: today,
          anuladas: false,
        }

        console.log('Parámetros de consulta equipos:', params);

        const equiposData = await getVentasEquipos(params)
        
        console.log('Equipos obtenidos:', equiposData);
        console.log('Cantidad de equipos:', equiposData.length);

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

  // Efecto mejorado para la búsqueda
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchTerm.trim().length > 1) {
        try {
          const results = await searchProductos({ query: searchTerm.trim() })
          setSearchResults(results)
          setShowResults(true)
          setShowAllResults(false) // Reset al hacer nueva búsqueda
        } catch (error) {
          console.error("Error al buscar productos:", error)
          setSearchResults([])
          setShowResults(false)
        }
      } else {
        // Limpiar completamente cuando no hay término de búsqueda
        setSearchResults([])
        setShowResults(false)
        setShowAllResults(false)
      }
    }

    // Debounce para evitar muchas consultas
    const timeoutId = setTimeout(fetchSearchResults, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Función para manejar la selección de un producto
  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setIsSearchDialogOpen(true)
    setShowResults(false)
    setSearchTerm("") // Limpiar búsqueda al seleccionar
  }

  // Función para mostrar todos los resultados
  const handleShowAllResults = () => {
    setShowAllResults(true)
  }

  // Función para limpiar la búsqueda
  const clearSearch = () => {
    setSearchTerm("")
    setSearchResults([])
    setShowResults(false)
    setShowAllResults(false)
  }

  // Función para abrir el diálogo de edición del dólar
  const openDollarDialog = () => {
    setNewDollarPrice(formatNumberARS(dollarPrice))
    setIsDollarDialogOpen(true)
  }

  // Función para guardar el nuevo precio del dólar
  const saveDollarPrice = async () => {
    if (isUpdatingDollar) return

    setIsUpdatingDollar(true)

    try {
      // Parsear el valor ingresado
      const numericValue = parseNumberARS(newDollarPrice)

      if (numericValue <= 0) {
        toast.error("El valor debe ser un número mayor que cero")
        setIsUpdatingDollar(false)
        return
      }

      console.log("Actualizando tipo de cambio a:", numericValue)

      // Actualizar primero en el contexto (esto lo guarda localmente)
      await updateDollarPrice(numericValue)

      // Cerrar el diálogo
      setIsDollarDialogOpen(false)

      // Intentar actualizar en el servidor si estamos online
      if (!isOffline) {
        try {
          const response = await setTipoCambio(numericValue)

          if (response.localOnly) {
            toast.info("Precio del dólar actualizado localmente. Se sincronizará cuando se restablezca la conexión.", {
              position: "bottom-right",
              autoClose: 4000,
            })
          } else {
            toast.success("Precio del dólar actualizado correctamente", {
              position: "bottom-right",
              autoClose: 2000,
            })
          }
        } catch (error) {
          console.error("Error al actualizar en el servidor:", error)
          toast.info("Precio del dólar actualizado localmente. Se sincronizará cuando se restablezca la conexión.", {
            position: "bottom-right",
            autoClose: 4000,
          })
        }
      } else {
        toast.info("Precio del dólar actualizado localmente. Se sincronizará cuando se restablezca la conexión.", {
          position: "bottom-right",
          autoClose: 4000,
        })
      }

      console.log("Tipo de cambio actualizado exitosamente")
    } catch (error) {
      console.error("Error al actualizar el dólar:", error)
      toast.error(error.message || "No se pudo actualizar el dólar", {
        position: "bottom-right",
        autoClose: 3000,
      })
    } finally {
      setIsUpdatingDollar(false)
    }
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

  // Función mejorada para formatear fecha y hora en zona horaria Argentina
  const formatearFechaHora = (fechaString) => {
    if (!fechaString) return ""

    // Crear la fecha a partir del string
    const fecha = new Date(fechaString)
    
    // Verificar si la fecha es válida
    if (isNaN(fecha.getTime())) return ""

    // Usar toLocaleString con zona horaria de Argentina y formato 24h
    return fecha.toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })
  }

  // Determinar qué productos mostrar
  const displayedResults = showAllResults ? searchResults : searchResults.slice(0, 5)
  const hasMoreResults = searchResults.length > 5 && !showAllResults

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
                <p className="text-xs font-medium text-gray-100 flex items-center gap-1">
                  Precio del Dólar
                  {isOffline ? (
                    <WifiOff className="h-3 w-3 text-orange-400" />
                  ) : (
                    <Wifi className="h-3 w-3 text-green-400" />
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-orange-600">${formatNumberARS(dollarPrice)}</span>
                  <Button
                    size="icon"
                    onClick={openDollarDialog}
                    className="h-7 w-7 bg-[#131321] hover:bg-[#131321]"
                    disabled={isUpdatingDollar}
                  >
                    {isUpdatingDollar ? (
                      <Loader2 className="h-3.5 w-3.5 text-gray-100 animate-spin" />
                    ) : (
                      <Edit className="h-3.5 w-3.5 text-gray-100" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Barra de búsqueda mejorada */}
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
            className="pl-10 pr-10 py-6 text-base bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-gray-700"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Resultados de búsqueda mejorados */}
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

                {/* Contenedor con scroll para todos los resultados */}
                <div className={`${showAllResults ? "max-h-96 overflow-y-auto" : ""}`}>
                  {displayedResults.map((product) => (
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
                        <p className="font-bold text-[#0b0044]">${formatNumberARS(product.precio || 0)}</p>
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
                </div>

                {/* Botón para mostrar más resultados */}
                {hasMoreResults && (
                  <div
                    className="text-sm text-center text-[#0b0044] p-2 border-t hover:bg-gray-100 cursor-pointer font-medium"
                    onClick={handleShowAllResults}
                  >
                    Ver todos los {searchResults.length} productos
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Mensaje cuando no hay resultados */}
          {showResults && searchResults.length === 0 && searchTerm.trim().length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 mt-2 w-full bg-white rounded-lg border shadow-lg"
            >
              <div className="p-4 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No se encontraron productos para "{searchTerm}"</p>
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
                                Agregado: {formatearFechaHora(note.fecha_creacion)}
                                {note.completada && note.fecha_completada && (
                                  <> • Completado: {formatearFechaHora(note.fecha_completada)}</>
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

      {/* Diálogo para editar el precio del dólar */}
      <Dialog open={isDollarDialogOpen} onOpenChange={setIsDollarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-orange-600">Actualizar Precio del Dólar</DialogTitle>
            <DialogDescription>
              Ingresa el nuevo precio del dólar. El valor actual es ${formatNumberARS(dollarPrice)}.
              {isOffline && (
                <div className="mt-2 flex items-center gap-2 text-amber-600">
                  <WifiOff className="h-4 w-4" />
                  <span>
                    Modo sin conexión: El cambio se guardará localmente y se sincronizará cuando vuelva la conexión.
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <label htmlFor="new-dollar-price" className="text-sm font-medium text-gray-700">
                  Nuevo precio del dólar
                </label>
                <Input
                  id="new-dollar-price"
                  ref={newDollarInputRef}
                  type="text"
                  placeholder="Ej: 1.200,50"
                  value={newDollarPrice}
                  onChange={(e) => {
                    // Permitir números, puntos, comas y espacios
                    const value = e.target.value.replace(/[^0-9.,\s]/g, "")
                    setNewDollarPrice(value)
                  }}
                  className="mt-1 text-lg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isUpdatingDollar) {
                      saveDollarPrice()
                    }
                  }}
                  disabled={isUpdatingDollar}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formato argentino: use punto para miles y coma para decimales (ej: 1.200,50)
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setIsDollarDialogOpen(false)}
              className="bg-gray-600 hover:bg-red-800 text-gray-100 hover:text-gray-100"
              disabled={isUpdatingDollar}
            >
              Cancelar
            </Button>
            <Button onClick={saveDollarPrice} className="bg-orange-600 hover:bg-orange-700" disabled={isUpdatingDollar}>
              {isUpdatingDollar ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Actualizar Precio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de detalles del producto - Solo información */}
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
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="text-sm text-muted-foreground">Precio</p>
                  <p className="text-xl font-bold">${formatNumberARS(selectedProduct.precio || 0)}</p>
                </div>

                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="text-sm text-muted-foreground">Stock</p>
                  <p className="text-xl font-bold">{selectedProduct.stock || 0} unidades</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-50">
                <p className="text-sm text-muted-foreground">Precio en Dólares</p>
                <p className="text-xl font-bold">US$ {formatNumberARS((selectedProduct.precio || 0) / dollarPrice)}</p>
                <p className="text-xs text-muted-foreground mt-1">Basado en el tipo de cambio actual</p>
              </div>

              {selectedProduct.descripcion && (
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="text-sm text-muted-foreground">Descripción</p>
                  <p className="text-sm mt-1">{selectedProduct.descripcion}</p>
                </div>
              )}

              <div className="p-4 rounded-lg bg-gray-50">
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className="text-sm mt-1">
                  {selectedProduct.stock > 10 ? (
                    <span className="text-green-600 font-medium">✓ Disponible</span>
                  ) : selectedProduct.stock > 0 ? (
                    <span className="text-amber-600 font-medium">⚠ Stock bajo</span>
                  ) : (
                    <span className="text-red-600 font-medium">✗ Sin stock</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}