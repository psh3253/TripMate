import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import Button from '@/components/Button'

const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID || 'YOUR_KAKAO_CLIENT_ID'
const REDIRECT_URI = `${window.location.origin}/oauth/kakao/callback`

export default function LoginPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleKakaoLogin = () => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`
    window.location.href = kakaoAuthUrl
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-primary-50 to-white">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">TripMate</h1>
          <p className="text-gray-600">함께하는 여행의 시작</p>
        </div>

        <div className="space-y-4">
          <Button
            variant="kakao"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleKakaoLogin}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-5.1 0-9.3 3.2-9.3 7.1 0 2.4 1.5 4.5 3.8 5.8l-1 3.6c-.1.3.3.5.5.4l4.3-2.9c.6.1 1.2.1 1.7.1 5.1 0 9.3-3.2 9.3-7.1S17.1 3 12 3z"/>
            </svg>
            카카오로 로그인
          </Button>

          <p className="text-center text-xs text-gray-500">
            로그인 시 서비스 이용약관 및 개인정보처리방침에<br />
            동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
