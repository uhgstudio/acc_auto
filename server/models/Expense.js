const mongoose = require('mongoose');

// 일회성 지출/수입 스키마
const OneTimeExpenseSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, '날짜는 필수입니다']
  },
  amount: {
    type: Number,
    required: [true, '금액은 필수입니다']
  },
  description: {
    type: String,
    required: [true, '내용은 필수입니다'],
    trim: true,
    maxlength: [200, '내용은 200자 이내여야 합니다']
  },
  vendor: {
    type: String,
    trim: true,
    maxlength: [100, '거래처는 100자 이내여야 합니다']
  },
  mainCategory: {
    type: String,
    required: [true, '대분류는 필수입니다'],
    trim: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  isActualPayment: {
    type: Boolean,
    default: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 반복 지출/수입 스키마
const RecurringExpenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, '내용은 필수입니다'],
    trim: true,
    maxlength: [200, '내용은 200자 이내여야 합니다']
  },
  amount: {
    type: Number,
    required: [true, '금액은 필수입니다']
  },
  frequency: {
    type: String,
    enum: ['daily', 'monthly'],
    default: 'monthly'
  },
  day: {
    type: Number,
    min: 1,
    max: 31
  },
  startDate: {
    type: String,
    required: [true, '시작일은 필수입니다']
  },
  endDate: {
    type: String
  },
  mainCategory: {
    type: String,
    required: [true, '대분류는 필수입니다'],
    trim: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  vendor: {
    type: String,
    trim: true,
    maxlength: [100, '거래처는 100자 이내여야 합니다']
  },
  skipWeekends: {
    type: Boolean,
    default: false
  },
  skipHolidays: {
    type: Boolean,
    default: false
  },
  isActualPayment: {
    type: Boolean,
    default: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const OneTimeExpense = mongoose.model('OneTimeExpense', OneTimeExpenseSchema);
const RecurringExpense = mongoose.model('RecurringExpense', RecurringExpenseSchema);

module.exports = { OneTimeExpense, RecurringExpense }; 