const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    console.log('MongoDB 연결 시도...');
    const conn = await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB 연결 성공: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`MongoDB 연결 오류: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 