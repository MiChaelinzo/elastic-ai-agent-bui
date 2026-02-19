import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lightning, Eye, EyeSlash, User as UserIcon } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import type { User } from '@/lib/auth-types'

interface LoginScreenProps {
  onLogin: (user: User) => void
  onRegister: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string; user?: User }>
  onDemoMode: () => void
}

export function LoginScreen({ onLogin, onRegister, onDemoMode }: LoginScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const user = await response.json()
        onLogin(user)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Invalid credentials')
      }
    } catch (err) {
      setError('Unable to connect to authentication server. Please try again or use Demo Mode.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!name.trim()) {
      setError('Name is required')
      setIsLoading(false)
      return
    }

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      const result = await onRegister(email, password, name)
      if (result.success && result.user) {
        onLogin(result.user)
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch (err) {
      setError('Failed to register. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,oklch(0.45_0.20_200/0.1),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,oklch(0.45_0.20_200/0.05)_50%,transparent_100%)] animate-pulse" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center p-4 bg-primary/20 rounded-2xl mb-4"
          >
            <Lightning size={48} weight="duotone" className="text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Elastic Agent Orchestrator</h1>
          <p className="text-muted-foreground">AI-Powered DevOps Incident Response</p>
        </div>

        <Card className="shadow-2xl border-border/50 backdrop-blur">
          <CardHeader>
            <CardTitle>{isRegistering ? 'Create Account' : 'Welcome Back'}</CardTitle>
            <CardDescription>
              {isRegistering 
                ? 'Sign up to start managing incidents with AI agents'
                : 'Sign in to your account to continue'
              }
            </CardDescription>
          </CardHeader>

          <form onSubmit={isRegistering ? handleRegister : handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {isRegistering && (
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    {isRegistering ? 'Creating account...' : 'Signing in...'}
                  </span>
                ) : (
                  <span>{isRegistering ? 'Create Account' : 'Sign In'}</span>
                )}
              </Button>

              <div className="w-full text-center space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsRegistering(!isRegistering)
                    setError('')
                    setEmail('')
                    setPassword('')
                    setName('')
                  }}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isRegistering 
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"
                  }
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={onDemoMode}
                  className="w-full"
                  disabled={isLoading}
                >
                  Continue with Demo Mode
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Demo mode provides instant access with sample data
        </p>
      </motion.div>
    </div>
  )
}
