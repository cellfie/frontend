"use client"

import { createContext, useState, useEffect } from "react"
import { getTipoCambio, setTipoCambio } from "@/services/tipoCambioService"

export const DollarContext = createContext()

export const DollarProvider = ({ children }) => {
  const [dollarPrice, setDollarPrice] = useState(0)
  const [loading, setLoading] = useState(true)

  // Cargar el precio del dólar al iniciar
  useEffect(() => {
    const fetchDollarPrice = async () => {
      try {
        setLoading(true)
        const price = await getTipoCambio()
        if (price > 0) {
          setDollarPrice(price)
        }
      } catch (error) {
        console.error("Error al obtener el precio del dólar:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDollarPrice()
  }, [])

  // Función para actualizar el precio del dólar
  const updateDollarPrice = async (newPrice) => {
    try {
      setLoading(true)
      await setTipoCambio(newPrice)
      setDollarPrice(newPrice)
      return true
    } catch (error) {
      console.error("Error al actualizar el precio del dólar:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return <DollarContext.Provider value={{ dollarPrice, updateDollarPrice, loading }}>{children}</DollarContext.Provider>
}
