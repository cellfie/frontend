"use client"

import { createContext, useState, useEffect } from "react"
import { getTipoCambio } from "@/services/tipoCambioService"

export const DollarContext = createContext()

export const DollarProvider = ({ children }) => {
  const [dollarPrice, setDollarPrice] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)

  // Detectar estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      // Intentar cargar el precio actualizado cuando vuelve la conexión
      fetchDollarPrice()
    }

    const handleOffline = () => {
      setIsOffline(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Verificar estado inicial
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Función para cargar el precio del dólar
  const fetchDollarPrice = async () => {
    try {
      setLoading(true)
      const price = await getTipoCambio()
      if (price > 0) {
        setDollarPrice(price)

        // Guardar en localStorage como respaldo
        try {
          localStorage.setItem("dollarPrice", price.toString())
        } catch (e) {
          console.warn("No se pudo guardar en localStorage:", e)
        }
      }
    } catch (error) {
      console.error("Error al obtener el precio del dólar:", error)

      // Intentar recuperar de localStorage si hay error
      try {
        const savedPrice = localStorage.getItem("dollarPrice")
        if (savedPrice) {
          const price = Number.parseFloat(savedPrice)
          if (price > 0) {
            setDollarPrice(price)
          }
        }
      } catch (e) {
        console.warn("No se pudo leer de localStorage:", e)
      }
    } finally {
      setLoading(false)
    }
  }

  // Cargar el precio del dólar al iniciar
  useEffect(() => {
    fetchDollarPrice()
  }, [])

  // Función para actualizar el precio del dólar
  const updateDollarPrice = async (newPrice) => {
    // Actualizar inmediatamente en la UI
    setDollarPrice(newPrice)

    // Guardar en localStorage como respaldo
    try {
      localStorage.setItem("dollarPrice", newPrice.toString())

      // Si estamos offline, guardar como pendiente
      if (isOffline) {
        localStorage.setItem(
          "pendingDollarUpdate",
          JSON.stringify({
            valor: newPrice,
            timestamp: Date.now(),
          }),
        )
      }
    } catch (e) {
      console.warn("No se pudo guardar en localStorage:", e)
    }

    return newPrice
  }

  return (
    <DollarContext.Provider
      value={{
        dollarPrice,
        updateDollarPrice,
        loading,
        isOffline,
        refreshDollarPrice: fetchDollarPrice,
      }}
    >
      {children}
    </DollarContext.Provider>
  )
}
