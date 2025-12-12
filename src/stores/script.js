import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 默认示例脚本
const defaultScript = {
  characters: {
    host: {
      name: '主播',
      color: '#FFD700'
    },
    guest: {
      name: '嘉宾',
      color: '#87CEEB'
    }
  },
  nodes: {
    start: {
      character: 'host',
      text: '大家好，欢迎来到直播间！',
      next: 'node2'
    },
    node2: {
      character: 'host',
      text: '今天我们来玩一个游戏...',
      choices: [
        { text: '开始游戏', goto: 'game_start' },
        { text: '先聊聊天', goto: 'chat' }
      ]
    },
    game_start: {
      character: 'guest',
      text: '好的，让我们开始吧！',
      next: null
    },
    chat: {
      character: 'guest',
      text: '聊点什么呢？',
      next: null
    }
  },
  startNode: 'start'
}

export const useScriptStore = defineStore('script', () => {
  // 当前脚本数据
  const script = ref(loadScript())

  // 从 localStorage 加载脚本
  function loadScript() {
    const saved = localStorage.getItem('galgame-script')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return { ...defaultScript }
      }
    }
    return { ...defaultScript }
  }

  // 保存脚本到 localStorage
  function saveScript() {
    localStorage.setItem('galgame-script', JSON.stringify(script.value))
  }

  // 获取所有角色
  const characters = computed(() => script.value.characters || {})

  // 获取所有节点
  const nodes = computed(() => script.value.nodes || {})

  // 获取节点列表（带 ID）
  const nodeList = computed(() => {
    return Object.entries(script.value.nodes || {}).map(([id, node]) => ({
      id,
      ...node
    }))
  })

  // 获取起始节点 ID
  const startNodeId = computed(() => script.value.startNode || 'start')

  // 获取指定节点
  function getNode(nodeId) {
    return script.value.nodes?.[nodeId] || null
  }

  // 获取角色信息
  function getCharacter(charId) {
    return script.value.characters?.[charId] || null
  }

  // 添加新节点
  function addNode(nodeId, nodeData) {
    if (!script.value.nodes) {
      script.value.nodes = {}
    }
    script.value.nodes[nodeId] = nodeData
    saveScript()
  }

  // 更新节点
  function updateNode(nodeId, nodeData) {
    if (script.value.nodes?.[nodeId]) {
      script.value.nodes[nodeId] = { ...script.value.nodes[nodeId], ...nodeData }
      saveScript()
    }
  }

  // 删除节点
  function deleteNode(nodeId) {
    if (script.value.nodes?.[nodeId]) {
      delete script.value.nodes[nodeId]
      // 清理引用此节点的 next 和 choices
      Object.values(script.value.nodes).forEach(node => {
        if (node.next === nodeId) {
          node.next = null
        }
        if (node.choices) {
          node.choices = node.choices.filter(c => c.goto !== nodeId)
        }
      })
      saveScript()
    }
  }

  // 添加角色
  function addCharacter(charId, charData) {
    if (!script.value.characters) {
      script.value.characters = {}
    }
    script.value.characters[charId] = charData
    saveScript()
  }

  // 更新角色
  function updateCharacter(charId, charData) {
    if (script.value.characters?.[charId]) {
      script.value.characters[charId] = { ...script.value.characters[charId], ...charData }
      saveScript()
    }
  }

  // 删除角色
  function deleteCharacter(charId) {
    if (script.value.characters?.[charId]) {
      delete script.value.characters[charId]
      saveScript()
    }
  }

  // 设置起始节点
  function setStartNode(nodeId) {
    script.value.startNode = nodeId
    saveScript()
  }

  // 导入脚本
  function importScript(newScript) {
    script.value = newScript
    saveScript()
  }

  // 导出脚本
  function exportScript() {
    return JSON.stringify(script.value, null, 2)
  }

  // 重置为默认脚本
  function resetScript() {
    script.value = { ...defaultScript }
    saveScript()
  }

  return {
    script,
    characters,
    nodes,
    nodeList,
    startNodeId,
    getNode,
    getCharacter,
    addNode,
    updateNode,
    deleteNode,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    setStartNode,
    importScript,
    exportScript,
    resetScript,
    saveScript
  }
})
