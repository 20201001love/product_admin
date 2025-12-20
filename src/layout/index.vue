<template>
  <div :class="classObj" class="app-wrapper" :style="{ '--current-color': theme }">
    <div v-if="device === 'mobile' && sidebar.opened" class="drawer-bg" @click="handleClickOutside" />

    <div class="logo-header" style="background-color: #6DB5FF">
      <!-- logo区域 -->
      <div class="logo-container">
        <img :src="logo" class="logo-img" />
        <span class="logo-title" style="color: #fff">{{ title }}</span>
      </div>
      <!-- 导航栏区域 -->
      <div class="header-navbar">
        <!-- 折叠按钮 -->
        <hamburger id="hamburger-container" :is-active="appStore.sidebar.opened" class="hamburger-container"
          @toggleClick="toggleSideBar" />
        <!-- 面包屑导航 -->
        <breadcrumb v-if="!settingsStore.topNav" id="breadcrumb-container" class="breadcrumb-container" />
        <!-- 顶部导航 -->
        <top-nav v-if="settingsStore.topNav" id="topmenu-container" class="topmenu-container" />
        <!-- 右侧菜单 -->
        <div class="right-menu">
          <template v-if="appStore.device !== 'mobile'">
            <!-- 欢迎语 -->
            <div class="welcome-container right-menu-item">
              <span>您好, {{ userName }}</span>
            </div>
            <!-- 注销按钮 -->
            <el-button type="text" @click="logout" class="right-menu-item logout-btn">
              <svg-icon icon-class="logout" style="font-size: 15px" class-name='custom-class' />
              <el-link type="primary">注销</el-link>
            </el-button>
            <!-- 搜索框 -->
            <header-search id="header-search" class="right-menu-item hover-effect" />
            <!-- 全屏按钮 -->
            <screenfull id="screenfull" class="right-menu-item hover-effect" />
            <!-- 主题模式 -->
            <el-tooltip content="主题模式" effect="dark" placement="bottom">
              <div class="right-menu-item hover-effect theme-switch-wrapper" @click="toggleTheme">
                <svg-icon v-if="settingsStore.isDark" icon-class="sunny" />
                <svg-icon v-if="!settingsStore.isDark" icon-class="moon" />
              </div>
            </el-tooltip>

            <!-- 布局大小 -->
            <el-tooltip content="布局大小" effect="dark" placement="bottom">
              <size-select id="size-select" class="right-menu-item hover-effect" />
            </el-tooltip>
          </template>
          <!-- 用户头像 -->
          <div class="avatar-container">
            <el-dropdown @command="handleCommand" class="right-menu-item hover-effect" trigger="click">
              <div class="avatar-wrapper">
                <img :src="userStore.avatar" class="user-avatar" />
                <el-icon><caret-bottom /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <!-- 个人中心 -->
                  <router-link to="/user/profile">
                    <el-dropdown-item>个人中心</el-dropdown-item>
                  </router-link>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>

    <!-- 侧边栏 -->
    <sidebar v-if="!sidebar.hide" class="sidebar-container" />
    <!-- 主容器 -->
    <div :class="{ hasTagsView: needTagsView, sidebarHide: sidebar.hide }" class="main-containers">
      <div :class="{ 'fixed-header': false }">
        <!-- 顶部导航 -->
        <navbar @setLayout="setLayout" />
        <tags-view v-if="needTagsView" />
      </div>
      <!-- 主内容区域 -->
      <app-main />
      <settings ref="settingRef" />
    </div>
  </div>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import Sidebar from './components/Sidebar/index.vue'
import { AppMain, Settings, TagsView } from './components'
import Breadcrumb from '@/components/Breadcrumb'
import TopNav from '@/components/TopNav'
import Hamburger from '@/components/Hamburger'
import Screenfull from '@/components/Screenfull'
import SizeSelect from '@/components/SizeSelect'
import HeaderSearch from '@/components/HeaderSearch'
import logo from '@/assets/logo/logo.png'
import { ElMessageBox } from 'element-plus'
import useAppStore from '@/stores/modules/app'
import useUserStore from '@/stores/modules/user'
import useSettingsStore from '@/stores/modules/settings'
import { getUser } from "@/api/system/user.js";

const title = import.meta.env.VITE_APP_TITLE
const appStore = useAppStore()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const userName = ref(null)

const getList = () => {
  getUser(userStore.id).then(res => {
    userName.value = res.data.userName
  })
}

function toggleSideBar() {
  appStore.toggleSideBar()
}

function handleCommand(command) {
  switch (command) {
    case "setLayout":
      setLayout()
      break
    case "logout":
      logout()
      break
    default:
      break
  }
}

function logout() {
  ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logOut().then(() => {
      location.href = '/index'
    })
  }).catch(() => { })
}

const emits = defineEmits(['setLayout'])
function setLayout() {
  emits('setLayout')
}

// 切换主题模式
function toggleTheme() {
  settingsStore.toggleTheme()
}

const sidebar = computed(() => appStore.sidebar)
const device = computed(() => appStore.device)
const needTagsView = computed(() => settingsStore.tagsView)
const fixedHeader = computed(() => settingsStore.fixedHeader)
const theme = computed(() => settingsStore.theme)
const sideTheme = computed(() => settingsStore.sideTheme)

const classObj = computed(() => ({
  hideSidebar: !sidebar.value.opened,
  openSidebar: sidebar.value.opened,
  withoutAnimation: sidebar.value.withoutAnimation,
  mobile: device.value === 'mobile'
}))

const { width, height } = useWindowSize()
const WIDTH = 992 // refer to Bootstrap's responsive design

watch(() => device.value, () => {
  if (device.value === 'mobile' && sidebar.value.opened) {
    appStore.closeSideBar({ withoutAnimation: false })
  }
})

watchEffect(() => {
  if (width.value - 1 < WIDTH) {
    appStore.toggleDevice('mobile')
    appStore.closeSideBar({ withoutAnimation: true })
  } else {
    appStore.toggleDevice('desktop')
  }
})

function handleClickOutside() {
  appStore.closeSideBar({ withoutAnimation: false })
}

const settingRef = ref(null)

getList()
</script>

<style lang="scss" scoped>
@use "@/assets/styles/mixin.scss" as *;
@use "@/assets/styles/variables.module.scss" as *;

.app-wrapper {
  @include clearfix;
  position: relative;
  height: 100vh; // 改为100vh确保占满整个视口高度
  width: 100%;
  transition: all 0.3s ease;

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

.logo-header {
  height: 50px;
  background: var(--navbar-bg);
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 11; // 确保logo在最上层

  .logo-container {
    display: flex;
    align-items: center;

    .logo-img {
      width: 40px;
      height: 40px;
      vertical-align: middle;
      margin-right: 12px;
      border-radius: 4px;
    }

    .logo-title {
      color: var(--navbar-text);
      font-weight: 600;
      font-size: 25px;
      white-space: nowrap;
    }
  }

  .header-navbar {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    margin-left: 20px;

    .hamburger-container {
      line-height: 46px;
      height: 100%;
      cursor: pointer;
      transition: background 0.3s;
      -webkit-tap-highlight-color: transparent;
      margin-right: 20px;
      border-radius: 6px;
      padding: 0 8px;

      &:hover {
        background: rgba(0, 0, 0, 0.025);
      }
    }

    .breadcrumb-container {
      flex: 1;
      height: 100%;
      display: flex;
      align-items: center;
    }

    .topmenu-container {
      flex: 1;
      height: 100%;
      position: static;
      margin-left: 20px;
    }

    .right-menu {
      height: 100%;
      display: flex;
      align-items: center;

      &:focus {
        outline: none;
      }

      .right-menu-item {
        display: flex;
        align-items: center;
        padding: 6px 10px;
        height: 36px;
        font-size: 16px;
        color: var(--navbar-text);
        vertical-align: text-bottom;
        border-radius: 6px;
        margin: 0 2px;
        transition: all 0.3s ease;
        position: relative;

        &.hover-effect {
          cursor: pointer;

          &:hover {
            background: rgba(0, 0, 0, 0.05);
            transform: translateY(-1px);
          }
        }

        &.theme-switch-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          padding: 0;
          border-radius: 50%;

          svg {
            transition: all 0.3s ease;
            font-size: 18px;

            &:hover {
              transform: scale(1.15) rotate(10deg);
            }
          }
        }
      }

      .welcome-container {
        font-size: 14px;
        padding: 0 12px;
        background: linear-gradient(90deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
        border-radius: 18px;
        margin-right: 8px;
        font-weight: 500;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .logout-btn {
        padding: 6px 12px;
        border-radius: 18px;
        margin: 0 8px;
        background: linear-gradient(90deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
        border: 1px solid var(--el-color-primary-light-5);
        transition: all 0.3s ease;

        &:hover {
          background: linear-gradient(90deg, var(--el-color-primary-light-8), var(--el-color-primary-light-7));
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        :deep(.el-link) {
          font-size: 14px;
          font-weight: 500;
        }
      }

      .avatar-container {
        margin-left: 15px;
        margin-right: 10px;

        .avatar-wrapper {
          display: flex;
          align-items: center;
          position: relative;
          cursor: pointer;
          padding: 2px;

          .user-avatar {
            cursor: pointer;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #fff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;

            &:hover {
              transform: scale(1.05);
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            }
          }

          i {
            cursor: pointer;
            position: absolute;
            right: -10px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 12px;
            color: #999;
            transition: all 0.3s ease;
          }

          &:hover {
            i {
              color: var(--el-color-primary);
              right: -8px;
            }
          }
        }
      }
    }
  }
}

.drawer-bg {
  background: #000;
  opacity: 0.3;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

.main-containers {
  min-height: calc(100vh - 50px); // 减去顶部logo区域的高度
  transition: margin-left .28s;
  margin-left: $base-sidebar-width;
  position: relative;
  top: 50px; // 使用top而不是margin-top来定位，避免增加整体高度
  box-shadow: none;
}

.hideSidebar .main-containers {
  margin-left: 54px;
}

.sidebarHide .main-containers {
  margin-left: 0;
}

.mobile .main-containers {
  margin-left: 0;
  top: 50px;
  box-shadow: none;
}
</style>
