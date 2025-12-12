<script setup>
import { computed, onMounted } from 'vue'
import { useDialogStore } from '../stores/dialog'
import { useScriptStore } from '../stores/script'
import { useSettingsStore } from '../stores/settings'

const dialogStore = useDialogStore()
const scriptStore = useScriptStore()
const settingsStore = useSettingsStore()

// 初始化跨标签页同步
onMounted(() => {
  dialogStore.initSync()
})

// 计算对话框样式
const dialogBoxStyle = computed(() => {
  const style = settingsStore.dialogStyle
  return {
    backgroundColor: style.backgroundColor,
    border: `${style.borderWidth}px solid ${style.borderColor}`,
    borderRadius: `${style.borderRadius}px`,
    padding: `${style.padding}px`
  }
})

// 计算文字样式
const textStyleComputed = computed(() => {
  const style = settingsStore.textStyle
  return {
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    color: style.color,
    lineHeight: style.lineHeight,
    textShadow: style.textShadow
  }
})

// 计算角色名称样式
const nameStyleComputed = computed(() => {
  const style = settingsStore.nameStyle
  const charColor = dialogStore.currentCharacter?.color || '#ffffff'
  return {
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    padding: style.padding,
    borderRadius: `${style.borderRadius}px`,
    backgroundColor: charColor,
    color: getContrastColor(charColor)
  }
})

// 计算选项样式
const choiceStyleComputed = computed(() => {
  const style = settingsStore.choiceStyle
  return {
    backgroundColor: style.backgroundColor,
    border: `${style.borderWidth}px solid ${style.borderColor}`,
    borderRadius: `${style.borderRadius}px`,
    padding: style.padding,
    fontSize: `${style.fontSize}px`,
    color: style.color,
    '--hover-bg': style.hoverBackgroundColor
  }
})

// 计算对比色（确保文字可读）
function getContrastColor(hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

// 处理点击事件
function handleClick() {
  dialogStore.next()
}

// 选择选项
function selectChoice(index) {
  dialogStore.selectChoice(index)
}
</script>

<template>
  <div class="display-view" :style="settingsStore.backgroundStyle">
    <!-- 对话区域 -->
    <div class="dialog-area" v-if="dialogStore.currentNode">
      <!-- 角色名称 -->
      <div class="character-name" v-if="dialogStore.currentCharacter" :style="nameStyleComputed">
        {{ dialogStore.currentCharacter.name }}
      </div>

      <!-- 对话框 -->
      <div class="dialog-box" :style="dialogBoxStyle" @click="handleClick">
        <p class="dialog-text" :style="textStyleComputed">
          {{ dialogStore.displayedText }}
          <span class="cursor" v-if="dialogStore.isTyping">|</span>
        </p>
      </div>

      <!-- 选项列表 -->
      <div class="choices" v-if="dialogStore.hasChoices && !dialogStore.isTyping">
        <button
          v-for="(choice, index) in dialogStore.choices"
          :key="index"
          class="choice-btn"
          :style="choiceStyleComputed"
          @click="selectChoice(index)"
        >
          {{ choice.text }}
        </button>
      </div>
    </div>

    <!-- 未开始状态 -->
    <div class="waiting" v-else>
      <p>等待开始对话...</p>
      <p class="hint">请在控制面板中开始对话</p>
    </div>

    <!-- 结束状态提示 -->
    <div class="ended-hint" v-if="dialogStore.isEnded && !dialogStore.isTyping">
      <span>对话结束</span>
    </div>
  </div>
</template>

<style scoped>
.display-view {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  position: relative;
  overflow: hidden;
}

.dialog-area {
  padding: 20px;
  padding-bottom: 50px;
}

.character-name {
  display: inline-block;
  margin-bottom: -1px;
  margin-left: 20px;
  position: relative;
  z-index: 1;
}

.dialog-box {
  cursor: pointer;
  min-height: 120px;
  transition: background-color 0.2s;
}

.dialog-box:hover {
  filter: brightness(1.1);
}

.dialog-text {
  margin: 0;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.cursor {
  animation: blink 0.8s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.choices {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
  padding: 0 20px;
}

.choice-btn {
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.choice-btn:hover {
  background-color: var(--hover-bg) !important;
  transform: translateX(10px);
}

.waiting {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

.waiting p {
  margin: 10px 0;
}

.waiting .hint {
  font-size: 14px;
  opacity: 0.7;
}

.ended-hint {
  position: absolute;
  bottom: 10px;
  right: 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}
</style>
