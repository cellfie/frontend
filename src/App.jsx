import { Routes, Route } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import Layout from "./components/Layout"
import { StockProductosPage } from "./pages/stock/StockProductosPage"
import { StockEquiposPage } from "./pages/stock/StockEquiposPage"
import { StockRepuestosPage } from "./pages/stock/StockRepuestosPage"
import VentasProductos from "./pages/registrar/VentasProductos"
import VentasEquipos from "./pages/registrar/VentasEquipos"
import ReparacionesPage from "./pages/registrar/ReparacionesPage"
import Home from "./pages/Home"
import ReparacionesPendientes from "./components/ReparacionesPedientes"
import LoginPage from "./pages/auth/LoginPage"
import RegisterPage from "./pages/auth/RegisterPage"
import ProtectedRoute from "./lib/ProtectedRoute"
import { AuthProvider } from "./context/AuthContext"
import { DollarProvider } from "./context/DollarContext"
import HistorialVentasProductosPage from "./pages/historial/HistorialVentasProductosPage"
import HistorialDevolucionesPage from "./pages/historial/HistorialDevolucionesPage"
import HistorialPerdidasPage from "./pages/historial/HistorialPerdidasPage"
import ClientesPage from "./pages/config/ClientesPage"
import HistorialVentasEquiposPage from "./pages/historial/HistorialVentasEquiposPage"
import CategoriasPage from "./pages/config/CategoriasPage"
import ProveedoresPage from "./pages/config/ProveedoresPage"
import AccesoDenegadoPage from "./pages/AccesoDenegadoPage"
import ComprasProductos from "./pages/registrar/ComprasProductos"
import HistorialComprasProductosPage from "./pages/historial/HistorialComprasProductosPage"
import CajaPage from "./pages/CajaPage"
import ReportesPage from "./pages/reportes/ReportesPage"

function App() {
  return (
    <AuthProvider>
      <DollarProvider>
        <ToastContainer position="bottom-right" />
        <Routes>
          {/* Rutas de autenticación */}
          <Route path="/auth">
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* Página de acceso denegado */}
          <Route path="/acceso-denegado" element={<AccesoDenegadoPage />} />

          {/* Ruta base que utiliza el Layout y requiere autenticación */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Página de inicio */}
            <Route index element={<Home />} />

            {/* Rutas anidadas para registrar (accesibles para todos, algunas solo admin) */}
            <Route path="registrar">
              <Route path="ventas-productos" element={<VentasProductos />} />
              <Route path="ventas-equipos" element={<VentasEquipos />} />
              <Route path="reparacion" element={<ReparacionesPage />} />
              <Route
                path="compras-productos"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ComprasProductos />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Rutas de stock (solo para administradores) */}
            <Route path="stock">
              <Route
                path="productos"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <StockProductosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="equipos"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <StockEquiposPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="repuestos"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <StockRepuestosPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Rutas de historial (algunas solo para administradores) */}
            <Route path="historial">
              <Route path="ventas-productos" element={<HistorialVentasProductosPage />} />
              <Route
                path="compras-productos"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <HistorialComprasProductosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="caja"
                element={
                  <ProtectedRoute requiredRoles={["admin", "empleado"]}>
                    <CajaPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="ventas-equipos"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <HistorialVentasEquiposPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="devoluciones"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <HistorialDevolucionesPage />
                  </ProtectedRoute>
                }
              />
              <Route path="perdidas" element={<HistorialPerdidasPage />} />
            </Route>

            {/* Rutas de configuraciones (algunas solo para administradores) */}
            <Route path="configuraciones">
              <Route
                path="categorias"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <CategoriasPage />
                  </ProtectedRoute>
                }
              />
              <Route path="clientes" element={<ClientesPage />} />
              <Route
                path="proveedores"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ProveedoresPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="reparaciones-pendientes" element={<ReparacionesPendientes />} />

            <Route
              path="reportes"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ReportesPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </DollarProvider>
    </AuthProvider>
  )
}

export default App
