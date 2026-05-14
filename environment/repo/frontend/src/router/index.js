import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { title: '登录 - 农产品管理系统', guestOnly: true }
    },
    {
      path: '/',
      component: () => import('../views/Layout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../views/Dashboard.vue'),
          meta: { title: '数据看板 - 农产品管理系统', requiresAuth: true }
        },
        {
          path: 'products',
          name: 'Products',
          component: () => import('../views/Products.vue'),
          meta: { title: '库存管理 - 农产品管理系统', requiresAuth: true }
        },
        {
          path: 'listings',
          name: 'Listings',
          component: () => import('../views/Listings.vue'),
          meta: { title: '上架管理 - 农产品管理系统', requiresAuth: true }
        },
        {
          path: 'accounts',
          name: 'Accounts',
          component: () => import('../views/Accounts.vue'),
          meta: { title: '账号管理 - 农产品管理系统', requiresAuth: true, adminOnly: true }
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('../views/Settings.vue'),
          meta: { title: '系统设置 - 农产品管理系统', requiresAuth: true }
        }
      ]
    },
    // Fallback redirect
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
});

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // Set page title
  if (to.meta.title) {
    document.title = to.meta.title;
  }

  const isAuth = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuth) {
    next({ name: 'Login' });
  } else if (to.meta.guestOnly && isAuth) {
    next({ name: 'Dashboard' });
  } else if (to.meta.adminOnly && !authStore.isAdmin) {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;
