"use client"

import { useState, useEffect, useCallback } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { AnimatePresence } from "framer-motion"
import { ProductHeader } from "./ProductHeader"
import { ProductTable } from "./ProductTable"
import { AddProductModal } from "./AddProductModal"
import { DiscountModal } from "./DiscountModal"
import { PaginationControls } from "@/lib/PaginationControls"
import {
  getProductosPaginados,
  createProducto,
  updateProducto,
  deleteProducto,
  adaptProductoToFrontend,
} from "../../../services/productosService"
import { createDescuento, desactivarDescuentosProducto } from "../../../services/descuentosService"
import { getPuntosVenta } from "../../../services/puntosVentaService"
import { getCategorias } from "../../../services/categoriasService"

// Hook personalizado para debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export const ProductosPrincipal = () => {
  // Estados principales
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [discountProduct, setDiscountProduct] = useState(null)
  const [showDetails, setShowDetails] = useState(null)

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("todas")
  const [pointOfSale, setPointOfSale] = useState("todos")
  const [stockRange, setStockRange] = useState([0, 100])
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null,
  })

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Estados de datos auxiliares
  const [puntosVenta, setPuntosVenta] = useState([])
  const [categorias, setCategorias] = useState([])
  const [selectedPuntoVentaId, setSelectedPuntoVentaId] = useState(null)
  const [maxStockAvailable, setMaxStockAvailable] = useState(100)

  // Debounce para la búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Cargar puntos de venta
  useEffect(() => {
    const fetchPuntosVenta = async () => {
      try {
        const data = await getPuntosVenta()
        setPuntosVenta(data)

        if (data.length > 0) {
          const defaultPuntoVenta = data.find((pv) => pv.id === 1) || data[0]
          setSelectedPuntoVentaId(defaultPuntoVenta.id)
        }
      } catch (error) {
        console.error("Error al cargar puntos de venta:", error)
        toast.error("Error al cargar puntos de venta")
      }
    }

    fetchPuntosVenta()
  }, [])

  // Cargar categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const data = await getCategorias()
        setCategorias(data)
      } catch (error) {
        console.error("Error al cargar categorías:", error)
        toast.error("Error al cargar categorías")
      }
    }

    fetchCategorias()
  }, [])

  // Función para construir filtros
  const buildFilters = useCallback(() => {
    const filters = {}

    if (debouncedSearchTerm) {
      filters.search = debouncedSearchTerm
    }

    if (selectedCategory !== "todas") {
      const categoria = categorias.find((cat) => cat.nombre === selectedCategory)
      if (categoria) filters.categoria_id = categoria.id
    }

    if (pointOfSale !== "todos") {
      const puntoVenta = puntosVenta.find((pv) => pv.nombre === pointOfSale)
      if (puntoVenta) filters.punto_venta_id = puntoVenta.id
    }

    if (stockRange[0] > 0) filters.min_stock = stockRange[0]
    if (stockRange[1] < maxStockAvailable) filters.max_stock = stockRange[1]

    // Filtros de fecha
    if (dateRange?.from) {
      const fechaInicio = new Date(dateRange.from)
      filters.fecha_inicio = fechaInicio.toISOString().split("T")[0]
    }

    if (dateRange?.to) {
      const fechaFin = new Date(dateRange.to)
      filters.fecha_fin = fechaFin.toISOString().split("T")[0]
    }

    return filters
  }, [
    debouncedSearchTerm,
    selectedCategory,
    pointOfSale,
    stockRange,
    categorias,
    puntosVenta,
    maxStockAvailable,
    dateRange,
  ])

  // Cargar productos con paginación
  const fetchProducts = useCallback(
    async (page = 1, resetPage = false) => {
      setIsLoading(true)
      try {
        const filters = buildFilters()
        const actualPage = resetPage ? 1 : page

        const result = await getProductosPaginados(actualPage, itemsPerPage, filters)

        const adaptedProducts = result.data.map(adaptProductoToFrontend)

        setProducts(adaptedProducts)
        setCurrentPage(result.pagination.currentPage)
        setTotalPages(result.pagination.totalPages)
        setTotalItems(result.pagination.totalItems)

        if (resetPage) {
          setCurrentPage(1)
        }

        // Actualizar el stock máximo disponible si es necesario
        if (adaptedProducts.length > 0) {
          const maxStock = Math.max(...adaptedProducts.map((p) => p.stock))
          if (maxStock > maxStockAvailable) {
            setMaxStockAvailable(maxStock)
            setStockRange([0, maxStock])
          }
        }
      } catch (error) {
        console.error("Error al cargar productos:", error)
        toast.error("Error al cargar productos")
      } finally {
        setIsLoading(false)
      }
    },
    [buildFilters, itemsPerPage, maxStockAvailable],
  )

  // Efecto para cargar productos cuando cambian los filtros
  useEffect(() => {
    fetchProducts(1, true)
  }, [debouncedSearchTerm, selectedCategory, pointOfSale, stockRange, itemsPerPage, dateRange])

  // Efecto para cargar productos cuando cambia la página
  useEffect(() => {
    if (currentPage > 1) {
      fetchProducts(currentPage, false)
    }
  }, [currentPage])

  // Funciones de manejo de productos
  const handleAddProduct = async (newProduct) => {
    try {
      setIsLoading(true)
      const result = await createProducto(newProduct)

      // Recargar la página actual
      await fetchProducts(currentPage)

      toast.success("Producto agregado exitosamente")
      return result
    } catch (error) {
      console.error("Error al agregar producto:", error)
      toast.error(error.message || "Error al agregar producto")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProduct = async (updatedProduct) => {
    try {
      setIsLoading(true)

      await updateProducto(updatedProduct.id, {
        code: updatedProduct.code,
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        categoria_id: updatedProduct.categoria_id === "0" ? null : Number(updatedProduct.categoria_id),
        stock: Number(updatedProduct.stock),
      })

      // Recargar la página actual
      await fetchProducts(currentPage)

      toast.success("Producto actualizado correctamente")
      return updatedProduct
    } catch (error) {
      console.error("Error al actualizar producto:", error)
      toast.error(error.message || "Error al actualizar producto")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProduct = async (productId, discountOnly = false) => {
    try {
      setIsLoading(true)

      if (discountOnly) {
        await desactivarDescuentosProducto(productId)
        toast.success("Descuento cancelado correctamente")
      } else {
        await deleteProducto(productId)
        toast.success("Producto eliminado")
      }

      // Recargar la página actual
      await fetchProducts(currentPage)

      return true
    } catch (error) {
      console.error("Error al eliminar producto:", error)
      toast.error(error.message || "Error al eliminar producto")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddDiscount = async (discountData) => {
    try {
      setIsLoading(true)

      if (discountData.removeDiscount) {
        await desactivarDescuentosProducto(discountData.productId)
        toast.success("Descuento eliminado correctamente")
      } else {
        await createDescuento(discountData)
        toast.success("Descuento aplicado correctamente")
      }

      // Recargar la página actual
      await fetchProducts(currentPage)

      return true
    } catch (error) {
      console.error("Error al gestionar el descuento:", error)
      toast.error(error.message || "Error al gestionar el descuento")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Funciones de modal
  const openAddModal = () => {
    setEditingProduct(null)
    setShowModal(true)
  }

  const openEditModal = (product) => {
    setEditingProduct(JSON.parse(JSON.stringify(product)))
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProduct(null)
  }

  const openDiscountModal = (product) => {
    setDiscountProduct(product)
    setShowDiscountModal(true)
  }

  const closeDiscountModal = () => {
    setShowDiscountModal(false)
    setDiscountProduct(null)
  }

  // Funciones de selección
  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const toggleSelectAll = (isSelected) => {
    setSelectedProducts(isSelected ? products.map((p) => p.id) : [])
  }

  const handleExportSelected = () => {
    console.log("Exportando productos:", selectedProducts)
    toast.info(`Exportando ${selectedProducts.length} producto(s)`)
  }

  const toggleDetails = (productId) => {
    setShowDetails((prev) => (prev === productId ? null : productId))
  }

  // Funciones de paginación
  const handlePageChange = (page) => {
    setCurrentPage(page)
    setShowDetails(null) // Cerrar detalles al cambiar página
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("todas")
    setPointOfSale("todos")
    setStockRange([0, maxStockAvailable])
    setDateRange({ from: null, to: null })
    setCurrentPage(1)
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <ProductHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        stockRange={stockRange}
        setStockRange={setStockRange}
        pointOfSale={pointOfSale}
        setPointOfSale={setPointOfSale}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onAddClick={openAddModal}
        totalProducts={totalItems}
        puntosVenta={puntosVenta}
        maxStockAvailable={maxStockAvailable}
        onClearFilters={clearFilters}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

      <ProductTable
        products={products}
        isLoading={isLoading}
        selectedProducts={selectedProducts}
        toggleProductSelection={toggleProductSelection}
        toggleSelectAll={toggleSelectAll}
        onExport={handleExportSelected}
        onEdit={openEditModal}
        onDelete={handleDeleteProduct}
        showDetails={showDetails}
        toggleDetails={toggleDetails}
        onAddDiscount={openDiscountModal}
      />

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        isLoading={isLoading}
      />

      <AnimatePresence>
        {showModal && (
          <AddProductModal
            isOpen={showModal}
            onClose={closeModal}
            onSave={editingProduct ? handleUpdateProduct : handleAddProduct}
            product={editingProduct}
            puntosVenta={puntosVenta}
            defaultPuntoVentaId={selectedPuntoVentaId}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDiscountModal && (
          <DiscountModal
            isOpen={showDiscountModal}
            onClose={closeDiscountModal}
            onSave={handleAddDiscount}
            product={discountProduct}
          />
        )}
      </AnimatePresence>

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
