<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-banner">
        <div class="banner-content">
          <h2 class="banner-title">{{ title }}</h2>
        </div>
      </div>

      <div class="login-form">
        <div class="form-header">
          <h3 class="title">管理员登录</h3>
          <p class="subtitle">请输入您的登录信息</p>
        </div>

        <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="form-content">
          <el-form-item prop="username">
            <el-input v-model="loginForm.username" type="text" size="large" auto-complete="off" placeholder="请输入用户名">
              <template #prefix>
                <svg-icon icon-class="user" class="el-input__icon input-icon" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input v-model="loginForm.password" type="password" size="large" auto-complete="off" placeholder="请输入密码"
              @keyup.enter="handleLogin">
              <template #prefix>
                <svg-icon icon-class="password" class="el-input__icon input-icon" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="code" v-if="captchaEnabled">
            <el-row :gutter="15">
              <el-col :span="14">
                <el-input v-model="loginForm.code" size="large" auto-complete="off" placeholder="请输入验证码"
                  @keyup.enter="handleLogin">
                  <template #prefix>
                    <svg-icon icon-class="validCode" class="el-input__icon input-icon" />
                  </template>
                </el-input>
              </el-col>
              <el-col :span="10">
                <div class="login-code">
                  <img :src="codeUrl" @click="getCode" class="login-code-img" alt="验证码" />
                </div>
              </el-col>
            </el-row>
          </el-form-item>

          <el-form-item>
            <el-row>
              <el-col :span="12">
                <el-checkbox v-model="loginForm.rememberMe">记住密码</el-checkbox>
              </el-col>
            </el-row>
          </el-form-item>

          <el-form-item style="width:100%;">
            <el-button :loading="loading" size="large" type="primary" style="width:100%;" @click.prevent="handleLogin">
              <span v-if="!loading">登录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>

          <div class="register-link" v-if="register">
            还没有账户？
            <router-link class="link-type" :to="'/register'">立即注册</router-link>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 登录页面组件
 * 功能：用户登录、记住密码、验证码验证
 */

// ==================== 导入依赖 ====================
// 获取验证码图片的 API 接口
import { getCodeImg } from "@/api/login"
// Cookie 操作库，用于存储和读取用户信息
import Cookies from "js-cookie"
// RSA 加密解密工具，用于加密存储的密码
import { encrypt, decrypt } from "@/utils/jsencrypt"
// Pinia 用户状态管理 store
import useUserStore from '@/stores/modules/user'

// ==================== 初始化变量 ====================
// 从环境变量中获取应用标题
const title = import.meta.env.VITE_APP_TITLE
// 获取用户状态管理实例
const userStore = useUserStore()
// 获取当前路由对象（用于读取路由参数）
const route = useRoute()
// 获取路由导航对象（用于页面跳转）
const router = useRouter()
// 获取组件实例的代理对象（用于访问 refs）
const { proxy } = getCurrentInstance()

// ==================== 表单数据 ====================
/**
 * 登录表单数据
 * - username: 用户名
 * - password: 密码
 * - rememberMe: 是否记住密码（复选框状态）
 * - code: 验证码
 * - uuid: 验证码的唯一标识符（用于后端验证）
 */
const loginForm = ref({
  username: "",
  password: "",
  rememberMe: false,
  code: "",
  uuid: ""
})

// ==================== 表单验证规则 ====================
/**
 * Element Plus 表单验证规则
 * - username: 必填，失去焦点时触发验证
 * - password: 必填，失去焦点时触发验证
 * - code: 必填，值改变时触发验证（验证码输入时）
 */
const loginRules = {
  username: [{ required: true, trigger: "blur", message: "请输入您的账号" }],
  password: [{ required: true, trigger: "blur", message: "请输入您的密码" }],
  code: [{ required: true, trigger: "change", message: "请输入验证码" }]
}

// ==================== 响应式状态 ====================
// 验证码图片的 base64 数据 URL
const codeUrl = ref("")
// 登录按钮的加载状态（防止重复提交）
const loading = ref(false)
// 验证码功能开关（由后端接口返回，控制是否显示验证码）
const captchaEnabled = ref(false)
// 注册功能开关（控制是否显示注册链接）
const register = ref(false)
// 登录成功后的重定向路径（从路由 query 参数中获取）
const redirect = ref(undefined)

// ==================== 监听路由变化 ====================
/**
 * 监听路由变化，获取重定向路径
 * immediate: true 表示立即执行一次，用于初始化时获取 redirect 参数
 */
watch(route, (newRoute) => {
  redirect.value = newRoute.query && newRoute.query.redirect
}, { immediate: true })

// ==================== 登录处理函数 ====================
/**
 * 处理用户登录
 * 1. 验证表单数据
 * 2. 根据"记住密码"选项保存或清除 Cookie
 * 3. 调用登录接口
 * 4. 登录成功后跳转到目标页面或首页
 * 5. 登录失败后重新获取验证码
 */
function handleLogin() {
  // 使用 Element Plus 的表单验证
  proxy.$refs.loginRef.validate(valid => {
    // 表单验证通过
    if (valid) {
      // 设置加载状态，禁用登录按钮
      loading.value = true

      // 如果用户勾选了"记住密码"
      if (loginForm.value.rememberMe) {
        // 将用户名、加密后的密码、记住密码状态保存到 Cookie
        // expires: 30 表示 Cookie 30 天后过期
        Cookies.set("username", loginForm.value.username, { expires: 30 })
        // 密码使用 RSA 加密后存储，提高安全性
        Cookies.set("password", encrypt(loginForm.value.password), { expires: 30 })
        Cookies.set("rememberMe", loginForm.value.rememberMe, { expires: 30 })
      } else {
        // 如果未勾选"记住密码"，清除之前保存的 Cookie
        Cookies.remove("username")
        Cookies.remove("password")
        Cookies.remove("rememberMe")
      }


      console.log(loginForm.value)

      // 调用 Pinia store 中的登录方法
      userStore.login(loginForm.value).then(() => {
        // 登录成功
        // 获取当前路由的所有 query 参数
        const query = route.query
        // 过滤掉 redirect 参数，保留其他参数（用于登录后跳转时携带）
        const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
          if (cur !== "redirect") {
            acc[cur] = query[cur]
          }
          return acc
        }, {})
        // 跳转到 redirect 指定的页面，如果没有则跳转到首页
        // 同时携带其他 query 参数
        router.push({ path: redirect.value || "/", query: otherQueryParams })
      }).catch(() => {
        // 登录失败
        // 取消加载状态，恢复登录按钮
        loading.value = false
        // 如果启用了验证码功能，登录失败后重新获取验证码
        // 防止验证码被重复使用
        if (captchaEnabled.value) {
          getCode()
        }
      })
    }
  })
}

// ==================== 获取验证码 ====================
/**
 * 从后端获取验证码图片
 * 1. 调用 API 获取验证码图片和 UUID
 * 2. 根据后端返回的配置决定是否启用验证码功能
 * 3. 将 base64 图片数据设置到 codeUrl
 * 4. 保存 UUID 用于后续验证码校验
 */
function getCode() {
  getCodeImg().then(res => {
    // 如果后端返回了 captchaEnabled 配置，使用该配置；否则默认为 true（启用验证码）
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled

    // 如果启用了验证码功能
    if (captchaEnabled.value) {
      // 将后端返回的 base64 图片数据转换为 data URL 格式
      // 格式：data:image/gif;base64,{base64数据}
      codeUrl.value = "data:image/gif;base64," + res.img
      // 保存验证码的唯一标识符，提交登录时需要一起发送给后端验证
      loginForm.value.uuid = res.uuid
    }
  })
}

// ==================== 读取 Cookie ====================
/**
 * 从 Cookie 中读取之前保存的用户名和密码
 * 用于实现"记住密码"功能，页面加载时自动填充表单
 * 如果 Cookie 中不存在，则使用表单的默认值
 */
function getCookie() {
  // 从 Cookie 中读取之前保存的值
  const username = Cookies.get("username")
  const password = Cookies.get("password")
  const rememberMe = Cookies.get("rememberMe")

  // 更新表单数据
  loginForm.value = {
    // 如果 Cookie 中有用户名，使用 Cookie 的值；否则保持表单默认值（空字符串）
    username: username === undefined ? loginForm.value.username : username,
    // 如果 Cookie 中有密码，解密后使用；否则保持表单默认值（空字符串）
    // 注意：存储时是加密的，读取时需要解密
    password: password === undefined ? loginForm.value.password : decrypt(password),
    // 如果 Cookie 中有记住密码状态，转换为布尔值；否则默认为 false
    rememberMe: rememberMe === undefined ? false : Boolean(rememberMe)
  }
}

// ==================== 组件挂载时执行 ====================
// 页面加载时立即获取验证码
getCode()
// 页面加载时读取 Cookie 中的用户信息（实现记住密码功能）
getCookie()
</script>

<style lang='scss' scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  min-height: 600px;
  background: url('@/assets/images/login-background.jpg') no-repeat center center;
  background-size: cover;
  position: relative;

  .login-box {
    display: flex;
    width: 900px;
    height: 500px;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
    overflow: hidden;

    .login-banner {
      flex: 1;
      background-color: #4e9af8;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;

      &::before {
        content: "";
        position: absolute;
        width: 300px;
        height: 300px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        top: -100px;
        right: -100px;
      }

      &::after {
        content: "";
        position: absolute;
        width: 200px;
        height: 200px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        bottom: -80px;
        left: -80px;
      }

      .banner-content {
        position: relative;
        z-index: 1;
        text-align: center;
        padding: 30px;

        .banner-title {
          font-size: 32px;
          font-weight: 600;
          margin-bottom: 15px;
          letter-spacing: 1px;
        }

        .banner-subtitle {
          font-size: 16px;
          opacity: 0.9;
        }
      }
    }

    .login-form {
      flex: 1;
      padding: 40px;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .form-header {
        text-align: center;
        margin-bottom: 30px;

        .title {
          font-size: 28px;
          font-weight: 600;
          color: #333;
          margin-bottom: 10px;
        }

        .subtitle {
          font-size: 14px;
          color: #999;
        }
      }

      .form-content {
        :deep(.el-form-item) {
          margin-bottom: 22px;
        }

        :deep(.el-input__inner) {
          height: 46px;
          line-height: 46px;
          padding-left: 40px;
          border-radius: 4px;
        }

        :deep(.input-icon) {
          height: 46px;
          width: 16px;
          margin-left: 12px;
        }

        :deep(.el-checkbox) {
          color: #666;
        }
      }

      .login-code {
        width: 100%;
        height: 46px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        border-radius: 4px;
        cursor: pointer;

        .login-code-img {
          max-width: 100%;
          max-height: 100%;
        }
      }

      .text-right {
        text-align: right;
      }

      .register-link {
        text-align: center;
        margin-top: 20px;
        color: #666;

        .link-type {
          color: #409eff;
          text-decoration: none;
          margin-left: 5px;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  }

  .login-footer {
    position: absolute;
    bottom: 20px;
    width: 100%;
    text-align: center;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
  }

  @media (max-width: 950px) {
    .login-box {
      width: 90%;
      max-width: 500px;

      .login-banner {
        display: none;
      }
    }
  }
}
</style>
