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
  getCuentaCorrienteProveedor,
  registrarPagoCuentaCorrienteProveedor,
} from "@/services/proveedoresService"
import { getPuntosVenta } from "@/services/puntosVentaService"
import { getTiposPago } from "@/services/pagosService"
import { getComprasPaginadas } from "@/services/comprasService"
import { useAuth } from "@/context/AuthContext"

import ProveedoresList from "@/components/proveedores/ProveedoresList"
import ProveedorFormDialog from "@/components/proveedores/ProveedorFormDialog"
import ProveedorCuentaCorrienteDialog from "@/components/proveedores/ProveedorCuentaCorrienteDialog"

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
  const [dialogCuentaCorrienteAbierto, setDialogCuentaCorrienteAbierto] = useState(false)
  const [cargandoCuentaCorriente, setCargandoCuentaCorriente] = useState(false)
  const [cuentaCorrienteProveedor, setCuentaCorrienteProveedor] = useState(null)
  const [comprasProveedor, setComprasProveedor] = useState([])
  const [puntosVentaPago, setPuntosVentaPago] = useState([])
  const [tiposPagoDisponibles, setTiposPagoDisponibles] = useState([])
  const [procesandoPagoProveedor, setProcesandoPagoProveedor] = useState(false)
  const [fechaInicioMovs, setFechaInicioMovs] = useState("")
  const [fechaFinMovs, setFechaFinMovs] = useState("")
  const [formPagoProveedor, setFormPagoProveedor] = useState({
    compra_id: "",
    monto: "",
    tipo_pago: "Efectivo",
    punto_venta_id: "",
    notas: "",
  })
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

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [puntos, tipos] = await Promise.all([getPuntosVenta(), getTiposPago()])
        setPuntosVentaPago(puntos)
        const tiposSinCuenta = tipos.filter((t) => t.nombre.toLowerCase() !== "cuenta corriente")
        setTiposPagoDisponibles(tiposSinCuenta)
        setFormPagoProveedor((prev) => ({
          ...prev,
          punto_venta_id: puntos[0]?.id?.toString() || "",
          tipo_pago: tiposSinCuenta[0]?.nombre || "Efectivo",
        }))
      } catch (error) {
        console.error("Error al cargar datos para cuenta corriente de proveedores:", error)
      }
    }
    cargarDatos()
  }, [])

  const cargarProveedores = async () => {
    setCargando(true)
    try {
      const data = await getProveedores()
      const proveedoresConSaldo = await Promise.all(
        data.map(async (prov) => {
          try {
            const cc = await getCuentaCorrienteProveedor(prov.id)
            return {
              ...prov,
              saldo_cc_proveedor: Number(cc?.cuenta_corriente?.saldo || 0),
            }
          } catch {
            return { ...prov, saldo_cc_proveedor: 0 }
          }
        }),
      )

      setProveedores(proveedoresConSaldo)
      setProveedoresFiltrados(proveedoresConSaldo)
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
      const saldoById = new Map(proveedores.map((p) => [p.id, p.saldo_cc_proveedor || 0]))
      setProveedoresFiltrados(
        data.map((p) => ({
          ...p,
          saldo_cc_proveedor: saldoById.get(p.id) || 0,
        })),
      )
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

  const cargarCuentaCorrienteYComprasProveedor = async (proveedorId, filters = {}) => {
    setCargandoCuentaCorriente(true)
    try {
      const [ccData, comprasData] = await Promise.all([
        getCuentaCorrienteProveedor(proveedorId, filters),
        getComprasPaginadas(1, 200, { proveedor_id: proveedorId, anuladas: "false" }),
      ])
      setCuentaCorrienteProveedor(ccData)
      setComprasProveedor(comprasData.compras || [])
      setFormPagoProveedor((prev) => ({
        ...prev,
        compra_id: prev.compra_id || comprasData.compras?.[0]?.id?.toString() || "",
      }))
    } catch (error) {
      console.error("Error al cargar cuenta corriente del proveedor:", error)
      toast.error(error.message || "Error al cargar cuenta corriente")
    } finally {
      setCargandoCuentaCorriente(false)
    }
  }

  const abrirDialogCuentaCorriente = async (proveedor) => {
    setProveedorSeleccionado(proveedor)
    setDialogCuentaCorrienteAbierto(true)
    setFechaInicioMovs("")
    setFechaFinMovs("")
    await cargarCuentaCorrienteYComprasProveedor(proveedor.id)
  }

  const filtrarMovimientosCuenta = async () => {
    if (!proveedorSeleccionado?.id) return
    await cargarCuentaCorrienteYComprasProveedor(proveedorSeleccionado.id, {
      fecha_inicio: fechaInicioMovs || undefined,
      fecha_fin: fechaFinMovs || undefined,
    })
  }

  const registrarPagoProveedor = async () => {
    if (!proveedorSeleccionado?.id) return

    const monto = Number(formPagoProveedor.monto)
    if (!Number.isFinite(monto) || monto <= 0) {
      toast.error("El monto debe ser mayor a cero")
      return
    }
    if (!formPagoProveedor.compra_id) {
      toast.error("Debes seleccionar una compra a imputar")
      return
    }
    if (!formPagoProveedor.punto_venta_id) {
      toast.error("Debes seleccionar un punto de venta")
      return
    }

    setProcesandoPagoProveedor(true)
    try {
      await registrarPagoCuentaCorrienteProveedor(proveedorSeleccionado.id, {
        compra_id: Number(formPagoProveedor.compra_id),
        monto,
        tipo_pago: formPagoProveedor.tipo_pago,
        punto_venta_id: Number(formPagoProveedor.punto_venta_id),
        notas: formPagoProveedor.notas,
      })

      toast.success("Pago registrado. Impactó caja como egreso.")
      await cargarCuentaCorrienteYComprasProveedor(proveedorSeleccionado.id, {
        fecha_inicio: fechaInicioMovs || undefined,
        fecha_fin: fechaFinMovs || undefined,
      })
      await cargarProveedores()
      setFormPagoProveedor((prev) => ({ ...prev, monto: "", notas: "" }))
    } catch (error) {
      console.error("Error al registrar pago al proveedor:", error)
      toast.error(error.message || "Error al registrar pago")
    } finally {
      setProcesandoPagoProveedor(false)
    }
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
        abrirDialogCuentaCorriente={abrirDialogCuentaCorriente}
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

      <ProveedorCuentaCorrienteDialog
        open={dialogCuentaCorrienteAbierto}
        onOpenChange={setDialogCuentaCorrienteAbierto}
        proveedor={proveedorSeleccionado}
        cuentaData={cuentaCorrienteProveedor}
        loading={cargandoCuentaCorriente}
        fechaInicio={fechaInicioMovs}
        setFechaInicio={setFechaInicioMovs}
        fechaFin={fechaFinMovs}
        setFechaFin={setFechaFinMovs}
        onFiltrarMovimientos={filtrarMovimientosCuenta}
        comprasProveedor={comprasProveedor}
        puntosVenta={puntosVentaPago}
        tiposPago={tiposPagoDisponibles}
        formPago={formPagoProveedor}
        setFormPago={setFormPagoProveedor}
        onRegistrarPago={registrarPagoProveedor}
        procesandoPago={procesandoPagoProveedor}
      />
    </div>
  )
}

export default ProveedoresPage

