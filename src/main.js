import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import TreeNode from './components/TreeNode.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 全局注册递归组件
app.component('TreeNode', TreeNode)

app.mount('#app')
