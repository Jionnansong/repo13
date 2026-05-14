<template>
  <div class="space-y-6 animate-fade-in-up">
    <!-- Header Controls -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-slate-800">农产品物料库存管理</h2>
        <p class="text-xs text-slate-400 mt-1">对基地收获入库的农产品物资进行目录管理、库存变动登记与预警监控</p>
      </div>
      <div class="flex items-center gap-3">
        <el-button type="success" :icon="Plus" class="bg-emerald-600 border-emerald-600 hover:bg-emerald-500 hover:border-emerald-500" @click="openAddDialog">
          物资入库登记
        </el-button>
      </div>
    </div>

    <!-- Search & Filter Card -->
    <el-card shadow="never" class="border-none !bg-white">
      <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
        <!-- Text Searches -->
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <el-input
            v-model="filters.name"
            placeholder="搜索农产品名称..."
            clearable
            :prefix-icon="Search"
            @input="debouncedSearch"
            class="!w-64"
          />
          <el-select v-model="filters.category" placeholder="分类筛选" clearable @change="loadProducts" class="!w-44">
            <el-option label="粮食作物 (Grains)" value="Grains" />
            <el-option label="新鲜蔬菜 (Vegetables)" value="Vegetables" />
            <el-option label="时令水果 (Fruits)" value="Fruits" />
            <el-option label="禽畜肉蛋 (Meats)" value="Meats" />
            <el-option label="绿色奶制 (Dairy)" value="Dairy" />
          </el-select>
          <el-select v-model="filters.status" placeholder="上架状态" clearable @change="loadProducts" class="!w-36">
            <el-option label="可用储备" value="true" />
            <el-option label="禁用备货" value="false" />
          </el-select>
        </div>
        
        <!-- Stock Status Guide -->
        <div class="flex items-center gap-4 text-xs font-semibold text-slate-400">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded bg-emerald-500"></span>
            <span>库存充沛</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded bg-amber-500"></span>
            <span>低存预警 (&lt; 100)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded bg-rose-500"></span>
            <span>严重缺货 (&lt; 20)</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Products Data Table -->
    <el-card shadow="never" class="border-none !bg-white !p-0">
      <el-table :data="products" v-loading="loading" style="width: 100%" class="custom-table" header-cell-class-name="bg-slate-50 text-slate-700 font-semibold text-xs border-b border-slate-100">
        <el-table-column prop="id" label="物资ID" width="80" align="center" />
        
        <el-table-column label="产品物资名称" min-width="160">
          <template #default="{ row }">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">{{ getCategoryEmoji(row.category) }}</span>
              <div>
                <p class="font-bold text-slate-700 text-sm leading-tight">{{ row.name }}</p>
                <p class="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">{{ row.origin }}</p>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="大类" width="110" align="center">
          <template #default="{ row }">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold" :class="getCategoryTagClass(row.category)">
              {{ getCategoryLabel(row.category) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="采购单价" width="110" align="right">
          <template #default="{ row }">
            <span class="font-mono font-bold text-slate-700 text-sm">¥{{ parseFloat(row.price).toFixed(2) }}</span>
            <span class="text-[10px] text-slate-400 font-medium ml-0.5">/{{ row.unit }}</span>
          </template>
        </el-table-column>

        <el-table-column label="当前在库量" width="140" align="center">
          <template #default="{ row }">
            <div class="flex flex-col items-center">
              <span class="font-mono font-extrabold text-sm" :class="getStockTextClass(row.stock)">
                {{ row.stock }} {{ row.unit }}
              </span>
              <!-- Small visual progress bar -->
              <div class="w-20 bg-slate-100 h-1 rounded overflow-hidden mt-1.5">
                <div class="h-full rounded" :class="getStockProgressClass(row.stock)" :style="{ width: Math.min((row.stock / 500) * 100, 100) + '%' }"></div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="可用状态" width="110" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              style="--el-switch-on-color: #10b981; --el-switch-off-color: #cbd5e1"
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="入库时间" width="140" align="center">
          <template #default="{ row }">
            <span class="text-xs text-slate-400 font-mono">{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-1.5">
              <el-button size="small" type="primary" link :icon="Histogram" @click="openStockDialog(row)">
                库存调配
              </el-button>
              <el-button size="small" type="primary" link :icon="Edit" @click="openEditDialog(row)">
                编辑
              </el-button>
              <el-button size="small" type="danger" link :icon="Delete" v-if="authStore.isAdmin" @click="deleteProduct(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Dialog: Add / Edit Product -->
    <el-dialog
      v-model="productDialog"
      :title="isEdit ? '编辑农产品物料信息' : '新农产品物资入库登记'"
      width="560px"
      align-center
      class="rounded-xl"
    >
      <el-form :model="productForm" ref="productFormRef" :rules="productRules" label-position="top" class="grid grid-cols-2 gap-x-4">
        <el-form-item label="农产品物资名称" prop="name" class="col-span-2">
          <el-input v-model="productForm.name" placeholder="例如：有机红富士苹果、高山黄瓜等" />
        </el-form-item>

        <el-form-item label="分类归属" prop="category">
          <el-select v-model="productForm.category" placeholder="选择分类" class="w-full">
            <el-option label="粮食作物" value="Grains" />
            <el-option label="新鲜蔬菜" value="Vegetables" />
            <el-option label="时令水果" value="Fruits" />
            <el-option label="禽畜肉蛋" value="Meats" />
            <el-option label="奶制品" value="Dairy" />
          </el-select>
        </el-form-item>

        <el-form-item label="计量单位" prop="unit">
          <el-input v-model="productForm.unit" placeholder="例如：箱、袋、kg、盒等" />
        </el-form-item>

        <el-form-item label="物料采购单价 (元)" prop="price">
          <el-input-number v-model="productForm.price" :precision="2" :step="0.5" :min="0" class="!w-full" />
        </el-form-item>

        <el-form-item label="初始入库库存" prop="stock" v-if="!isEdit">
          <el-input-number v-model="productForm.stock" :min="0" :precision="0" class="!w-full" />
        </el-form-item>

        <el-form-item label="物资产地 / 种植基地" prop="origin" class="col-span-2">
          <el-input v-model="productForm.origin" placeholder="例如：山东省烟台市牟平区蓬莱阁基地" />
        </el-form-item>

        <el-form-item label="详情备注 / 培育描述" prop="description" class="col-span-2">
          <el-input v-model="productForm.description" type="textarea" :rows="3" placeholder="录入物资的质量属性、存储注意项、冷链条件等..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-3 mt-2">
          <el-button @click="productDialog = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" class="bg-emerald-600 border-emerald-600 hover:bg-emerald-500" @click="submitProduct">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Dialog: Inventory Adjustment -->
    <el-dialog
      v-model="stockDialog"
      title="库存变动记账 / 调配盘点"
      width="420px"
      align-center
      class="rounded-xl"
    >
      <div class="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-5 flex items-center gap-3">
        <span class="text-3xl">{{ getCategoryEmoji(activeProduct?.category) }}</span>
        <div>
          <h4 class="font-bold text-slate-800 text-sm">{{ activeProduct?.name }}</h4>
          <p class="text-xs text-slate-400 mt-0.5">当前在库余量：<span class="font-bold font-mono text-emerald-600">{{ activeProduct?.stock }} {{ activeProduct?.unit }}</span></p>
        </div>
      </div>

      <el-form :model="stockForm" ref="stockFormRef" :rules="stockRules" label-position="top">
        <el-form-item label="记账变动类型" prop="type">
          <el-radio-group v-model="stockForm.type" class="w-full grid grid-cols-3 gap-2">
            <el-radio-button label="in">入库增加</el-radio-button>
            <el-radio-button label="out">出库消耗</el-radio-button>
            <el-radio-button label="set">期末盘点</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="变动数量" prop="quantity">
          <el-input-number v-model="stockForm.quantity" :min="1" :precision="0" class="!w-full" />
        </el-form-item>

        <el-form-item label="变动事由 / 批次说明" prop="reason">
          <el-input v-model="stockForm.reason" type="textarea" :rows="2" placeholder="请输入此次出入库/盘点审核原因或批次单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-3 mt-2">
          <el-button @click="stockDialog = false">取消</el-button>
          <el-button type="primary" :loading="stockLoading" class="bg-emerald-600 border-emerald-600 hover:bg-emerald-500" @click="submitStock">
            确认过账
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { Search, Plus, Edit, Delete, Histogram } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../utils/api';

const authStore = useAuthStore();

// Filters & State
const loading = ref(false);
const products = ref([]);
const filters = ref({
  name: '',
  category: '',
  status: '',
});

// Debounce Search Timer
let searchTimer = null;
const debouncedSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadProducts();
  }, 300);
};

// Fetch list of products
const loadProducts = async () => {
  loading.value = true;
  try {
    const res = await api.get('/products', { params: filters.value });
    products.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Toggle status of product
const toggleStatus = async (row) => {
  try {
    await api.put(`/products/${row.id}`, { status: row.status });
    ElMessage.success(`产品 "${row.name}" 已成功${row.status ? '开启储备' : '下架禁用'}`);
  } catch (err) {
    row.status = !row.status; // Revert
  }
};

// Add / Edit Dialog Configuration
const productDialog = ref(false);
const submitLoading = ref(false);
const isEdit = ref(false);
const productFormRef = ref(null);
const productForm = ref({
  name: '',
  category: '',
  unit: '',
  price: 0.0,
  stock: 0,
  origin: '',
  description: '',
});

const productRules = {
  name: [{ required: true, message: '请填写物资名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择物资大类', trigger: 'change' }],
  unit: [{ required: true, message: '请填写计量单位', trigger: 'blur' }],
  price: [{ required: true, message: '请填写单价', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入初始在库数量', trigger: 'blur' }],
  origin: [{ required: true, message: '请录入物资产地', trigger: 'blur' }],
};

const openAddDialog = () => {
  isEdit.value = false;
  productForm.value = { name: '', category: '', unit: '', price: 0, stock: 0, origin: '', description: '' };
  productDialog.value = true;
  if (productFormRef.value) productFormRef.value.resetFields();
};

const openEditDialog = (row) => {
  isEdit.value = true;
  productForm.value = { ...row, price: parseFloat(row.price) };
  productDialog.value = true;
};

const submitProduct = () => {
  productFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    submitLoading.value = true;
    try {
      if (isEdit.value) {
        await api.put(`/products/${productForm.value.id}`, productForm.value);
        ElMessage.success('产品物资修改成功');
      } else {
        await api.post('/products', productForm.value);
        ElMessage.success('新物资成功入库，已记录建档');
      }
      productDialog.value = false;
      loadProducts();
    } catch (err) {
      // Axios logs details
    } finally {
      submitLoading.value = false;
    }
  });
};

// Stock Adjustments Config
const stockDialog = ref(false);
const stockLoading = ref(false);
const activeProduct = ref(null);
const stockFormRef = ref(null);
const stockForm = ref({
  type: 'in', // 'in', 'out', 'set'
  quantity: 1,
  reason: '',
});

const stockRules = {
  type: [{ required: true, message: '请选择调整类型', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入变动数量', trigger: 'blur' }],
};

const openStockDialog = (row) => {
  activeProduct.value = row;
  stockForm.value = { type: 'in', quantity: 10, reason: '' };
  stockDialog.value = true;
  if (stockFormRef.value) stockFormRef.value.resetFields();
};

const submitStock = () => {
  stockFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    stockLoading.value = true;
    try {
      await api.patch(`/products/${activeProduct.value.id}/stock`, stockForm.value);
      ElMessage.success('库存调配账目核对成功，已成功过账！');
      stockDialog.value = false;
      loadProducts();
    } catch (err) {
      // Handled
    } finally {
      stockLoading.value = false;
    }
  });
};

// Delete product
const deleteProduct = (row) => {
  ElMessageBox.confirm(`您确定要彻底删除物资 "${row.name}" 吗？删除后，关联的市场货架上架信息可能失效。`, '警告：彻底删除物资', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'error',
    confirmButtonClass: 'bg-rose-600 border-rose-600 text-white hover:bg-rose-500',
    customClass: 'rounded-xl'
  }).then(async () => {
    try {
      await api.delete(`/products/${row.id}`);
      ElMessage.success('产品物资档案已彻底销毁');
      loadProducts();
    } catch (err) {}
  }).catch(() => {});
};

// Helpers for tags & assets
const getCategoryEmoji = (cat) => {
  const emojis = { Grains: '🌾', Vegetables: '🥦', Fruits: '🍎', Meats: '🥩', Dairy: '🥛' };
  return emojis[cat] || '📦';
};

const getCategoryLabel = (cat) => {
  const labels = { Grains: '粮食作物', Vegetables: '新鲜蔬菜', Fruits: '时令水果', Meats: '禽畜肉蛋', Dairy: '绿色奶制' };
  return labels[cat] || cat;
};

const getCategoryTagClass = (cat) => {
  const classes = {
    Grains: 'bg-amber-50 text-amber-700 border border-amber-150',
    Vegetables: 'bg-green-50 text-green-700 border border-green-150',
    Fruits: 'bg-rose-50 text-rose-700 border border-rose-150',
    Meats: 'bg-indigo-50 text-indigo-700 border border-indigo-150',
    Dairy: 'bg-sky-50 text-sky-700 border border-sky-150',
  };
  return classes[cat] || 'bg-slate-50 text-slate-700 border border-slate-100';
};

const getStockTextClass = (stock) => {
  if (stock < 20) return 'text-rose-600 font-extrabold';
  if (stock < 100) return 'text-amber-500 font-bold';
  return 'text-emerald-600 font-semibold';
};

const getStockProgressClass = (stock) => {
  if (stock < 20) return 'bg-rose-500';
  if (stock < 100) return 'bg-amber-500';
  return 'bg-emerald-500';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

onMounted(() => {
  loadProducts();
});
</script>

<style scoped>
/* Scoped overrides */
</style>
