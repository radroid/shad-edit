import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'
import { Home, Package } from 'lucide-react'
import { ModeToggle } from '@/components/ModeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6 md:gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="hidden font-bold sm:inline-block">ShadEdit</span>
          </Link>

          <NavigationMenu>
            <NavigationMenuList className="gap-3 md:gap-4">
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/"
                    className={cn(
                      'group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-active:bg-accent/50 data-[state=open]:bg-accent/50'
                    )}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/marketplace"
                    className={cn(
                      'group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-active:bg-accent/50 data-[state=open]:bg-accent/50'
                    )}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Marketplace
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <ModeToggle />
          <Link to="/auth/sign-in">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/auth/sign-up">
            <Button size="sm">Sign up</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
