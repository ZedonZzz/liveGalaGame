import { createRouter, createWebHistory } from 'vue-router'
import DisplayView from '../views/DisplayView.vue'
import ControlView from '../views/ControlView.vue'
import EditorView from '../views/EditorView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'display',
      component: DisplayView,
      meta: { title: 'LiveGalaGame - 显示窗口' },
    },
    {
      path: '/control',
      name: 'control',
      component: ControlView,
      meta: { title: 'LiveGalaGame - 控制面板' },
    },
    {
      path: '/editor',
      name: 'editor',
      component: EditorView,
      meta: { title: 'LiveGalaGame - 脚本编辑器' },
    },
  ],
})

// 更新页面标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'LiveGalaGame'
  next()
})

export default router
