// 跨标签页状态同步
const CHANNEL_NAME = 'livegalagame-sync'

let channel = null

export function initSyncChannel() {
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME)
  }
  return channel
}

export function getSyncChannel() {
  if (!channel) {
    initSyncChannel()
  }
  return channel
}

// 发送同步消息
export function broadcastSync(type, payload) {
  const ch = getSyncChannel()
  if (ch) {
    ch.postMessage({ type, payload, timestamp: Date.now() })
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
