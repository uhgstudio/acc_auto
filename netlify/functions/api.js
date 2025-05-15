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

// MongoDB 연결
let cachedDb = null;
const connectDB = async () => {
  if (cachedDb) {
    console.log('MongoDB 연결 재사용');
    return cachedDb;
  }
  
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB 연결됨: ${conn.connection.host}`);
    cachedDb = conn;
    return cachedDb;
  } catch (error) {
    console.error(`MongoDB 연결 에러: ${error.message}`);
    return null;
  }
};

// 라우터 불러오기
const authRoutes = require('../../server/routes/auth');
const expensesRoutes = require('../../server/routes/expenses');
const categoriesRoutes = require('../../server/routes/categories');
const holidaysRoutes = require('../../server/routes/holidays');

// 라우터 등록 - '/api' 접두사 제거 (Netlify에서 이미 /.netlify/functions/api로 리다이렉트함)
app.use('/auth', authRoutes);
app.use('/expenses', expensesRoutes);
app.use('/categories', categoriesRoutes);
app.use('/holidays', holidaysRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: 'API 서버가 정상적으로 작동 중입니다.'
  });
});

// 에러 처리 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: '서버 오류가 발생했습니다.'
  });
});

// 핸들러 함수
exports.handler = async (event, context) => {
  // 함수 콜드 스타트 시에만 DB 연결
  context.callbackWaitsForEmptyEventLoop = false;
  await connectDB();
  
  // serverless-http을 통해 Express 앱 실행
  const handler = serverless(app);
  return handler(event, context);
}; 