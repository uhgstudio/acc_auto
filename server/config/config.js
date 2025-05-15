// 서버 구성 설정
const config = {
  port: process.env.PORT || 5000,
  // 데이터베이스 이름을 'account'로 지정
  mongoUri: 'mongodb+srv://uhgstudio:eo12rjdia@cluster0.6fofljr.mongodb.net/account?retryWrites=true&w=majority&appName=Cluster0',
  jwtSecret: process.env.JWT_SECRET || 'your_secret_jwt_key_change_this_in_production',
  jwtExpire: process.env.JWT_EXPIRE || '30d'
};

module.exports = config; 