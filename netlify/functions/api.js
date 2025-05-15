const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// 환경 변수 로드
dotenv.config();

// Express 앱 생성
const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());

// DB 연결
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB 연결됨: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB 연결 에러: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

// 라우터 불러오기
const authRoutes = require('../../server/routes/auth');
const expensesRoutes = require('../../server/routes/expenses');
const categoriesRoutes = require('../../server/routes/categories');
const holidaysRoutes = require('../../server/routes/holidays');

// 라우터 등록
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/holidays', holidaysRoutes);

// 기본 라우트
app.get('/api', (req, res) => {
  res.json({
    message: 'API 서버가 정상적으로 작동 중입니다.'
  });
});

// API를 서버리스 함수로 래핑하여 내보내기
module.exports.handler = serverless(app); 