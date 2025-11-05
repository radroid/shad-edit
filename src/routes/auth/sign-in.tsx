import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SignIn as ClerkSignIn } from '@clerk/clerk-react'

export const Route = createFileRoute('/auth/sign-in')({ component: SignInPage })

function SignInPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold">Sign in</CardTitle>
          <CardDescription>Continue to your account</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ClerkSignIn routing="path" path="/auth/sign-in" />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/auth/sign-up" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}


