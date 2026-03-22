"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { History, FolderOpen, Wallet, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CajaSesionDetalleModal } from "@/components/caja/CajaSesionDetalleModal"

import { getPuntosVenta } from "@/services/puntosVentaService"
import { getSesionesCaja, getSesionCajaPorId, getMovimientosCompletosCaja } from "@/services/cajaService"
import { useAuth } from "@/context/AuthContext"
import { PaginationControls } from "@/lib/PaginationControls"
import { formatearMonedaARS, formatearFechaHora } from "@/lib/cajaHistorialUtils"

const HistorialCajaPage = () => {
  const { currentUser } = useAuth()
  const esAdmin = currentUser?.role === "admin"

  const [puntosVenta, setPuntosVenta] = useState([])
  const [puntoVentaSeleccionado, setPuntoVentaSeleccionado] = useState("")

  const [sesiones, setSesiones] = useState([])
  const [sesionesPagination, setSesionesPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  })
  const [loadingSesiones, setLoadingSesiones] = useState(false)

  const [sesionDetalle, setSesionDetalle] = useState(null)
  const [dialogDetalleSesionAbierto, setDialogDetalleSesionAbierto] = useState(false)
  const [loadingDetalleSesion, setLoadingDetalleSesion] = useState(false)
  const [historialMovimientos, setHistorialMovimientos] = useState([])
  const [historialMovimientosPagination, setHistorialMovimientosPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50,
  })
  const [loadingHistorialMovimientos, setLoadingHistorialMovimientos] = useState(false)
  const [historialFiltroOrigen, setHistorialFiltroOrigen] = useState("general")
  const [historialFiltroTipo, setHistorialFiltroTipo] = useState("todos")
  const [historialTabDesglose, setHistorialTabDesglose] = useState("ventas_productos")

  useEffect(() => {
    const cargarPV = async () => {
      try {
        const puntos = await getPuntosVenta()
        setPuntosVenta(puntos)
        if (puntos.length > 0) {
          let puntoDefecto
          if (currentUser?.id === 7) {
            puntoDefecto = puntos.find((p) => p.nombre.toLowerCase() === "tala")
          } else {
            puntoDefecto = puntos.find((p) => p.nombre.toLowerCase() === "trancas")
          }
          setPuntoVentaSeleccionado(puntoDefecto ? puntoDefecto.id.toString() : puntos[0].id.toString())
        }
      } catch (error) {
        console.error("Error al cargar puntos de venta:", error)
        toast.error("Error al cargar puntos de venta")
      }
    }
    cargarPV()
  }, [currentUser])

  const cargarSesiones = async (page = 1) => {
    if (!puntoVentaSeleccionado) return
    setLoadingSesiones(true)
    try {
      const data = await getSesionesCaja(page, sesionesPagination.itemsPerPage, {
        punto_venta_id: puntoVentaSeleccionado || undefined,
      })
      setSesiones(data.sesiones)
      setSesionesPagination((prev) => ({ ...prev, ...data.pagination }))
    } catch (error) {
      console.error("Error al obtener sesiones de caja:", error)
      toast.error(error.message || "Error al obtener historial de caja")
    } finally {
      setLoadingSesiones(false)
    }
  }

  useEffect(() => {
    if (puntoVentaSeleccionado) {
      cargarSesiones(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntoVentaSeleccionado])

  const abrirDetalleSesion = async (sesionRow) => {
    if (!esAdmin) {
      toast.error("No tenés permisos para ver el detalle con movimientos")
      return
    }
    setDialogDetalleSesionAbierto(true)
    setSesionDetalle(null)
    setLoadingDetalleSesion(true)
    setHistorialMovimientos([])
    setHistorialFiltroOrigen("general")
    setHistorialFiltroTipo("todos")
    setHistorialTabDesglose("ventas_productos")
    try {
      const data = await getSesionCajaPorId(sesionRow.id)
      setSesionDetalle(data)
    } catch (error) {
      console.error("Error al cargar detalle de sesión:", error)
      toast.error(error.message || "Error al cargar detalle")
      setDialogDetalleSesionAbierto(false)
    } finally {
      setLoadingDetalleSesion(false)
    }
  }

  const cargarHistorialMovimientos = async (page = 1) => {
    if (!sesionDetalle?.sesion?.id) return
    setLoadingHistorialMovimientos(true)
    try {
      const data = await getMovimientosCompletosCaja(
        sesionDetalle.sesion.id,
        historialFiltroOrigen,
        page,
        100,
        historialFiltroTipo,
      )
      setHistorialMovimientos(data.movimientos)
      setHistorialMovimientosPagination((prev) => ({ ...prev, ...data.pagination }))
    } catch (error) {
      console.error("Error al cargar movimientos del historial:", error)
      toast.error(error.message || "Error al cargar movimientos")
    } finally {
      setLoadingHistorialMovimientos(false)
    }
  }

  useEffect(() => {
    if (
      dialogDetalleSesionAbierto &&
      sesionDetalle?.sesion?.id &&
      !loadingDetalleSesion &&
      esAdmin
    ) {
      cargarHistorialMovimientos(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogDetalleSesionAbierto, sesionDetalle?.sesion?.id, historialFiltroOrigen, historialFiltroTipo, esAdmin])

  const puntoVentaNombre =
    puntosVenta.find((p) => p.id.toString() === puntoVentaSeleccionado)?.nombre || "Seleccionar"

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <ToastContainer position="bottom-right" autoClose={3000} />

      <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Link
              to="/"
              className="hover:text-orange-600 transition-colors"
            >
              Inicio
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 font-medium">Historial</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-semibold">Caja</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="h-7 w-7 text-orange-600" />
            Historial de sesiones de caja
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Consultá todas las sesiones del punto de venta elegido,{" "}
            <strong>incluso si la caja está cerrada</strong>. El detalle completo (movimientos y totales) está
            disponible solo para administradores.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center shrink-0">
          <Button variant="outline" className="h-10 gap-2 border-orange-200 bg-white hover:bg-orange-50" asChild>
            <Link to="/caja">
              <Wallet className="h-4 w-4 text-orange-600" />
              Ir a control de caja
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-md mb-6">
        <CardHeader className="bg-[#131321] pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-orange-500 flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                Filtro por punto de venta
              </CardTitle>
              <CardDescription className="text-gray-300 mt-1">
                Listado de sesiones de apertura y cierre de caja para{" "}
                <span className="font-semibold text-orange-400">{puntoVentaNombre}</span>
              </CardDescription>
            </div>
            <Select value={puntoVentaSeleccionado} onValueChange={setPuntoVentaSeleccionado}>
              <SelectTrigger className="w-full sm:w-[240px] h-10 bg-white shadow-sm">
                <SelectValue placeholder="Punto de venta" />
              </SelectTrigger>
              <SelectContent>
                {puntosVenta.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingSesiones ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : sesiones.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <FolderOpen className="h-14 w-14 text-gray-300 mx-auto mb-4" />
              <p className="text-base font-medium text-gray-700">No hay sesiones de caja</p>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                No hay sesiones registradas para este punto de venta. Las sesiones aparecen al abrir y cerrar caja
                desde <strong>Control de caja</strong>.
              </p>
              <Button className="mt-6 bg-orange-600 hover:bg-orange-700" asChild>
                <Link to="/caja">Abrir control de caja</Link>
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-[min(520px,60vh)] sm:max-h-[560px]">
                <div className="divide-y divide-gray-100">
                  {sesiones.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={esAdmin ? () => abrirDetalleSesion(s) : undefined}
                      aria-disabled={!esAdmin}
                      className={`w-full py-4 px-5 text-left text-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 transition-colors ${
                        esAdmin ? "hover:bg-orange-50/80 cursor-pointer" : "opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-3 min-w-0">
                        <Badge
                          className={
                            s.estado === "abierta"
                              ? "bg-green-100 text-green-800 border-green-300 shrink-0"
                              : "bg-gray-200 text-gray-800 border-gray-300 shrink-0"
                          }
                        >
                          {s.estado === "abierta" ? "Abierta" : "Cerrada"}
                        </Badge>
                        <span className="font-semibold text-gray-900">{s.punto_venta_nombre}</span>
                        <span className="text-xs text-gray-500 shrink-0">
                          Apertura · {formatearFechaHora(s.fecha_apertura)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 shrink-0">
                        <span className="text-xs text-gray-600">
                          Inicial: <span className="font-medium text-gray-800">{formatearMonedaARS(s.monto_apertura || 0)}</span>
                        </span>
                        {s.monto_cierre != null && (
                          <span className="text-xs text-gray-600">
                            Cierre:{" "}
                            <span className="font-semibold text-gray-900">{formatearMonedaARS(s.monto_cierre)}</span>
                          </span>
                        )}
                        {esAdmin ? (
                          <span className="text-orange-600 text-xs font-semibold">Ver detalle →</span>
                        ) : (
                          <span className="text-gray-500 text-xs">Detalle solo administradores</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
              {sesionesPagination.totalPages > 1 && (
                <div className="p-4 border-t bg-gray-50/80">
                  <PaginationControls
                    currentPage={sesionesPagination.currentPage}
                    totalPages={sesionesPagination.totalPages}
                    totalItems={sesionesPagination.totalItems}
                    itemsPerPage={sesionesPagination.itemsPerPage}
                    onPageChange={(page) => cargarSesiones(page)}
                    onItemsPerPageChange={() => {}}
                    isLoading={loadingSesiones}
                    hidePageSizeSelector
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {!esAdmin && (
        <Card className="border border-amber-200 bg-amber-50/60">
          <CardContent className="p-4 flex gap-3 text-sm text-amber-950">
            <span className="shrink-0 font-semibold">Nota:</span>
            <p>
              Como empleado podés ver el listado de sesiones. El detalle con movimientos y desglose está reservado para
              administradores.
            </p>
          </CardContent>
        </Card>
      )}

      <CajaSesionDetalleModal
        open={dialogDetalleSesionAbierto}
        onOpenChange={(open) => {
          setDialogDetalleSesionAbierto(open)
          if (!open) setSesionDetalle(null)
        }}
        sesionDetalle={sesionDetalle}
        loadingDetalle={loadingDetalleSesion}
        historialMovimientos={historialMovimientos}
        loadingHistorialMovimientos={loadingHistorialMovimientos}
        historialMovimientosPagination={historialMovimientosPagination}
        historialFiltroOrigen={historialFiltroOrigen}
        setHistorialFiltroOrigen={setHistorialFiltroOrigen}
        historialFiltroTipo={historialFiltroTipo}
        setHistorialFiltroTipo={setHistorialFiltroTipo}
        historialTabDesglose={historialTabDesglose}
        setHistorialTabDesglose={setHistorialTabDesglose}
        cargarHistorialMovimientos={cargarHistorialMovimientos}
      />
    </div>
  )
}

export default HistorialCajaPage
