// 서버 구성 설정
const config = {
  port: process.env.PORT || 5000,
  // MongoDB URI는 환경 변수에서 로드
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/account',
  jwtSecret: process.env.JWT_SECRET || 'your_secret_jwt_key_change_this_in_production',
  jwtExpire: process.env.JWT_EXPIRE || '30d'
};

module.exports = config; 