import { useEffect, useState, useRef } from 'react'
import * as React from 'react'
import * as LucideIcons from 'lucide-react'

// Declare Babel type for CDN-loaded Babel
declare global {
  interface Window {
    Babel?: {
      transform: (code: string, options: any) => { code: string }
    }
  }
}
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

type LivePreviewProps = {
  previewCode: string
  componentCode?: string
  className?: string
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
      <div className="text-sm font-semibold text-destructive mb-2">Preview Error</div>
      <div className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
        {error.message}
      </div>
    </div>
  )
}

export default function LivePreview({ previewCode, componentCode, className }: LivePreviewProps) {
    const [error, setError] = useState<Error | null>(null)
    const [PreviewComponent, setPreviewComponent] = useState<React.ComponentType | null>(null)
    const [babelLoaded, setBabelLoaded] = useState(false)
    const babelScriptRef = useRef<HTMLScriptElement | null>(null)

    // Load Babel from CDN
    useEffect(() => {
      if (window.Babel) {
        setBabelLoaded(true)
        return
      }

      if (babelScriptRef.current) {
        return // Already loading
      }

      const script = document.createElement('script')
      script.src = 'https://unpkg.com/@babel/standalone@7.23.5/babel.min.js'
      script.async = true
      script.onload = () => {
        setBabelLoaded(true)
      }
      script.onerror = () => {
        setError(new Error('Failed to load Babel transpiler'))
      }
      babelScriptRef.current = script
      document.head.appendChild(script)

      return () => {
        if (babelScriptRef.current && document.head.contains(babelScriptRef.current)) {
          document.head.removeChild(babelScriptRef.current)
        }
      }
    }, [])

  useEffect(() => {
    if (!babelLoaded) {
      return // Wait for Babel to load
    }
    
    if (!previewCode) {
      setPreviewComponent(null)
      return
    }

    try {
      // Process preview code - remove imports and directives
      let processedPreviewCode = previewCode
        .replace(/['"]use client['"];?\s*/g, '') // Remove "use client" directive
        .replace(/['"]use server['"];?\s*/g, '') // Remove "use server" directive
        .replace(/import\s+{[^}]*}\s+from\s+['"][^'"]+['"]\s*;?\s*/g, '')
        .replace(/import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"]\s*;?\s*/g, '')
        .replace(/import\s+\w+\s+from\s+['"][^'"]+['"]\s*;?\s*/g, '')
        .replace(/export\s+default\s+function/g, 'function')
        .replace(/export\s+function/g, 'function')
        .replace(/export\s+default\s+/g, '')
        .replace(/export\s+{[^}]+}/g, '')
        .trim()

      // Process component code if provided - this is the edited component
      let processedComponentCode = ''
      if (componentCode) {
        processedComponentCode = componentCode
          .replace(/['"]use client['"];?\s*/g, '')
          .replace(/['"]use server['"];?\s*/g, '')
          .replace(/import\s+{[^}]*}\s+from\s+['"][^'"]+['"]\s*;?\s*/g, '')
          .replace(/import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"]\s*;?\s*/g, '')
          .replace(/import\s+\w+\s+from\s+['"][^'"]+['"]\s*;?\s*/g, '')
          .replace(/export\s+default\s+function/g, 'function')
          .replace(/export\s+function/g, 'function')
          .replace(/export\s+default\s+/g, '')
          .replace(/export\s+const\s+/g, 'const ')
          .replace(/export\s+{[^}]+}/g, '')
          .trim()
      }

      // Create scope with all components and utilities
      const scope = {
        React,
        ...React,
        useState: React.useState,
        useEffect: React.useEffect,
        useRef: React.useRef,
        useMemo: React.useMemo,
        useCallback: React.useCallback,
        ...LucideIcons,
        cn,
        cva,
        Button,
        Badge,
        Card,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
        Input,
        Label,
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
        Switch,
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
        Accordion,
        AccordionContent,
        AccordionItem,
        AccordionTrigger,
        Separator,
        ScrollArea,
        NavigationMenu,
        NavigationMenuContent,
        NavigationMenuItem,
        NavigationMenuLink,
        NavigationMenuList,
        NavigationMenuTrigger,
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
        // Mock Avatar components for preview compatibility
        Avatar: ({ children, className }: any) => <div className={`inline-flex items-center justify-center rounded-full ${className || ''}`}>{children}</div>,
        AvatarImage: ({ src, alt, className }: any) => <img src={src} alt={alt} className={`h-full w-full object-cover ${className || ''}`} />,
        AvatarFallback: ({ children, className }: any) => <div className={`flex items-center justify-center bg-muted ${className || ''}`}>{children}</div>,
      }

      // Extract preview component name
      const previewNameMatch = processedPreviewCode.match(/function\s+(\w+)\s*\(/);
      const previewComponentName = previewNameMatch ? previewNameMatch[1] : null

      if (!previewComponentName) {
        throw new Error('Could not find component function in preview code')
      }

      // Combine component code (edited) with preview code
      const combinedCode = processedComponentCode 
        ? `${processedComponentCode}\n\n${processedPreviewCode}`
        : processedPreviewCode

      // Transpile JSX to JavaScript using Babel
      const transpiledCode = window.Babel!.transform(combinedCode, {
        presets: ['react'],
        filename: 'preview.tsx',
      }).code

      // Create the component using Function constructor with scope
      const scopeKeys = Object.keys(scope)
      const scopeValues = Object.values(scope)
      
      const componentFactory = new Function(
        ...scopeKeys,
        `
        ${transpiledCode}
        return ${previewComponentName};
        `
      )

      const Component = componentFactory(...scopeValues)

      if (typeof Component === 'function') {
        setPreviewComponent(() => Component)
        setError(null)
      } else {
        throw new Error('Generated component is not a valid React component')
      }
    } catch (err) {
      console.error('Error rendering preview:', err)
      setError(err as Error)
      setPreviewComponent(null)
    }
  }, [previewCode, componentCode, babelLoaded])

  if (!babelLoaded) {
    return (
      <div className="text-center text-muted-foreground p-8">
        <div className="animate-pulse">Loading JSX transpiler...</div>
      </div>
    )
  }

  if (error) {
    return <ErrorFallback error={error} />
  }

  if (!PreviewComponent) {
    return (
      <div className="text-center text-muted-foreground p-8">
        No preview available
      </div>
    )
  }

  return (
    <div className={className}>
      <PreviewComponent />
    </div>
  )
}

