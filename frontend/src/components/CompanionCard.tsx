import { Link } from 'react-router-dom'
import { MapPin, Calendar, Users } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Companion } from '@/types'
import Card from './Card'

interface CompanionCardProps {
  companion: Companion
}

const statusLabels: Record<string, { label: string; color: string }> = {
  RECRUITING: { label: '모집중', color: 'bg-green-100 text-green-700' },
  CLOSED: { label: '모집완료', color: 'bg-gray-100 text-gray-700' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-700' },
}

export default function CompanionCard({ companion }: CompanionCardProps) {
  const status = statusLabels[companion.status] || statusLabels.RECRUITING

  return (
    <Link to={`/companions/${companion.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {companion.title}
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {companion.content}
        </p>

        {companion.trip && (
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{companion.trip.destination}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(companion.trip.startDate), 'M월 d일', { locale: ko })} -{' '}
                {format(new Date(companion.trip.endDate), 'M월 d일', { locale: ko })}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {companion.user?.profileImage ? (
              <img
                src={companion.user.profileImage}
                alt={companion.user.nickname}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200" />
            )}
            <span className="text-sm text-gray-600">
              {companion.user?.nickname || '익명'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-sm">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-primary-600 font-medium">{companion.currentMembers}</span>
            <span className="text-gray-400">/ {companion.maxMembers}</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
