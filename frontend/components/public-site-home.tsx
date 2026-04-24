"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { Heart, Moon, SunMedium } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { PublicPreregistroSection } from "@/components/public-preregistro-section"

/**
 * Página de inicio para visitantes: bienvenida y pre-registro debajo al pulsar el botón.
 * El acceso al panel (login) es la ruta `/panel`.
 */
export function PublicSiteHome() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [preregVisible, setPreregVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const isDark = mounted && resolvedTheme === "dark"

  const scrollToPrereg = useCallback(() => {
    document.getElementById("pre-registro-inline")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const onLlenarPreregistro = useCallback(() => {
    setPreregVisible(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToPrereg)
    })
  }, [scrollToPrereg])

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -15%, oklch(0.55 0.14 250 / 0.14) 0%, transparent 65%), " +
            "radial-gradient(ellipse 50% 40% at 100% 100%, oklch(0.78 0.12 85 / 0.12) 0%, transparent 55%)",
        }}
      />

      <header className="relative z-10 flex items-center justify-between gap-4 border-b border-border/60 px-4 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-border/30">
            <Image
              src="/logo-espina-bifida.png"
              alt=""
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-foreground">Asociación de Espina Bífida</p>
            <p className="text-xs text-muted-foreground">Bienvenida</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 rounded-full border-border/60"
            aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <SunMedium className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex w-full flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 md:min-h-[45vh] md:px-8 md:py-20">
          <div className="mx-auto w-full max-w-xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Heart className="size-3.5" aria-hidden />
              Bienvenida
            </div>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Estamos para acompañarte
            </h1>
            <p className="mx-auto mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              Si deseas vincular a una persona beneficiaria, puedes llenar el pre-registro aquí. El equipo de la
              asociación revisará tus datos y se pondrá en contacto contigo.
            </p>

            <Button
              type="button"
              size="lg"
              className="mt-10 rounded-full bg-[#005bb5] px-10 text-base text-white hover:bg-[#004a94]"
              onClick={onLlenarPreregistro}
            >
              Llenar pre-registro
            </Button>
          </div>
        </div>

        {preregVisible ? (
          <section
            id="pre-registro-inline"
            className="scroll-mt-24 border-t border-border/50 bg-gradient-to-b from-muted/25 via-background to-muted/15 pb-16 pt-12 md:pb-24 md:pt-16"
            aria-labelledby="titulo-pre-registro-inline"
          >
            <div className="mx-auto max-w-3xl px-4 md:px-8">
              <h2
                id="titulo-pre-registro-inline"
                className="text-balance text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl"
              >
                Pre-registro de beneficiario
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-pretty text-center text-sm leading-relaxed text-muted-foreground md:text-base">
                Mismos datos que en la asociación. Si necesitas corregir algo después de enviar, comunícate con nosotros y
                conserva tu CURP.
              </p>
              <div className="mt-10">
                <PublicPreregistroSection
                  embedded
                  hideIntro
                  scrollTargetOnSuccess="pre-registro-inline"
                />
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="relative z-10 border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Asociación de Espina Bífida
      </footer>
    </div>
  )
}
