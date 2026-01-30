import { Link } from 'react-router-dom'
import { MapPin, Phone } from 'lucide-react'
import type { TourPlace } from '@/services/tourService'
import { CONTENT_TYPE_LABELS } from '@/services/tourService'
import Card from './Card'

interface TourPlaceCardProps {
  place: TourPlace
}

export default function TourPlaceCard({ place }: TourPlaceCardProps) {
  const contentType = CONTENT_TYPE_LABELS[Number(place.contentTypeId)] || '기타'

  return (
    <Link to={`/explore/${place.contentId}?type=${place.contentTypeId}`}>
      <Card padding="none" className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex">
          {place.firstImage ? (
            <img
              src={place.firstImage}
              alt={place.title}
              className="w-28 h-28 object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-28 h-28 bg-gray-200 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
          )}

          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 line-clamp-1">{place.title}</h3>
              <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full text-xs whitespace-nowrap">
                {contentType}
              </span>
            </div>

            {place.addr1 && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {place.addr1}
              </p>
            )}

            {place.tel && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-1 flex items-center gap-1">
                <Phone className="w-3 h-3 flex-shrink-0" />
                {place.tel}
              </p>
            )}

            {place.dist && (
              <p className="text-xs text-primary-600 mt-2">
                {place.dist < 1000
                  ? `${Math.round(place.dist)}m`
                  : `${(place.dist / 1000).toFixed(1)}km`}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
