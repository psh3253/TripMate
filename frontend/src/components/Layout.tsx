import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Compass, MapPin, Users, MessageCircle, User } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export default function Layout() {
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const navItems = [
    { path: '/', icon: Home, label: '홈' },
    { path: '/explore', icon: Compass, label: '탐색' },
    { path: '/trips', icon: MapPin, label: '여행', auth: true },
    { path: '/companions', icon: Users, label: '동행' },
    { path: '/profile', icon: User, label: '프로필', auth: true },
  ]

  const filteredNavItems = navItems.filter((item) => !item.auth || isAuthenticated)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary-600">
            TripMate
          </Link>
          {!isAuthenticated && (
            <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              로그인
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full">
        <Outlet />
      </main>

      <nav className="sticky bottom-0 bg-white border-t border-gray-200 safe-bottom">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex justify-around">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path))
              const Icon = item.icon

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center py-2 px-3 ${
                    isActive ? 'text-primary-600' : 'text-gray-500'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
