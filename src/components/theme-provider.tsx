"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { ClientOnly } from "./client-only"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <ClientOnly fallback={<div className="min-h-screen bg-white">{children}</div>}>
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </ClientOnly>
  )
}
