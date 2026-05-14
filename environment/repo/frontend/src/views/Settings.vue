<template>
  <div class="space-y-6 animate-fade-in-up">
    <div>
      <h2 class="text-xl font-bold text-slate-800">系统运营参数与审计日志</h2>
      <p class="text-xs text-slate-400 mt-1">配置现代化温湿度自动监测预警阈值、市场公告广播并查阅系统完备过账操作流转日志</p>
    </div>

    <el-tabs v-model="activeTab" class="custom-tabs">
      <!-- Tab 1: System Settings -->
      <el-tab-pane label="⚙️ 核心基础参数配置" name="params">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Form Configs -->
          <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 class="text-base font-bold text-slate-800 mb-6">系统核心运营指标定义</h3>
            
            <el-form :model="settingsForm" ref="settingsFormRef" :rules="rules" label-position="top">
              <el-form-item label="管理系统平台运行名称" prop="system_name">
                <el-input v-model="settingsForm.system_name" :disabled="!isAdmin" placeholder="例如：恒丰现代农业管理系统" />
              </el-form-item>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <el-form-item label="常规大宗采购与运输业务时间段" prop="operating_hours">
                  <el-input v-model="settingsForm.operating_hours" :disabled="!isAdmin" placeholder="例如：08:00 - 18:00" />
                </el-form-item>

                <el-form-item label="常温储备库房最高安全温标 (C°)" prop="warehouse_temp_alarm">
                  <el-input-number v-model="settingsForm.warehouse_temp_alarm" :precision="1" :step="0.5" :disabled="!isAdmin" class="!w-full" />
                </el-form-item>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150 mb-5">
                <div class="col-span-1 md:col-span-2 mb-2">
                  <h4 class="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <span>❄️</span>
                    <span>智能低温恒温冷藏库警戒区间</span>
                  </h4>
                  <p class="text-[10px] text-slate-400 font-light mt-0.5">当冷库实时温标偏离此安全设定区间时，数据看板将自动触发报警警报</p>
                </div>
                
                <el-form-item label="最低冷藏标定区间" prop="cold_storage_temp_min">
                  <el-input-number v-model="settingsForm.cold_storage_temp_min" :precision="1" :step="0.5" :disabled="!isAdmin" class="!w-full" />
                </el-form-item>

                <el-form-item label="最高冷藏标定区间" prop="cold_storage_temp_max">
                  <el-input-number v-model="settingsForm.cold_storage_temp_max" :precision="1" :step="0.5" :disabled="!isAdmin" class="!w-full" />
                </el-form-item>
              </div>

              <el-form-item label="主页数据中心公告板广播内容" prop="system_announcement">
                <el-input v-model="settingsForm.system_announcement" type="textarea" :rows="4" :disabled="!isAdmin" placeholder="公告文字内容..." />
              </el-form-item>

              <div class="flex justify-end gap-3 mt-6" v-if="isAdmin">
                <el-button type="primary" :loading="submitLoading" class="bg-emerald-600 border-emerald-600 hover:bg-emerald-500 px-6" @click="saveSettings">
                  保存系统变更
                </el-button>
              </div>
            </el-form>
          </div>

          <!-- Quick Guidelines Card -->
          <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-fit">
            <h3 class="text-base font-bold text-slate-800 mb-4">操作使用指南 / 权限指示</h3>
            <div class="space-y-4 text-xs font-light text-slate-500 leading-relaxed">
              <div class="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100">
                <p class="font-semibold flex items-center gap-1.5 mb-1 text-sm">
                  <span>ℹ️</span>
                  <span>当前账户权限：{{ isAdmin ? '系统最高管理员' : '普通农业操作员' }}</span>
                </p>
                <p v-if="isAdmin">您拥有最高级运行配置参数编辑权，保存后相关参数以及冷链传感器监测规则将即时对全局生效。</p>
                <p v-else>您当前权限为只读，仅支持查阅当前系统的阈值。若需修改报警环境或公告广播，请联络系统管理员 (admin) 协助。</p>
              </div>

              <div>
                <p class="font-bold text-slate-700 mb-1">冷藏温标规则</p>
                <p>一般而言，水果库、果蔬保鲜库标准控制在 -1.0 °C 到 4.0 °C 之间即可，而肉类冷库一般要求在 -18.0 °C 以下。请严格遵循生产工艺设置警戒数值。</p>
              </div>

              <div>
                <p class="font-bold text-slate-700 mb-1">公告板推送</p>
                <p>管理员在此发布的公告板内容，操作员点击主页顶部的 <span class="font-bold">铃铛 🔔</span> 图标即刻便可浏览查阅最新通知广播。</p>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tab 2: Operational Logs -->
      <el-tab-pane label="📜 仓储全流程过账审计" name="logs" v-if="isAdmin">
        <el-card shadow="never" class="border-none !bg-white !p-0">
          <div class="flex items-center justify-between mb-4 px-4 pt-2">
            <div>
              <h3 class="text-sm font-bold text-slate-800">全量操作行为明细</h3>
              <p class="text-[10px] text-slate-400 mt-0.5">全天候不可篡改的系统关键数据库变更与登录请求轨迹</p>
            </div>
            <el-button type="primary" link :icon="Refresh" @click="loadLogs">刷新明细</el-button>
          </div>

          <el-table :data="logs" v-loading="logsLoading" style="width: 100%" class="custom-table" header-cell-class-name="bg-slate-50 text-slate-700 font-semibold text-xs border-b border-slate-100">
            <el-table-column prop="id" label="日志ID" width="85" align="center" />
            
            <el-table-column label="动作主客体" width="160">
              <template #default="{ row }">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold text-slate-700">{{ row.username }}</span>
                  <span class="text-[10px] text-slate-400 font-medium">({{ row.ip }})</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="action" label="操作事件类型" width="140" align="center">
              <template #default="{ row }">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="getActionTagClass(row.action)">
                  {{ row.action }}
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="details" label="日志详情快照" min-width="260" />

            <el-table-column label="操作戳记" width="160" align="center">
              <template #default="{ row }">
                <span class="font-mono text-xs text-slate-400">{{ formatTimestamp(row.createdAt) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import api from '../utils/api';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.isAdmin);

const activeTab = ref('params');

// Form Parameters State
const settingsForm = ref({
  system_name: '',
  operating_hours: '',
  cold_storage_temp_min: -2.0,
  cold_storage_temp_max: 4.0,
  warehouse_temp_alarm: 25.0,
  system_announcement: '',
});

const submitLoading = ref(false);

const rules = {
  system_name: [{ required: true, message: '系统平台名称不能为空', trigger: 'blur' }],
};

// Fetch global parameters
const loadSettings = async () => {
  try {
    const res = await api.get('/settings');
    const data = res.data;
    settingsForm.value = {
      system_name: data.system_name || '',
      operating_hours: data.operating_hours || '',
      cold_storage_temp_min: parseFloat(data.cold_storage_temp_min || '-2.0'),
      cold_storage_temp_max: parseFloat(data.cold_storage_temp_max || '4.0'),
      warehouse_temp_alarm: parseFloat(data.warehouse_temp_alarm || '25.0'),
      system_announcement: data.system_announcement || '',
    };
  } catch (err) {
    console.error(err);
  }
};

const saveSettings = () => {
  submitLoading.value = true;
  api.put('/settings', settingsForm.value)
    .then(() => {
      ElMessage.success('系统运营参数修改已全部生效！');
      loadSettings();
    })
    .catch(() => {})
    .finally(() => {
      submitLoading.value = false;
    });
};

// Audit Logs State
const logs = ref([]);
const logsLoading = ref(false);

const loadLogs = async () => {
  if (!isAdmin.value) return;
  logsLoading.value = true;
  try {
    const res = await api.get('/settings/logs');
    logs.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    logsLoading.value = false;
  }
};

const getActionTagClass = (act) => {
  const classes = {
    '登录系统': 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    '入库农产品': 'bg-sky-50 text-sky-700 border border-sky-100',
    '编辑农产品': 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    '库存变动': 'bg-amber-50 text-amber-700 border border-amber-100',
    '创建上架': 'bg-teal-50 text-teal-700 border border-teal-100',
    '产品上架': 'bg-green-50 text-green-700 border border-green-100',
    '下架产品': 'bg-rose-50 text-rose-700 border border-rose-100',
    '修改系统设置': 'bg-slate-100 text-slate-700 border border-slate-200',
  };
  return classes[act] || 'bg-slate-50 text-slate-600 border border-slate-100';
};

const formatTimestamp = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
};

onMounted(() => {
  loadSettings();
  if (isAdmin.value) {
    loadLogs();
  }
});
</script>

<style scoped>
/* Tabs styles */
</style>
