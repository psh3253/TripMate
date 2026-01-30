import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Utensils, Hotel, Navigation } from 'lucide-react'
import { useNearbyPlaces } from '@/hooks/useTour'
import { CONTENT_TYPES } from '@/services/tourService'
import TourPlaceCard from '@/components/TourPlaceCard'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import Button from '@/components/Button'

const categories = [
  { id: 'all', label: '전체', typeId: undefined },
  { id: 'attraction', label: '관광지', typeId: CONTENT_TYPES.ATTRACTION },
  { id: 'restaurant', label: '맛집', typeId: CONTENT_TYPES.RESTAURANT },
  { id: 'accommodation', label: '숙박', typeId: CONTENT_TYPES.ACCOMMODATION },
]

export default function NearbyPage() {
  const [searchParams] = useSearchParams()
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  const [category, setCategory] = useState('all')
  const [radius, setRadius] = useState(5000)
  const [page, setPage] = useState(1)

  const currentCategory = categories.find((c) => c.id === category)

  const { data, isLoading, error } = useNearbyPlaces({
    mapX: lng ? parseFloat(lng) : 0,
    mapY: lat ? parseFloat(lat) : 0,
    radius,
    contentTypeId: currentCategory?.typeId,
    pageNo: page,
    numOfRows: 20,
  })

  if (!lat || !lng) {
    return (
      <div className="px-4 py-6">
        <EmptyState
          icon={<Navigation className="w-12 h-12" />}
          title="위치 정보가 필요합니다"
          description="탐색 페이지에서 '내 주변' 버튼을 눌러주세요"
          action={
            <Link to="/explore">
              <Button>탐색으로 이동</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="pb-6">
      {/* 헤더 */}
      <div className="sticky top-14 z-40 bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <Link to="/explore" className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">내 주변</h1>
        </div>

        {/* 반경 선택 */}
        <div className="flex gap-2 mb-3">
          {[1000, 3000, 5000, 10000].map((r) => (
            <button
              key={r}
              onClick={() => {
                setRadius(r)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-full text-sm ${
                radius === r
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r < 1000 ? `${r}m` : `${r / 1000}km`}
            </button>
          ))}
        </div>

        {/* 카테고리 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategory(cat.id)
                setPage(1)
              }}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                category === cat.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 결과 */}
      <div className="px-4 pt-4">
        {isLoading ? (
          <Loading />
        ) : error ? (
          <EmptyState
            icon={<Navigation className="w-12 h-12" />}
            title="오류가 발생했습니다"
            description="잠시 후 다시 시도해주세요"
          />
        ) : data && data.items.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-4">
              반경 {radius < 1000 ? `${radius}m` : `${radius / 1000}km`} 내 {data.totalCount}개의 장소
            </p>

            <div className="space-y-3">
              {data.items.map((place) => (
                <TourPlaceCard key={place.contentId} place={place} />
              ))}
            </div>

            {/* 페이지네이션 */}
            {data.totalCount > data.numOfRows && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  이전
                </Button>
                <span className="px-4 py-2 text-sm">
                  {page} / {Math.ceil(data.totalCount / data.numOfRows)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(data.totalCount / data.numOfRows)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={<MapPin className="w-12 h-12" />}
            title="주변에 장소가 없습니다"
            description="검색 반경을 늘려보세요"
          />
        )}
      </div>
    </div>
  )
}
