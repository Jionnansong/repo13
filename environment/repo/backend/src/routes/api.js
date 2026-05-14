const express = require('express');
const router = express.Router();

const {
  authMiddleware,
  adminMiddleware,
  login,
  getCurrentUser,
  changePassword,
  getAccounts,
  createAccount,
  updateAccount,
  toggleAccountStatus,
  deleteAccount,
} = require('../controllers/authController');

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct,
} = require('../controllers/productController');

const {
  getAllListings,
  createListing,
  updateListing,
  toggleListingStatus,
  deleteListing,
} = require('../controllers/listingController');

const {
  getStats,
  getSalesChartData,
} = require('../controllers/dashboardController');

const {
  getSettings,
  updateSettings,
  getLogs,
} = require('../controllers/settingsController');

// --- Auth Routes ---
router.post('/auth/login', login);
router.get('/auth/me', authMiddleware, getCurrentUser);
router.post('/auth/change-password', authMiddleware, changePassword);

// --- Admin Account Routes ---
router.get('/auth/accounts', authMiddleware, adminMiddleware, getAccounts);
router.post('/auth/accounts', authMiddleware, adminMiddleware, createAccount);
router.put('/auth/accounts/:id', authMiddleware, adminMiddleware, updateAccount);
router.patch('/auth/accounts/:id/status', authMiddleware, adminMiddleware, toggleAccountStatus);
router.delete('/auth/accounts/:id', authMiddleware, adminMiddleware, deleteAccount);

// --- Product Routes ---
router.get('/products', authMiddleware, getAllProducts);
router.get('/products/:id', authMiddleware, getProductById);
router.post('/products', authMiddleware, createProduct);
router.put('/products/:id', authMiddleware, updateProduct);
router.patch('/products/:id/stock', authMiddleware, adjustStock);
router.delete('/products/:id', authMiddleware, adminMiddleware, deleteProduct);

// --- Listing Routes ---
router.get('/listings', authMiddleware, getAllListings);
router.post('/listings', authMiddleware, createListing);
router.put('/listings/:id', authMiddleware, updateListing);
router.patch('/listings/:id/status', authMiddleware, toggleListingStatus);
router.delete('/listings/:id', authMiddleware, adminMiddleware, deleteListing);

// --- Dashboard Routes ---
router.get('/dashboard/stats', authMiddleware, getStats);
router.get('/dashboard/charts', authMiddleware, getSalesChartData);

// --- Settings Routes ---
router.get('/settings', authMiddleware, getSettings);
router.put('/settings', authMiddleware, adminMiddleware, updateSettings);
router.get('/settings/logs', authMiddleware, adminMiddleware, getLogs);

module.exports = router;
