const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const { initDefaultCategories } = require('./controllers/categories');
const connectDB = require('./config/db');

// 환경 변수 로드
dotenv.config();

// Express 앱 초기화
const app = express();

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS 설정
const allowedOrigins = [
  'http://localhost:5000', 
  'http://localhost:3000', 
  'http://127.0.0.1:5000',
  // Render 도메인 추가
  process.env.RENDER_EXTERNAL_URL,
  'https://acc-auto.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // origin이 undefined인 경우(같은 오리진 요청)도 허용
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('차단된 CORS 요청:', origin);
      callback(new Error('CORS 정책에 의해 차단되었습니다'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 오류 처리 미들웨어
app.use((err, req, res, next) => {
  console.error('서버 오류:', err.stack);
  res.status(500).json({
    success: false,
    error: '서버 내부 오류가 발생했습니다.'
  });
});

// 라우트 파일 가져오기
const auth = require('./routes/auth');
const expenses = require('./routes/expenses');
const categories = require('./routes/categories');
const holidays = require('./routes/holidays');

// API 라우트 설정
app.use('/api/auth', auth);
app.use('/api/expenses', expenses);
app.use('/api/categories', categories);
app.use('/api/holidays', holidays);

// 정적 파일 제공 (프로덕션 환경에서는 'dist' 폴더의 파일 제공)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // 모든 요청을 index.html로 라우팅 (SPA 지원)
  app.get('*', (req, res) => {
    // API 요청은 제외
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
    }
  });
} else {
  // 개발 환경에서는 루트 디렉토리의 파일 제공
  app.use(express.static(path.join(__dirname, '../')));
  
  // 기본 라우트 - index.html 제공
  app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../', 'index.html'));
  });
}

// 404 에러 처리
app.use((req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  } else {
    res.status(404).sendFile(path.resolve(__dirname, '../', 'index.html'));
  }
});

const PORT = config.port;

// 데이터베이스 연결 후 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 연결
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다. 환경: ${process.env.NODE_ENV || 'development'}`);
      
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
    
  } catch (error) {
    console.error('서버 시작 실패:', error.message);
    process.exit(1);
  }
};

startServer(); 