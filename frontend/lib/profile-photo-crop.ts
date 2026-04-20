import type { Area } from "react-easy-crop"

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener("load", () => resolve(img))
    img.addEventListener("error", () => reject(new Error("No se pudo cargar la imagen")))
    img.src = src
  })
}

const OUT = 512

/**
 * Recorta la región indicada por `pixelCrop` (cuadrado, típico de crop circular en pantalla)
 * y la escribe en un canvas circular (relleno opaco en esquinas para JPEG).
 */
export async function getProfilePhotoCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  mime: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
  quality = 0.9
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const side = Math.round(Math.min(pixelCrop.width, pixelCrop.height))
  const canvas = document.createElement("canvas")
  canvas.width = OUT
  canvas.height = OUT
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D no disponible")

  const r = OUT / 2
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, OUT, OUT)
  ctx.beginPath()
  ctx.arc(r, r, r, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    OUT,
    OUT
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("No se pudo generar la imagen"))
      },
      mime,
      quality
    )
  })
}
