// Función para generar datos de prueba de repuestos
export function generateMockRepuestos(count = 10) {
  const repuestoNames = [
    "Pantalla",
    "Batería",
    "Cámara",
    "Altavoz",
    "Puerto de carga",
    "Carcasa",
    "Micrófono",
    "Auricular",
    "Botón de encendido",
    "Placa base",
  ]
  const brands = ["Samsung", "Apple", "Xiaomi", "Huawei", "Motorola", "OnePlus", "Google", "Sony", "LG", "Nokia"]
  const models = ["A1", "B2", "C3", "D4", "E5", "F6", "G7", "H8", "I9", "J10"]
  const pointsOfSale = ["Tala", "Trancas"]

  const repuestos = []

  for (let i = 0; i < count; i++) {
    const nombre = repuestoNames[Math.floor(Math.random() * repuestoNames.length)]
    const marca = brands[Math.floor(Math.random() * brands.length)]
    const modelo = models[Math.floor(Math.random() * models.length)]
    const stock = Math.floor(Math.random() * 101) // 0 a 100 unidades
    const descripcion = `Repuesto de ${nombre} compatible con ${marca} ${modelo}.`
    const pointOfSale = pointsOfSale[Math.floor(Math.random() * pointsOfSale.length)]

    repuestos.push({
      id: `RP-${i + 1000}`,
      nombre,
      marca,
      modelo,
      descripcion,
      stock,
      pointOfSale,
    })
  }

  return repuestos
}
