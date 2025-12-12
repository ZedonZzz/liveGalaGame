// WebSocket 同步服务器
// 用于 OBS 浏览器源和外部浏览器之间的通信

import { WebSocketServer } from 'ws'

const PORT = 9527
const wss = new WebSocketServer({ port: PORT })

const clients = new Set()

wss.on('connection', (ws) => {
  clients.add(ws)
  console.log(`[连接] 客户端已连接，当前连接数: ${clients.size}`)

  ws.on('message', (data) => {
    // 广播消息给所有其他客户端
    const message = data.toString()
    clients.forEach((client) => {
      if (client !== ws && client.readyState === ws.OPEN) {
        client.send(message)
      }
    })
  })

  ws.on('close', () => {
    clients.delete(ws)
    console.log(`[断开] 客户端已断开，当前连接数: ${clients.size}`)
  })

  ws.on('error', (err) => {
    console.error('[错误]', err.message)
    clients.delete(ws)
  })
})

console.log(`
╔════════════════════════════════════════════╗
║     LiveGalaGame WebSocket 同步服务器      ║
╠════════════════════════════════════════════╣
║  端口: ${PORT}                              ║
║  地址: ws://localhost:${PORT}               ║
╠════════════════════════════════════════════╣
║  使用说明:                                 ║
║  1. 保持此窗口运行                         ║
║  2. 在外部浏览器打开控制面板               ║
║  3. 在 OBS 浏览器源中打开显示窗口          ║
╚════════════════════════════════════════════╝
`)
