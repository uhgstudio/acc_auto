const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getHolidays,
  getHoliday,
  createHoliday,
  createHolidayBatch,
  updateHoliday,
  deleteHoliday,
  deleteHolidaysByYear
} = require('../controllers/holidays');

// 모든 라우트에 인증 미들웨어 적용
router.use(protect);

// 공휴일 기본 라우트
router.route('/')
  .get(getHolidays)
  .post(createHoliday);

// 일괄 추가 라우트
router.post('/batch', createHolidayBatch);

// 연도별 삭제 라우트
router.delete('/year/:year', deleteHolidaysByYear);

// ID별 조회/수정/삭제 라우트
router.route('/:id')
  .get(getHoliday)
  .put(updateHoliday)
  .delete(deleteHoliday);

module.exports = router; 