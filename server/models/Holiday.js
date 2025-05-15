const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, '날짜는 필수입니다']
  },
  name: {
    type: String,
    required: [true, '공휴일명은 필수입니다'],
    trim: true,
    maxlength: [100, '공휴일명은 100자 이내여야 합니다']
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  day: {
    type: Number,
    required: true
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

// 날짜로 인덱스 생성
HolidaySchema.index({ date: 1, user: 1 }, { unique: true });

// 저장 전에 year, month, day 필드 자동 설정
HolidaySchema.pre('save', function(next) {
  const date = new Date(this.date);
  this.year = date.getFullYear();
  this.month = date.getMonth() + 1; // JavaScript 월은 0부터 시작, 1을 더해서 1~12로 표현
  this.day = date.getDate();
  next();
});

module.exports = mongoose.model('Holiday', HolidaySchema); 