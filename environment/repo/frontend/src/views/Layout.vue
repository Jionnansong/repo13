<template>
  <el-container class="min-h-screen bg-slate-50">
    <!-- Sidebar -->
    <el-aside width="260px" class="hidden md:flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 relative z-30 shadow-xl">
      <!-- Sidebar Header Branding -->
      <div class="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl shadow-inner shadow-emerald-500/30">
          🌾
        </div>
        <div>
          <h1 class="text-base font-bold text-white tracking-wide leading-tight">恒丰现代农业</h1>
          <p class="text-[10px] text-emerald-400 font-medium tracking-wider uppercase">Products System</p>
        </div>
      </div>

      <!-- Navigation Menu -->
      <div class="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          v-show="!item.adminOnly || isAdmin"
          class="flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-300 group font-medium"
          :class="isRouteActive(item.path) 
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50 hover:translate-x-1'"
        >
          <el-icon class="text-lg transition-transform group-hover:scale-110">
            <component :is="item.icon" />
          </el-icon>
          <span class="text-sm tracking-wide">{{ item.label }}</span>
        </router-link>
      </div>

      <!-- Sidebar Footer User Profile Card -->
      <div class="p-4 border-t border-slate-800 bg-slate-950/40">
        <div class="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30">
          <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center font-bold text-white text-sm shadow">
            {{ userInitials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-white truncate">{{ authStore.currentUser?.realName }}</p>
            <p class="text-xs text-slate-500 truncate capitalize">{{ authStore.currentUser?.role === 'admin' ? '系统管理员' : '农业操作员' }}</p>
          </div>
        </div>
      </div>
    </el-aside>

    <!-- Main Container -->
    <el-container class="flex-1 flex flex-col min-w-0">
      <!-- Header -->
      <el-header class="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shadow-sm relative z-20">
        <!-- Breadcrumb & Collapse Button -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1.5 text-slate-500 text-sm">
            <el-icon class="text-slate-400 text-base"><Location /></el-icon>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentRouteLabel }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
        </div>

        <!-- Header Actions -->
        <div class="flex items-center gap-4">
          <!-- Notification Alert -->
          <el-tooltip content="系统公告" placement="bottom">
            <div class="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer relative" @click="showNotice">
              <el-icon class="text-lg animate-pulse"><Bell /></el-icon>
              <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            </div>
          </el-tooltip>

          <!-- User dropdown -->
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 py-1.5 px-3 rounded-lg transition">
              <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                {{ userInitials }}
              </div>
              <div class="hidden sm:block text-left">
                <p class="text-sm font-semibold text-slate-700 leading-none mb-0.5">{{ authStore.currentUser?.realName }}</p>
                <p class="text-[10px] text-slate-400 font-medium tracking-wider uppercase leading-none">{{ authStore.currentUser?.username }}</p>
              </div>
              <el-icon class="text-slate-400 text-xs hidden sm:block"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="w-48">
                <div class="px-4 py-2 border-b border-slate-100 mb-1">
                  <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">当前账号</p>
                  <p class="text-sm font-bold text-slate-700 truncate mt-0.5">{{ authStore.currentUser?.realName }}</p>
                </div>
                <el-dropdown-item command="password">
                  <el-icon><Lock /></el-icon>修改密码
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided class="text-rose-600 hover:text-rose-600 hover:bg-rose-50">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- Content Area -->
      <el-main class="flex-1 p-6 md:p-8 overflow-y-auto">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <!-- Password Modal -->
    <el-dialog
      v-model="passwordDialog"
      title="修改登录密码"
      width="420px"
      align-center
      class="rounded-xl"
    >
      <el-form :model="passwordForm" ref="passwordFormRef" :rules="passwordRules" label-position="top">
        <el-form-item label="当前登录密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入当前密码" />
        </el-form-item>
        <el-form-item label="设置新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入至少 6 位的新密码" />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-3 mt-4">
          <el-button @click="passwordDialog = false">取消</el-button>
          <el-button type="primary" :loading="passwordLoading" class="bg-emerald-600 border-emerald-600 hover:bg-emerald-500" @click="submitPassword">确认修改</el-button>
        </div>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../utils/api';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isAdmin = computed(() => authStore.isAdmin);

const userInitials = computed(() => {
  const name = authStore.currentUser?.realName || 'User';
  return name.charAt(0);
});

const isRouteActive = (path) => {
  return route.path.startsWith(path);
};

const menuItems = [
  { path: '/dashboard', label: '智能数据面板', icon: 'DataLine' },
  { path: '/products', label: '农产品库存管理', icon: 'Box' },
  { path: '/listings', label: '产品上架管理', icon: 'Sell' },
  { path: '/accounts', label: '系统账号管理', icon: 'UserFilled', adminOnly: true },
  { path: '/settings', label: '系统参数配置', icon: 'Setting' },
];

const currentRouteLabel = computed(() => {
  const matched = menuItems.find(item => route.path.startsWith(item.path));
  return matched ? matched.label : '数据监控';
});

// Notice notification
const showNotice = async () => {
  try {
    const res = await api.get('/settings');
    const systemAnnouncement = res.data.system_announcement || '欢迎使用现代农产品管理系统！';
    ElMessageBox.alert(systemAnnouncement, '系统公告 / 通知广播', {
      confirmButtonText: '我知道了',
      type: 'info',
      customClass: 'rounded-xl',
      confirmButtonClass: 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500'
    });
  } catch (err) {
    ElMessage.error('加载系统公告失败');
  }
};

// Handle Dropdown actions
const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('您确定要安全退出恒丰现代农业管理系统吗？', '系统登出提示', {
      confirmButtonText: '确认退出',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'bg-rose-600 border-rose-600 text-white hover:bg-rose-500',
      customClass: 'rounded-xl'
    }).then(() => {
      authStore.logout();
      router.push('/login');
      ElMessage.success('您已成功安全登出系统');
    }).catch(() => {});
  } else if (command === 'password') {
    resetPasswordForm();
    passwordDialog.value = true;
  }
};

// Password Change Setup
const passwordDialog = ref(false);
const passwordLoading = ref(false);
const passwordFormRef = ref(null);
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const validateConfirm = (rule, value, callback) => {
  if (value !== passwordForm.value.newPassword) {
    callback(new Error('两次输入的新密码不一致'));
  } else {
    callback();
  }
};

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码长度至少为 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
};

const resetPasswordForm = () => {
  passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  if (passwordFormRef.value) passwordFormRef.value.resetFields();
};

const submitPassword = () => {
  passwordFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    passwordLoading.value = true;
    try {
      await api.post('/auth/change-password', {
        oldPassword: passwordForm.value.oldPassword,
        newPassword: passwordForm.value.newPassword
      });
      ElMessage.success('登录密码修改成功，请妥善保管新密码！');
      passwordDialog.value = false;
    } catch (err) {
      // Axios interceptor logs details
    } finally {
      passwordLoading.value = false;
    }
  });
};
</script>

<style scoped>
/* Page transition effects */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
