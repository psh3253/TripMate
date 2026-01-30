import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MessageCircle, Send, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { useChatRooms, useChatMessages, useWebSocket } from '@/hooks/useChat'
import { useAuthStore } from '@/stores/authStore'
import Card from '@/components/Card'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'

export default function ChatPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const user = useAuthStore((state) => state.user)
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: rooms, isLoading: roomsLoading } = useChatRooms()
  const { data: messages, isLoading: messagesLoading } = useChatMessages(Number(roomId))
  const { sendMessage, isConnected } = useWebSocket(roomId ? Number(roomId) : null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    sendMessage(message)
    setMessage('')
  }

  if (roomsLoading) return <Loading />

  if (!roomId) {
    return (
      <div className="px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">채팅</h1>

        {rooms && rooms.length > 0 ? (
          <div className="space-y-3">
            {rooms.map((room) => (
              <Link key={room.id} to={`/chat/${room.id}`}>
                <Card className="flex items-center gap-3 hover:bg-gray-50">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium">채팅방 #{room.id}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(room.createdAt), 'M월 d일')}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<MessageCircle className="w-12 h-12" />}
            title="채팅방이 없어요"
            description="동행 모집에 참여하면 채팅방이 생성됩니다"
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="px-4 py-3 border-b bg-white flex items-center gap-3">
        <Link to="/chat" className="p-1 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="font-semibold">채팅방</h2>
        <span className={`ml-auto w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messagesLoading ? (
          <Loading />
        ) : messages && messages.length > 0 ? (
          messages.map((msg) => {
            const isMe = msg.userId === user?.id
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isMe ? 'order-2' : ''}`}>
                  {!isMe && (
                    <p className="text-xs text-gray-500 mb-1">
                      {msg.user?.nickname || '알 수 없음'}
                    </p>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isMe
                        ? 'bg-primary-500 text-white rounded-br-sm'
                        : 'bg-gray-200 text-gray-900 rounded-bl-sm'
                    }`}
                  >
                    <p>{msg.content}</p>
                  </div>
                  <p className={`text-xs text-gray-400 mt-1 ${isMe ? 'text-right' : ''}`}>
                    {format(new Date(msg.createdAt), 'HH:mm')}
                  </p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center text-gray-500 py-8">
            첫 메시지를 보내보세요
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="px-4 py-3 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <button
            type="submit"
            disabled={!message.trim() || !isConnected}
            className="p-2 bg-primary-500 text-white rounded-full disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
