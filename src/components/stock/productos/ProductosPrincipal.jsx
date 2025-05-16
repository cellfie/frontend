"use client"

import { useState, useEffect } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { AnimatePresence } from "framer-motion"
import { ProductHeader } from "./ProductHeader"
import { ProductTable } from "./ProductTable"
import { AddProductModal } from "./AddProductModal"
import { DiscountModal } from "./DiscountModal"
import {
  getProductos,
  searchProductos,
  createProducto,
  updateProducto,
  deleteProducto,
  adaptProductoToFrontend,
} from "../../../services/productosService"
import { createDescuento, desactivarDescuentosProducto } from "../../../services/descuentosService"
import { getPuntosVenta } from "../../../services/puntosVentaService"
import { getCategorias } from "../../../services/categoriasService"

export const ProductosPrincipal = () => {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [discountProduct, setDiscountProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [stockRange, setStockRange] = useState([0, 100])
  const [pointOfSale, setPointOfSale] = useState("todos")
  const [selectedCategory, setSelectedCategory] = useState("todas")
  const [showDetails, setShowDetails] = useState(null)
  const [puntosVenta, setPuntosVenta] = useState([])
  const [categorias, setCategorias] = useState([])
  const [selectedPuntoVentaId, setSelectedPuntoVentaId] = useState(null)
  const [maxStockAvailable, setMaxStockAvailable] = useState(100)

  // Cargar puntos de venta
  useEffect(() => {
    const fetchPuntosVenta = async () => {
      try {
        const data = await getPuntosVenta()
        setPuntosVenta(data)

        // Establecer el punto de venta por defecto (ID 1 o el primero disponible)
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

  // Cargar productos
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const data = await getProductos()
        // Adaptar los datos del backend al formato que espera el frontend
        const adaptedProducts = data.map(adaptProductoToFrontend)

        // Calculate maximum stock available
        if (adaptedProducts.length > 0) {
          const maxStock = Math.max(...adaptedProducts.map((p) => p.stock))
          setMaxStockAvailable(maxStock > 0 ? maxStock : 100)
          setStockRange([0, maxStock > 0 ? maxStock : 100])
        }

        setProducts(adaptedProducts)
        setFilteredProducts(adaptedProducts)
      } catch (error) {
        console.error("Error al cargar productos:", error)
        toast.error("Error al cargar productos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Filtrar productos
  useEffect(() => {
    const applyFilters = async () => {
      setIsLoading(true)
      try {
        if (
          searchTerm ||
          selectedCategory !== "todas" ||
          stockRange[0] > 0 ||
          stockRange[1] < maxStockAvailable ||
          pointOfSale !== "todos"
        ) {
          // Preparar parámetros para la búsqueda
          const params = {}
          if (searchTerm) params.query = searchTerm
          if (stockRange[0] > 0) params.min_stock = stockRange[0]
          if (stockRange[1] < maxStockAvailable) params.max_stock = stockRange[1]

          // Si se selecciona un punto de venta específico
          if (pointOfSale !== "todos") {
            const puntoVenta = puntosVenta.find((pv) => pv.nombre === pointOfSale)
            if (puntoVenta) params.punto_venta_id = puntoVenta.id
          }

          // Si se selecciona una categoría específica
          if (selectedCategory !== "todas") {
            const categoria = categorias.find((cat) => cat.nombre === selectedCategory)
            if (categoria) params.categoria_id = categoria.id
          }

          // Realizar la búsqueda con los filtros
          const data = await searchProductos(params)
          const adaptedProducts = data.map(adaptProductoToFrontend)
          setFilteredProducts(adaptedProducts)
        } else {
          // Si no hay filtros, mostrar todos los productos
          setFilteredProducts(products)
        }
      } catch (error) {
        console.error("Error al filtrar productos:", error)
        toast.error("Error al filtrar productos")
      } finally {
        setIsLoading(false)
      }
    }

    applyFilters()
  }, [searchTerm, selectedCategory, stockRange, pointOfSale, products, puntosVenta, categorias, maxStockAvailable])

  const handleAddProduct = async (newProduct) => {
    try {
      setIsLoading(true)
      const result = await createProducto(newProduct)

      // Obtener todos los productos actualizados
      const updatedProducts = await getProductos()
      const adaptedProducts = updatedProducts.map(adaptProductoToFrontend)

      setProducts(adaptedProducts)
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

  // Modificar la función handleUpdateProduct para manejar correctamente el cambio de punto de venta
  const handleUpdateProduct = async (updatedProduct) => {
    try {
      setIsLoading(true)

      // Log para depuración
      console.log("Producto a actualizar:", updatedProduct)

      // Actualizar el producto sin cambiar el punto de venta
      await updateProducto(updatedProduct.id, {
        code: updatedProduct.code,
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        categoria_id: updatedProduct.categoria_id === "0" ? null : Number(updatedProduct.categoria_id),
        stock: Number(updatedProduct.stock),
        // No incluimos punto_venta_id aquí, se mantendrá el original en el backend
      })

      // Actualizar la lista de productos
      const updatedProducts = await getProductos()
      const adaptedProducts = updatedProducts.map(adaptProductoToFrontend)

      // Log para depuración
      console.log("Productos actualizados:", adaptedProducts)

      setProducts(adaptedProducts)
      setFilteredProducts((prev) => {
        // Actualizar también los productos filtrados para reflejar los cambios inmediatamente
        return prev.map((p) =>
          p.id === updatedProduct.id ? adaptedProducts.find((ap) => ap.id === updatedProduct.id) : p,
        )
      })

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
        // Solo eliminar el descuento
        await desactivarDescuentosProducto(productId)
        toast.success("Descuento cancelado correctamente")
      } else {
        // Eliminar el producto completo
        await deleteProducto(productId)
        toast.success("Producto eliminado")
      }

      // Actualizar la lista de productos
      const updatedProducts = await getProductos()
      const adaptedProducts = updatedProducts.map(adaptProductoToFrontend)

      setProducts(adaptedProducts)
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
        // Eliminar el descuento
        await desactivarDescuentosProducto(discountData.productId)
        toast.success("Descuento eliminado correctamente")
      } else {
        // Crear o actualizar el descuento
        await createDescuento(discountData)
        toast.success("Descuento aplicado correctamente")
      }

      // Actualizar la lista de productos
      const updatedProducts = await getProductos()
      const adaptedProducts = updatedProducts.map(adaptProductoToFrontend)

      setProducts(adaptedProducts)
      return true
    } catch (error) {
      console.error("Error al gestionar el descuento:", error)
      toast.error(error.message || "Error al gestionar el descuento")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingProduct(null)
    setShowModal(true)
  }

  const openEditModal = (product) => {
    // Guardar una copia profunda del producto para poder comparar después
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

  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const toggleSelectAll = (isSelected) => {
    setSelectedProducts(isSelected ? filteredProducts.map((p) => p.id) : [])
  }

  const handleExportSelected = () => {
    // Implementar exportación real si es necesario
    console.log("Exportando productos:", selectedProducts)
    toast.info(`Exportando ${selectedProducts.length} producto(s)`)
  }

  const toggleDetails = (productId) => {
    setShowDetails((prev) => (prev === productId ? null : productId))
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
        totalProducts={filteredProducts.length}
        puntosVenta={puntosVenta}
        maxStockAvailable={maxStockAvailable}
      />

      <ProductTable
        products={filteredProducts}
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

      {/* React-Toastify - Solo un contenedor */}
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
