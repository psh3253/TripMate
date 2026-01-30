import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, User as UserIcon } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/authService'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Input from '@/components/Input'

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)

  const [nickname, setNickname] = useState(user?.nickname || '')
  const [profileImage, setProfileImage] = useState(user?.profileImage || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    navigate('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요')
      return
    }

    if (nickname.length < 2 || nickname.length > 20) {
      setError('닉네임은 2~20자 사이로 입력해주세요')
      return
    }

    setIsLoading(true)
    try {
      const updatedUser = await authService.updateProfile({
        nickname: nickname.trim(),
        profileImage: profileImage.trim() || undefined,
      })
      updateUser(updatedUser)
      navigate('/profile')
    } catch (err) {
      setError('프로필 수정에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageError = () => {
    setProfileImage('')
  }

  return (
    <div className="px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">프로필 수정</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 프로필 이미지 */}
        <Card className="py-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="프로필"
                  className="w-24 h-24 rounded-full object-cover"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 p-1.5 bg-primary-500 rounded-full">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              이미지 URL을 입력하여 프로필 사진을 변경할 수 있습니다
            </p>
          </div>
        </Card>

        {/* 입력 폼 */}
        <Card className="space-y-4">
          <Input
            label="닉네임"
            placeholder="닉네임을 입력하세요"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
          />
          <p className="text-xs text-gray-500 -mt-2">
            2~20자 사이로 입력해주세요 ({nickname.length}/20)
          </p>

          <Input
            label="프로필 이미지 URL (선택)"
            placeholder="https://example.com/image.jpg"
            value={profileImage}
            onChange={(e) => setProfileImage(e.target.value)}
          />

          {/* 이미지 미리보기 */}
          {profileImage && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-2">미리보기</p>
              <img
                src={profileImage}
                alt="미리보기"
                className="w-16 h-16 rounded-full object-cover border"
                onError={handleImageError}
              />
            </div>
          )}
        </Card>

        {/* 에러 메시지 */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            취소
          </Button>
          <Button
            type="submit"
            className="flex-1"
            isLoading={isLoading}
          >
            저장
          </Button>
        </div>
      </form>
    </div>
  )
}
