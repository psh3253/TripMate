import { useEffect, useRef, useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { chatService } from '@/services/chatService'
import { useAuthStore } from '@/stores/authStore'
import type { ChatMessage } from '@/types'

export function useChatRooms() {
  return useQuery({
    queryKey: ['chat', 'rooms'],
    queryFn: () => chatService.getRooms(),
  })
}

export function useChatMessages(roomId: number) {
  return useQuery({
    queryKey: ['chat', 'messages', roomId],
    queryFn: () => chatService.getMessages(roomId),
    enabled: !!roomId,
  })
}

export function useWebSocket(roomId: number | null) {
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)

  const connect = useCallback(() => {
    if (!roomId || !accessToken) return

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      onConnect: () => {
        setIsConnected(true)
        client.subscribe(`/topic/chat/${roomId}`, (message) => {
          const chatMessage: ChatMessage = JSON.parse(message.body)
          queryClient.setQueryData<ChatMessage[]>(
            ['chat', 'messages', roomId],
            (old) => (old ? [...old, chatMessage] : [chatMessage])
          )
        })
      },
      onDisconnect: () => {
        setIsConnected(false)
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame)
      },
    })

    client.activate()
    clientRef.current = client
  }, [roomId, accessToken, queryClient])

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate()
      clientRef.current = null
      setIsConnected(false)
    }
  }, [])

  const sendMessage = useCallback(
    (content: string) => {
      if (clientRef.current?.connected && roomId) {
        clientRef.current.publish({
          destination: `/app/chat/${roomId}`,
          body: JSON.stringify({ content }),
        })
      }
    },
    [roomId]
  )

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return { isConnected, sendMessage, disconnect, reconnect: connect }
}
