import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone, Clock, Car, CreditCard, Globe, Calendar } from 'lucide-react'
import { useTourDetail } from '@/hooks/useTour'
import { CONTENT_TYPE_LABELS, CONTENT_TYPES } from '@/services/tourService'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Loading from '@/components/Loading'

export default function ExploreDetailPage() {
  const { contentId } = useParams<{ contentId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const contentTypeId = searchParams.get('type') ? Number(searchParams.get('type')) : undefined

  const { data: detail, isLoading } = useTourDetail(contentId || '', contentTypeId)

  if (isLoading) return <Loading />
  if (!detail) return null

  const contentType = CONTENT_TYPE_LABELS[Number(detail.contentTypeId)] || '기타'
  const isRestaurant = Number(detail.contentTypeId) === CONTENT_TYPES.RESTAURANT
  const isAccommodation = Number(detail.contentTypeId) === CONTENT_TYPES.ACCOMMODATION

  const openMap = () => {
    if (detail.mapY && detail.mapX) {
      window.open(
        `https://map.kakao.com/link/map/${detail.title},${detail.mapY},${detail.mapX}`,
        '_blank'
      )
    }
  }

  const removeHtmlTags = (str: string | null) => {
    if (!str) return ''
    return str.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
  }

  return (
    <div className="pb-6">
      {/* 헤더 이미지 */}
      <div className="relative">
        {detail.firstImage ? (
          <img
            src={detail.firstImage}
            alt={detail.title}
            className="w-full h-56 object-cover"
          />
        ) : (
          <div className="w-full h-56 bg-gray-200 flex items-center justify-center">
            <MapPin className="w-16 h-16 text-gray-400" />
          </div>
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="absolute bottom-4 right-4 px-3 py-1 bg-primary-500 text-white rounded-full text-sm">
          {contentType}
        </span>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* 기본 정보 */}
        <Card>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{detail.title}</h1>

          {detail.addr1 && (
            <button
              onClick={openMap}
              className="flex items-start gap-2 text-gray-600 hover:text-primary-600 text-left"
            >
              <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                {detail.addr1}
                {detail.addr2 && ` ${detail.addr2}`}
              </span>
            </button>
          )}

          {detail.tel && (
            <a
              href={`tel:${detail.tel}`}
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mt-2"
            >
              <Phone className="w-5 h-5" />
              <span>{detail.tel}</span>
            </a>
          )}

          {detail.homepage && (
            <a
              href={removeHtmlTags(detail.homepage)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary-600 hover:underline mt-2"
            >
              <Globe className="w-5 h-5" />
              <span>홈페이지 방문</span>
            </a>
          )}
        </Card>

        {/* 상세 정보 */}
        {(detail.useTime || detail.restDate || detail.parking || detail.openTime) && (
          <Card>
            <h2 className="font-semibold text-gray-900 mb-3">이용 안내</h2>
            <div className="space-y-3 text-sm">
              {(detail.useTime || detail.openTime) && (
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-gray-500">이용시간</p>
                    <p className="text-gray-900">{removeHtmlTags(detail.useTime || detail.openTime)}</p>
                  </div>
                </div>
              )}

              {detail.restDate && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-gray-500">휴무일</p>
                    <p className="text-gray-900">{removeHtmlTags(detail.restDate)}</p>
                  </div>
                </div>
              )}

              {detail.parking && (
                <div className="flex items-start gap-2">
                  <Car className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-gray-500">주차</p>
                    <p className="text-gray-900">{removeHtmlTags(detail.parking)}</p>
                  </div>
                </div>
              )}

              {detail.chkCreditCard && (
                <div className="flex items-start gap-2">
                  <CreditCard className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-gray-500">신용카드</p>
                    <p className="text-gray-900">{removeHtmlTags(detail.chkCreditCard)}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 음식점 정보 */}
        {isRestaurant && (detail.firstMenu || detail.treatMenu) && (
          <Card>
            <h2 className="font-semibold text-gray-900 mb-3">메뉴 정보</h2>
            <div className="space-y-2 text-sm">
              {detail.firstMenu && (
                <div>
                  <p className="text-gray-500">대표메뉴</p>
                  <p className="text-gray-900">{removeHtmlTags(detail.firstMenu)}</p>
                </div>
              )}
              {detail.treatMenu && (
                <div className="mt-2">
                  <p className="text-gray-500">취급메뉴</p>
                  <p className="text-gray-900">{removeHtmlTags(detail.treatMenu)}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 숙박 정보 */}
        {isAccommodation && (detail.checkInTime || detail.checkOutTime || detail.roomCount) && (
          <Card>
            <h2 className="font-semibold text-gray-900 mb-3">숙박 정보</h2>
            <div className="space-y-2 text-sm">
              {detail.checkInTime && (
                <p>
                  <span className="text-gray-500">체크인: </span>
                  <span className="text-gray-900">{removeHtmlTags(detail.checkInTime)}</span>
                </p>
              )}
              {detail.checkOutTime && (
                <p>
                  <span className="text-gray-500">체크아웃: </span>
                  <span className="text-gray-900">{removeHtmlTags(detail.checkOutTime)}</span>
                </p>
              )}
              {detail.roomCount && (
                <p>
                  <span className="text-gray-500">객실수: </span>
                  <span className="text-gray-900">{removeHtmlTags(detail.roomCount)}</span>
                </p>
              )}
              {detail.reservationUrl && (
                <a
                  href={removeHtmlTags(detail.reservationUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  예약하기
                </a>
              )}
            </div>
          </Card>
        )}

        {/* 개요 */}
        {detail.overview && (
          <Card>
            <h2 className="font-semibold text-gray-900 mb-3">소개</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {removeHtmlTags(detail.overview)}
            </p>
          </Card>
        )}

        {/* 지도 버튼 */}
        {detail.mapY && detail.mapX && (
          <Button onClick={openMap} className="w-full">
            <MapPin className="w-5 h-5 mr-2" />
            지도에서 보기
          </Button>
        )}
      </div>
    </div>
  )
}
