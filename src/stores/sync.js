// 跨窗口状态同步 - WebSocket 版本
// 支持 OBS 浏览器源与外部浏览器通信

const WS_URL = 'ws://localhost:9527'
const RECONNECT_INTERVAL = 3000

let ws = null
let messageHandler = null
let reconnectTimer = null

// 连接状态
export const connectionState = {
  connected: false,
  reconnecting: false
}

// 初始化 WebSocket 连接
export function initSyncChannel() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return ws
  }

  try {
    ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      console.log('[Sync] WebSocket 已连接')
      connectionState.connected = true
      connectionState.reconnecting = false
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (messageHandler) {
          messageHandler({ data })
        }
      } catch (e) {
        console.error('[Sync] 消息解析失败:', e)
      }
    }

    ws.onclose = () => {
      console.log('[Sync] WebSocket 已断开，尝试重连...')
      connectionState.connected = false
      scheduleReconnect()
    }

    ws.onerror = (err) => {
      console.error('[Sync] WebSocket 错误')
      connectionState.connected = false
    }
  } catch (e) {
    console.error('[Sync] WebSocket 初始化失败:', e)
    scheduleReconnect()
  }

  return ws
}

// 定时重连
function scheduleReconnect() {
  if (reconnectTimer) return

  connectionState.reconnecting = true
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    initSyncChannel()
  }, RECONNECT_INTERVAL)
}

// 获取同步通道（兼容旧接口）
export function getSyncChannel() {
  if (!ws) {
    initSyncChannel()
  }

  // 返回兼容 BroadcastChannel 接口的对象
  return {
    postMessage: (data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data))
      }
    },
    set onmessage(handler) {
      messageHandler = handler
    },
    get onmessage() {
      return messageHandler
    }
  }
}

// 发送同步消息
export function broadcastSync(type, payload) {
  // 确保连接已初始化
  if (!ws) {
    initSyncChannel()
  }

  const message = JSON.stringify({ type, payload, timestamp: Date.now() })

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(message)
  } else {
    // 连接未就绪时，等待连接后发送（最多重试 30 次，共 3 秒）
    let retries = 0
    const maxRetries = 30
    const checkAndSend = () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(message)
      } else if (retries < maxRetries) {
        retries++
        setTimeout(checkAndSend, 100)
      } else {
        console.warn('[Sync] 消息发送失败：WebSocket 连接超时')
      }
    }
    setTimeout(checkAndSend, 100)
  }
}

// 同步消息类型
export const SyncTypes = {
  // 对话状态
  DIALOG_START: 'dialog:start',
  DIALOG_NEXT: 'dialog:next',
  DIALOG_GOTO: 'dialog:goto',
  DIALOG_CHOICE: 'dialog:choice',
  DIALOG_RESET: 'dialog:reset',
  DIALOG_TYPING_SKIP: 'dialog:typing_skip',

  // 脚本更新
  SCRIPT_UPDATE: 'script:update',

  // 设置更新
  SETTINGS_UPDATE: 'settings:update'
}
