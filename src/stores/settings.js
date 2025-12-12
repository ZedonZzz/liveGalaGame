import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 预设绿幕颜色
export const GREEN_SCREEN_COLORS = {
  standard: { name: '标准绿', value: '#00FF00' },
  video: { name: '视频绿', value: '#00B140' },
  blue: { name: '蓝幕', value: '#0000FF' },
  magenta: { name: '品红', value: '#FF00FF' }
}

// 预设窗口尺寸
export const WINDOW_SIZES = {
  fullhd: { name: '全屏覆盖', width: 1920, height: 1080 },
  hd: { name: '画中画', width: 1280, height: 720 },
  small: { name: '小窗口', width: 800, height: 600 }
}

export const useSettingsStore = defineStore('settings', () => {
  // 绿幕模式开关
  const greenScreenEnabled = ref(loadSetting('greenScreenEnabled', false))

  // 绿幕颜色
  const greenScreenColor = ref(loadSetting('greenScreenColor', GREEN_SCREEN_COLORS.standard.value))

  // 透明背景模式
  const transparentBackground = ref(loadSetting('transparentBackground', false))

  // 窗口尺寸
  const windowWidth = ref(loadSetting('windowWidth', 1920))
  const windowHeight = ref(loadSetting('windowHeight', 1080))

  // 对话框样式
  const dialogStyle = ref(loadSetting('dialogStyle', {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderColor: '#ffffff',
    borderWidth: 2,
    borderRadius: 10,
    padding: 20
  }))

  // 文字样式
  const textStyle = ref(loadSetting('textStyle', {
    fontFamily: 'Microsoft YaHei, sans-serif',
    fontSize: 24,
    color: '#ffffff',
    lineHeight: 1.6,
    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
  }))

  // 角色名称栏样式
  const nameStyle = ref(loadSetting('nameStyle', {
    fontSize: 20,
    fontWeight: 'bold',
    padding: '5px 15px',
    borderRadius: 5
  }))

  // 选项按钮样式
  const choiceStyle = ref(loadSetting('choiceStyle', {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    hoverBackgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 5,
    padding: '10px 20px',
    fontSize: 18,
    color: '#ffffff'
  }))

  // 打字机速度 (ms)
  const typingSpeed = ref(loadSetting('typingSpeed', 50))

  // 从 localStorage 加载设置
  function loadSetting(key, defaultValue) {
    const saved = localStorage.getItem(`galgame-settings-${key}`)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return defaultValue
      }
    }
    return defaultValue
  }

  // 保存设置到 localStorage
  function saveSetting(key, value) {
    localStorage.setItem(`galgame-settings-${key}`, JSON.stringify(value))
  }

  // 计算背景样式
  const backgroundStyle = computed(() => {
    if (greenScreenEnabled.value) {
      return { backgroundColor: greenScreenColor.value }
    }
    if (transparentBackground.value) {
      return { backgroundColor: 'transparent' }
    }
    return { backgroundColor: '#000000' }
  })

  // 设置绿幕模式
  function setGreenScreen(enabled) {
    greenScreenEnabled.value = enabled
    saveSetting('greenScreenEnabled', enabled)
    if (enabled) {
      transparentBackground.value = false
      saveSetting('transparentBackground', false)
    }
  }

  // 设置绿幕颜色
  function setGreenScreenColor(color) {
    greenScreenColor.value = color
    saveSetting('greenScreenColor', color)
  }

  // 设置透明背景
  function setTransparentBackground(enabled) {
    transparentBackground.value = enabled
    saveSetting('transparentBackground', enabled)
    if (enabled) {
      greenScreenEnabled.value = false
      saveSetting('greenScreenEnabled', false)
    }
  }

  // 设置窗口尺寸
  function setWindowSize(width, height) {
    windowWidth.value = width
    windowHeight.value = height
    saveSetting('windowWidth', width)
    saveSetting('windowHeight', height)
  }

  // 更新对话框样式
  function updateDialogStyle(style) {
    dialogStyle.value = { ...dialogStyle.value, ...style }
    saveSetting('dialogStyle', dialogStyle.value)
  }

  // 更新文字样式
  function updateTextStyle(style) {
    textStyle.value = { ...textStyle.value, ...style }
    saveSetting('textStyle', textStyle.value)
  }

  // 更新角色名称样式
  function updateNameStyle(style) {
    nameStyle.value = { ...nameStyle.value, ...style }
    saveSetting('nameStyle', nameStyle.value)
  }

  // 更新选项样式
  function updateChoiceStyle(style) {
    choiceStyle.value = { ...choiceStyle.value, ...style }
    saveSetting('choiceStyle', choiceStyle.value)
  }

  // 设置打字速度
  function setTypingSpeed(speed) {
    typingSpeed.value = speed
    saveSetting('typingSpeed', speed)
  }

  // 重置所有设置
  function resetSettings() {
    greenScreenEnabled.value = false
    greenScreenColor.value = GREEN_SCREEN_COLORS.standard.value
    transparentBackground.value = false
    windowWidth.value = 1920
    windowHeight.value = 1080
    dialogStyle.value = {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#ffffff',
      borderWidth: 2,
      borderRadius: 10,
      padding: 20
    }
    textStyle.value = {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: 24,
      color: '#ffffff',
      lineHeight: 1.6,
      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
    }
    nameStyle.value = {
      fontSize: 20,
      fontWeight: 'bold',
      padding: '5px 15px',
      borderRadius: 5
    }
    choiceStyle.value = {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      hoverBackgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderColor: '#ffffff',
      borderWidth: 1,
      borderRadius: 5,
      padding: '10px 20px',
      fontSize: 18,
      color: '#ffffff'
    }
    typingSpeed.value = 50
    // 保存所有重置的值
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('galgame-settings-')) {
        localStorage.removeItem(key)
      }
    })
  }

  return {
    greenScreenEnabled,
    greenScreenColor,
    transparentBackground,
    windowWidth,
    windowHeight,
    dialogStyle,
    textStyle,
    nameStyle,
    choiceStyle,
    typingSpeed,
    backgroundStyle,
    setGreenScreen,
    setGreenScreenColor,
    setTransparentBackground,
    setWindowSize,
    updateDialogStyle,
    updateTextStyle,
    updateNameStyle,
    updateChoiceStyle,
    setTypingSpeed,
    resetSettings
  }
})
