import { Link } from 'react-router-dom'
import { Plus, MapPin, Bot } from 'lucide-react'
import { useMyTrips } from '@/hooks/useTrips'
import TripCard from '@/components/TripCard'
import Button from '@/components/Button'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'

export default function TripsPage() {
  const { data: trips, isLoading } = useMyTrips()

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">내 여행</h1>
        <div className="flex gap-2">
          <Link to="/trips/ai-planner">
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <Bot className="w-4 h-4" />
              AI 플래너
            </Button>
          </Link>
          <Link to="/trips/create">
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="w-4 h-4" />
              새 여행
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : trips && trips.length > 0 ? (
        <div className="space-y-4">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<MapPin className="w-12 h-12" />}
          title="아직 여행 계획이 없어요"
          description="새로운 여행을 계획해보세요"
          action={
            <Link to="/trips/create">
              <Button>여행 계획하기</Button>
            </Link>
          }
        />
      )}
    </div>
  )
}
