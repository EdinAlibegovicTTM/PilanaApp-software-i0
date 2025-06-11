"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Loader2 } from "lucide-react"

export default function PilanaApp() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("pilana_user")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        console.error("Failed to parse user data", e)
      }
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    setTimeout(() => {
      const validCredentials = [
        { username: "admin", password: "password123", role: "admin", id: 1 },
        { username: "manager", password: "password123", role: "manager", id: 2 },
        { username: "user", password: "password123", role: "user", id: 3 },
      ]

      const validUser = validCredentials.find((cred) => cred.username === username && cred.password === password)

      if (validUser) {
        const userData = {
          id: validUser.id,
          username: validUser.username,
          role: validUser.role,
          email: `${validUser.username}@pilanaapp.com`,
          loginTime: new Date().toISOString(),
        }

        localStorage.setItem("pilana_user", JSON.stringify(userData))
        setUser(userData)
        setError("")
      } else {
        setError("Invalid username or password")
      }
      setIsLoading(false)
    }, 1000)
  }

  const handleLogout = () => {
    localStorage.removeItem("pilana_user")
    setUser(null)
    setUsername("")
    setPassword("")
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-600">Pilana APP</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.username}</span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Forms</CardTitle>
                <CardDescription>Manage your forms</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">No forms created yet.</p>
                <Button className="mt-4">Create Form</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>View form analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Analytics will appear here.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Configure your account</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Settings options.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Pilana App</CardTitle>
          <CardDescription>Sign in to access your forms</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Demo Credentials:</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <strong>Admin:</strong>
                <span>admin / password123</span>
              </div>
              <div className="flex justify-between">
                <strong>Manager:</strong>
                <span>manager / password123</span>
              </div>
              <div className="flex justify-between">
                <strong>User:</strong>
                <span>user / password123</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
