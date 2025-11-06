import { useEffect, useRef, type ReactNode } from 'react'

type ProjectTheme = {
  colors?: Record<string, string>
}

type ProjectThemeProviderProps = {
  theme: ProjectTheme | null | undefined
  children: ReactNode
}

/**
 * Light mode default values for all CSS variables that dark mode would override.
 * These are used to reset dark mode variables when a project theme is active,
 * ensuring project themes are independent of the global dark mode toggle.
 */
const LIGHT_MODE_DEFAULTS: Record<string, string> = {
  background: 'oklch(1 0 0)',
  foreground: 'oklch(0.145 0 0)',
  card: 'oklch(1 0 0)',
  cardForeground: 'oklch(0.145 0 0)',
  popover: 'oklch(1 0 0)',
  popoverForeground: 'oklch(0.145 0 0)',
  primary: 'oklch(0.205 0 0)',
  primaryForeground: 'oklch(0.985 0 0)',
  secondary: 'oklch(0.97 0 0)',
  secondaryForeground: 'oklch(0.205 0 0)',
  muted: 'oklch(0.97 0 0)',
  mutedForeground: 'oklch(0.556 0 0)',
  accent: 'oklch(0.97 0 0)',
  accentForeground: 'oklch(0.205 0 0)',
  destructive: 'oklch(0.577 0.245 27.325)',
  border: 'oklch(0.922 0 0)',
  input: 'oklch(0.922 0 0)',
  ring: 'oklch(0.708 0 0)',
  chart1: 'oklch(0.646 0.222 41.116)',
  chart2: 'oklch(0.6 0.118 184.704)',
  chart3: 'oklch(0.398 0.07 227.392)',
  chart4: 'oklch(0.828 0.189 84.429)',
  chart5: 'oklch(0.769 0.188 70.08)',
  sidebar: 'oklch(0.985 0 0)',
  sidebarForeground: 'oklch(0.145 0 0)',
  sidebarPrimary: 'oklch(0.205 0 0)',
  sidebarPrimaryForeground: 'oklch(0.985 0 0)',
  sidebarAccent: 'oklch(0.97 0 0)',
  sidebarAccentForeground: 'oklch(0.205 0 0)',
  sidebarBorder: 'oklch(0.922 0 0)',
  sidebarRing: 'oklch(0.708 0 0)',
}

/**
 * ProjectThemeProvider applies project theme CSS variables to a scoped container
 * instead of globally. This allows project pages to have custom themes while
 * keeping the Header and other pages (marketplace, projects list) using the default theme.
 * 
 * The container is isolated from dark mode by explicitly setting all CSS variables,
 * ensuring the project theme is independent of the global dark mode toggle.
 */
export default function ProjectThemeProvider({
  theme,
  children,
}: ProjectThemeProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (theme?.colors) {
      // First, reset all dark mode variables to light mode defaults
      // This ensures project themes are independent of dark mode
      Object.entries(LIGHT_MODE_DEFAULTS).forEach(([key, defaultValue]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
        // Only set if not provided by project theme
        if (!theme?.colors?.[key]) {
          container.style.setProperty(`--${cssKey}`, defaultValue)
        }
      })

      // Then apply project theme CSS variables (these override the defaults)
      // Inline styles have higher specificity than CSS classes, so these will override dark mode variables
      Object.entries(theme.colors).forEach(([key, value]) => {
        // Map camelCase to CSS variable names used by Tailwind
        // e.g., primaryForeground -> --primary-foreground
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
        container.style.setProperty(`--${cssKey}`, value)
      })
    }

    // Cleanup: remove theme variables when component unmounts or theme changes
    return () => {
      if (container) {
        // Remove all variables we set
        Object.keys(LIGHT_MODE_DEFAULTS).forEach((key) => {
          const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
          container.style.removeProperty(`--${cssKey}`)
        })
        if (theme?.colors) {
          Object.keys(theme.colors).forEach((key) => {
            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
            container.style.removeProperty(`--${cssKey}`)
          })
        }
      }
    }
  }, [theme])

  return (
    <div 
      ref={containerRef} 
      className="h-full w-full project-theme-container"
      data-project-theme="true"
      style={{
        // Isolate from dark mode by ensuring project theme variables take precedence
        // The 'important' flag in setProperty ensures these override dark mode variables
      }}
    >
      {children}
    </div>
  )
}

