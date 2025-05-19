const API_URL = "https://api.sistemacellfierm22.site/api" 

// Función para convertir un precio formateado a número
const parseFormattedPrice = (price) => {
  if (typeof price === "number") return price

  // Eliminar el símbolo de moneda y espacios
  let cleanPrice = price.toString().replace(/\$ /g, "").replace(/\s/g, "")

  // Convertir formato argentino (1.234,56) a formato numérico (1234.56)
  cleanPrice = cleanPrice.replace(/\./g, "").replace(",", ".")

  return Number.parseFloat(cleanPrice)
}

// Obtener todos los productos
export const getProductos = async () => {
  try {
    const response = await fetch(`${API_URL}/productos`, {
      method: "GET",
      credentials: "include", // Importante para enviar la cookie con el token
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener productos")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getProductos:", error)
    throw error
  }
}

// Obtener un producto por ID
export const getProductoById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/productos/${id}`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener el producto")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en getProductoById:", error)
    throw error
  }
}

// Buscar productos con filtros
export const searchProductos = async (query) => {
  try {
    // Si recibimos un string, lo convertimos a un objeto de parámetros
    const params = typeof query === "string" ? { query } : query

    // Construir la URL con los parámetros de búsqueda
    const queryParams = new URLSearchParams()

    if (params.query) queryParams.append("query", params.query)
    if (params.categoria_id) queryParams.append("categoria_id", params.categoria_id)
    if (params.punto_venta_id) queryParams.append("punto_venta_id", params.punto_venta_id)
    if (params.min_precio !== undefined) queryParams.append("min_precio", params.min_precio)
    if (params.max_precio !== undefined) queryParams.append("max_precio", params.max_precio)
    if (params.min_stock !== undefined) queryParams.append("min_stock", params.min_stock)
    if (params.max_stock !== undefined) queryParams.append("max_stock", params.max_stock)

    const url = `${API_URL}/productos/search?${queryParams.toString()}`

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al buscar productos")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en searchProductos:", error)
    throw error
  }
}


// Crear un nuevo producto
export const createProducto = async (productoData) => {
  try {
    // Adaptar los datos del frontend al formato que espera el backend
    const backendData = {
      codigo: productoData.code,
      nombre: productoData.name,
      descripcion: productoData.description || "",
      precio: parseFormattedPrice(productoData.price),
      categoria_id: productoData.categoria_id === "0" ? null : Number(productoData.categoria_id),
      punto_venta_id: Number(productoData.punto_venta_id), // Usar directamente el ID del punto de venta
      stock: productoData.stock,
    }

    console.log("Datos enviados al backend:", backendData)

    const response = await fetch(`${API_URL}/productos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al crear el producto")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en createProducto:", error)
    throw error
  }
}

// Actualizar un producto existente
export const updateProducto = async (id, productoData) => {
  try {
    // Obtener el producto actual para mantener su punto_venta_id
    const productoActual = await getProductoById(id)

    const categoria_id =
      productoData.categoria_id === "0"
        ? null
        : productoData.categoria_id === 0
          ? null
          : Number(productoData.categoria_id)

    // Manejar el precio correctamente
    // Si el precio es un número, usarlo directamente
    // Si no, intentar parsearlo
    let precio
    if (typeof productoData.price === "number") {
      precio = productoData.price
    } else {
      precio = parseFormattedPrice(productoData.price)
    }

    // Adaptar los datos del frontend al formato que espera el backend
    const backendData = {
      codigo: productoData.code,
      nombre: productoData.name,
      descripcion: productoData.description || "",
      precio: precio,
      categoria_id: categoria_id,
      punto_venta_id: productoActual.punto_venta_id, // Mantener el punto de venta original
      stock: productoData.stock,
    }

    console.log("Datos enviados al backend para actualizar:", backendData)
    console.log("Precio original:", productoActual.precio)
    console.log("Precio enviado:", precio)

    const response = await fetch(`${API_URL}/productos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al actualizar el producto")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en updateProducto:", error)
    throw error
  }
}

// Eliminar un producto
export const deleteProducto = async (id) => {
  try {
    const response = await fetch(`${API_URL}/productos/${id}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al eliminar el producto")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en deleteProducto:", error)
    throw error
  }
}

// Función para adaptar los datos del backend al formato que espera el frontend
export const adaptProductoToFrontend = (producto) => {
  return {
    id: producto.id,
    name: producto.nombre,
    code: producto.codigo,
    description: producto.descripcion,
    price: producto.precio,
    category: producto.categoria,
    categoria_id: producto.categoria_id,
    stock: producto.stock || 0,
    pointOfSale: producto.punto_venta,
    punto_venta_id: producto.punto_venta_id,
    discount: producto.descuento
      ? {
          id: producto.descuento.id,
          percentage: producto.descuento.porcentaje,
          startDate: producto.descuento.fecha_inicio,
          endDate: producto.descuento.fecha_fin,
        }
      : null,
  }
}

// Obtener productos por punto de venta
export const getProductosByPuntoVenta = async (puntoVentaId) => {
  try {
    // Utilizamos la función de búsqueda existente con el filtro de punto de venta
    return await searchProductos({ punto_venta_id: puntoVentaId })
  } catch (error) {
    console.error("Error en getProductosByPuntoVenta:", error)
    throw error
  }
}
