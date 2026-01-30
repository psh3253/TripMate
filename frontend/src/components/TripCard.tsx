import { Link } from 'react-router-dom'
import { MapPin, Calendar, Wallet } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Trip } from '@/types'
import Card from './Card'

interface TripCardProps {
  trip: Trip
}

const themeLabels: Record<string, string> = {
  HEALING: '힐링',
  ADVENTURE: '모험',
  FOOD: '맛집',
  CULTURE: '문화',
  SHOPPING: '쇼핑',
  NATURE: '자연',
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PLANNING: { label: '계획중', color: 'bg-blue-100 text-blue-700' },
  CONFIRMED: { label: '확정', color: 'bg-green-100 text-green-700' },
  COMPLETED: { label: '완료', color: 'bg-gray-100 text-gray-700' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-700' },
}

export default function TripCard({ trip }: TripCardProps) {
  const status = statusLabels[trip.status] || statusLabels.PLANNING

  return (
    <Link to={`/trips/${trip.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {trip.title}
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2 flex-wrap">
            <MapPin className="w-4 h-4" />
            <span>{trip.destination}</span>
            {trip.themes?.map((theme) => (
              <span key={theme} className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full text-xs">
                {themeLabels[theme] || theme}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {format(new Date(trip.startDate), 'M월 d일', { locale: ko })} -{' '}
              {format(new Date(trip.endDate), 'M월 d일', { locale: ko })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span>{trip.budget.toLocaleString()}원</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
