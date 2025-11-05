/**
 * Component Renderer - Dynamically renders actual React components
 */

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

export type ComponentType = 
  | 'button'
  | 'input'
  | 'card'
  | 'dialog'
  | 'navigation-menu'
  | 'badge'
  | 'label'

export interface ComponentPreviewProps {
  type: ComponentType
  props?: Record<string, any>
}

/**
 * Render a component preview based on type
 */
export function renderComponentPreview({ type, props = {} }: ComponentPreviewProps) {
  switch (type) {
    case 'button':
      return (
        <Button
          variant={(props.variant as any) || 'default'}
          size={(props.size as any) || 'default'}
          className={props.className}
        >
          {props.text || props.children || 'Click me'}
        </Button>
      )

    case 'input':
      return (
        <Input
          type={props.type || 'text'}
          placeholder={props.placeholder || 'Enter text...'}
          className={`w-full max-w-sm ${props.className || ''}`}
          defaultValue={props.defaultValue}
        />
      )

    case 'card':
      return (
        <Card className={`w-full max-w-md ${props.className || ''}`}>
          <CardHeader>
            <CardTitle>{props.title || 'Card Title'}</CardTitle>
            {(props.description !== false && props.description !== '') && (
              <CardDescription>
                {props.description || 'Card description goes here'}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {props.content || (
              <p className="text-sm">
                This is the card content area. You can customize this text and add more elements.
              </p>
            )}
          </CardContent>
          {props.showFooter !== false && (
            <CardFooter>
              <Button variant="outline" className="w-full">
                {props.footerAction || 'Action'}
              </Button>
            </CardFooter>
          )}
        </Card>
      )

    case 'dialog':
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="default">
              {props.triggerText || 'Open Dialog'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{props.title || 'Dialog Title'}</DialogTitle>
              {(props.description !== false && props.description !== '') && (
                <DialogDescription>
                  {props.description || 'Make changes to your profile here. Click save when you\'re done.'}
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="py-4">
              {props.content || (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This is the dialog content area. You can add forms, text, or other components here.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit">{props.actionText || 'Save changes'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

    case 'navigation-menu':
      return (
        <NavigationMenu className="mx-auto">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                {props.item1 || 'Getting started'}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid gap-3 p-4 w-[400px] md:w-[500px]">
                  <NavigationMenuLink className="block p-3 hover:bg-accent rounded-md cursor-pointer">
                    <div className="font-medium mb-1">Introduction</div>
                    <div className="text-sm text-muted-foreground">
                      Learn about the component library
                    </div>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                {props.item2 || 'Components'}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid gap-3 p-4 w-[400px] md:w-[500px]">
                  <NavigationMenuLink className="block p-3 hover:bg-accent rounded-md cursor-pointer">
                    <div className="font-medium mb-1">Browse Components</div>
                    <div className="text-sm text-muted-foreground">
                      Explore all available components
                    </div>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )

    case 'badge':
      return (
        <Badge variant={props.variant || 'default'} {...props}>
          {props.text || props.children || 'Badge'}
        </Badge>
      )

    case 'label':
      return (
        <Label {...props}>
          {props.text || props.children || 'Label'}
        </Label>
      )

    default:
      return <div>Unknown component type: {type}</div>
  }
}

/**
 * Get default props for a component type
 */
export function getDefaultComponentProps(type: ComponentType): Record<string, any> {
  switch (type) {
    case 'button':
      return {
        text: 'Click me',
        variant: 'default',
        size: 'default',
      }

    case 'input':
      return {
        type: 'text',
        placeholder: 'Search or enter text...',
      }

    case 'card':
      return {
        title: 'Card Title',
        description: 'This is a card description that provides context',
        content: 'This is the main content area of the card. You can add any content here.',
        showFooter: true,
        footerAction: 'Learn More',
      }

    case 'dialog':
      return {
        triggerText: 'Open Dialog',
        title: 'Are you sure?',
        description: 'This action will make changes to your account',
        content: 'Please review the details before proceeding.',
        actionText: 'Continue',
      }

    case 'navigation-menu':
      return {
        item1: 'Getting started',
        item2: 'Components',
      }

    case 'badge':
      return {
        text: 'Badge',
        variant: 'default',
      }

    case 'label':
      return {
        text: 'Label',
      }

    default:
      return {}
  }
}

/**
 * Get component preview info
 */
export function getComponentInfo(type: ComponentType) {
  const components = {
    'button': {
      name: 'Button',
      description: 'A clickable button component with various styles',
      category: 'Form',
    },
    'input': {
      name: 'Input',
      description: 'A text input field for user data entry',
      category: 'Form',
    },
    'card': {
      name: 'Card',
      description: 'A flexible container for content',
      category: 'Layout',
    },
    'dialog': {
      name: 'Dialog',
      description: 'A modal dialog for focused interactions',
      category: 'Overlay',
    },
    'navigation-menu': {
      name: 'Navigation Menu',
      description: 'A navigation menu with dropdowns',
      category: 'Navigation',
    },
    'badge': {
      name: 'Badge',
      description: 'A small status indicator',
      category: 'Display',
    },
    'label': {
      name: 'Label',
      description: 'A text label for form fields',
      category: 'Form',
    },
  }

  return components[type] || { name: type, description: 'Component', category: 'Other' }
}

/**
 * Get all available component types
 */
export function getAllComponentTypes(): ComponentType[] {
  return [
    'button',
    'input',
    'card',
    'dialog',
    'navigation-menu',
    'badge',
    'label',
  ]
}

