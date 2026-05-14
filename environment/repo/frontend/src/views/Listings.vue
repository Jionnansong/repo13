<template>
  <div class="space-y-6 animate-fade-in-up">
    <!-- Header Controls -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-slate-800">农产品市场铺货上架管理</h2>
        <p class="text-xs text-slate-400 mt-1">对在库储备的农产品向各类分销渠道（电商零售、大宗批发、线下菜市）进行铺货上架管理</p>
      </div>
      <div class="flex items-center gap-3">
        <el-button type="success" :icon="Sell" class="bg-emerald-600 border-emerald-600 hover:bg-emerald-500 hover:border-emerald-500" @click="openAddDialog">
          铺货上架申报
        </el-button>
      </div>
    </div>

    <!-- Search & Filter Card -->
    <el-card shadow="never" class="border-none !bg-white">
      <div class="flex flex-wrap items-center gap-3">
        <el-input
          v-model="filters.title"
          placeholder="搜索上架标题..."
          clearable
          :prefix-icon="Search"
          @input="debouncedSearch"
          class="!w-64"
        />
        <el-select v-model="filters.platform" placeholder="分销平台" clearable @change="loadListings" class="!w-44">
          <el-option label="电商零售 (E-commerce)" value="E-commerce" />
          <el-option label="大宗商超批发 (Wholesale)" value="Wholesale" />
          <el-option label="线下农贸直销 (Farmers Market)" value="Farmers Market" />
        </el-select>
        <el-select v-model="filters.status" placeholder="货架状态" clearable @change="loadListings" class="!w-36">
          <el-option label="待上架草稿" value="Draft" />
          <el-option label="在售上架中" value="Listed" />
          <el-option label="已售罄下架" value="Delisted" />
        </el-select>
      </div>
    </el-card>

    <!-- Listings Table -->
    <el-card shadow="never" class="border-none !bg-white !p-0">
      <el-table :data="listings" v-loading="loading" style="width: 100%" class="custom-table" header-cell-class-name="bg-slate-50 text-slate-700 font-semibold text-xs border-b border-slate-100">
        <el-table-column prop="id" label="货架ID" width="80" align="center" />
        
        <el-table-column label="上架销售商品标题" min-width="220">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <span class="text-xl">{{ getPlatformEmoji(row.platform) }}</span>
              <div>
                <p class="font-bold text-slate-700 text-sm leading-tight">{{ row.title }}</p>
                <p class="text-[10px] text-emerald-600 font-semibold mt-1">关联库存: {{ row.product?.name || '无' }} (余: {{ row.product?.stock }} {{ row.product?.unit }})</p>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="铺货平台" width="130" align="center">
          <template #default="{ row }">
            <span class="px-2 py-1 rounded text-xs font-semibold" :class="getPlatformTagClass(row.platform)">
              {{ getPlatformLabel(row.platform) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="售卖单价 / 毛利" width="140" align="right">
          <template #default="{ row }">
            <div>
              <p class="font-mono font-bold text-slate-700 text-sm">¥{{ parseFloat(row.price).toFixed(2) }}</p>
              <!-- Gross margin calculation -->
              <p class="text-[10px] text-slate-400 mt-0.5">
                采购: ¥{{ parseFloat(row.product?.price || 0).toFixed(2) }}
                <span class="font-bold ml-1" :class="getMarginClass(row)">
                  ({{ getMarginText(row) }}%)
                </span>
              </p>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="货架铺货量" width="110" align="center">
          <template #default="{ row }">
            <span class="font-mono font-semibold text-slate-700">{{ row.quantity }} {{ row.product?.unit }}</span>
          </template>
        </el-table-column>

        <el-table-column label="货架状态" width="110" align="center">
          <template #default="{ row }">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold" :class="getStatusTagClass(row.status)">
              {{ getStatusLabel(row.status) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="铺货上架时间" width="140" align="center">
          <template #default="{ row }">
            <span class="text-xs text-slate-400 font-mono">{{ formatDate(row.listedAt) || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="快捷流转 / 动作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-1.5">
              <!-- Quick status progression buttons -->
              <el-button size="small" type="success" link v-if="row.status !== 'Listed'" :icon="Select" @click="changeStatus(row, 'Listed')">
                上架
              </el-button>
              <el-button size="small" type="warning" link v-if="row.status === 'Listed'" :icon="Close" @click="changeStatus(row, 'Delisted')">
                下架
              </el-button>
              <el-button size="small" type="primary" link :icon="Edit" @click="openEditDialog(row)">
                编辑
              </el-button>
              <el-button size="small" type="danger" link :icon="Delete" v-if="authStore.isAdmin" @click="deleteListing(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Dialog: Add / Edit Listing -->
    <el-dialog
      v-model="listingDialog"
      :title="isEdit ? '编辑产品上架发布' : '新产品市场铺货上架登记'"
      width="540px"
      align-center
      class="rounded-xl"
    >
      <el-form :model="listingForm" ref="listingFormRef" :rules="listingRules" label-position="top">
        <el-form-item label="选择需要上架的在库农产品" prop="productId" v-if="!isEdit">
          <el-select v-model="listingForm.productId" placeholder="选择在库储备产品..." class="w-full" @change="onProductSelect">
            <el-option v-for="p in availableProducts" :key="p.id" :label="`${getCategoryEmoji(p.category)} ${p.name} (库存: ${p.stock}${p.unit}，进价: ${p.price}元)`" :value="p.id" :disabled="p.stock <= 0" />
          </el-select>
        </el-form-item>

        <el-form-item label="货架销售标题 (起一个吸引人的市场标题)" prop="title">
          <el-input v-model="listingForm.title" placeholder="例如：【有机基地专直达】山东烟台精品红富士 10斤装" />
        </el-form-item>

        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="零售上架价格 (元)" prop="price">
            <el-input-number v-model="listingForm.price" :precision="2" :step="0.5" :min="0" class="!w-full" />
            <span class="text-[10px] text-slate-400 font-medium block mt-1" v-if="selectedProduct">产品进价参考：¥{{ parseFloat(selectedProduct.price).toFixed(2) }} / {{ selectedProduct.unit }}</span>
          </el-form-item>

          <el-form-item label="货架铺货量 (不能超在库量)" prop="quantity">
            <el-input-number v-model="listingForm.quantity" :min="1" :precision="0" class="!w-full" />
            <span class="text-[10px] text-slate-400 font-medium block mt-1" v-if="selectedProduct">当前在库储备：{{ selectedProduct.stock }} {{ selectedProduct.unit }}</span>
          </el-form-item>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="目标铺货平台" prop="platform">
            <el-select v-model="listingForm.platform" placeholder="选择分销渠道" class="w-full">
              <el-option label="线上电商平台" value="E-commerce" />
              <el-option label="大宗商超批发" value="Wholesale" />
              <el-option label="线下农贸直销" value="Farmers Market" />
            </el-select>
          </el-form-item>

          <el-form-item label="初始发布状态" prop="status" v-if="!isEdit">
            <el-select v-model="listingForm.status" placeholder="货架发布状态" class="w-full">
              <el-option label="存为草稿 (暂不上架)" value="Draft" />
              <el-option label="审核并直接上架" value="Listed" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-3 mt-2">
          <el-button @click="listingDialog = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" class="bg-emerald-600 border-emerald-600 hover:bg-emerald-500" @click="submitListing">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { Search, Sell, Edit, Delete, Select, Close } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../utils/api';

const authStore = useAuthStore();

// Filters & Table State
const loading = ref(false);
const listings = ref([]);
const availableProducts = ref([]);
const filters = ref({
  title: '',
  platform: '',
  status: '',
});

// Search debounce
let searchTimer = null;
const debouncedSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadListings();
  }, 300);
};

// Fetch listings
const loadListings = async () => {
  loading.value = true;
  try {
    const res = await api.get('/listings', { params: filters.value });
    listings.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Fetch products for dropdown
const loadProducts = async () => {
  try {
    const res = await api.get('/products', { params: { status: 'true' } });
    availableProducts.value = res.data;
  } catch (err) {
    console.error(err);
  }
};

// Toggle or quick change shelf status
const changeStatus = async (row, newStatus) => {
  try {
    await api.patch(`/listings/${row.id}/status`, { status: newStatus });
    ElMessage.success(`铺货条目已成功变更状态为【${getStatusLabel(newStatus)}】`);
    loadListings();
  } catch (err) {}
};

// Add / Edit Configs
const listingDialog = ref(false);
const submitLoading = ref(false);
const isEdit = ref(false);
const listingFormRef = ref(null);
const listingForm = ref({
  productId: null,
  title: '',
  price: 0,
  quantity: 0,
  platform: '',
  status: 'Draft',
});

// Dropdown item reference helper
const selectedProduct = computed(() => {
  if (!listingForm.value.productId) return null;
  return availableProducts.value.find(p => p.id === listingForm.value.productId) || null;
});

const onProductSelect = (id) => {
  const prod = availableProducts.value.find(p => p.id === id);
  if (prod) {
    listingForm.value.title = `【官方直发】精品${prod.name}特惠装`;
    listingForm.value.price = parseFloat((prod.price * 1.2).toFixed(2)); // Suggest a 20% margin
    listingForm.value.quantity = Math.min(prod.stock, 50); // Suggest a stock limit or current stock
  }
};

const validateQty = (rule, value, callback) => {
  if (selectedProduct.value && value > selectedProduct.value.stock) {
    callback(new Error(`铺货量 ${value} 不能大于库存剩余量 ${selectedProduct.value.stock}`));
  } else {
    callback();
  }
};

const listingRules = {
  productId: [{ required: true, message: '请选择拟铺货的在库农产品', trigger: 'change' }],
  title: [{ required: true, message: '请录入货架销售标题', trigger: 'blur' }],
  price: [{ required: true, message: '请输入售卖零售价格', trigger: 'blur' }],
  quantity: [
    { required: true, message: '请输入铺货货源数量', trigger: 'blur' },
    { validator: validateQty, trigger: 'blur' }
  ],
  platform: [{ required: true, message: '请选择销售分销渠道', trigger: 'change' }],
};

const openAddDialog = () => {
  isEdit.value = false;
  listingForm.value = { productId: null, title: '', price: 0, quantity: 10, platform: 'E-commerce', status: 'Draft' };
  loadProducts(); // Reload newest stock levels
  listingDialog.value = true;
  if (listingFormRef.value) listingFormRef.value.resetFields();
};

const openEditDialog = (row) => {
  isEdit.value = true;
  listingForm.value = { ...row, price: parseFloat(row.price) };
  loadProducts();
  listingDialog.value = true;
};

const submitListing = () => {
  listingFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    submitLoading.value = true;
    try {
      if (isEdit.value) {
        await api.put(`/listings/${listingForm.value.id}`, listingForm.value);
        ElMessage.success('货架上架条目信息修改成功');
      } else {
        await api.post('/listings', listingForm.value);
        ElMessage.success('铺货条目发布审核成功，账目已关联');
      }
      listingDialog.value = false;
      loadListings();
    } catch (err) {
      // Axios logs
    } finally {
      submitLoading.value = false;
    }
  });
};

// Delete shelf listing
const deleteListing = (row) => {
  ElMessageBox.confirm(`您确认要彻底销毁铺货条目 "${row.title}" 吗？该操作不可撤销。`, '警告：删除上架货架', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'error',
    confirmButtonClass: 'bg-rose-600 border-rose-600 text-white hover:bg-rose-500',
    customClass: 'rounded-xl'
  }).then(async () => {
    try {
      await api.delete(`/listings/${row.id}`);
      ElMessage.success('货架铺货条目已彻底销毁');
      loadListings();
    } catch (err) {}
  }).catch(() => {});
};

// Calculations / margin calculations
const getMarginText = (row) => {
  const sellPrice = parseFloat(row.price);
  const costPrice = parseFloat(row.product?.price || 0);
  if (costPrice <= 0) return '0';
  const margin = ((sellPrice - costPrice) / sellPrice) * 100;
  return margin.toFixed(1);
};

const getMarginClass = (row) => {
  const text = parseFloat(getMarginText(row));
  if (text < 0) return 'text-rose-500';
  if (text < 10) return 'text-amber-500';
  return 'text-emerald-500';
};

// Visual Tags Helpers
const getPlatformLabel = (plat) => {
  const labels = { 'E-commerce': '网上商城零售', 'Wholesale': '大宗商超批发', 'Farmers Market': '直销线下零售' };
  return labels[plat] || plat;
};

const getPlatformEmoji = (plat) => {
  const emojis = { 'E-commerce': '📱', 'Wholesale': '🚚', 'Farmers Market': '🏪' };
  return emojis[plat] || '📦';
};

const getPlatformTagClass = (plat) => {
  const classes = {
    'E-commerce': 'bg-sky-50 text-sky-700 border border-sky-200',
    'Wholesale': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    'Farmers Market': 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  };
  return classes[plat] || 'bg-slate-50 text-slate-700 border border-slate-200';
};

const getStatusLabel = (status) => {
  const labels = { 'Draft': '待发布草稿', 'Listed': '在售上架中', 'Delisted': '下架暂存' };
  return labels[status] || status;
};

const getStatusTagClass = (status) => {
  const classes = {
    'Draft': 'bg-slate-100 text-slate-600 border border-slate-200',
    'Listed': 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
    'Delisted': 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
  };
  return classes[status] || 'bg-slate-100 text-slate-600 border border-slate-200';
};

const getCategoryEmoji = (cat) => {
  const emojis = { Grains: '🌾', Vegetables: '🥦', Fruits: '🍎', Meats: '🥩', Dairy: '🥛' };
  return emojis[cat] || '📦';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  loadListings();
});
</script>

<style scoped>
/* Table custom overrides */
</style>
