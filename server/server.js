const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const config = require('./config/config');
const { initDefaultCategories } = require('./controllers/categories');

// 환경 변수 로드
dotenv.config();

// 데이터베이스 연결
connectDB();

// 라우트 파일 가져오기
const auth = require('./routes/auth');
const expenses = require('./routes/expenses');
const categories = require('./routes/categories');

// Express 앱 초기화
const app = express();

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS 설정 - 더 구체적인 옵션으로 설정
app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:3000', 'http://127.0.0.1:5000'],
  credentials: true, // 쿠키 포함 요청 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 오류 처리 미들웨어 추가
app.use((err, req, res, next) => {
  console.error('서버 오류:', err.stack);
  res.status(500).json({
    success: false,
    error: '서버 내부 오류가 발생했습니다.'
  });
});

// API 라우트 설정
app.use('/api/auth', auth);
app.use('/api/expenses', expenses);
app.use('/api/categories', categories);

// 정적 파일 제공
app.use(express.static(path.join(__dirname, '../')));

// 기본 라우트 - index.html 제공
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../', 'index.html'));
});

// 404 에러 처리
app.use((req, res) => {
  res.status(404).sendFile(path.resolve(__dirname, '../', 'index.html'));
});

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  
  // 서버 시작 시 기본 카테고리 초기화
  initDefaultCategories()
    .then(result => {
      if (result.success) {
        console.log(`카테고리 초기화 완료: 대분류 ${result.mainCount}개, 중분류 ${result.subCount}개`);
      } else {
        console.error('카테고리 초기화 실패:', result.error);
      }
    })
    .catch(error => {
      console.error('카테고리 초기화 중 오류 발생:', error);
    });
});

// 처리되지 않은 예외 처리
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // 서버 정상 종료
  server.close(() => process.exit(1));
}); 