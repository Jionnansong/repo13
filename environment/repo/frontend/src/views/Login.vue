<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-tr from-emerald-900 via-teal-900 to-slate-950 relative overflow-hidden px-4">
    <!-- Abstract nature background overlay objects -->
    <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl"></div>
    
    <!-- Animated particle style decorative leaves -->
    <div class="absolute top-1/4 left-1/4 text-emerald-400/20 text-4xl animate-bounce duration-1000">🌿</div>
    <div class="absolute bottom-1/4 right-1/4 text-teal-400/20 text-4xl animate-bounce duration-700">🌾</div>
    <div class="absolute top-1/3 right-1/5 text-lime-400/10 text-5xl rotate-12">🍎</div>
    <div class="absolute bottom-1/3 left-1/5 text-amber-400/10 text-4xl -rotate-12">🌽</div>

    <!-- Login Card Panel -->
    <div class="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 relative z-10 animate-fade-in-up">
      <!-- Header / Logo -->
      <div class="text-center mb-8">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-500/30 mb-4">
          🌾
        </div>
        <h2 class="text-2xl font-bold text-white tracking-wide">恒丰现代农业产品管理系统</h2>
        <p class="text-xs text-emerald-400 font-medium mt-1 tracking-wider uppercase">Enterprise Management System</p>
      </div>

      <!-- Login Form -->
      <el-form :model="loginForm" ref="formRef" :rules="rules" @submit.prevent="handleLogin" label-position="top">
        <el-form-item prop="username">
          <label class="text-xs font-semibold text-slate-300 mb-1.5 block">账户登录名</label>
          <el-input
            v-model="loginForm.username"
            placeholder="请输入管理员或职员用户名"
            prefix-icon="User"
            size="large"
            class="custom-login-input"
          />
        </el-form-item>

        <el-form-item prop="password">
          <label class="text-xs font-semibold text-slate-300 mb-1.5 block">安全登录密码</label>
          <el-input
            v-model="loginForm.password"
            type="password"
            show-password
            placeholder="请输入安全密码"
            prefix-icon="Lock"
            size="large"
            class="custom-login-input"
          />
        </el-form-item>

        <!-- Demo account helper button list -->
        <div class="mb-6">
          <p class="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2">测试快捷填入 (Demo Accounts)</p>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="quickFill('admin')"
              class="px-3 py-2 text-xs rounded-lg border border-slate-700 hover:border-emerald-500/50 bg-slate-800/40 hover:bg-emerald-950/20 text-slate-300 hover:text-emerald-400 transition flex items-center justify-center gap-1.5"
            >
              <span>👑</span>
              <span>系统管理员</span>
            </button>
            <button
              type="button"
              @click="quickFill('staff')"
              class="px-3 py-2 text-xs rounded-lg border border-slate-700 hover:border-emerald-500/50 bg-slate-800/40 hover:bg-emerald-950/20 text-slate-300 hover:text-emerald-400 transition flex items-center justify-center gap-1.5"
            >
              <span>🧑‍🌾</span>
              <span>农业操作员</span>
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 active:scale-[0.99] transition disabled:opacity-50 disabled:pointer-events-none mt-2"
        >
          <span v-if="!loading" class="tracking-widest">进入系统</span>
          <span v-else class="flex items-center justify-center gap-2">
            <el-icon class="animate-spin text-lg"><Loading /></el-icon>
            正在验证凭证...
          </span>
        </button>
      </el-form>
    </div>

    <!-- Page Footer -->
    <div class="absolute bottom-6 left-0 right-0 text-center z-10">
      <p class="text-xs text-slate-600 tracking-wide">© 2026 恒丰现代农业科技开发有限公司. All Rights Reserved.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { ElMessage } from 'element-plus';

const router = useRouter();
const authStore = useAuthStore();

const formRef = ref(null);
const loading = ref(false);

const loginForm = ref({
  username: '',
  password: '',
});

const rules = {
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入安全密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }
  ],
};

const quickFill = (role) => {
  if (role === 'admin') {
    loginForm.value.username = 'admin';
    loginForm.value.password = '123456';
  } else {
    loginForm.value.username = 'staff';
    loginForm.value.password = '123456';
  }
};

const handleLogin = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    loading.value = true;
    try {
      await authStore.login(loginForm.value.username, loginForm.value.password);
      ElMessage({
        message: '密码验证通过，欢迎进入系统！',
        type: 'success',
        duration: 2000,
      });
      router.push('/dashboard');
    } catch (error) {
      // API response interceptor takes care of logging, just silence
    } finally {
      loading.value = false;
    }
  });
};
</script>

<style scoped>
/* Custom style overrides to style element-plus inputs dark and glossy in the login container */
:deep(.custom-login-input .el-input__wrapper) {
  background-color: rgba(15, 23, 42, 0.4) !important;
  border: 1px solid rgba(71, 85, 105, 0.5) !important;
  box-shadow: none !important;
  padding: 8px 12px !important;
}

:deep(.custom-login-input .el-input__wrapper:hover),
:deep(.custom-login-input .el-input__wrapper.is-focus) {
  border-color: rgba(16, 185, 129, 0.7) !important;
  background-color: rgba(15, 23, 42, 0.6) !important;
}

:deep(.custom-login-input .el-input__inner) {
  color: #fff !important;
  font-size: 0.875rem !important;
}

:deep(.custom-login-input .el-input__inner::placeholder) {
  color: #64748b !important;
}

:deep(.custom-login-input .el-input__icon) {
  color: #64748b !important;
}
</style>
