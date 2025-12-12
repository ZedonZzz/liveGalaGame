<script setup>
import { ref, computed } from 'vue'
import { useDialogStore } from '../stores/dialog'
import { useScriptStore } from '../stores/script'
import { useSettingsStore, GREEN_SCREEN_COLORS, WINDOW_SIZES } from '../stores/settings'

const dialogStore = useDialogStore()
const scriptStore = useScriptStore()
const settingsStore = useSettingsStore()

// 当前选中的节点（用于快速跳转）
const selectedNodeId = ref('')

// 实时编辑的临时值
const editingCharName = ref('')
const editingText = ref('')
const isEditingCharName = ref(false)
const isEditingText = ref(false)

// 所有节点列表
const nodeOptions = computed(() => {
  return scriptStore.nodeList.map(node => ({
    id: node.id,
    label: `[${node.id}] ${scriptStore.getCharacter(node.character)?.name || '未知'}: ${node.text?.slice(0, 20)}...`
  }))
})

// 开始对话
function startDialog() {
  dialogStore.start()
}

// 下一句
function nextDialog() {
  dialogStore.next()
}

// 跳转到指定节点
function jumpToNode() {
  if (selectedNodeId.value) {
    dialogStore.goToNode(selectedNodeId.value)
  }
}

// 选择选项
function selectChoice(index) {
  dialogStore.selectChoice(index)
}

// 重置对话
function resetDialog() {
  dialogStore.reset()
}

// 开始编辑角色名称
function startEditCharName() {
  if (dialogStore.currentCharacter) {
    editingCharName.value = dialogStore.currentCharacter.name
    isEditingCharName.value = true
  }
}

// 保存角色名称
function saveCharName() {
  if (dialogStore.currentNode?.character) {
    scriptStore.updateCharacter(dialogStore.currentNode.character, {
      name: editingCharName.value
    })
  }
  isEditingCharName.value = false
}

// 开始编辑对话文本
function startEditText() {
  if (dialogStore.currentNode) {
    editingText.value = dialogStore.currentNode.text
    isEditingText.value = true
  }
}

// 保存对话文本
function saveText() {
  if (dialogStore.currentNodeId) {
    scriptStore.updateNode(dialogStore.currentNodeId, {
      text: editingText.value
    })
    // 更新显示文本
    dialogStore.stopTyping()
  }
  isEditingText.value = false
}

// 设置绿幕
function toggleGreenScreen() {
  settingsStore.setGreenScreen(!settingsStore.greenScreenEnabled)
}

// 设置绿幕颜色
function setGreenScreenColor(color) {
  settingsStore.setGreenScreenColor(color)
}

// 设置透明背景
function toggleTransparent() {
  settingsStore.setTransparentBackground(!settingsStore.transparentBackground)
}
</script>

<template>
  <div class="control-view">
    <header class="control-header">
      <h1>控制面板</h1>
      <div class="header-links">
        <router-link to="/" target="_blank">打开显示窗口</router-link>
        <router-link to="/editor">编辑器</router-link>
      </div>
    </header>

    <main class="control-main">
      <!-- 左侧：对话控制 -->
      <section class="control-section dialog-control">
        <h2>对话控制</h2>

        <!-- 控制按钮 -->
        <div class="control-buttons">
          <button class="btn btn-primary" @click="startDialog">
            开始对话
          </button>
          <button
            class="btn btn-success"
            @click="nextDialog"
            :disabled="!dialogStore.canNext && !dialogStore.isTyping"
          >
            {{ dialogStore.isTyping ? '跳过动画' : '下一句' }}
          </button>
          <button class="btn btn-danger" @click="resetDialog">
            重置
          </button>
        </div>

        <!-- 快速跳转 -->
        <div class="jump-control">
          <h3>快速跳转</h3>
          <div class="jump-row">
            <select v-model="selectedNodeId">
              <option value="">选择节点...</option>
              <option v-for="node in nodeOptions" :key="node.id" :value="node.id">
                {{ node.label }}
              </option>
            </select>
            <button class="btn" @click="jumpToNode" :disabled="!selectedNodeId">
              跳转
            </button>
          </div>
        </div>

        <!-- 当前状态 -->
        <div class="current-status">
          <h3>当前状态</h3>
          <div class="status-info">
            <p><strong>节点ID:</strong> {{ dialogStore.currentNodeId || '无' }}</p>
            <p>
              <strong>角色:</strong>
              <span v-if="!isEditingCharName">
                {{ dialogStore.currentCharacter?.name || '无' }}
                <button class="btn-inline" @click="startEditCharName" v-if="dialogStore.currentCharacter">
                  编辑
                </button>
              </span>
              <span v-else>
                <input v-model="editingCharName" @keyup.enter="saveCharName" />
                <button class="btn-inline" @click="saveCharName">保存</button>
              </span>
            </p>
            <p><strong>状态:</strong>
              <span v-if="dialogStore.isTyping">打字中...</span>
              <span v-else-if="dialogStore.hasChoices">等待选择</span>
              <span v-else-if="dialogStore.isEnded">已结束</span>
              <span v-else-if="!dialogStore.currentNode">未开始</span>
              <span v-else>等待下一句</span>
            </p>
          </div>
        </div>

        <!-- 当前对话内容 -->
        <div class="current-dialog" v-if="dialogStore.currentNode">
          <h3>当前对话</h3>
          <div class="dialog-content" v-if="!isEditingText">
            <p>{{ dialogStore.currentNode.text }}</p>
            <button class="btn-inline" @click="startEditText">编辑</button>
          </div>
          <div class="dialog-edit" v-else>
            <textarea v-model="editingText" rows="3"></textarea>
            <button class="btn" @click="saveText">保存</button>
          </div>
        </div>

        <!-- 当前选项 -->
        <div class="current-choices" v-if="dialogStore.hasChoices && !dialogStore.isTyping">
          <h3>选项</h3>
          <div class="choice-list">
            <button
              v-for="(choice, index) in dialogStore.choices"
              :key="index"
              class="btn choice-btn"
              @click="selectChoice(index)"
            >
              {{ index + 1 }}. {{ choice.text }}
            </button>
          </div>
        </div>
      </section>

      <!-- 右侧：设置 -->
      <section class="control-section settings-control">
        <h2>显示设置</h2>

        <!-- 绿幕设置 -->
        <div class="setting-group">
          <h3>背景模式</h3>
          <div class="setting-row">
            <label>
              <input type="checkbox" :checked="settingsStore.greenScreenEnabled" @change="toggleGreenScreen" />
              绿幕模式
            </label>
          </div>
          <div class="setting-row" v-if="settingsStore.greenScreenEnabled">
            <label>颜色:</label>
            <div class="color-options">
              <button
                v-for="(color, key) in GREEN_SCREEN_COLORS"
                :key="key"
                class="color-btn"
                :class="{ active: settingsStore.greenScreenColor === color.value }"
                :style="{ backgroundColor: color.value }"
                @click="setGreenScreenColor(color.value)"
                :title="color.name"
              ></button>
            </div>
          </div>
          <div class="setting-row">
            <label>
              <input type="checkbox" :checked="settingsStore.transparentBackground" @change="toggleTransparent" />
              透明背景
            </label>
          </div>
        </div>

        <!-- 打字速度 -->
        <div class="setting-group">
          <h3>打字速度</h3>
          <div class="setting-row">
            <input
              type="range"
              min="10"
              max="200"
              :value="settingsStore.typingSpeed"
              @input="settingsStore.setTypingSpeed(Number($event.target.value))"
            />
            <span>{{ settingsStore.typingSpeed }}ms</span>
          </div>
        </div>

        <!-- 对话历史 -->
        <div class="history-section">
          <h3>对话历史</h3>
          <div class="history-list">
            <div
              v-for="(item, index) in dialogStore.history"
              :key="index"
              class="history-item"
            >
              <span class="history-char" :style="{ color: item.character?.color }">
                {{ item.character?.name }}:
              </span>
              <span class="history-text">{{ item.text }}</span>
              <span v-if="item.selectedChoice" class="history-choice">
                [选择: {{ item.selectedChoice }}]
              </span>
            </div>
            <p v-if="dialogStore.history.length === 0" class="empty-hint">暂无历史记录</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.control-view {
  min-height: 100vh;
  background: #1a1a2e;
  color: #eee;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #16213e;
  border-bottom: 1px solid #0f3460;
}

.control-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.header-links {
  display: flex;
  gap: 15px;
}

.header-links a {
  color: #4da8da;
  text-decoration: none;
}

.header-links a:hover {
  text-decoration: underline;
}

.control-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.control-section {
  background: #16213e;
  border-radius: 8px;
  padding: 20px;
}

.control-section h2 {
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #0f3460;
  font-size: 1.2rem;
}

.control-section h3 {
  margin: 15px 0 10px 0;
  font-size: 1rem;
  color: #aaa;
}

.control-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  background: #0f3460;
  color: #fff;
}

.btn:hover:not(:disabled) {
  filter: brightness(1.2);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #4da8da;
}

.btn-success {
  background: #27ae60;
}

.btn-danger {
  background: #e74c3c;
}

.btn-inline {
  padding: 2px 8px;
  font-size: 12px;
  background: #0f3460;
  border: none;
  border-radius: 3px;
  color: #4da8da;
  cursor: pointer;
  margin-left: 5px;
}

.btn-inline:hover {
  background: #1a4a7a;
}

.jump-control {
  margin-top: 15px;
}

.jump-row {
  display: flex;
  gap: 10px;
}

.jump-row select {
  flex: 1;
  padding: 8px;
  border: 1px solid #0f3460;
  border-radius: 5px;
  background: #1a1a2e;
  color: #eee;
}

.status-info p {
  margin: 5px 0;
}

.status-info input {
  padding: 4px 8px;
  border: 1px solid #0f3460;
  border-radius: 3px;
  background: #1a1a2e;
  color: #eee;
}

.current-dialog {
  margin-top: 15px;
}

.dialog-content {
  background: #1a1a2e;
  padding: 15px;
  border-radius: 5px;
}

.dialog-content p {
  margin: 0 0 10px 0;
}

.dialog-edit textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #0f3460;
  border-radius: 5px;
  background: #1a1a2e;
  color: #eee;
  resize: vertical;
  margin-bottom: 10px;
}

.current-choices {
  margin-top: 15px;
}

.choice-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.choice-btn {
  text-align: left;
  background: #0f3460;
}

.choice-btn:hover {
  background: #1a4a7a;
}

.setting-group {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #0f3460;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
}

.setting-row label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.setting-row input[type="range"] {
  flex: 1;
}

.color-options {
  display: flex;
  gap: 8px;
}

.color-btn {
  width: 30px;
  height: 30px;
  border: 2px solid transparent;
  border-radius: 5px;
  cursor: pointer;
}

.color-btn.active {
  border-color: #fff;
}

.history-section {
  margin-top: 20px;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
  background: #1a1a2e;
  border-radius: 5px;
  padding: 10px;
}

.history-item {
  padding: 8px;
  border-bottom: 1px solid #0f3460;
  font-size: 13px;
}

.history-item:last-child {
  border-bottom: none;
}

.history-char {
  font-weight: bold;
}

.history-choice {
  display: block;
  color: #4da8da;
  font-style: italic;
  margin-top: 3px;
}

.empty-hint {
  color: #666;
  text-align: center;
  margin: 0;
}

@media (max-width: 900px) {
  .control-main {
    grid-template-columns: 1fr;
  }
}
</style>
