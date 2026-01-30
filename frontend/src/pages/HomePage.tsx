import { Link } from 'react-router-dom'
import { MapPin, Users, Compass, Utensils, Hotel, PartyPopper, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAttractions } from '@/hooks/useTour'
import Button from '@/components/Button'
import Card from '@/components/Card'
import TourPlaceCard from '@/components/TourPlaceCard'
import Loading from '@/components/Loading'

const quickLinks = [
  { path: '/explore?tab=attraction', icon: MapPin, label: '관광지', color: 'bg-blue-100 text-blue-600' },
  { path: '/explore?tab=restaurant', icon: Utensils, label: '맛집', color: 'bg-orange-100 text-orange-600' },
  { path: '/explore?tab=accommodation', icon: Hotel, label: '숙박', color: 'bg-purple-100 text-purple-600' },
  { path: '/explore?tab=festival', icon: PartyPopper, label: '축제', color: 'bg-pink-100 text-pink-600' },
]

export default function HomePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  const { data: attractions, isLoading } = useAttractions({ numOfRows: 5 })

  return (
    <div className="px-4 py-6 space-y-6">
      <section className="text-center py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          함께하는 여행
        </h1>
        <p className="text-gray-600 mb-6">
          전국의 여행 정보를 탐색하고<br />
          마음 맞는 동행을 찾아보세요
        </p>

        {isAuthenticated ? (
          <div className="space-y-3">
            <p className="text-primary-600 font-medium">
              안녕하세요, {user?.nickname}님!
            </p>
            <div className="flex gap-3">
              <Link to="/trips/ai-planner" className="flex-1">
                <Button size="lg" className="w-full">
                  AI로 여행 계획
                </Button>
              </Link>
              <Link to="/explore" className="flex-1">
                <Button size="lg" variant="outline" className="w-full">
                  여행지 탐색
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Link to="/explore">
              <Button size="lg" className="w-full">
                여행 정보 둘러보기
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-400">또는</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">
                로그인하고 더 많은 기능을 이용하세요
              </p>
              <Link to="/login">
                <Button variant="kakao" size="lg" className="w-full">
                  카카오로 시작하기
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 빠른 탐색 */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">빠른 탐색</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.path}
                to={link.path}
                className="flex flex-col items-center p-3 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className={`p-2 rounded-full ${link.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs mt-2 text-gray-700">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* 인기 여행지 */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">인기 여행지</h2>
          <Link to="/explore" className="text-sm text-primary-600">
            더보기
          </Link>
        </div>

        {isLoading ? (
          <Loading size="sm" />
        ) : attractions && attractions.items.length > 0 ? (
          <div className="space-y-3">
            {attractions.items.slice(0, 3).map((place) => (
              <TourPlaceCard key={place.contentId} place={place} />
            ))}
          </div>
        ) : (
          <Card padding="lg" className="text-center text-gray-500">
            여행지 정보를 불러오는 중...
          </Card>
        )}
      </section>

      {/* 주요 기능 */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">주요 기능</h2>

        <div className="grid gap-3">
          <Link to={isAuthenticated ? "/trips/ai-planner" : "/login"}>
            <Card className="flex items-start gap-4 hover:shadow-md transition-shadow border-2 border-primary-200 bg-gradient-to-r from-primary-50 to-blue-50">
              <div className="p-3 bg-gradient-to-br from-primary-500 to-blue-500 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">AI 여행 플래너</h3>
                  <span className="text-xs bg-gradient-to-r from-primary-500 to-blue-500 text-white px-2 py-0.5 rounded-full">NEW</span>
                </div>
                <p className="text-sm text-gray-600">
                  6개의 전문 AI가 협업하여 완벽한 여행 계획을 세워드려요
                </p>
              </div>
            </Card>
          </Link>

          <Link to="/explore">
            <Card className="flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Compass className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">여행 정보 탐색</h3>
                <p className="text-sm text-gray-600">
                  전국의 관광지, 맛집, 숙소 정보를 검색하세요
                </p>
              </div>
            </Card>
          </Link>

          <Link to={isAuthenticated ? "/trips/create" : "/login"}>
            <Card className="flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="p-3 bg-green-100 rounded-lg">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">직접 여행 계획</h3>
                <p className="text-sm text-gray-600">
                  목적지, 날짜, 예산을 설정하고 나만의 여행을 계획하세요
                </p>
              </div>
            </Card>
          </Link>

          <Link to="/companions">
            <Card className="flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">동행 모집</h3>
                <p className="text-sm text-gray-600">
                  비슷한 취향의 여행 동행을 찾고 함께 떠나세요
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  )
}
