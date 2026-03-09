"use client"

import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Filter, UserPlus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import {
  getProveedores,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  searchProveedores,
} from "@/services/proveedoresService"
import { useAuth } from "@/context/AuthContext"

import ProveedoresList from "@/components/proveedores/ProveedoresList"
import ProveedorFormDialog from "@/components/proveedores/ProveedorFormDialog"

const ProveedoresPage = () => {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === "admin"

  const [proveedores, setProveedores] = useState([])
  const [proveedoresFiltrados, setProveedoresFiltrados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null)
  const [dialogProveedorAbierto, setDialogProveedorAbierto] = useState(false)
  const [dialogEliminarAbierto, setDialogEliminarAbierto] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [proveedorEnEdicion, setProveedorEnEdicion] = useState(null)
  const [formProveedor, setFormProveedor] = useState({
    nombre: "",
    telefono: "",
    email: "",
    cuit: "",
    direccion: "",
    contacto: "",
    notas: "",
  })

  useEffect(() => {
    if (isAdmin || currentUser) {
      cargarProveedores()
    } else {
      setProveedores([])
      setProveedoresFiltrados([])
      setCargando(false)
    }
  }, [isAdmin, currentUser])

  useEffect(() => {
    filtrarProveedores()
  }, [busqueda, proveedores])

  const cargarProveedores = async () => {
    setCargando(true)
    try {
      const data = await getProveedores()
      setProveedores(data)
      setProveedoresFiltrados(data)
    } catch (error) {
      console.error("Error al cargar proveedores:", error)
      toast.error("Error al cargar proveedores")
    } finally {
      setCargando(false)
    }
  }

  const buscarProveedoresServidor = async () => {
    if (!busqueda.trim()) {
      setProveedoresFiltrados(proveedores)
      return
    }

    if (busqueda.trim().length < 2) {
      return
    }

    setCargando(true)
    try {
      const data = await searchProveedores(busqueda.trim())
      setProveedoresFiltrados(data)
    } catch (error) {
      console.error("Error al buscar proveedores:", error)
      toast.error("Error al buscar proveedores")
    } finally {
      setCargando(false)
    }
  }

  const filtrarProveedores = () => {
    if (!busqueda.trim()) {
      setProveedoresFiltrados(proveedores)
      return
    }

    const termino = busqueda.toLowerCase()
    const filtrados = proveedores.filter(
      (p) =>
        p.nombre.toLowerCase().includes(termino) ||
        (p.telefono && p.telefono.toLowerCase().includes(termino)) ||
        (p.email && p.email.toLowerCase().includes(termino)) ||
        (p.cuit && p.cuit.toLowerCase().includes(termino)) ||
        (p.contacto && p.contacto.toLowerCase().includes(termino)),
    )

    setProveedoresFiltrados(filtrados)
  }

  const abrirDialogProveedor = (proveedor = null) => {
    if (proveedor) {
      setModoEdicion(true)
      setProveedorEnEdicion(proveedor)
      setFormProveedor({
        nombre: proveedor.nombre || "",
        telefono: proveedor.telefono || "",
        email: proveedor.email || "",
        cuit: proveedor.cuit || "",
        direccion: proveedor.direccion || "",
        contacto: proveedor.contacto || "",
        notas: proveedor.notas || "",
      })
    } else {
      setModoEdicion(false)
      setProveedorEnEdicion(null)
      setFormProveedor({
        nombre: "",
        telefono: "",
        email: "",
        cuit: "",
        direccion: "",
        contacto: "",
        notas: "",
      })
    }
    setDialogProveedorAbierto(true)
  }

  const guardarProveedor = async () => {
    if (!formProveedor.nombre.trim()) {
      toast.error("El nombre del proveedor es obligatorio")
      return
    }

    try {
      if (modoEdicion) {
        if (!proveedorEnEdicion || !proveedorEnEdicion.id) {
          toast.error("Error: No se pudo identificar el proveedor a editar")
          return
        }

        const actualizado = await updateProveedor(proveedorEnEdicion.id, formProveedor)

        setProveedores((prev) =>
          prev.map((p) => (p.id === proveedorEnEdicion.id ? { ...p, ...formProveedor, activo: actualizado.activo } : p)),
        )

        toast.success("Proveedor actualizado correctamente")
      } else {
        const creado = await createProveedor(formProveedor)
        setProveedores((prev) => [...prev, creado])
        toast.success("Proveedor creado correctamente")
      }

      setDialogProveedorAbierto(false)
      setProveedorEnEdicion(null)
      setModoEdicion(false)
    } catch (error) {
      console.error("Error al guardar proveedor:", error)
      toast.error(error.message || "Error al guardar proveedor")
    }
  }

  const eliminarProveedor = async () => {
    try {
      await deleteProveedor(proveedorSeleccionado.id)

      setProveedores((prev) => prev.filter((p) => p.id !== proveedorSeleccionado.id))
      setDialogEliminarAbierto(false)
      setProveedorSeleccionado(null)

      toast.success("Proveedor eliminado correctamente")
    } catch (error) {
      console.error("Error al eliminar proveedor:", error)
      toast.error(error.message || "Error al eliminar proveedor")
    }
  }

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value)
  }

  const handleSubmitBusqueda = (e) => {
    e.preventDefault()
    buscarProveedoresServidor()
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Proveedores</h1>
          <p className="text-gray-500">Administra tus proveedores para el módulo de compras</p>
        </div>
        {isAdmin && (
          <Button onClick={() => abrirDialogProveedor()} className="bg-orange-600 hover:bg-orange-700">
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Proveedor
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card className="mb-6 border-0 shadow-md">
        <CardHeader className="bg-[#131321] pb-3">
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <Filter size={20} />
            Buscar Proveedores
          </CardTitle>
          <CardDescription className="text-gray-300">
            Encuentra rápidamente a tus proveedores por nombre, CUIT, teléfono, email o contacto
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleSubmitBusqueda} className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, CUIT, teléfono, email o contacto..."
                className="pl-9"
                value={busqueda}
                onChange={handleBusqueda}
              />
            </div>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabla de proveedores */}
      <ProveedoresList
        proveedores={proveedoresFiltrados}
        cargando={cargando}
        busqueda={busqueda}
        abrirDialogProveedor={abrirDialogProveedor}
        setProveedorSeleccionado={setProveedorSeleccionado}
        setDialogEliminarAbierto={setDialogEliminarAbierto}
      />

      {/* Diálogos */}
      <ProveedorFormDialog
        open={dialogProveedorAbierto}
        setOpen={setDialogProveedorAbierto}
        modoEdicion={modoEdicion}
        formProveedor={formProveedor}
        setFormProveedor={setFormProveedor}
        guardarProveedor={guardarProveedor}
        proveedorSeleccionado={proveedorEnEdicion}
        dialogEliminarAbierto={dialogEliminarAbierto}
        setDialogEliminarAbierto={setDialogEliminarAbierto}
        eliminarProveedor={eliminarProveedor}
      />
    </div>
  )
}

export default ProveedoresPage

