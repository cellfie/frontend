"use client"

import { useState } from "react"
import { ArrowLeftRight, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const DevolucionItem = ({ devolucion, formatearPrecio, formatearFechaHora }) => {
  const [expandido, setExpandido] = useState(false)

  return (
    <Card className="mb-3 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="p-3 bg-white">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                  <ArrowLeftRight className="h-3 w-3 mr-1" />
                  Devolución
                </Badge>
                <span className="text-xs text-gray-500">{formatearFechaHora(devolucion.fecha)}</span>
              </div>
              <div className="mt-1 text-sm">
                <span className="text-gray-600">Productos devueltos:</span>{" "}
                <span className="font-medium">{devolucion.productos_devueltos.length}</span>
                {devolucion.productos_reemplazo.length > 0 && (
                  <>
                    {" • "}
                    <span className="text-gray-600">Productos de reemplazo:</span>{" "}
                    <span className="font-medium">{devolucion.productos_reemplazo.length}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="font-medium">
                {devolucion.diferencia > 0 ? (
                  <span className="text-red-600">Pagó: {formatearPrecio(devolucion.diferencia)}</span>
                ) : devolucion.diferencia < 0 ? (
                  <span className="text-green-600">A favor: {formatearPrecio(Math.abs(devolucion.diferencia))}</span>
                ) : (
                  <span className="text-gray-600">Sin diferencia</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-7 text-xs flex items-center gap-1"
                onClick={() => setExpandido(!expandido)}
              >
                {expandido ? (
                  <>
                    Ver menos <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Ver detalles <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {expandido && (
            <div className="mt-3 pt-3 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2 text-gray-700">Productos devueltos</h4>
                  <div className="space-y-2">
                    {devolucion.productos_devueltos.map((producto, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded border text-sm"
                      >
                        <div>
                          <div className="font-medium">{producto.producto_nombre || producto.nombre}</div>
                          <Badge
                            className={
                              producto.tipo_devolucion === "defectuoso"
                                ? "bg-red-100 text-red-800 border-red-300"
                                : "bg-green-100 text-green-800 border-green-300"
                            }
                          >
                            {producto.tipo_devolucion === "defectuoso" ? "Defectuoso" : "Normal"}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div>{formatearPrecio(producto.precio)}</div>
                          <div className="text-xs text-gray-500">Cant: {producto.cantidad}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2 text-gray-700">Productos de reemplazo</h4>
                  {devolucion.productos_reemplazo.length > 0 ? (
                    <div className="space-y-2">
                      {devolucion.productos_reemplazo.map((producto, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 bg-green-50 rounded border text-sm"
                        >
                          <div className="font-medium">{producto.producto_nombre || producto.nombre}</div>
                          <div className="text-right">
                            <div>{formatearPrecio(producto.precio)}</div>
                            <div className="text-xs text-gray-500">Cant: {producto.cantidad}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3 bg-gray-50 rounded border text-sm text-gray-500">
                      No hay productos de reemplazo
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-gray-600">Método de pago:</div>
                  <div className="font-medium">{devolucion.tipo_pago || "N/A"}</div>
                </div>
                <div>
                  <div className="text-gray-600">Cliente:</div>
                  <div className="font-medium">{devolucion.cliente_nombre || "Cliente General"}</div>
                </div>
                <div>
                  <div className="text-gray-600">Procesado por:</div>
                  <div className="font-medium">{devolucion.usuario_nombre}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default DevolucionItem
