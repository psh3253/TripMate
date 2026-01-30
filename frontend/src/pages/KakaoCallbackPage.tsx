import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/authService'
import Loading from '@/components/Loading'

export default function KakaoCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setAuth = useAuthStore((state) => state.setAuth)

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      toast.error('카카오 로그인에 실패했습니다')
      navigate('/login', { replace: true })
      return
    }

    if (code) {
      authService
        .kakaoLogin(code)
        .then((data) => {
          setAuth(data.user, data.accessToken, data.refreshToken)
          toast.success('로그인되었습니다')
          navigate('/', { replace: true })
        })
        .catch((err) => {
          console.error('Login failed:', err)
          toast.error('로그인 처리 중 오류가 발생했습니다')
          navigate('/login', { replace: true })
        })
    } else {
      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate, setAuth])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading text="로그인 처리 중..." />
    </div>
  )
}
