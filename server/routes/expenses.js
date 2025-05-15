const express = require('express');
const {
  getOneTimeExpenses,
  createOneTimeExpense,
  getOneTimeExpense,
  updateOneTimeExpense,
  deleteOneTimeExpense,
  getRecurringExpenses,
  createRecurringExpense,
  getRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense
} = require('../controllers/expenses');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 일회성 지출 라우트
router.route('/one-time')
  .get(protect, getOneTimeExpenses)
  .post(protect, createOneTimeExpense);

router.route('/one-time/:id')
  .get(protect, getOneTimeExpense)
  .put(protect, updateOneTimeExpense)
  .delete(protect, deleteOneTimeExpense);

// 반복 지출 라우트
router.route('/recurring')
  .get(protect, getRecurringExpenses)
  .post(protect, createRecurringExpense);

router.route('/recurring/:id')
  .get(protect, getRecurringExpense)
  .put(protect, updateRecurringExpense)
  .delete(protect, deleteRecurringExpense);

module.exports = router; 