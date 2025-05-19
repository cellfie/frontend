const API_URL = "https://api.sistemacellfierm22.site/api" 

// Obtener todos los descuentos
export const getDescuentos = async () => {
  try {
    const response = await fetch(`${API_URL}/descuentos`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al obtener descuentos");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en getDescuentos:", error);
    throw error;
  }
};

// Obtener descuentos activos
export const getDescuentosActivos = async () => {
  try {
    const response = await fetch(`${API_URL}/descuentos/activos`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al obtener descuentos activos");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en getDescuentosActivos:", error);
    throw error;
  }
};

// Obtener descuentos por producto
export const getDescuentosByProducto = async (productoId) => {
  try {
    const response = await fetch(`${API_URL}/descuentos/producto/${productoId}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al obtener descuentos del producto");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en getDescuentosByProducto:", error);
    throw error;
  }
};

// Crear un nuevo descuento
export const createDescuento = async (descuentoData) => {
  try {
    // Adaptar los datos del frontend al formato que espera el backend
    const backendData = {
      producto_id: descuentoData.productId,
      porcentaje: descuentoData.percentage,
      fecha_inicio: descuentoData.startDate,
      fecha_fin: descuentoData.endDate
    };

    const response = await fetch(`${API_URL}/descuentos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendData),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al crear el descuento");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en createDescuento:", error);
    throw error;
  }
};

// Actualizar un descuento existente
export const updateDescuento = async (id, descuentoData) => {
  try {
    // Adaptar los datos del frontend al formato que espera el backend
    const backendData = {
      porcentaje: descuentoData.percentage,
      fecha_inicio: descuentoData.startDate,
      fecha_fin: descuentoData.endDate,
      activo: descuentoData.activo !== undefined ? descuentoData.activo : true
    };

    const response = await fetch(`${API_URL}/descuentos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendData),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al actualizar el descuento");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en updateDescuento:", error);
    throw error;
  }
};

// Eliminar un descuento
export const deleteDescuento = async (id) => {
  try {
    const response = await fetch(`${API_URL}/descuentos/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al eliminar el descuento");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en deleteDescuento:", error);
    throw error;
  }
};

// Desactivar todos los descuentos de un producto
export const desactivarDescuentosProducto = async (productoId) => {
  try {
    const response = await fetch(`${API_URL}/descuentos/producto/${productoId}/desactivar`, {
      method: "PUT",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al desactivar los descuentos del producto");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en desactivarDescuentosProducto:", error);
    throw error;
  }
};