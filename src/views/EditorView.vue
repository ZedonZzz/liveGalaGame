<script setup>
import { ref, computed, watch } from 'vue'
import { useScriptStore } from '../stores/script'

const scriptStore = useScriptStore()

// 视图模式: 'list' | 'tree'
const viewMode = ref(localStorage.getItem('editor-view-mode') || 'list')

// 搜索关键词
const searchKeyword = ref('')

// 当前编辑的节点
const editingNode = ref(null)
const editingNodeId = ref('')

// 当前编辑的角色
const editingCharacter = ref(null)
const editingCharacterId = ref('')

// 新节点表单
const showNewNodeForm = ref(false)
const newNodeForm = ref({
  id: '',
  character: '',
  text: '',
  next: ''
})

// 新角色表单
const showNewCharForm = ref(false)
const newCharForm = ref({
  id: '',
  name: '',
  color: '#FFD700'
})

// 导入/导出
const showImportModal = ref(false)
const importText = ref('')

// 过滤后的节点列表
const filteredNodes = computed(() => {
  if (!searchKeyword.value) {
    return scriptStore.nodeList
  }
  const keyword = searchKeyword.value.toLowerCase()
  return scriptStore.nodeList.filter(node => {
    const charName = scriptStore.getCharacter(node.character)?.name || ''
    return (
      node.id.toLowerCase().includes(keyword) ||
      node.text.toLowerCase().includes(keyword) ||
      charName.toLowerCase().includes(keyword)
    )
  })
})

// 角色列表
const characterList = computed(() => {
  return Object.entries(scriptStore.characters).map(([id, char]) => ({
    id,
    ...char
  }))
})

// 保存视图模式偏好
watch(viewMode, (val) => {
  localStorage.setItem('editor-view-mode', val)
})

// 开始编辑节点
function editNode(nodeId) {
  const node = scriptStore.getNode(nodeId)
  if (node) {
    editingNodeId.value = nodeId
    editingNode.value = {
      character: node.character,
      text: node.text,
      next: node.next || '',
      choices: node.choices ? JSON.parse(JSON.stringify(node.choices)) : []
    }
  }
}

// 保存节点
function saveNode() {
  if (editingNodeId.value && editingNode.value) {
    const data = {
      character: editingNode.value.character,
      text: editingNode.value.text
    }

    if (editingNode.value.choices && editingNode.value.choices.length > 0) {
      data.choices = editingNode.value.choices.filter(c => c.text && c.goto)
      delete data.next
    } else {
      data.next = editingNode.value.next || null
      delete data.choices
    }

    scriptStore.updateNode(editingNodeId.value, data)
    cancelEditNode()
  }
}

// 取消编辑节点
function cancelEditNode() {
  editingNode.value = null
  editingNodeId.value = ''
}

// 删除节点
function deleteNode(nodeId) {
  if (confirm(`确定要删除节点 "${nodeId}" 吗？`)) {
    scriptStore.deleteNode(nodeId)
    if (editingNodeId.value === nodeId) {
      cancelEditNode()
    }
  }
}

// 添加选项到当前编辑的节点
function addChoice() {
  if (editingNode.value) {
    if (!editingNode.value.choices) {
      editingNode.value.choices = []
    }
    editingNode.value.choices.push({ text: '', goto: '' })
  }
}

// 删除选项
function removeChoice(index) {
  if (editingNode.value?.choices) {
    editingNode.value.choices.splice(index, 1)
  }
}

// 显示新建节点表单
function showAddNode() {
  newNodeForm.value = {
    id: `node_${Date.now()}`,
    character: characterList.value[0]?.id || '',
    text: '',
    next: ''
  }
  showNewNodeForm.value = true
}

// 创建新节点
function createNode() {
  if (!newNodeForm.value.id || !newNodeForm.value.text) {
    alert('请填写节点ID和对话文本')
    return
  }

  if (scriptStore.nodes[newNodeForm.value.id]) {
    alert('节点ID已存在')
    return
  }

  const nodeData = {
    character: newNodeForm.value.character,
    text: newNodeForm.value.text,
    next: newNodeForm.value.next || null
  }

  scriptStore.addNode(newNodeForm.value.id, nodeData)
  showNewNodeForm.value = false
}

// 开始编辑角色
function editCharacter(charId) {
  const char = scriptStore.getCharacter(charId)
  if (char) {
    editingCharacterId.value = charId
    editingCharacter.value = { ...char }
  }
}

// 保存角色
function saveCharacter() {
  if (editingCharacterId.value && editingCharacter.value) {
    scriptStore.updateCharacter(editingCharacterId.value, editingCharacter.value)
    cancelEditCharacter()
  }
}

// 取消编辑角色
function cancelEditCharacter() {
  editingCharacter.value = null
  editingCharacterId.value = ''
}

// 删除角色
function deleteCharacter(charId) {
  if (confirm(`确定要删除角色 "${charId}" 吗？`)) {
    scriptStore.deleteCharacter(charId)
    if (editingCharacterId.value === charId) {
      cancelEditCharacter()
    }
  }
}

// 显示新建角色表单
function showAddCharacter() {
  newCharForm.value = {
    id: `char_${Date.now()}`,
    name: '',
    color: '#FFD700'
  }
  showNewCharForm.value = true
}

// 创建新角色
function createCharacter() {
  if (!newCharForm.value.id || !newCharForm.value.name) {
    alert('请填写角色ID和名称')
    return
  }

  if (scriptStore.characters[newCharForm.value.id]) {
    alert('角色ID已存在')
    return
  }

  scriptStore.addCharacter(newCharForm.value.id, {
    name: newCharForm.value.name,
    color: newCharForm.value.color
  })
  showNewCharForm.value = false
}

// 设为起始节点
function setAsStart(nodeId) {
  scriptStore.setStartNode(nodeId)
}

// 导出脚本
function exportScript() {
  const json = scriptStore.exportScript()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'galgame-script.json'
  a.click()
  URL.revokeObjectURL(url)
}

// 显示导入对话框
function showImport() {
  importText.value = ''
  showImportModal.value = true
}

// 导入脚本
function doImport() {
  try {
    const data = JSON.parse(importText.value)
    if (!data.characters || !data.nodes || !data.startNode) {
      throw new Error('脚本格式不正确')
    }
    scriptStore.importScript(data)
    showImportModal.value = false
    alert('导入成功')
  } catch (e) {
    alert('导入失败: ' + e.message)
  }
}

// 重置脚本
function resetScript() {
  if (confirm('确定要重置为默认脚本吗？所有更改将丢失。')) {
    scriptStore.resetScript()
  }
}

// 获取节点的连接关系（用于树形视图）
function getNodeConnections(nodeId) {
  const node = scriptStore.getNode(nodeId)
  if (!node) return []

  const connections = []
  if (node.next) {
    connections.push({ type: 'next', target: node.next, label: '下一句' })
  }
  if (node.choices) {
    node.choices.forEach(choice => {
      connections.push({ type: 'choice', target: choice.goto, label: choice.text })
    })
  }
  return connections
}

// 构建树形数据
const treeData = computed(() => {
  const startId = scriptStore.startNodeId
  const visited = new Set()
  const result = []

  function buildTree(nodeId, depth = 0) {
    if (!nodeId || visited.has(nodeId)) return null
    visited.add(nodeId)

    const node = scriptStore.getNode(nodeId)
    if (!node) return null

    const char = scriptStore.getCharacter(node.character)
    const treeNode = {
      id: nodeId,
      characterName: char?.name || '未知',
      characterColor: char?.color || '#999',
      text: node.text,
      depth,
      children: []
    }

    if (node.next) {
      const child = buildTree(node.next, depth + 1)
      if (child) {
        treeNode.children.push({ type: 'next', node: child })
      }
    }

    if (node.choices) {
      node.choices.forEach(choice => {
        const child = buildTree(choice.goto, depth + 1)
        if (child) {
          treeNode.children.push({ type: 'choice', label: choice.text, node: child })
        }
      })
    }

    return treeNode
  }

  const tree = buildTree(startId)
  if (tree) {
    result.push(tree)
  }

  // 添加未连接的节点
  Object.keys(scriptStore.nodes).forEach(nodeId => {
    if (!visited.has(nodeId)) {
      const orphan = buildTree(nodeId)
      if (orphan) {
        result.push(orphan)
      }
    }
  })

  return result
})
</script>

<template>
  <div class="editor-view">
    <header class="editor-header">
      <h1>脚本编辑器</h1>
      <div class="header-actions">
        <router-link to="/" target="_blank" class="btn btn-link">显示窗口</router-link>
        <router-link to="/control" class="btn btn-link">控制面板</router-link>
        <button class="btn" @click="exportScript">导出</button>
        <button class="btn" @click="showImport">导入</button>
        <button class="btn btn-danger" @click="resetScript">重置</button>
      </div>
    </header>

    <div class="editor-toolbar">
      <div class="view-toggle">
        <button
          :class="['toggle-btn', { active: viewMode === 'list' }]"
          @click="viewMode = 'list'"
        >
          列表视图
        </button>
        <button
          :class="['toggle-btn', { active: viewMode === 'tree' }]"
          @click="viewMode = 'tree'"
        >
          树形视图
        </button>
      </div>
      <div class="search-box" v-if="viewMode === 'list'">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索节点..."
        />
      </div>
      <div class="toolbar-actions">
        <button class="btn btn-primary" @click="showAddNode">+ 新建节点</button>
        <button class="btn" @click="showAddCharacter">+ 新建角色</button>
      </div>
    </div>

    <main class="editor-main">
      <!-- 列表视图 -->
      <div class="list-view" v-if="viewMode === 'list'">
        <!-- 角色列表 -->
        <section class="section characters-section">
          <h2>角色 ({{ characterList.length }})</h2>
          <div class="character-list">
            <div
              v-for="char in characterList"
              :key="char.id"
              class="character-card"
              :class="{ editing: editingCharacterId === char.id }"
            >
              <div class="char-color" :style="{ backgroundColor: char.color }"></div>
              <div class="char-info">
                <strong>{{ char.name }}</strong>
                <span class="char-id">{{ char.id }}</span>
              </div>
              <div class="char-actions">
                <button class="btn-small" @click="editCharacter(char.id)">编辑</button>
                <button class="btn-small btn-danger" @click="deleteCharacter(char.id)">删除</button>
              </div>
            </div>
          </div>
        </section>

        <!-- 节点列表 -->
        <section class="section nodes-section">
          <h2>对话节点 ({{ filteredNodes.length }})</h2>
          <div class="node-list">
            <div
              v-for="node in filteredNodes"
              :key="node.id"
              class="node-card"
              :class="{
                editing: editingNodeId === node.id,
                'is-start': scriptStore.startNodeId === node.id
              }"
            >
              <div class="node-header">
                <span class="node-id">{{ node.id }}</span>
                <span
                  class="node-char"
                  :style="{ color: scriptStore.getCharacter(node.character)?.color }"
                >
                  {{ scriptStore.getCharacter(node.character)?.name || '未知' }}
                </span>
                <span class="start-badge" v-if="scriptStore.startNodeId === node.id">起始</span>
              </div>
              <div class="node-text">{{ node.text }}</div>
              <div class="node-meta">
                <span v-if="node.next">下一句: {{ node.next }}</span>
                <span v-if="node.choices">{{ node.choices.length }}个选项</span>
              </div>
              <div class="node-actions">
                <button class="btn-small" @click="editNode(node.id)">编辑</button>
                <button
                  class="btn-small"
                  @click="setAsStart(node.id)"
                  v-if="scriptStore.startNodeId !== node.id"
                >
                  设为起始
                </button>
                <button class="btn-small btn-danger" @click="deleteNode(node.id)">删除</button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- 树形视图 -->
      <div class="tree-view" v-else>
        <div class="tree-container">
          <template v-for="root in treeData" :key="root.id">
            <div class="tree-root">
              <TreeNode :node="root" @edit="editNode" />
            </div>
          </template>
        </div>
      </div>
    </main>

    <!-- 节点编辑面板 -->
    <aside class="edit-panel" v-if="editingNode">
      <h3>编辑节点: {{ editingNodeId }}</h3>
      <div class="form-group">
        <label>角色</label>
        <select v-model="editingNode.character">
          <option v-for="char in characterList" :key="char.id" :value="char.id">
            {{ char.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>对话文本</label>
        <textarea v-model="editingNode.text" rows="4"></textarea>
      </div>
      <div class="form-group" v-if="!editingNode.choices || editingNode.choices.length === 0">
        <label>下一个节点</label>
        <select v-model="editingNode.next">
          <option value="">无（结束）</option>
          <option
            v-for="node in scriptStore.nodeList"
            :key="node.id"
            :value="node.id"
            :disabled="node.id === editingNodeId"
          >
            {{ node.id }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>选项分支</label>
        <div class="choices-editor">
          <div v-for="(choice, index) in editingNode.choices" :key="index" class="choice-item">
            <input v-model="choice.text" placeholder="选项文本" />
            <select v-model="choice.goto">
              <option value="">选择目标节点</option>
              <option
                v-for="node in scriptStore.nodeList"
                :key="node.id"
                :value="node.id"
              >
                {{ node.id }}
              </option>
            </select>
            <button class="btn-small btn-danger" @click="removeChoice(index)">删除</button>
          </div>
          <button class="btn-small" @click="addChoice">+ 添加选项</button>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="saveNode">保存</button>
        <button class="btn" @click="cancelEditNode">取消</button>
      </div>
    </aside>

    <!-- 角色编辑面板 -->
    <aside class="edit-panel" v-if="editingCharacter">
      <h3>编辑角色: {{ editingCharacterId }}</h3>
      <div class="form-group">
        <label>名称</label>
        <input v-model="editingCharacter.name" />
      </div>
      <div class="form-group">
        <label>颜色</label>
        <input type="color" v-model="editingCharacter.color" />
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="saveCharacter">保存</button>
        <button class="btn" @click="cancelEditCharacter">取消</button>
      </div>
    </aside>

    <!-- 新建节点表单 -->
    <div class="modal" v-if="showNewNodeForm" @click.self="showNewNodeForm = false">
      <div class="modal-content">
        <h3>新建节点</h3>
        <div class="form-group">
          <label>节点ID</label>
          <input v-model="newNodeForm.id" />
        </div>
        <div class="form-group">
          <label>角色</label>
          <select v-model="newNodeForm.character">
            <option v-for="char in characterList" :key="char.id" :value="char.id">
              {{ char.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>对话文本</label>
          <textarea v-model="newNodeForm.text" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>下一个节点</label>
          <select v-model="newNodeForm.next">
            <option value="">无（结束）</option>
            <option v-for="node in scriptStore.nodeList" :key="node.id" :value="node.id">
              {{ node.id }}
            </option>
          </select>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="createNode">创建</button>
          <button class="btn" @click="showNewNodeForm = false">取消</button>
        </div>
      </div>
    </div>

    <!-- 新建角色表单 -->
    <div class="modal" v-if="showNewCharForm" @click.self="showNewCharForm = false">
      <div class="modal-content">
        <h3>新建角色</h3>
        <div class="form-group">
          <label>角色ID</label>
          <input v-model="newCharForm.id" />
        </div>
        <div class="form-group">
          <label>名称</label>
          <input v-model="newCharForm.name" />
        </div>
        <div class="form-group">
          <label>颜色</label>
          <input type="color" v-model="newCharForm.color" />
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="createCharacter">创建</button>
          <button class="btn" @click="showNewCharForm = false">取消</button>
        </div>
      </div>
    </div>

    <!-- 导入弹窗 -->
    <div class="modal" v-if="showImportModal" @click.self="showImportModal = false">
      <div class="modal-content modal-large">
        <h3>导入脚本</h3>
        <div class="form-group">
          <label>粘贴 JSON 脚本:</label>
          <textarea v-model="importText" rows="15" placeholder="粘贴脚本内容..."></textarea>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="doImport">导入</button>
          <button class="btn" @click="showImportModal = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- 树节点递归组件 -->
<script>
export default {
  name: 'EditorView'
}
</script>

<style scoped>
.editor-view {
  height: 100vh;
  background: #1a1a2e;
  color: #eee;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #16213e;
  border-bottom: 1px solid #0f3460;
}

.editor-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-link {
  color: #4da8da;
  text-decoration: none;
  padding: 8px 15px;
}

.btn-link:hover {
  text-decoration: underline;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #16213e;
  border-bottom: 1px solid #0f3460;
  gap: 20px;
  flex-wrap: wrap;
}

.view-toggle {
  display: flex;
  background: #0f3460;
  border-radius: 5px;
  overflow: hidden;
}

.toggle-btn {
  padding: 8px 20px;
  border: none;
  background: transparent;
  color: #aaa;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: #4da8da;
  color: #fff;
}

.search-box input {
  padding: 8px 15px;
  border: 1px solid #0f3460;
  border-radius: 5px;
  background: #1a1a2e;
  color: #eee;
  width: 250px;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  background: #0f3460;
  color: #fff;
}

.btn:hover {
  filter: brightness(1.2);
}

.btn-primary {
  background: #4da8da;
}

.btn-danger {
  background: #e74c3c;
}

.btn-small {
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  background: #0f3460;
  color: #fff;
}

.btn-small:hover {
  filter: brightness(1.2);
}

.btn-small.btn-danger {
  background: #e74c3c;
}

.editor-main {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

/* 列表视图 */
.list-view {
  max-width: 1200px;
  margin: 0 auto;
}

.section {
  margin-bottom: 30px;
}

.section h2 {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: #aaa;
}

.character-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.character-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #16213e;
  border-radius: 8px;
  border: 1px solid #0f3460;
}

.character-card.editing {
  border-color: #4da8da;
}

.char-color {
  width: 30px;
  height: 30px;
  border-radius: 50%;
}

.char-info {
  flex: 1;
}

.char-info strong {
  display: block;
}

.char-id {
  font-size: 12px;
  color: #888;
}

.char-actions {
  display: flex;
  gap: 5px;
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.node-card {
  padding: 15px;
  background: #16213e;
  border-radius: 8px;
  border: 1px solid #0f3460;
}

.node-card.editing {
  border-color: #4da8da;
}

.node-card.is-start {
  border-left: 3px solid #27ae60;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.node-id {
  font-family: monospace;
  background: #0f3460;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 13px;
}

.node-char {
  font-weight: bold;
}

.start-badge {
  background: #27ae60;
  color: #fff;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
}

.node-text {
  margin-bottom: 8px;
  line-height: 1.5;
}

.node-meta {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.node-meta span {
  margin-right: 15px;
}

.node-actions {
  display: flex;
  gap: 5px;
}

/* 树形视图 */
.tree-view {
  padding: 20px;
  overflow: auto;
}

.tree-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.tree-root {
  background: #16213e;
  border-radius: 8px;
  padding: 20px;
}

/* 编辑面板 */
.edit-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 400px;
  background: #16213e;
  border-left: 1px solid #0f3460;
  padding: 20px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: -5px 0 20px rgba(0,0,0,0.3);
}

.edit-panel h3 {
  margin: 0 0 20px 0;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #aaa;
  font-size: 13px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #0f3460;
  border-radius: 5px;
  background: #1a1a2e;
  color: #eee;
}

.form-group textarea {
  resize: vertical;
}

.choices-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.choice-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.choice-item input {
  flex: 1;
}

.choice-item select {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

/* 弹窗 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-content {
  background: #16213e;
  padding: 25px;
  border-radius: 10px;
  width: 400px;
  max-width: 90%;
}

.modal-content h3 {
  margin: 0 0 20px 0;
}

.modal-large {
  width: 600px;
}

.modal-large textarea {
  font-family: monospace;
  font-size: 12px;
}
</style>
