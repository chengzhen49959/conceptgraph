'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

// Thin client wrapper so the server root layout can mount next-themes. The
// provider injects a synchronous inline script that sets the theme class on
// <html> before first paint (see Next's "preventing flash before hydration").
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
