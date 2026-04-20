"use client"

import { useRef, useState, useCallback } from "react"
import { Camera, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { resolvePublicUploadUrl } from "@/lib/media-url"
import { ProfilePhotoCropDialog } from "@/components/profile-photo-crop-dialog"

const MAX_FILE_BYTES = 2 * 1024 * 1024
const ACCEPT_RE = /^image\/(jpeg|png|webp|gif)$/i

export interface ProfilePhotoUploadProps {
  fotoPerfilUrl?: string | null
  /** Incrementar tras subida exitosa para evitar caché del navegador con la misma ruta */
  imageRevision?: number
  /** Vista previa local (p. ej. URL.createObjectURL) antes de tener URL en servidor */
  previewSrc?: string | null
  /** Texto o iniciales si no hay imagen */
  fallbackText: string
  disabled?: boolean
  uploading?: boolean
  onFileSelected: (file: File) => void | Promise<void>
  /** Tamaño del avatar en px (aprox.) */
  size?: "sm" | "md" | "lg"
  /** detail = hover para cambiar (expediente); form = botón explícito bajo la foto */
  variant?: "detail" | "form"
  /** Foto en escala de grises (p. ej. beneficiario dado de baja) */
  grayscale?: boolean
  /** Solo variante `form`: si hay `fotoPerfilUrl` en servidor, muestra papelera al hover y llama al pedir eliminar (confirmación en el padre) */
  onRemovePhotoRequest?: () => void
  /** Si es false, la imagen elegida se envía directo sin diálogo de recorte */
  enableCrop?: boolean
}

const sizeClass = {
  sm: "size-14 text-lg",
  md: "size-20 text-2xl",
  lg: "size-24 text-3xl",
} as const

export function ProfilePhotoUpload({
  fotoPerfilUrl,
  imageRevision = 0,
  previewSrc,
  fallbackText,
  disabled,
  uploading,
  onFileSelected,
  size = "md",
  variant = "form",
  grayscale,
  onRemovePhotoRequest,
  enableCrop = true,
}: ProfilePhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  const serverSrc = resolvePublicUploadUrl(
    fotoPerfilUrl ?? undefined,
    previewSrc ? null : imageRevision || null
  )
  const displaySrc = previewSrc ?? serverSrc
  const dim = sizeClass[size]
  const imgKey = `${displaySrc ?? ""}|${imageRevision}|${previewSrc ?? ""}`

  const cancelCrop = useCallback(() => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    setCropOpen(false)
  }, [cropSrc])

  const finishCrop = useCallback(
    async (file: File) => {
      try {
        await onFileSelected(file)
      } finally {
        cancelCrop()
      }
    },
    [onFileSelected, cancelCrop]
  )

  async function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || disabled || uploading) return
    if (!ACCEPT_RE.test(file.type)) {
      toast.error("Formato no válido. Usa JPEG, PNG, WebP o GIF.")
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("La imagen no puede superar 2 MB.")
      return
    }
    if (!enableCrop) {
      await onFileSelected(file)
      return
    }
    const url = URL.createObjectURL(file)
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
    setCropOpen(true)
  }

  const trigger = () => {
    if (!disabled && !uploading) inputRef.current?.click()
  }

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      className="sr-only"
      aria-label="Seleccionar foto de perfil"
      onChange={(e) => void onInputChange(e)}
      disabled={disabled || uploading}
    />
  )

  const cropDialog = (
    <ProfilePhotoCropDialog
      open={cropOpen}
      imageSrc={cropSrc}
      onClose={cancelCrop}
      onComplete={finishCrop}
    />
  )

  if (variant === "detail") {
    return (
      <>
        <div className="relative shrink-0">
          {fileInput}
          <button
            type="button"
            onClick={trigger}
            disabled={disabled || uploading}
            title="Elegir otra imagen"
            aria-label="Elegir o cambiar foto de perfil"
            className={cn(
              "group relative flex cursor-pointer items-center justify-center rounded-full bg-primary/10 text-primary font-bold ring-4 ring-background shadow-sm overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring",
              dim,
              grayscale && "grayscale",
              (disabled || uploading) && "cursor-not-allowed opacity-60"
            )}
          >
            {displaySrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={imgKey} src={displaySrc} alt="" className="pointer-events-none size-full object-cover" />
            ) : (
              <span className="select-none">{fallbackText.slice(0, 2).toUpperCase()}</span>
            )}
            <span
              className={cn(
                "pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/55 text-[10px] font-semibold text-white opacity-0 transition-opacity",
                "group-hover:opacity-100 group-focus-visible:opacity-100",
                uploading && "opacity-100"
              )}
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <Camera className="size-4" />
                  {displaySrc ? "Cambiar" : "Foto"}
                </>
              )}
            </span>
          </button>
        </div>
        {cropDialog}
      </>
    )
  }

  const showRemoveOnHover =
    Boolean(onRemovePhotoRequest) &&
    Boolean(String(fotoPerfilUrl ?? "").trim()) &&
    !disabled &&
    !uploading

  return (
    <>
      <div className="flex flex-col items-start gap-3">
        {fileInput}
        <div className="relative inline-block shrink-0 group/photo">
          <button
            type="button"
            onClick={trigger}
            disabled={disabled || uploading}
            title="Elegir otra imagen"
            aria-label="Elegir o cambiar foto de perfil"
            className={cn(
              "flex cursor-pointer items-center justify-center rounded-full bg-primary/10 text-primary font-bold ring-2 ring-border outline-none transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-ring overflow-hidden",
              dim,
              grayscale && "grayscale",
              !(disabled || uploading) && "opacity-90 group-hover/photo:opacity-100",
              (disabled || uploading) && "cursor-not-allowed opacity-60"
            )}
          >
            {displaySrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={imgKey} src={displaySrc} alt="" className="pointer-events-none size-full object-cover" />
            ) : (
              <span className="select-none">{fallbackText.slice(0, 2).toUpperCase()}</span>
            )}
          </button>
          {showRemoveOnHover && (
            <button
              type="button"
              title="Eliminar foto de perfil"
              aria-label="Eliminar foto de perfil"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onRemovePhotoRequest?.()
              }}
              className={cn(
                "absolute -right-0.5 -top-0.5 z-10 flex size-7 items-center justify-center rounded-full",
                "border border-destructive/30 bg-destructive text-white shadow-md",
                "opacity-0 transition-opacity duration-150",
                "pointer-events-none group-hover/photo:pointer-events-auto group-hover/photo:opacity-100",
                "hover:bg-destructive/90 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <Trash2 className="size-3.5 text-white" aria-hidden />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={disabled || uploading}
          onClick={trigger}
        >
          {uploading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Subiendo…
            </>
          ) : (
            <>
              <Camera className="size-4" />
              {previewSrc || serverSrc ? "Cambiar foto" : "Subir foto de perfil"}
            </>
          )}
        </Button>
      </div>
      {cropDialog}
    </>
  )
}
