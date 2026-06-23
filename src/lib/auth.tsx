import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export type UserRole = 'admin' | 'member'

interface AuthContextValue {
  role: UserRole
  isAdmin: boolean
  isLoading: boolean
  adminToken: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(() => {
    const cached = sessionStorage.getItem('pm_role')
    return cached === 'admin' ? 'admin' : 'member'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [adminToken, setAdminToken] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlRole = params.get('role')
    const token = params.get('token')

    if (urlRole === 'admin' && token) {
      // 验证 admin token
      supabase
        .from('admin_tokens')
        .select('token')
        .eq('token', token)
        .eq('is_active', true)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            setRole('admin')
            setAdminToken(token)
            sessionStorage.setItem('pm_role', 'admin')
            sessionStorage.setItem('pm_token', token)
          } else {
            setRole('member')
            sessionStorage.removeItem('pm_role')
            sessionStorage.removeItem('pm_token')
          }
          setIsLoading(false)
        })
    } else {
      // 非 admin URL，检查 session 缓存
      const cachedToken = sessionStorage.getItem('pm_token')
      if (role === 'admin' && cachedToken) {
        setAdminToken(cachedToken)
      }
      setIsLoading(false)
    }

    // 清除 URL 参数（保持 URL 简洁）
    if (urlRole || token) {
      const url = new URL(window.location.href)
      url.searchParams.delete('role')
      url.searchParams.delete('token')
      window.history.replaceState({}, '', url.pathname)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ role, isAdmin: role === 'admin', isLoading, adminToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
