import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SignUp as ClerkSignUp } from '@clerk/clerk-react'

export const Route = createFileRoute('/auth/sign-up')({ component: SignUpPage })

function SignUpPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold">Create your account</CardTitle>
          <CardDescription>Start creating components</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ClerkSignUp routing="path" path="/auth/sign-up" />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/auth/sign-in" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}


