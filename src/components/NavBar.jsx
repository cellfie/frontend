"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  ChevronDown,
  Menu,
  Home,
  ShoppingCart,
  Package,
  Clock,
  Settings,
  Smartphone,
  PenToolIcon as Tool,
  BarChart3,
  ShoppingBag,
  AlertTriangle,
  Tag,
  Users,
  RefreshCw,
  LogOut,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { logout, getCurrentUser } from "../services/authService"
import { toast } from "react-toastify"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// DesktopMenuItem component with gray text and transparent hover
const DesktopMenuItem = ({ title, to, icon: Icon, children, hidden = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const isActive = to && location.pathname === to
  const closeTimeoutRef = useRef(null)

  // Si el elemento está oculto, no renderizarlo
  if (hidden) return null

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    if (children) setIsOpen(true)
  }

  const handleMouseLeave = () => {
    if (children) {
      closeTimeoutRef.current = setTimeout(() => {
        setIsOpen(false)
      }, 150) // Small delay to allow moving to submenu
    }
  }

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children ? (
        <>
          <Button
            variant="ghost"
            className={cn(
              "flex items-center gap-1 h-10 text-gray-200 hover:bg-transparent hover:text-orange-600",
              isOpen && "text-orange-600",
              isActive && "text-orange-600",
            )}
            onClick={() => setIsOpen(!isOpen)}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{title}</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
          </Button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-0 pt-1 w-56 z-50">
              <div className="rounded-md border border-[#131321] bg-[#131321] shadow-xl py-1">{children}</div>
            </div>
          )}
        </>
      ) : (
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-1 h-10 text-gray-200 hover:bg-transparent hover:text-orange-600",
            isActive && "text-orange-600",
          )}
          asChild
        >
          <Link to={to} className="flex items-center gap-1">
            {Icon && <Icon className="h-4 w-4" />}
            <span>{title}</span>
          </Link>
        </Button>
      )}
    </div>
  )
}

// DesktopSubMenuItem component with gray text and transparent hover
const DesktopSubMenuItem = ({ title, to, icon: Icon, hidden = false }) => {
  const location = useLocation()
  const isActive = location.pathname === to

  // Si el elemento está oculto, no renderizarlo
  if (hidden) return null

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start px-3 py-2 text-sm text-gray-200 hover:bg-transparent hover:text-orange-600",
        isActive && "text-orange-600",
      )}
      asChild
    >
      <Link to={to} className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        <span>{title}</span>
      </Link>
    </Button>
  )
}

// MobileNavItem component with gray text and transparent hover
const MobileNavItem = ({ title, to, icon: Icon, children, hidden = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const isActive = to && location.pathname === to

  // Si el elemento está oculto, no renderizarlo
  if (hidden) return null

  // Si no hay hijos visibles, no mostrar el elemento
  if (children && React.Children.count(children) === 0) return null

  return (
    <div className="w-full">
      {children ? (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-between px-2 text-gray-200 hover:bg-transparent hover:text-orange-600",
                isOpen && "text-orange-600",
                isActive && "text-orange-600",
              )}
            >
              <div className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                <span>{title}</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 border-l border-orange-700 ml-3 mt-1">{children}</CollapsibleContent>
        </Collapsible>
      ) : (
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start px-2 text-gray-200 hover:bg-transparent hover:text-orange-600",
            isActive && "text-orange-600",
          )}
          asChild
        >
          <Link to={to} className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            <span>{title}</span>
          </Link>
        </Button>
      )}
    </div>
  )
}

// Componente para el botón móvil con control de visibilidad
const MobileNavButton = ({ to, icon: Icon, title, hidden = false, onClick }) => {
  // Si el elemento está oculto, no renderizarlo
  if (hidden) return null

  if (onClick) {
    return (
      <Button
        variant="ghost"
        className="justify-start h-9 text-gray-200 hover:bg-transparent hover:text-orange-600"
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span>{title}</span>
        </div>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      className="justify-start h-9 text-gray-200 hover:bg-transparent hover:text-orange-600"
      asChild
    >
      <Link to={to} className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </Link>
    </Button>
  )
}

// NavBar component with adjusted title spacing
export const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { currentUser } = useAuth()
  const location = useLocation()

  // Determinar si el usuario es administrador
  const isAdmin = currentUser?.role === "admin"

  const [username, setUsername] = useState("")
  const [userInitials, setUserInitials] = useState("US")

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

  // Función para manejar el cierre de sesión
  const handleLogout = async () => {
    try {
      setIsLoading(true)
      await logout()
      // Redirigir al login
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      toast.error("Error al cerrar sesión", {
        position: "bottom-right",
        autoClose: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Detectar scroll para cambiar la apariencia de la navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        isScrolled
          ? "bg-[#131321] backdrop-blur-sm shadow-md border-b border-orange-700"
          : "bg-[#131321] border-b border-orange-700",
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 pl-4">
          <span className="text-xl font-bold text-orange-600">Cell-fie</span>
        </Link>

        {/* Navegación de Escritorio */}
        <div className="hidden md:flex items-center space-x-1">
          <DesktopMenuItem title="Inicio" to="/" icon={Home} />

          <DesktopMenuItem title="Registrar" icon={ShoppingCart}>
            <DesktopSubMenuItem title="Ventas productos" to="/registrar/ventas-productos" icon={ShoppingBag} />
            <DesktopSubMenuItem title="Ventas equipos" to="/registrar/ventas-equipos" icon={Smartphone} />
            <DesktopSubMenuItem title="Reparación" to="/registrar/reparacion" icon={Tool} />
          </DesktopMenuItem>

          {/* Stock solo visible para administradores */}
          <DesktopMenuItem title="Stock" icon={Package} hidden={!isAdmin}>
            <DesktopSubMenuItem title="Productos" to="/stock/productos" icon={ShoppingBag} />
            <DesktopSubMenuItem title="Equipos" to="/stock/equipos" icon={Smartphone} />
            <DesktopSubMenuItem title="Repuestos" to="/stock/repuestos" icon={Tool} />
          </DesktopMenuItem>

          <DesktopMenuItem title="Historial" icon={Clock}>
            <DesktopSubMenuItem title="Ventas Productos" to="/historial/ventas-productos" icon={BarChart3} />
            <DesktopSubMenuItem
              title="Ventas Equipos"
              to="/historial/ventas-equipos"
              icon={BarChart3}
              hidden={!isAdmin}
            />
            <DesktopSubMenuItem title="Devoluciones" to="/historial/devoluciones" icon={RefreshCw} hidden={!isAdmin} />
            <DesktopSubMenuItem title="Pérdidas" to="/historial/perdidas" icon={AlertTriangle} />
          </DesktopMenuItem>

          <DesktopMenuItem title="Configuraciones" icon={Settings}>
            <DesktopSubMenuItem title="Clientes" to="/configuraciones/clientes" icon={Users} />
            <DesktopSubMenuItem title="Categorías" to="/configuraciones/categorias" icon={Tag} hidden={!isAdmin} />
          </DesktopMenuItem>
        </div>

        {/* Perfil de usuario y cierre de sesión (escritorio) */}
        <div className="hidden md:flex items-center ml-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="mr-5">
              <Button variant="ghost" className="h-9 px-2 text-gray-200 hover:bg-transparent hover:text-orange-600">
                <Avatar className="h-7 w-7 border border-orange-600">
                  <AvatarFallback className="bg-[#131321] text-orange-600 text-xs">{userInitials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{username || "Usuario"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#131321] border-orange-700 text-gray-200">
              <DropdownMenuItem
                className="cursor-pointer hover:bg-transparent hover:text-orange-600"
                onClick={handleLogout}
                disabled={isLoading}
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Menú móvil */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-gray-200 hover:text-orange-600 hover:bg-transparent">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[350px] bg-[#131321] text-gray-200 border-[#131321]">
            <div className="flex flex-col gap-6 py-4">
              <div className="flex items-center justify-between pl-2">
                <Link to="/" className="flex items-center gap-2">
                  <span className="text-xl font-bold text-orange-600">Cell-fie</span>
                </Link>

                {/* Perfil móvil */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-orange-600">
                    <AvatarFallback className="bg-[#131321] text-orange-600 text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{username || "Usuario"}</span>
                </div>
              </div>

              <nav className="flex flex-col gap-2">
                <MobileNavItem title="Inicio" to="/" icon={Home} />

                <MobileNavItem title="Registrar" icon={ShoppingCart}>
                  <div className="flex flex-col gap-1 py-1">
                    <MobileNavButton to="/registrar/ventas-productos" icon={ShoppingBag} title="Ventas productos" />
                    <MobileNavButton to="/registrar/ventas-equipos" icon={Smartphone} title="Ventas equipos" />
                    <MobileNavButton to="/registrar/reparacion" icon={Tool} title="Reparación" />
                  </div>
                </MobileNavItem>

                {/* Stock solo visible para administradores */}
                <MobileNavItem title="Stock" icon={Package} hidden={!isAdmin}>
                  <div className="flex flex-col gap-1 py-1">
                    <MobileNavButton to="/stock/productos" icon={ShoppingBag} title="Productos" />
                    <MobileNavButton to="/stock/equipos" icon={Smartphone} title="Equipos" />
                    <MobileNavButton to="/stock/repuestos" icon={Tool} title="Repuestos" />
                  </div>
                </MobileNavItem>

                <MobileNavItem title="Historial" icon={Clock}>
                  <div className="flex flex-col gap-1 py-1">
                    <MobileNavButton to="/historial/ventas-productos" icon={BarChart3} title="Ventas productos" />
                    <MobileNavButton
                      to="/historial/ventas-equipos"
                      icon={BarChart3}
                      title="Ventas Equipos"
                      hidden={!isAdmin}
                    />
                    <MobileNavButton
                      to="/historial/devoluciones"
                      icon={RefreshCw}
                      title="Devoluciones"
                      hidden={!isAdmin}
                    />
                    <MobileNavButton to="/historial/perdidas" icon={AlertTriangle} title="Pérdidas" />
                  </div>
                </MobileNavItem>

                <MobileNavItem title="Configuraciones" icon={Settings}>
                  <div className="flex flex-col gap-1 py-1">
                    <MobileNavButton to="/configuraciones/clientes" icon={Users} title="Clientes" />
                    <MobileNavButton to="/configuraciones/categorias" icon={Tag} title="Categorías" hidden={!isAdmin} />
                  </div>
                </MobileNavItem>

                {/* Botón de cierre de sesión en móvil */}
                <div className="mt-4 pt-4 border-t border-orange-700">
                  <MobileNavButton icon={LogOut} title="Cerrar Sesión" onClick={handleLogout} />
                </div>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
