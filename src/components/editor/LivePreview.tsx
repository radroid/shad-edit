import { useEffect, useState } from 'react'
import * as LucideIcons from 'lucide-react'
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

  useEffect(() => {
    if (!previewCode) {
      setPreviewComponent(null)
      return
    }

    try {
      // Process preview code - remove imports
      let processedPreviewCode = previewCode
        .replace(/import\s+{[^}]*}\s+from\s+['"][^'"]+['"]\s*;?/g, '')
        .replace(/import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"]\s*;?/g, '')
        .replace(/import\s+\w+\s+from\s+['"][^'"]+['"]\s*;?/g, '')
        .replace(/export\s+(default\s+)?function/g, 'function')
        .replace(/export\s+{[^}]+}/g, '')
        .trim()

      // Process component code if provided - this is the edited component
      let processedComponentCode = ''
      if (componentCode) {
        processedComponentCode = componentCode
          .replace(/import\s+{[^}]*}\s+from\s+['"][^'"]+['"]\s*;?/g, '')
          .replace(/import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"]\s*;?/g, '')
          .replace(/import\s+\w+\s+from\s+['"][^'"]+['"]\s*;?/g, '')
          .replace(/export\s+(default\s+)?/g, '')
          .trim()
      }

      // Create scope with all components
      const scope = {
        React: require('react'),
        ...LucideIcons,
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

      // Combine component code and preview code
      const combinedCode = processedComponentCode 
        ? `${processedComponentCode}\n\n${processedPreviewCode}`
        : processedPreviewCode

      // Create the component using Function constructor with scope
      const scopeKeys = Object.keys(scope)
      const scopeValues = Object.values(scope)
      
      const componentFactory = new Function(
        ...scopeKeys,
        `
        ${combinedCode}
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
  }, [previewCode, componentCode])

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

