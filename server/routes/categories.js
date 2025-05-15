const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getMainCategories,
  getSubCategories,
  addMainCategory,
  addSubCategory,
  deleteMainCategory,
  deleteSubCategory,
  updateMainCategory,
  updateSubCategory,
  updateMainCategoryByCode,
  updateSubCategoryByCode
} = require('../controllers/categories');

const router = express.Router();

// 대분류 카테고리 라우트
router.route('/main')
  .get(protect, getMainCategories)
  .post(protect, addMainCategory);

// 중분류 카테고리 라우트
router.route('/sub')
  .get(protect, getSubCategories)
  .post(protect, addSubCategory);

// 대분류 카테고리 관리 라우트 (코드 기반) - 더 구체적인 라우트를 먼저 정의
router.route('/main/code/:code')
  .put(protect, updateMainCategoryByCode);

// 중분류 카테고리 관리 라우트 (코드 기반) - 더 구체적인 라우트를 먼저 정의
router.route('/sub/code/:code')
  .put(protect, updateSubCategoryByCode);

// 대분류 카테고리 관리 라우트 (ID 기반)
router.route('/main/:id')
  .delete(protect, deleteMainCategory)
  .put(protect, updateMainCategory);

// 중분류 카테고리 관리 라우트 (ID 기반)
router.route('/sub/:id')
  .delete(protect, deleteSubCategory)
  .put(protect, updateSubCategory);

module.exports = router; 