// Client-side authentication utilities
export class AuthClient {
  private static TOKEN_KEY = "pilana_access_token"
  private static REFRESH_TOKEN_KEY = "pilana_refresh_token"
  private static USER_KEY = "pilana_user"

  static setTokens(accessToken: string, refreshToken?: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.TOKEN_KEY, accessToken)
      if (refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken)
      } else {
        localStorage.removeItem(this.REFRESH_TOKEN_KEY)
      }
    }
  }

  static getAccessToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.TOKEN_KEY)
    }
    return null
  }

  static getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY)
    }
    return null
  }

  static setUser(user: any) {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user))
    }
  }

  static getUser(): any | null {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem(this.USER_KEY)
      return user ? JSON.parse(user) : null
    }
    return null
  }

  static clearAuth() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.TOKEN_KEY)
      localStorage.removeItem(this.REFRESH_TOKEN_KEY)
      localStorage.removeItem(this.USER_KEY)
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }

  // API call wrapper with automatic token inclusion
  static async apiCall(url: string, options: RequestInit = {}) {
    const token = this.getAccessToken()

    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Handle token expiration
    if (response.status === 401) {
      this.clearAuth()
      window.location.href = "/login"
      return response
    }

    return response
  }
}
