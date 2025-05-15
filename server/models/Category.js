const mongoose = require('mongoose');

// 메인 카테고리 스키마
const MainCategorySchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, '분류 코드는 필수입니다'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, '분류명은 필수입니다'],
    trim: true
  },
  type: {
    type: String,
    required: [true, '유형은 필수입니다'],
    enum: ['income', 'expense'],
    default: 'expense'
  },
  order: {
    type: Number,
    default: 0
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null // null이면 시스템 기본 카테고리
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 서브 카테고리 스키마
const SubCategorySchema = new mongoose.Schema({
  mainCode: {
    type: String,
    required: [true, '상위 분류 코드는 필수입니다'],
    trim: true
  },
  code: {
    type: String,
    required: [true, '분류 코드는 필수입니다'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, '분류명은 필수입니다'],
    trim: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null // null이면 시스템 기본 카테고리
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = {
  MainCategory: mongoose.model('MainCategory', MainCategorySchema),
  SubCategory: mongoose.model('SubCategory', SubCategorySchema)
}; 