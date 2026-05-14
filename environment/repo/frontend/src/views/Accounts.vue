<template>
  <div class="space-y-6 animate-fade-in-up">
    <!-- Header Controls -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-slate-800">系统仓储账号管理</h2>
        <p class="text-xs text-slate-400 mt-1">管理享有该后台系统访问权限的农业操作员、冷链审核员与管理员账户</p>
      </div>
      <div class="flex items-center gap-3">
        <el-button type="success" :icon="Plus" class="bg-emerald-600 border-emerald-600 hover:bg-emerald-500 hover:border-emerald-500" @click="openAddDialog">
          添加系统新账户
        </el-button>
      </div>
    </div>

    <!-- Accounts Table -->
    <el-card shadow="never" class="border-none !bg-white !p-0">
      <el-table :data="accounts" v-loading="loading" style="width: 100%" class="custom-table" header-cell-class-name="bg-slate-50 text-slate-700 font-semibold text-xs border-b border-slate-100">
        <el-table-column prop="id" label="账户ID" width="80" align="center" />
        
        <el-table-column label="账户信息" min-width="180">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm border border-slate-200 shadow-inner">
                {{ row.realName?.charAt(0) }}
              </div>
              <div>
                <p class="font-bold text-slate-700 text-sm leading-tight">{{ row.realName }}</p>
                <p class="text-[10px] text-slate-400 font-mono mt-1">{{ row.username }}</p>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="系统角色" width="130" align="center">
          <template #default="{ row }">
            <span class="px-2.5 py-1 rounded text-xs font-semibold"
                  :class="row.role === 'admin' 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'">
              {{ row.role === 'admin' ? '系统管理员' : '农业操作员' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="phone" label="联系电话" width="140" align="center">
          <template #default="{ row }">
            <span class="font-mono text-xs text-slate-600">{{ row.phone || '未绑定' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="账户状态" width="120" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :disabled="row.username === 'admin'"
              style="--el-switch-on-color: #10b981; --el-switch-off-color: #cbd5e1"
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="注册开通时间" width="140" align="center">
          <template #default="{ row }">
            <span class="text-xs text-slate-400 font-mono">{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="管理维护" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-1.5" v-if="row.username !== 'admin'">
              <el-button size="small" type="primary" link :icon="Edit" @click="openEditDialog(row)">
                编辑
              </el-button>
              <el-button size="small" type="danger" link :icon="Delete" @click="deleteAccount(row)">
                删除
              </el-button>
            </div>
            <span v-else class="text-[10px] text-slate-400 font-medium">内置内置系统级账户保护</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Dialog: Add / Edit Account -->
    <el-dialog
      v-model="accountDialog"
      :title="isEdit ? '修改账户管理权限信息' : '创建后台系统新账户'"
      width="440px"
      align-center
      class="rounded-xl"
    >
      <el-form :model="accountForm" ref="accountFormRef" :rules="accountRules" label-position="top">
        <el-form-item label="登录账户名称" prop="username" v-if="!isEdit">
          <el-input v-model="accountForm.username" placeholder="请输入唯一英文字母登录名" />
        </el-form-item>

        <el-form-item label="账户登录密码" prop="password" :required="!isEdit">
          <el-input v-model="accountForm.password" type="password" show-password :placeholder="isEdit ? '留空则保持密码不变' : '请输入至少 6 位的登录密码'" />
        </el-form-item>

        <el-form-item label="使用者真实姓名" prop="realName">
          <el-input v-model="accountForm.realName" placeholder="例如：李小强" />
        </el-form-item>

        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="绑定手机号码" prop="phone">
            <el-input v-model="accountForm.phone" placeholder="请输入11位联系电话" />
          </el-form-item>

          <el-form-item label="角色授权" prop="role">
            <el-select v-model="accountForm.role" placeholder="赋予角色" class="w-full">
              <el-option label="系统管理员" value="admin" />
              <el-option label="农业操作员" value="staff" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-3 mt-2">
          <el-button @click="accountDialog = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" class="bg-emerald-600 border-emerald-600 hover:bg-emerald-500" @click="submitAccount">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../utils/api';

const loading = ref(false);
const accounts = ref([]);

// Fetch accounts list
const loadAccounts = async () => {
  loading.value = true;
  try {
    const res = await api.get('/auth/accounts');
    accounts.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Toggle status switch
const toggleStatus = async (row) => {
  try {
    await api.patch(`/auth/accounts/${row.id}/status`);
    ElMessage.success(`账户 "${row.realName}" 已${row.status ? '成功恢复启用' : '成功挂起禁用'}`);
  } catch (err) {
    row.status = !row.status; // Revert on failure
  }
};

// Add / Edit Configs
const accountDialog = ref(false);
const submitLoading = ref(false);
const isEdit = ref(false);
const accountFormRef = ref(null);
const accountForm = ref({
  username: '',
  password: '',
  realName: '',
  phone: '',
  role: 'staff',
});

const validatePass = (rule, value, callback) => {
  if (!isEdit.value && (!value || value.length < 6)) {
    callback(new Error('新账户登录密码不能少于 6 位'));
  } else if (isEdit.value && value && value.length < 6) {
    callback(new Error('登录密码长度不能少于 6 位'));
  } else {
    callback();
  }
};

const accountRules = {
  username: [{ required: true, message: '请填写登录用户名', trigger: 'blur' }],
  password: [{ validator: validatePass, trigger: 'blur' }],
  realName: [{ required: true, message: '请填写使用者真实姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请赋予对应角色', trigger: 'change' }],
};

const openAddDialog = () => {
  isEdit.value = false;
  accountForm.value = { username: '', password: '', realName: '', phone: '', role: 'staff' };
  accountDialog.value = true;
  if (accountFormRef.value) accountFormRef.value.resetFields();
};

const openEditDialog = (row) => {
  isEdit.value = true;
  accountForm.value = { ...row, password: '' }; // Keep password empty initially on edits
  accountDialog.value = true;
};

const submitAccount = () => {
  accountFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    submitLoading.value = true;
    try {
      if (isEdit.value) {
        await api.put(`/auth/accounts/${accountForm.value.id}`, accountForm.value);
        ElMessage.success('账户修改信息成功保存');
      } else {
        await api.post('/auth/accounts', accountForm.value);
        ElMessage.success('系统安全账户开通注册成功！');
      }
      accountDialog.value = false;
      loadAccounts();
    } catch (err) {
      // Axios
    } finally {
      submitLoading.value = false;
    }
  });
};

// Delete Account
const deleteAccount = (row) => {
  ElMessageBox.confirm(`您确定要永久注销删除账户 "${row.realName}" (${row.username}) 吗？注销后其名下全部操作流转日志将失去对应关系。`, '警告：彻底注销删除账户', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'error',
    confirmButtonClass: 'bg-rose-600 border-rose-600 text-white hover:bg-rose-500',
    customClass: 'rounded-xl'
  }).then(async () => {
    try {
      await api.delete(`/auth/accounts/${row.id}`);
      ElMessage.success('账户管理权限已被成功永久收回销毁');
      loadAccounts();
    } catch (err) {}
  }).catch(() => {});
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

onMounted(() => {
  loadAccounts();
});
</script>

<style scoped>
/* Scoped styles */
</style>
