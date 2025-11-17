import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'
import { Package, FolderKanban, Plus } from 'lucide-react'
import { ModeToggle } from '@/components/ModeToggle'
import { SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react'
import { Authenticated, Unauthenticated } from 'convex/react'
import { useState } from 'react'
import AddComponentDialog from '@/components/marketplace/AddComponentDialog'

export default function Header() {
  const [addComponentDialogOpen, setAddComponentDialogOpen] = useState(false)

  return (
    <>
    <header className="flex-shrink-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6 md:gap-8">
          <Link to="/" className="flex items-center gap-2 py-2">
            <span className="hidden font-bold sm:inline-block">ShadEdit</span>
          </Link>

          <NavigationMenu>
            <NavigationMenuList className="gap-3 md:gap-4">
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
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/projects"
                    className={cn(
                      'group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-active:bg-accent/50 data-[state=open]:bg-accent/50'
                    )}
                  >
                    <FolderKanban className="mr-2 h-4 w-4" />
                    Projects
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
            <Authenticated>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddComponentDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Component</span>
              </Button>
            </Authenticated>
          <ModeToggle />
          <Authenticated>
            <UserButton afterSignOutUrl="/" />
          </Authenticated>
          <Unauthenticated>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">Sign in</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">Sign up</Button>
            </SignUpButton>
          </Unauthenticated>
        </div>
      </div>
    </header>
      <Authenticated>
        <AddComponentDialog
          open={addComponentDialogOpen}
          onOpenChange={setAddComponentDialogOpen}
        />
      </Authenticated>
    </>
  )
}
