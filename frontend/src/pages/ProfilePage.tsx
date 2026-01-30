import { useNavigate } from 'react-router-dom'
import { LogOut, MapPin, Users, Settings, Edit, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { useMyTrips } from '@/hooks/useTrips'
import { useConfirm } from '@/components/ConfirmModal'
import Card from '@/components/Card'

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { data: trips } = useMyTrips()
  const confirm = useConfirm()

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: '로그아웃',
      message: '로그아웃 하시겠습니까?',
      confirmText: '로그아웃',
      type: 'info',
    })
    if (confirmed) {
      logout()
      toast.success('로그아웃되었습니다')
      navigate('/')
    }
  }

  if (!user) return null

  const tripCount = trips?.length || 0
  const completedTrips = trips?.filter((t) => t.status === 'COMPLETED').length || 0

  return (
    <div className="px-4 py-6 space-y-6">
      <Card className="text-center py-6 relative">
        <button
          onClick={() => navigate('/profile/edit')}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"
          aria-label="프로필 수정"
        >
          <Edit className="w-4 h-4 text-gray-500" />
        </button>
        {user.profileImage ? (
          <img
            src={user.profileImage}
            alt={user.nickname}
            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl text-gray-400">
              {user.nickname.charAt(0)}
            </span>
          </div>
        )}
        <h2 className="text-xl font-bold text-gray-900">{user.nickname}</h2>
        {user.email && (
          <p className="text-sm text-gray-500 mt-1">{user.email}</p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center py-4">
          <MapPin className="w-6 h-6 text-primary-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{tripCount}</p>
          <p className="text-sm text-gray-500">계획한 여행</p>
        </Card>
        <Card className="text-center py-4">
          <Users className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{completedTrips}</p>
          <p className="text-sm text-gray-500">완료한 여행</p>
        </Card>
      </div>

      <Card className="divide-y">
        <button
          onClick={() => navigate('/profile/edit')}
          className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left"
        >
          <Edit className="w-5 h-5 text-gray-400" />
          <span className="flex-1 text-gray-700">프로필 수정</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
        <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left">
          <Settings className="w-5 h-5 text-gray-400" />
          <span className="flex-1 text-gray-700">설정</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left text-red-500"
        >
          <LogOut className="w-5 h-5" />
          <span>로그아웃</span>
        </button>
      </Card>

      <div className="text-center text-xs text-gray-400">
        <p>TripMate v0.1.0</p>
      </div>
    </div>
  )
}
