"use client"

import { Input } from "@/components/ui/input"

import { useState, useEffect } from "react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Filter, UserPlus, Search, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  adaptClienteToFrontend,
} from "@/services/clientesService"
import {
  getCuentaCorrienteByCliente,
  createOrUpdateCuentaCorriente,
  adaptCuentaCorrienteToFrontend,
  registrarAjuste,
} from "@/services/cuentasCorrientesService"
import { createPago } from "@/services/pagosService"
import { useAuth } from "@/context/AuthContext"

import ClientesList from "../../components/clientes/ClientesList"
import ClienteFormDialog from "../../components/clientes/ClienteFormDialog"
import CuentaCorrienteDialog from "../../components/clientes/CuentaCorrienteDialog"
import PagoDialog from "../../components/clientes/PagoDialog"
import AjusteDialog from "../../components/clientes/AjusteDialog"

const ClientesPage = () => {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === "admin"

  const [clientes, setClientes] = useState([])
  const [clientesFiltrados, setClientesFiltrados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [detalleClienteAbierto, setDetalleClienteAbierto] = useState(null)
  const [dialogClienteAbierto, setDialogClienteAbierto] = useState(false)
  const [dialogEliminarAbierto, setDialogEliminarAbierto] = useState(false)
  const [dialogPagoAbierto, setDialogPagoAbierto] = useState(false)
  const [dialogCuentaCorrienteAbierto, setDialogCuentaCorrienteAbierto] = useState(false)
  const [dialogAjusteAbierto, setDialogAjusteAbierto] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [clienteEnEdicion, setClienteEnEdicion] = useState(null) // Nuevo estado para el cliente en edición
  const [formCliente, setFormCliente] = useState({
    nombre: "",
    telefono: "",
    dni: "",
  })
  const [formCuentaCorriente, setFormCuentaCorriente] = useState({
    limiteCredito: 0,
    activo: true,
  })
  const [formPago, setFormPago] = useState({
    monto: "",
    notas: "",
    tipo_pago: "Efectivo",
  })
  const [cargandoCuentaCorriente, setCargandoCuentaCorriente] = useState(false)
  const [cuentaCorriente, setCuentaCorriente] = useState(null)
  const [movimientosCuenta, setMovimientosCuenta] = useState([])
  const [rangoFechasMovimientos, setRangoFechasMovimientos] = useState({
    from: null,
    to: null,
  })
  const [procesandoPago, setProcesandoPago] = useState(false)
  const [estadoPago, setEstadoPago] = useState({
    exito: false,
    error: false,
    mensaje: "",
  })
  const [procesandoAjuste, setProcesandoAjuste] = useState(false)
  const [estadoAjuste, setEstadoAjuste] = useState({
    exito: false,
    error: false,
    mensaje: "",
  })
  const [mostrarSoloConCuenta, setMostrarSoloConCuenta] = useState(false)

  // Cargar clientes al iniciar solo si es admin
  useEffect(() => {
    if (isAdmin) {
      cargarClientes()
    } else {
      // Si es empleado, inicializar con lista vacía y quitar estado de carga
      setClientes([])
      setClientesFiltrados([])
      setCargando(false)
    }
  }, [isAdmin])

  // Filtrar clientes cuando cambia la búsqueda
  useEffect(() => {
    filtrarClientes()
  }, [busqueda, clientes, mostrarSoloConCuenta])

  // Modificar el método cargarClientes para asegurar que todos los clientes tengan la información de cuenta corriente
  const cargarClientes = async () => {
    setCargando(true)
    try {
      const clientesData = await getClientes()

      // Procesar cada cliente para obtener su información de cuenta corriente
      const clientesPromises = clientesData.map(async (cliente) => {
        try {
          // Intentar obtener la cuenta corriente para cada cliente
          const clienteDetallado = await getClienteById(cliente.id)
          return adaptClienteToFrontend(clienteDetallado)
        } catch (error) {
          console.error(`Error al obtener detalles del cliente ${cliente.id}:`, error)
          // Si hay error, devolver el cliente sin cuenta corriente
          return {
            id: cliente.id,
            nombre: cliente.nombre,
            telefono: cliente.telefono || "",
            cuentaCorriente: null,
          }
        }
      })

      const clientesAdaptados = await Promise.all(clientesPromises)
      setClientes(clientesAdaptados)
      setClientesFiltrados(clientesAdaptados)
    } catch (error) {
      console.error("Error al cargar clientes:", error)
      toast.error("Error al cargar clientes")
    } finally {
      setCargando(false)
    }
  }

  // Buscar cliente por término de búsqueda (para empleados)
  const buscarClientes = async () => {
    if (!busqueda.trim()) {
      // Si el empleado no ha ingresado búsqueda, mostrar lista vacía
      if (!isAdmin) {
        setClientesFiltrados([])
        return
      }

      // Si es admin, mostrar todos los clientes
      setClientesFiltrados(clientes)
      return
    }

    // Verificar que el término de búsqueda tenga al menos 3 caracteres
    if (!isAdmin && busqueda.trim().length < 3) {
      setClientesFiltrados([])
      return
    }

    setCargando(true)
    try {
      const clientesData = await getClientes()

      // Filtrar por término de búsqueda
      const termino = busqueda.toLowerCase()
      const clientesFiltradosData = clientesData.filter(
        (cliente) =>
          cliente.nombre.toLowerCase().includes(termino) ||
          (cliente.telefono && cliente.telefono.toLowerCase().includes(termino)) ||
          (cliente.dni && cliente.dni.toLowerCase().includes(termino)),
      )

      // Procesar cada cliente para obtener su información de cuenta corriente
      const clientesPromises = clientesFiltradosData.map(async (cliente) => {
        try {
          const clienteDetallado = await getClienteById(cliente.id)
          return adaptClienteToFrontend(clienteDetallado)
        } catch (error) {
          console.error(`Error al obtener detalles del cliente ${cliente.id}:`, error)
          return {
            id: cliente.id,
            nombre: cliente.nombre,
            telefono: cliente.telefono || "",
            cuentaCorriente: null,
          }
        }
      })

      const clientesAdaptados = await Promise.all(clientesPromises)

      // Aplicar filtro de cuenta corriente si está activado
      let resultado = clientesAdaptados
      if (mostrarSoloConCuenta) {
        resultado = resultado.filter((cliente) => cliente.cuentaCorriente && cliente.cuentaCorriente.activo === true)
      }

      setClientesFiltrados(resultado)
    } catch (error) {
      console.error("Error al buscar clientes:", error)
      toast.error("Error al buscar clientes")
    } finally {
      setCargando(false)
    }
  }

  // Modificar el método filtrarClientes para manejar diferentes roles
  const filtrarClientes = () => {
    // Si es empleado y hay búsqueda, realizar búsqueda en el servidor
    if (!isAdmin && busqueda.trim()) {
      // Verificar que el término de búsqueda tenga al menos 3 caracteres
      if (busqueda.trim().length >= 3) {
        buscarClientes()
      } else {
        setClientesFiltrados([])
      }
      return
    }

    // Si es empleado y no hay búsqueda, mostrar lista vacía
    if (!isAdmin && !busqueda.trim()) {
      setClientesFiltrados([])
      return
    }

    // Para administradores, filtrar la lista completa localmente
    if (!busqueda.trim() && !mostrarSoloConCuenta) {
      setClientesFiltrados(clientes)
      return
    }

    let filtrados = [...clientes]

    // Aplicar filtro de búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase()
      filtrados = filtrados.filter(
        (cliente) =>
          cliente.nombre.toLowerCase().includes(termino) ||
          (cliente.telefono && cliente.telefono.toLowerCase().includes(termino)) ||
          (cliente.dni && cliente.dni.toLowerCase().includes(termino)),
      )
    }

    // Aplicar filtro de cuenta corriente
    if (mostrarSoloConCuenta) {
      filtrados = filtrados.filter((cliente) => cliente.cuentaCorriente && cliente.cuentaCorriente.activo === true)
    }

    setClientesFiltrados(filtrados)
  }

  // Cargar detalle del cliente - MEJORADO para mantener el foco
  const cargarDetalleCliente = async (clienteId) => {
    if (detalleClienteAbierto === clienteId) {
      setDetalleClienteAbierto(null)
      setClienteSeleccionado(null)
      return
    }

    try {
      // NO usar setCargando aquí para mantener el foco en la lista
      const clienteDetallado = await getClienteById(clienteId)
      setClienteSeleccionado(adaptClienteToFrontend(clienteDetallado))
      setDetalleClienteAbierto(clienteId)

      // Cargar cuenta corriente si existe
      if (clienteDetallado.cuenta_corriente) {
        await cargarCuentaCorriente(clienteId)
      }
    } catch (error) {
      console.error("Error al obtener detalle del cliente:", error)
      toast.error("Error al obtener detalle del cliente")
    }
  }

  // Cargar cuenta corriente del cliente
  const cargarCuentaCorriente = async (clienteId) => {
    setCargandoCuentaCorriente(true)
    try {
      const cuentaData = await getCuentaCorrienteByCliente(clienteId)
      setCuentaCorriente(adaptCuentaCorrienteToFrontend(cuentaData))
      setMovimientosCuenta(cuentaData.movimientos || [])
    } catch (error) {
      console.error("Error al cargar cuenta corriente:", error)
      setCuentaCorriente(null)
      setMovimientosCuenta([])
    } finally {
      setCargandoCuentaCorriente(false)
    }
  }

  // Abrir diálogo para crear/editar cliente - CORREGIDO
  const abrirDialogCliente = (cliente = null) => {
    if (cliente) {
      setModoEdicion(true)
      setClienteEnEdicion(cliente) // Guardar referencia del cliente en edición
      setFormCliente({
        nombre: cliente.nombre,
        telefono: cliente.telefono || "",
        dni: cliente.dni || "",
      })
    } else {
      setModoEdicion(false)
      setClienteEnEdicion(null) // Limpiar referencia
      setFormCliente({
        nombre: "",
        telefono: "",
        dni: "",
      })
    }
    setDialogClienteAbierto(true)
  }

  // Abrir diálogo para configurar cuenta corriente
  const abrirDialogCuentaCorriente = () => {
    setFormCuentaCorriente({
      limiteCredito: clienteSeleccionado?.cuentaCorriente?.limiteCredito || 0,
      activo: clienteSeleccionado?.cuentaCorriente?.activo !== false,
    })
    setDialogCuentaCorrienteAbierto(true)
  }

  // Abrir diálogo para registrar pago
  const abrirDialogPago = () => {
    setFormPago({
      monto: "",
      notas: "",
      tipo_pago: "Efectivo",
    })
    setEstadoPago({
      exito: false,
      error: false,
      mensaje: "",
    })
    setDialogPagoAbierto(true)
  }

  // NUEVA FUNCIÓN: Abrir diálogo para ajustes de cuenta
  const abrirDialogAjuste = () => {
    setEstadoAjuste({
      exito: false,
      error: false,
      mensaje: "",
    })
    setDialogAjusteAbierto(true)
  }

  // Guardar cliente (crear o actualizar) - CORREGIDO
  const guardarCliente = async () => {
    if (!formCliente.nombre.trim()) {
      toast.error("El nombre del cliente es obligatorio")
      return
    }

    try {
      let clienteGuardado
      if (modoEdicion) {
        // Verificar que tenemos el cliente en edición
        if (!clienteEnEdicion || !clienteEnEdicion.id) {
          toast.error("Error: No se pudo identificar el cliente a editar")
          return
        }

        clienteGuardado = await updateCliente(clienteEnEdicion.id, formCliente)

        // Actualizar el cliente en la lista
        setClientes((prevClientes) =>
          prevClientes.map((c) => (c.id === clienteEnEdicion.id ? { ...c, ...formCliente } : c)),
        )

        // Actualizar el cliente seleccionado si está abierto
        if (clienteSeleccionado && clienteSeleccionado.id === clienteEnEdicion.id) {
          setClienteSeleccionado({
            ...clienteSeleccionado,
            nombre: formCliente.nombre,
            telefono: formCliente.telefono,
            dni: formCliente.dni,
          })
        }

        toast.success("Cliente actualizado correctamente")
      } else {
        clienteGuardado = await createCliente(formCliente)

        // Agregar el nuevo cliente a la lista
        setClientes((prevClientes) => [...prevClientes, clienteGuardado])

        toast.success("Cliente creado correctamente")
      }

      setDialogClienteAbierto(false)
      // Limpiar estados
      setClienteEnEdicion(null)
      setModoEdicion(false)
    } catch (error) {
      console.error("Error al guardar cliente:", error)
      toast.error(error.message || "Error al guardar cliente")
    }
  }

  // Eliminar cliente
  const eliminarCliente = async () => {
    try {
      await deleteCliente(clienteSeleccionado.id)

      // Eliminar el cliente de la lista
      setClientes((prevClientes) => prevClientes.filter((c) => c.id !== clienteSeleccionado.id))

      setDetalleClienteAbierto(null)
      setClienteSeleccionado(null)
      setDialogEliminarAbierto(false)

      toast.success("Cliente eliminado correctamente")
    } catch (error) {
      console.error("Error al eliminar cliente:", error)
      toast.error(error.message || "Error al eliminar cliente")
    }
  }

  // Guardar configuración de cuenta corriente
  const guardarCuentaCorriente = async () => {
    try {
      const cuentaData = {
        cliente_id: clienteSeleccionado.id,
        limite_credito: formCuentaCorriente.limiteCredito,
        activo: formCuentaCorriente.activo ? 1 : 0,
      }

      await createOrUpdateCuentaCorriente(cuentaData)

      // Recargar la cuenta corriente
      await cargarCuentaCorriente(clienteSeleccionado.id)

      // Actualizar el cliente seleccionado
      if (clienteSeleccionado) {
        setClienteSeleccionado({
          ...clienteSeleccionado,
          cuentaCorriente: {
            ...clienteSeleccionado.cuentaCorriente,
            limiteCredito: formCuentaCorriente.limiteCredito,
            activo: formCuentaCorriente.activo,
          },
        })
      }

      // Actualizar la lista de clientes
      setClientes((prevClientes) =>
        prevClientes.map((c) => {
          if (c.id === clienteSeleccionado.id) {
            return {
              ...c,
              cuentaCorriente: {
                ...c.cuentaCorriente,
                limiteCredito: formCuentaCorriente.limiteCredito,
                activo: formCuentaCorriente.activo,
              },
            }
          }
          return c
        }),
      )

      setDialogCuentaCorrienteAbierto(false)
      toast.success("Cuenta corriente configurada correctamente")
    } catch (error) {
      console.error("Error al configurar cuenta corriente:", error)
      toast.error(error.message || "Error al configurar cuenta corriente")
    }
  }

  // Registrar pago en cuenta corriente
  const registrarPagoEnCuenta = async () => {
    // Convertir el monto formateado a un número
    const montoString = formPago.monto.toString().replace(/\./g, "").replace(",", ".").replace(/\$ /g, "")
    const montoNumerico = Number.parseFloat(montoString)

    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      toast.error("El monto debe ser mayor a cero")
      return
    }

    setProcesandoPago(true)
    setEstadoPago({ exito: false, error: false, mensaje: "" })

    try {
      // Usar el endpoint de pagos para registrar el pago
      const pagoData = {
        monto: montoNumerico,
        tipo_pago: formPago.tipo_pago,
        cliente_id: clienteSeleccionado.id,
        tipo_referencia: "cuenta_corriente",
        notas: formPago.notas || "Pago en cuenta corriente",
        punto_venta_id: 1, // Punto de venta por defecto
      }

      // Registrar el pago usando el servicio de pagos
      const resultadoPago = await createPago(pagoData)

      // Recargar la cuenta corriente para obtener el saldo actualizado
      await cargarCuentaCorriente(clienteSeleccionado.id)

      // Actualizar el cliente seleccionado con el nuevo saldo
      if (clienteSeleccionado && clienteSeleccionado.cuentaCorriente) {
        const nuevoSaldo = clienteSeleccionado.cuentaCorriente.saldo - montoNumerico

        setClienteSeleccionado({
          ...clienteSeleccionado,
          cuentaCorriente: {
            ...clienteSeleccionado.cuentaCorriente,
            saldo: nuevoSaldo,
          },
        })

        // Actualizar la lista de clientes
        setClientes((prevClientes) =>
          prevClientes.map((c) => {
            if (c.id === clienteSeleccionado.id && c.cuentaCorriente) {
              return {
                ...c,
                cuentaCorriente: {
                  ...c.cuentaCorriente,
                  saldo: nuevoSaldo,
                },
              }
            }
            return c
          }),
        )
      }

      setEstadoPago({
        exito: true,
        error: false,
        mensaje: `Pago de ${formatearPrecio(montoNumerico)} registrado correctamente`,
      })

      // Cerrar el diálogo después de 2 segundos
      setTimeout(() => {
        setDialogPagoAbierto(false)
        toast.success("Pago registrado correctamente")
      }, 2000)
    } catch (error) {
      console.error("Error al registrar pago:", error)
      setEstadoPago({
        exito: false,
        error: true,
        mensaje: error.message || "Error al registrar pago",
      })
    } finally {
      setProcesandoPago(false)
    }
  }

  // NUEVA FUNCIÓN: Registrar ajuste de cuenta corriente
  const registrarAjusteEnCuenta = async (datosAjuste) => {
    setProcesandoAjuste(true)
    setEstadoAjuste({ exito: false, error: false, mensaje: "" })

    try {
      // Registrar el ajuste usando el nuevo servicio
      const resultadoAjuste = await registrarAjuste(datosAjuste)

      // Recargar la cuenta corriente para obtener el saldo actualizado
      await cargarCuentaCorriente(clienteSeleccionado.id)

      // Calcular el nuevo saldo según el tipo de ajuste
      let nuevoSaldo
      const montoNumerico = Number.parseFloat(datosAjuste.monto)
      const saldoActual = clienteSeleccionado.cuentaCorriente.saldo

      if (datosAjuste.tipo_ajuste === "pago") {
        nuevoSaldo = saldoActual - montoNumerico
      } else {
        nuevoSaldo = saldoActual + montoNumerico
      }

      // Actualizar el cliente seleccionado con el nuevo saldo
      if (clienteSeleccionado && clienteSeleccionado.cuentaCorriente) {
        setClienteSeleccionado({
          ...clienteSeleccionado,
          cuentaCorriente: {
            ...clienteSeleccionado.cuentaCorriente,
            saldo: nuevoSaldo,
          },
        })

        // Actualizar la lista de clientes
        setClientes((prevClientes) =>
          prevClientes.map((c) => {
            if (c.id === clienteSeleccionado.id && c.cuentaCorriente) {
              return {
                ...c,
                cuentaCorriente: {
                  ...c.cuentaCorriente,
                  saldo: nuevoSaldo,
                },
              }
            }
            return c
          }),
        )
      }

      const tipoTexto = datosAjuste.tipo_ajuste === "pago" ? "Pago" : "Cargo"
      setEstadoAjuste({
        exito: true,
        error: false,
        mensaje: `${tipoTexto} de ${formatearPrecio(montoNumerico)} registrado correctamente`,
      })

      // Cerrar el diálogo después de 2 segundos
      setTimeout(() => {
        setDialogAjusteAbierto(false)
        toast.success(`${tipoTexto} registrado correctamente`)
      }, 2000)
    } catch (error) {
      console.error("Error al registrar ajuste:", error)
      setEstadoAjuste({
        exito: false,
        error: true,
        mensaje: error.message || "Error al registrar ajuste",
      })
    } finally {
      setProcesandoAjuste(false)
    }
  }

  // Formatear fecha para mostrar - SIMPLIFICADO sin conversiones manuales
  const formatearFechaHora = (fechaString) => {
    if (!fechaString) return ""

    // Crear la fecha a partir del string
    const fecha = new Date(fechaString)

    // Usar toLocaleString sin especificar zona horaria para usar la del sistema
    return fecha.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Formatear precio para mostrar
  const formatearPrecio = (precio) => {
    const precioNumerico = Number.parseFloat(precio) || 0
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(precioNumerico)
  }

  // Manejar la búsqueda para empleados
  const handleBusqueda = (e) => {
    setBusqueda(e.target.value)

    // Si es empleado y se borra la búsqueda, limpiar resultados
    if (!isAdmin && e.target.value === "") {
      setClientesFiltrados([])
    }
  }

  // Manejar el envío del formulario de búsqueda para empleados
  const handleSubmitBusqueda = (e) => {
    e.preventDefault()
    if (!isAdmin) {
      buscarClientes()
    }
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <ToastContainer position="bottom-right" />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="text-gray-500">Administra tus clientes y sus cuentas corrientes</p>
        </div>
        <Button onClick={() => abrirDialogCliente()} className="bg-orange-600 hover:bg-orange-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6 border-0 shadow-md">
        <CardHeader className="bg-[#131321] pb-3">
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <Filter size={20} />
            {isAdmin ? "Buscar Clientes" : "Buscar Cliente"}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {isAdmin
              ? "Encuentra rápidamente a tus clientes por nombre o teléfono"
              : "Ingresa el nombre, DNI o teléfono del cliente para buscarlo"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {isAdmin ? (
            <ClientesList.Filtros
              busqueda={busqueda}
              setBusqueda={setBusqueda}
              mostrarSoloConCuenta={mostrarSoloConCuenta}
              setMostrarSoloConCuenta={setMostrarSoloConCuenta}
            />
          ) : (
            <form onSubmit={handleSubmitBusqueda} className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, DNI o teléfono..."
                  className="pl-9"
                  value={busqueda}
                  onChange={handleBusqueda}
                />
              </div>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={busqueda.trim().length < 3}>
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </form>
          )}

          {!isAdmin && !busqueda.trim() && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Ingresa un término de búsqueda</p>
                <p className="text-sm">Debes ingresar un nombre, DNI o teléfono para buscar clientes.</p>
              </div>
            </div>
          )}

          {!isAdmin && busqueda.trim().length > 0 && busqueda.trim().length < 3 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Término de búsqueda demasiado corto</p>
                <p className="text-sm">Ingresa al menos 3 caracteres para realizar la búsqueda.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de clientes */}
      {(isAdmin || (busqueda.trim().length >= 3 && clientesFiltrados.length > 0)) && (
        <ClientesList
          clientes={clientesFiltrados}
          cargando={cargando}
          detalleClienteAbierto={detalleClienteAbierto}
          clienteSeleccionado={clienteSeleccionado}
          busqueda={busqueda}
          cargarDetalleCliente={cargarDetalleCliente}
          abrirDialogCliente={abrirDialogCliente}
          setClienteSeleccionado={setClienteSeleccionado}
          setDialogEliminarAbierto={setDialogEliminarAbierto}
          formatearFechaHora={formatearFechaHora}
          formatearPrecio={formatearPrecio}
          cargandoCuentaCorriente={cargandoCuentaCorriente}
          setCargandoCuentaCorriente={setCargandoCuentaCorriente}
          cuentaCorriente={cuentaCorriente}
          movimientosCuenta={movimientosCuenta}
          setMovimientosCuenta={setMovimientosCuenta}
          rangoFechasMovimientos={rangoFechasMovimientos}
          setRangoFechasMovimientos={setRangoFechasMovimientos}
          abrirDialogCuentaCorriente={abrirDialogCuentaCorriente}
          abrirDialogPago={abrirDialogPago}
          abrirDialogAjuste={abrirDialogAjuste}
        />
      )}

      {/* Mensaje cuando no hay resultados de búsqueda para empleados */}
      {!isAdmin && busqueda.trim().length >= 3 && clientesFiltrados.length === 0 && !cargando && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 text-center">
            <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No se encontraron clientes</h3>
            <p className="text-gray-500">
              No hay clientes que coincidan con "{busqueda}". Intenta con otro término de búsqueda.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Diálogos */}
      <ClienteFormDialog
        open={dialogClienteAbierto}
        setOpen={setDialogClienteAbierto}
        modoEdicion={modoEdicion}
        formCliente={formCliente}
        setFormCliente={setFormCliente}
        guardarCliente={guardarCliente}
        clienteSeleccionado={clienteEnEdicion} // Usar clienteEnEdicion en lugar de clienteSeleccionado
        dialogEliminarAbierto={dialogEliminarAbierto}
        setDialogEliminarAbierto={setDialogEliminarAbierto}
        eliminarCliente={eliminarCliente}
      />

      <CuentaCorrienteDialog
        open={dialogCuentaCorrienteAbierto}
        setOpen={setDialogCuentaCorrienteAbierto}
        formCuentaCorriente={formCuentaCorriente}
        setFormCuentaCorriente={setFormCuentaCorriente}
        guardarCuentaCorriente={guardarCuentaCorriente}
        clienteSeleccionado={clienteSeleccionado}
      />

      <PagoDialog
        open={dialogPagoAbierto}
        setOpen={setDialogPagoAbierto}
        formPago={formPago}
        setFormPago={setFormPago}
        registrarPagoEnCuenta={registrarPagoEnCuenta}
        clienteSeleccionado={clienteSeleccionado}
        procesandoPago={procesandoPago}
        estadoPago={estadoPago}
        formatearPrecio={formatearPrecio}
      />

      <AjusteDialog
        open={dialogAjusteAbierto}
        setOpen={setDialogAjusteAbierto}
        clienteSeleccionado={clienteSeleccionado}
        procesandoAjuste={procesandoAjuste}
        estadoAjuste={estadoAjuste}
        onRegistrarAjuste={registrarAjusteEnCuenta}
        formatearPrecio={formatearPrecio}
      />
    </div>
  )
}

export default ClientesPage
