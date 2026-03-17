import { useEffect, useRef, useState } from 'react'

// 全局变量，确保整个应用只有一个 WebSocket 实例
let globalWs: WebSocket | null = null
let globalCallbacks: Set<(data: WSMessage) => void> = new Set()

interface WSMessage {
  type: string
  event?: string
  path?: string
}

type WSStatus = 'connecting' | 'connected' | 'disconnected'

function createGlobalWebSocket() {
  if (globalWs?.readyState === WebSocket.OPEN || globalWs?.readyState === WebSocket.CONNECTING) {
    return
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/ws`

  const ws = new WebSocket(wsUrl)
  globalWs = ws

  ws.onopen = () => {
    // broadcast to all listeners
  }

  ws.onclose = () => {
    globalWs = null
    // 3秒后重连
    setTimeout(() => {
      createGlobalWebSocket()
    }, 3000)
  }

  ws.onerror = () => {
    ws.close()
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      globalCallbacks.forEach((cb) => cb(data))
    } catch {
      // ignore
    }
  }
}

export function useWebSocket(onMessage: (data: WSMessage) => void) {
  const [status, setStatus] = useState<WSStatus>('disconnected')

  useEffect(() => {
    // 添加回调到全局集合
    globalCallbacks.add(onMessage)

    // 创建全局 WebSocket（如果还没有）
    createGlobalWebSocket()

    // 更新状态
    if (globalWs?.readyState === WebSocket.OPEN) {
      setStatus('connected')
    } else {
      setStatus('connecting')
      const checkStatus = setInterval(() => {
        if (globalWs?.readyState === WebSocket.OPEN) {
          setStatus('connected')
          clearInterval(checkStatus)
        }
      }, 100)
      // 5秒后清除检查
      setTimeout(() => clearInterval(checkStatus), 5000)
    }

    return () => {
      globalCallbacks.delete(onMessage)
    }
  }, [onMessage])

  const reconnect = () => {
    if (globalWs) {
      globalWs.close()
      globalWs = null
    }
    createGlobalWebSocket()
  }

  return { status, reconnect }
}