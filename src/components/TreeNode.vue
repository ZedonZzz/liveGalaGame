<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit'])

function handleEdit() {
  emit('edit', props.node.id)
}
</script>

<template>
  <div class="tree-node">
    <div class="node-content" @click="handleEdit">
      <span class="node-id">[{{ node.id }}]</span>
      <span class="node-char" :style="{ color: node.characterColor }">
        {{ node.characterName }}:
      </span>
      <span class="node-text">"{{ node.text.slice(0, 30) }}{{ node.text.length > 30 ? '...' : '' }}"</span>
    </div>
    <div class="node-children" v-if="node.children && node.children.length > 0">
      <div
        v-for="(child, index) in node.children"
        :key="index"
        class="child-branch"
        :class="child.type"
      >
        <div class="branch-line">
          <span class="branch-label" v-if="child.type === 'choice'">
            「{{ child.label }}」
          </span>
          <span class="branch-arrow">→</span>
        </div>
        <TreeNode :node="child.node" @edit="emit('edit', $event)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tree-node {
  margin-left: 20px;
}

.tree-node:first-child {
  margin-left: 0;
}

.node-content {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #1a1a2e;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #0f3460;
}

.node-content:hover {
  border-color: #4da8da;
  background: #0f3460;
}

.node-id {
  font-family: monospace;
  color: #888;
  font-size: 12px;
}

.node-char {
  font-weight: bold;
}

.node-text {
  color: #ccc;
}

.node-children {
  margin-top: 10px;
  padding-left: 20px;
  border-left: 2px solid #0f3460;
}

.child-branch {
  margin: 15px 0;
}

.branch-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
  margin-left: -22px;
  padding-left: 20px;
}

.branch-label {
  color: #4da8da;
  font-size: 13px;
}

.branch-arrow {
  color: #666;
}

.child-branch.choice .node-children {
  border-color: #4da8da;
}
</style>
