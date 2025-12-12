import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useScriptStore } from './script'
import { broadcastSync, SyncTypes, getSyncChannel } from './sync'

export const useDialogStore = defineStore('dialog', () => {
  const scriptStore = useScriptStore()

  // 当前节点 ID
  const currentNodeId = ref(null)

  // 是否正在显示打字机效果
  const isTyping = ref(false)

  // 当前显示的文字（用于打字机效果）
  const displayedText = ref('')

  // 对话历史
  const history = ref([])

  // 当前节点数据
  const currentNode = computed(() => {
    if (!currentNodeId.value) return null
    return scriptStore.getNode(currentNodeId.value)
  })

  // 当前角色信息
  const currentCharacter = computed(() => {
    if (!currentNode.value?.character) return null
    return scriptStore.getCharacter(currentNode.value.character)
  })

  // 当前完整文本
  const fullText = computed(() => currentNode.value?.text || '')

  // 是否有选项
  const hasChoices = computed(() => {
    return currentNode.value?.choices && currentNode.value.choices.length > 0
  })

  // 当前选项列表
  const choices = computed(() => currentNode.value?.choices || [])

  // 是否可以继续下一句
  const canNext = computed(() => {
    if (isTyping.value) return true // 可以跳过打字机效果
    if (hasChoices.value) return false // 有选项时不能直接下一句
    return currentNode.value?.next !== null && currentNode.value?.next !== undefined
  })

  // 是否已结束
  const isEnded = computed(() => {
    if (!currentNode.value) return false
    return !hasChoices.value && !currentNode.value.next
  })

  // 打字机效果定时器
  let typingTimer = null
  const typingSpeed = ref(50) // 每个字的间隔毫秒

  // 开始对话（从起始节点）
  function start(broadcast = true) {
    history.value = []
    goToNode(scriptStore.startNodeId, broadcast)
    if (broadcast) {
      broadcastSync(SyncTypes.DIALOG_START, { startNodeId: scriptStore.startNodeId })
    }
  }

  // 跳转到指定节点
  function goToNode(nodeId, broadcast = true) {
    if (!nodeId) return

    // 停止当前打字机效果
    stopTyping()

    currentNodeId.value = nodeId
    displayedText.value = ''

    const node = scriptStore.getNode(nodeId)
    if (node) {
      startTyping()
    }

    if (broadcast) {
      broadcastSync(SyncTypes.DIALOG_GOTO, { nodeId })
    }
  }

  // 开始打字机效果
  function startTyping() {
    if (!currentNode.value?.text) return

    isTyping.value = true
    displayedText.value = ''
    let index = 0
    const text = currentNode.value.text

    typingTimer = setInterval(() => {
      if (index < text.length) {
        displayedText.value += text[index]
        index++
      } else {
        stopTyping()
      }
    }, typingSpeed.value)
  }

  // 停止打字机效果（显示完整文本）
  function stopTyping(broadcast = false) {
    if (typingTimer) {
      clearInterval(typingTimer)
      typingTimer = null
    }
    isTyping.value = false
    if (currentNode.value?.text) {
      displayedText.value = currentNode.value.text
    }
    if (broadcast) {
      broadcastSync(SyncTypes.DIALOG_TYPING_SKIP, {})
    }
  }

  // 下一句对话
  function next(broadcast = true) {
    if (isTyping.value) {
      // 如果正在打字，跳过打字机效果
      stopTyping(broadcast)
      return
    }

    if (hasChoices.value) {
      // 有选项时不能直接下一句
      return
    }

    // 添加到历史
    if (currentNode.value) {
      history.value.push({
        nodeId: currentNodeId.value,
        character: currentCharacter.value,
        text: currentNode.value.text
      })
    }

    // 跳转到下一个节点
    if (currentNode.value?.next) {
      goToNode(currentNode.value.next, false)
    }

    if (broadcast) {
      broadcastSync(SyncTypes.DIALOG_NEXT, {})
    }
  }

  // 选择选项
  function selectChoice(choiceIndex, broadcast = true) {
    if (!hasChoices.value) return
    if (choiceIndex < 0 || choiceIndex >= choices.value.length) return

    const choice = choices.value[choiceIndex]

    // 添加到历史
    if (currentNode.value) {
      history.value.push({
        nodeId: currentNodeId.value,
        character: currentCharacter.value,
        text: currentNode.value.text,
        selectedChoice: choice.text
      })
    }

    // 跳转到选项指向的节点
    if (choice.goto) {
      goToNode(choice.goto, false)
    }

    if (broadcast) {
      broadcastSync(SyncTypes.DIALOG_CHOICE, { choiceIndex })
    }
  }

  // 重置对话
  function reset(broadcast = true) {
    stopTyping()
    currentNodeId.value = null
    displayedText.value = ''
    history.value = []

    if (broadcast) {
      broadcastSync(SyncTypes.DIALOG_RESET, {})
    }
  }

  // 设置打字速度
  function setTypingSpeed(speed) {
    typingSpeed.value = speed
  }

  // 初始化跨标签页监听
  function initSync() {
    const channel = getSyncChannel()
    if (channel) {
      channel.onmessage = (event) => {
        const { type, payload } = event.data

        switch (type) {
          case SyncTypes.DIALOG_START:
            history.value = []
            goToNode(payload.startNodeId, false)
            break
          case SyncTypes.DIALOG_GOTO:
            goToNode(payload.nodeId, false)
            break
          case SyncTypes.DIALOG_NEXT:
            next(false)
            break
          case SyncTypes.DIALOG_CHOICE:
            selectChoice(payload.choiceIndex, false)
            break
          case SyncTypes.DIALOG_RESET:
            reset(false)
            break
          case SyncTypes.DIALOG_TYPING_SKIP:
            stopTyping(false)
            break
          case SyncTypes.SCRIPT_UPDATE:
            // 脚本更新时重新加载
            scriptStore.script = payload.script
            break
        }
      }
    }
  }

  return {
    currentNodeId,
    currentNode,
    currentCharacter,
    displayedText,
    fullText,
    isTyping,
    hasChoices,
    choices,
    canNext,
    isEnded,
    history,
    typingSpeed,
    start,
    goToNode,
    next,
    selectChoice,
    reset,
    stopTyping,
    setTypingSpeed,
    initSync
  }
})
