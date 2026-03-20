"use client"

import { useEffect, useMemo, useState } from "react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Filter, Search, UserPlus, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import UsuariosList from "@/components/usuarios/UsuariosList"
import UsuarioFormDialog from "@/components/usuarios/UsuarioFormDialog"

import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from "@/services/usuariosService"
import { useAuth } from "@/context/AuthContext"

const UsuariosPage = () => {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === "admin"

  const [usuarios, setUsuarios] = useState([])
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([])
  const [cargando, setCargando] = useState(true)

  const [busqueda, setBusqueda] = useState("")

  const [dialogUsuarioAbierto, setDialogUsuarioAbierto] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState(null)

  const [formUsuario, setFormUsuario] = useState({
    nombre: "",
    password: "",
    rol: "empleado",
    activo: 1,
    nota: "",
  })

  const [creandoUsuario, setCreandoUsuario] = useState(false)

  const [dialogDesactivarAbierto, setDialogDesactivarAbierto] = useState(false)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [desactivandoUsuario, setDesactivandoUsuario] = useState(false)

  useEffect(() => {
    if (!isAdmin) {
      setCargando(false)
      setUsuarios([])
      setUsuariosFiltrados([])
      return
    }

    const cargar = async () => {
      setCargando(true)
      try {
        const data = await getUsuarios()
        setUsuarios(data || [])
        setUsuariosFiltrados(data || [])
      } catch (error) {
        console.error(error)
        toast.error(error.message || "Error al cargar usuarios")
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [isAdmin])

  useEffect(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) {
      setUsuariosFiltrados(usuarios)
      return
    }

    setUsuariosFiltrados(
      usuarios.filter((u) => {
        return (
          (u.nombre || "").toLowerCase().includes(termino) ||
          (u.rol || "").toLowerCase().includes(termino) ||
          (u.activo === 0 ? "inactivo" : "activo").includes(termino)
        )
      }),
    )
  }, [busqueda, usuarios])

  const abrirDialogUsuario = (usuario = null) => {
    if (usuario) {
      setModoEdicion(true)
      setUsuarioEnEdicion(usuario)
      setFormUsuario({
        nombre: usuario.nombre || "",
        password: "",
        rol: usuario.rol || "empleado",
        activo: usuario.activo === 0 ? 0 : 1,
        nota: "",
      })
    } else {
      setModoEdicion(false)
      setUsuarioEnEdicion(null)
      setFormUsuario({
        nombre: "",
        password: "",
        rol: "empleado",
        activo: 1,
        nota: "",
      })
    }
    setDialogUsuarioAbierto(true)
  }

  const guardarUsuario = async () => {
    if (creandoUsuario) return

    const nombre = formUsuario.nombre.trim()
    if (!nombre) {
      toast.error("El nombre de usuario es obligatorio")
      return
    }

    if (!modoEdicion && (!formUsuario.password || formUsuario.password.trim().length < 6)) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setCreandoUsuario(true)
    try {
      if (modoEdicion) {
        if (!usuarioEnEdicion?.id) {
          toast.error("Error: no se pudo identificar el usuario a editar")
          return
        }

        const payload = {
          nombre,
          rol: formUsuario.rol,
          activo: formUsuario.activo ? 1 : 0,
          ...(formUsuario.password && formUsuario.password.trim().length > 0 ? { password: formUsuario.password } : {}),
        }

        const actualizado = await updateUsuario(usuarioEnEdicion.id, payload)
        setUsuarios((prev) => prev.map((u) => (u.id === usuarioEnEdicion.id ? actualizado : u)))
        toast.success("Usuario actualizado correctamente")
      } else {
        const payload = {
          nombre,
          password: formUsuario.password,
          rol: formUsuario.rol,
          activo: formUsuario.activo ? 1 : 0,
        }

        const creado = await createUsuario(payload)
        setUsuarios((prev) => [...prev, creado])
        toast.success("Usuario creado correctamente")
      }

      setDialogUsuarioAbierto(false)
      setModoEdicion(false)
      setUsuarioEnEdicion(null)
    } catch (error) {
      console.error(error)
      toast.error(error.message || "Error al guardar usuario")
    } finally {
      setCreandoUsuario(false)
    }
  }

  const confirmarDesactivarUsuario = async () => {
    if (!usuarioSeleccionado?.id) return
    if (desactivandoUsuario) return

    setDesactivandoUsuario(true)
    try {
      const result = await deleteUsuario(usuarioSeleccionado.id)
      const nuevoActivo = 0

      setUsuarios((prev) => prev.map((u) => (u.id === usuarioSeleccionado.id ? { ...u, activo: nuevoActivo, rol: result.rol || u.rol } : u)))
      toast.success(result.message || "Usuario desactivado")
      setDialogDesactivarAbierto(false)
      setUsuarioSeleccionado(null)
    } catch (error) {
      console.error(error)
      toast.error(error.message || "Error al desactivar usuario")
    } finally {
      setDesactivandoUsuario(false)
    }
  }

  const onCloseDesactivar = () => {
    setDialogDesactivarAbierto(false)
    setUsuarioSeleccionado(null)
    setDesactivandoUsuario(false)
  }

  const handleToggleActivo = async (usuario) => {
    // Activar: usamos updateUsuario con activo=1
    if (!usuario?.id) return
    try {
      const payload = { activo: usuario.activo === 0 ? 1 : 0 }
      const actualizado = await updateUsuario(usuario.id, payload)
      setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? actualizado : u)))
      toast.success(payload.activo === 1 ? "Usuario activado" : "Usuario desactivado")
    } catch (error) {
      console.error(error)
      toast.error(error.message || "Error al cambiar estado")
    }
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100">
      <ToastContainer position="bottom-right" />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-500">Administrá usuarios para el acceso al sistema.</p>
        </div>

        {isAdmin && (
          <Button onClick={() => abrirDialogUsuario(null)} className="bg-orange-600 hover:bg-orange-700">
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo usuario
          </Button>
        )}
      </div>

      <Card className="mb-6 border-0 shadow-md">
        <CardHeader className="bg-[#131321] pb-3">
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <Filter size={20} />
            Buscar usuarios
          </CardTitle>
          <CardDescription className="text-gray-300">Por nombre, rol o estado.</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Ej: admin, empleado, inactivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <UsuariosList
        usuarios={usuariosFiltrados}
        cargando={cargando}
        abrirDialogUsuario={abrirDialogUsuario}
        setUsuarioSeleccionado={setUsuarioSeleccionado}
        setDialogDesactivarAbierto={setDialogDesactivarAbierto}
        onToggleActivo={handleToggleActivo}
      />

      {/* Form crear/editar */}
      <UsuarioFormDialog
        open={dialogUsuarioAbierto}
        setOpen={setDialogUsuarioAbierto}
        modoEdicion={modoEdicion}
        formUsuario={formUsuario}
        setFormUsuario={setFormUsuario}
        guardarUsuario={guardarUsuario}
      />

      {/* Desactivar usuario */}
      <Dialog open={dialogDesactivarAbierto} onOpenChange={() => onCloseDesactivar()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle size={18} />
              Desactivar usuario
            </DialogTitle>
            <DialogDescription>
              Esta acción impide que el usuario inicie sesión. Podés activarlo nuevamente desde el listado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="bg-gray-50 border rounded-md p-3 text-sm">
              <p className="flex justify-between">
                <span className="text-gray-500">Usuario</span>
                <span className="font-medium">{usuarioSeleccionado?.nombre}</span>
              </p>
              <p className="flex justify-between mt-1">
                <span className="text-gray-500">Rol</span>
                <span className="font-medium">{usuarioSeleccionado?.rol}</span>
              </p>
              <p className="mt-2">
                Estado actual:{" "}
                <Badge variant="outline" className={usuarioSeleccionado?.activo === 0 ? "" : "border-red-300 text-red-700"}>
                  {usuarioSeleccionado?.activo === 0 ? "Inactivo" : "Activo"}
                </Badge>
              </p>
            </div>

            <Separator />

            <p className="text-xs text-gray-500">
              Recomendación: evitá desactivar el último administrador activo.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onCloseDesactivar} disabled={desactivandoUsuario}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarDesactivarUsuario}
              disabled={desactivandoUsuario || !usuarioSeleccionado?.id}
            >
              {desactivandoUsuario ? "Desactivando..." : "Desactivar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UsuariosPage

