import { ArrowLeftRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import DevolucionItem from "./DevolucionItem"

const DevolucionesList = ({ devoluciones, formatearPrecio, formatearFechaHora }) => {
  if (!devoluciones || devoluciones.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border">
        <ArrowLeftRight className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <h4 className="text-lg font-medium mb-2 text-gray-700">Sin devoluciones</h4>
        <p className="text-gray-500">No hay devoluciones registradas para esta venta</p>
      </div>
    )
  }

  return (
    <Card className="border border-blue-200 shadow-sm">
      <CardHeader className="bg-blue-50 pb-3">
        <CardTitle className="text-blue-700 flex items-center gap-2">
          <ArrowLeftRight size={20} />
          Devoluciones de esta venta
        </CardTitle>
        <CardDescription className="text-blue-600/70">
          {devoluciones.length} {devoluciones.length === 1 ? "devolución registrada" : "devoluciones registradas"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <ScrollArea className="max-h-[350px] pr-2">
          {devoluciones.map((devolucion, index) => (
            <DevolucionItem
              key={index}
              devolucion={devolucion}
              formatearPrecio={formatearPrecio}
              formatearFechaHora={formatearFechaHora}
            />
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default DevolucionesList
