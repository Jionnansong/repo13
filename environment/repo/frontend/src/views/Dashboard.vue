<template>
  <div class="space-y-6 animate-fade-in-up">
    <!-- Welcome Header / Banner -->
    <div class="relative bg-gradient-to-r from-emerald-800 to-teal-700 rounded-2xl p-6 md:p-8 text-white overflow-hidden shadow-lg shadow-emerald-950/20">
      <!-- Decorative graphics -->
      <div class="absolute -right-10 -bottom-10 text-[180px] opacity-10 pointer-events-none select-none rotate-12">🌾</div>
      <div class="absolute top-4 right-8 text-[80px] opacity-5 pointer-events-none select-none">☀️</div>

      <div class="relative z-10 max-w-2xl">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-300 mb-4">
          <span class="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
          系统正常运行中
        </span>
        <h2 class="text-2xl md:text-3xl font-extrabold tracking-wide mb-2">
          您好，{{ authStore.currentUser?.realName }}！
        </h2>
        <p class="text-emerald-100/80 text-sm md:text-base font-light leading-relaxed">
          欢迎回到农产品管理系统。今天为您整理了最新的仓库物料库存统计、渠道上架状态及销售流向分析，请及时查阅。
        </p>
      </div>
    </div>

    <!-- Quick Stat Widgets Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- Total Sales -->
      <el-card shadow="hover" class="relative overflow-hidden border-none !bg-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">最近7天销售总额</p>
            <h3 class="text-2xl font-bold text-slate-800 mt-1.5">¥{{ stats.totalSales?.toLocaleString() }}</h3>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl text-amber-600 shadow-sm shadow-amber-500/10">
            🪙
          </div>
        </div>
        <div class="mt-4 flex items-center text-xs text-slate-500">
          <span class="text-emerald-500 font-bold mr-1">↑ 12.5%</span>
          <span>相比上周同期</span>
        </div>
      </el-card>

      <!-- Total Inventory -->
      <el-card shadow="hover" class="relative overflow-hidden border-none !bg-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">在库农产品总数</p>
            <h3 class="text-2xl font-bold text-slate-800 mt-1.5">{{ stats.totalStock?.toLocaleString() }} 件</h3>
          </div>
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl text-emerald-600 shadow-sm shadow-emerald-500/10">
            📦
          </div>
        </div>
        <div class="mt-4 flex items-center text-xs text-slate-500">
          <span>共录入 </span>
          <span class="font-bold text-emerald-600 px-1">{{ stats.totalProducts }}</span>
          <span>个物资品类</span>
        </div>
      </el-card>

      <!-- On-Shelf Rate -->
      <el-card shadow="hover" class="relative overflow-hidden border-none !bg-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">产品市场铺货率</p>
            <h3 class="text-2xl font-bold text-slate-800 mt-1.5">{{ stats.listingRate }}%</h3>
          </div>
          <div class="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-xl text-teal-600 shadow-sm shadow-teal-500/10">
            🛒
          </div>
        </div>
        <div class="mt-4 flex items-center text-xs text-slate-500">
          <span>当前上架 </span>
          <span class="font-bold text-teal-600 px-1">{{ stats.listedCount }}</span>
          <span>个售卖货架</span>
        </div>
      </el-card>

      <!-- Storage Temp -->
      <el-card shadow="hover" class="relative overflow-hidden border-none !bg-white" :class="isTempWarning ? '!bg-rose-50/30' : ''">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">智能冷库实时环境</p>
            <h3 class="text-2xl font-bold mt-1.5" :class="isTempWarning ? 'text-rose-600' : 'text-slate-800'">
              {{ stats.storageTemp?.toFixed(1) }} °C
            </h3>
          </div>
          <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm"
               :class="isTempWarning 
                 ? 'bg-rose-500/10 border border-rose-500/20 text-rose-600 shadow-rose-500/10 animate-bounce' 
                 : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 shadow-indigo-500/10'">
            🌡️
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between text-xs">
          <span class="text-slate-500">阈值: {{ stats.tempMin }} ~ {{ stats.tempMax }} °C</span>
          <span class="inline-flex items-center gap-1 font-bold" :class="isTempWarning ? 'text-rose-600' : 'text-emerald-600'">
            <span class="w-1.5 h-1.5 rounded-full" :class="isTempWarning ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'"></span>
            {{ isTempWarning ? '温度警告！' : '环境安全' }}
          </span>
        </div>
      </el-card>
    </div>

    <!-- Charts Area (ECharts) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Chart 1: Sales Trend (past 7 days) -->
      <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col min-h-[420px]">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h4 class="text-base font-bold text-slate-800">7日内农产品销售总额走势</h4>
            <p class="text-xs text-slate-400 mt-0.5">统计周期内各渠道每日销售业绩数据流向</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span class="text-xs font-semibold text-slate-500">总销售额 (元)</span>
          </div>
        </div>
        <!-- Chart DOM -->
        <div class="flex-1 w-full min-h-[300px]" ref="salesTrendChartRef"></div>
      </div>

      <!-- Chart 2: Category distribution -->
      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col min-h-[420px]">
        <div>
          <h4 class="text-base font-bold text-slate-800">物资库存分类占比</h4>
          <p class="text-xs text-slate-400 mt-0.5">当前在库储备农产品品类配比详情</p>
        </div>
        <!-- Chart DOM -->
        <div class="flex-1 w-full min-h-[300px]" ref="categoryDistributionChartRef"></div>
      </div>
    </div>

    <!-- Inventory Rank & System Operations Feed -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Top Stock Products Chart -->
      <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col min-h-[380px]">
        <div>
          <h4 class="text-base font-bold text-slate-800">库存最高产品榜单</h4>
          <p class="text-xs text-slate-400 mt-0.5">全仓重点物资储备量排行前六</p>
        </div>
        <!-- Chart DOM -->
        <div class="flex-1 w-full min-h-[260px]" ref="stockRankChartRef"></div>
      </div>

      <!-- Recent System Logs -->
      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col min-h-[380px]">
        <div class="mb-4">
          <h4 class="text-base font-bold text-slate-800">实时系统审计日志</h4>
          <p class="text-xs text-slate-400 mt-0.5">最新的后台仓储操作及登录行为记录</p>
        </div>
        
        <div class="flex-1 overflow-y-auto space-y-4 pr-1">
          <div v-for="log in stats.recentLogs" :key="log.id" class="flex gap-3 text-xs leading-normal">
            <div class="flex flex-col items-center">
              <div class="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px]">
                ⚙️
              </div>
              <div class="flex-1 w-px bg-slate-200 my-1"></div>
            </div>
            <div class="flex-1 bg-slate-50 hover:bg-slate-100/80 transition p-2.5 rounded-lg border border-slate-100">
              <div class="flex items-center justify-between font-semibold text-slate-600 mb-1">
                <span>{{ log.username }} - {{ log.action }}</span>
                <span class="text-[10px] text-slate-400 font-medium">{{ formatTime(log.createdAt) }}</span>
              </div>
              <p class="text-slate-500 font-light text-[11px]">{{ log.details }}</p>
            </div>
          </div>
          
          <div v-if="!stats.recentLogs || stats.recentLogs.length === 0" class="flex items-center justify-center h-full text-slate-400">
            暂无操作日志记录
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../utils/api';
import * as echarts from 'echarts';

const authStore = useAuthStore();

// Reactive Stats
const stats = ref({
  totalSales: 0,
  totalProducts: 0,
  totalStock: 0,
  totalListings: 0,
  listedCount: 0,
  listingRate: 0,
  storageTemp: 0,
  tempMin: -2.0,
  tempMax: 4.0,
  recentLogs: []
});

const isTempWarning = computed(() => {
  return stats.value.storageTemp < stats.value.tempMin || stats.value.storageTemp > stats.value.tempMax;
});

// Chart Element Refs
const salesTrendChartRef = ref(null);
const categoryDistributionChartRef = ref(null);
const stockRankChartRef = ref(null);

// Chart Instances
let salesChartInstance = null;
let categoryChartInstance = null;
let stockChartInstance = null;

// Load dashboard statistics
const loadStats = async () => {
  try {
    const res = await api.get('/dashboard/stats');
    stats.value = res.data;
  } catch (err) {
    console.error('Failed to load dashboard stats:', err);
  }
};

// Setup and draw ECharts
const initCharts = async () => {
  try {
    const res = await api.get('/dashboard/charts');
    const chartData = res.data;

    // 1. Line Chart: Sales Trend
    if (salesTrendChartRef.value) {
      salesChartInstance = echarts.init(salesTrendChartRef.value);
      salesChartInstance.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross', label: { backgroundColor: '#10b981' } }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: chartData.salesTrend.labels,
          axisLine: { lineStyle: { color: '#e2e8f0' } },
          axisLabel: { color: '#64748b' }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#e2e8f0' } },
          axisLabel: { color: '#64748b' },
          splitLine: { lineStyle: { color: '#f1f5f9' } }
        },
        series: [
          {
            name: '销售额',
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            sampling: 'average',
            itemStyle: { color: '#10b981' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0)' }
              ])
            },
            data: chartData.salesTrend.data
          }
        ]
      });
    }

    // 2. Pie/Doughnut Chart: Category Distribution
    if (categoryDistributionChartRef.value) {
      categoryChartInstance = echarts.init(categoryDistributionChartRef.value);
      categoryChartInstance.setOption({
        tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c}个 ({d}%)' },
        legend: { bottom: '5%', left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { color: '#64748b' } },
        series: [
          {
            name: '农产品类别',
            type: 'pie',
            radius: ['45%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: {
              label: { show: true, fontSize: 16, fontWeight: 'bold', color: '#334155' }
            },
            labelLine: { show: false },
            color: ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#6366f1'],
            data: chartData.categoryData
          }
        ]
      });
    }

    // 3. Horizontal Bar Chart: Stock rankings
    if (stockRankChartRef.value) {
      stockChartInstance = echarts.init(stockRankChartRef.value);
      stockChartInstance.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'value',
          axisLine: { show: false },
          axisLabel: { color: '#64748b' },
          splitLine: { lineStyle: { color: '#f1f5f9' } }
        },
        yAxis: {
          type: 'category',
          data: chartData.stockLevel.labels.reverse(),
          axisLine: { lineStyle: { color: '#e2e8f0' } },
          axisLabel: { color: '#64748b' }
        },
        series: [
          {
            name: '在库量',
            type: 'bar',
            barWidth: '45%',
            itemStyle: {
              borderRadius: [0, 6, 6, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#06b6d4' },
                { offset: 1, color: '#10b981' }
              ])
            },
            data: chartData.stockLevel.data.reverse()
          }
        ]
      });
    }
  } catch (err) {
    console.error('Failed to load chart data:', err);
  }
};

// Window resizing handler for fluid charts responsive layouts
const handleResize = () => {
  if (salesChartInstance) salesChartInstance.resize();
  if (categoryChartInstance) categoryChartInstance.resize();
  if (stockChartInstance) stockChartInstance.resize();
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(async () => {
  await loadStats();
  await initCharts();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (salesChartInstance) salesChartInstance.dispose();
  if (categoryChartInstance) categoryChartInstance.dispose();
  if (stockChartInstance) stockChartInstance.dispose();
});
</script>

<style scoped>
/* Scoped chart styles */
</style>
