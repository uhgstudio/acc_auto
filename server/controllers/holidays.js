const Holiday = require('../models/Holiday');

/**
 * @desc    모든 공휴일 조회
 * @route   GET /api/holidays
 * @access  Private
 */
exports.getHolidays = async (req, res) => {
  try {
    // 사용자 ID와 연도로 필터링
    const filter = { user: req.user.id };
    
    // 연도 파라미터가 있으면 추가
    if (req.query.year) {
      filter.year = parseInt(req.query.year);
    }
    
    console.log('공휴일 조회 필터:', filter);
    
    const holidays = await Holiday.find(filter).sort({ month: 1, day: 1 });
    
    // 날짜 데이터 변환: ISO 형식의 date 필드를 YYYY-MM-DD 형식의 formattedDate 필드로 변환
    const formattedHolidays = holidays.map(holiday => {
      const { _id, year, month, day, name, date, user, createdAt } = holiday;
      
      // month와 day가 10보다 작으면 앞에 0 붙이기
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      
      // YYYY-MM-DD 형식으로 변환
      const formattedDate = `${year}-${monthStr}-${dayStr}`;
      
      return {
        _id,
        year,
        month,
        day,
        name,
        date: formattedDate, // ISO 날짜 대신 YYYY-MM-DD 형식 사용
        user,
        createdAt
      };
    });
    
    console.log(`공휴일 조회 결과: ${holidays.length}개 데이터`);
    if (holidays.length > 0) {
      console.log('첫 번째 공휴일 샘플:', formattedHolidays[0]);
    }
    
    res.status(200).json({
      success: true,
      count: formattedHolidays.length,
      data: formattedHolidays
    });
  } catch (error) {
    console.error('공휴일 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      message: error.message
    });
  }
};

/**
 * @desc    단일 공휴일 조회
 * @route   GET /api/holidays/:id
 * @access  Private
 */
exports.getHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!holiday) {
      return res.status(404).json({
        success: false,
        error: '공휴일을 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: holiday
    });
  } catch (error) {
    console.error('공휴일 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      message: error.message
    });
  }
};

/**
 * @desc    공휴일 추가
 * @route   POST /api/holidays
 * @access  Private
 */
exports.createHoliday = async (req, res) => {
  try {
    const { year, month, day, name } = req.body;
    
    if (!year || !month || !day || !name) {
      return res.status(400).json({
        success: false,
        error: '모든 필드를 입력해주세요 (year, month, day, name).'
      });
    }
    
    // 날짜 객체 생성
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // 같은 날짜에 이미 공휴일이 있는지 확인
    const existingHoliday = await Holiday.findOne({
      user: req.user.id,
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day)
    });
    
    if (existingHoliday) {
      return res.status(400).json({
        success: false,
        error: '해당 날짜에 이미 공휴일이 등록되어 있습니다.'
      });
    }
    
    // 공휴일 생성
    const holiday = await Holiday.create({
      date,
      name,
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      user: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: holiday
    });
  } catch (error) {
    console.error('공휴일 생성 오류:', error);
    
    // MongoDB 중복 키 오류 처리
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: '해당 날짜에 이미 공휴일이 등록되어 있습니다.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      message: error.message
    });
  }
};

/**
 * @desc    공휴일 일괄 추가
 * @route   POST /api/holidays/batch
 * @access  Private
 */
exports.createHolidayBatch = async (req, res) => {
  try {
    const { holidays } = req.body;
    
    if (!holidays || !Array.isArray(holidays)) {
      return res.status(400).json({
        success: false,
        error: '공휴일 배열이 필요합니다.'
      });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    // 각 공휴일을 개별적으로 저장 (트랜잭션 없이)
    for (const holiday of holidays) {
      const { year, month, day, name } = holiday;
      
      if (!year || !month || !day || !name) {
        results.failed.push({
          holiday,
          error: '모든 필드가 필요합니다 (year, month, day, name).'
        });
        continue;
      }
      
      try {
        // 날짜 객체 생성
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        // 같은 날짜에 이미 공휴일이 있는지 확인
        const existingHoliday = await Holiday.findOne({
          user: req.user.id,
          year: parseInt(year),
          month: parseInt(month),
          day: parseInt(day)
        });
        
        if (existingHoliday) {
          results.failed.push({
            holiday,
            error: '해당 날짜에 이미 공휴일이 등록되어 있습니다.'
          });
          continue;
        }
        
        // 공휴일 생성
        const newHoliday = await Holiday.create({
          date,
          name,
          year: parseInt(year),
          month: parseInt(month),
          day: parseInt(day),
          user: req.user.id
        });
        
        results.success.push(newHoliday);
      } catch (error) {
        results.failed.push({
          holiday,
          error: error.message
        });
      }
    }
    
    res.status(201).json({
      success: true,
      data: {
        successCount: results.success.length,
        failedCount: results.failed.length,
        totalCount: holidays.length,
        successItems: results.success,
        failedItems: results.failed
      }
    });
  } catch (error) {
    console.error('공휴일 일괄 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      message: error.message
    });
  }
};

/**
 * @desc    공휴일 수정
 * @route   PUT /api/holidays/:id
 * @access  Private
 */
exports.updateHoliday = async (req, res) => {
  try {
    const { year, month, day, name } = req.body;
    
    // 기존 공휴일 조회
    let holiday = await Holiday.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!holiday) {
      return res.status(404).json({
        success: false,
        error: '공휴일을 찾을 수 없습니다.'
      });
    }
    
    // 수정할 내용
    const updateData = {};
    
    if (name) updateData.name = name;
    
    // 날짜 관련 필드가 변경된 경우
    if (year || month || day) {
      const newYear = year ? parseInt(year) : holiday.year;
      const newMonth = month ? parseInt(month) : holiday.month;
      const newDay = day ? parseInt(day) : holiday.day;
      
      // 새 날짜 객체 생성
      const newDate = new Date(newYear, newMonth - 1, newDay);
      
      // 같은 날짜에 이미 다른 공휴일이 있는지 확인
      if (year || month || day) {
        const existingHoliday = await Holiday.findOne({
          user: req.user.id,
          year: newYear,
          month: newMonth,
          day: newDay,
          _id: { $ne: req.params.id } // 현재 수정 중인 항목 제외
        });
        
        if (existingHoliday) {
          return res.status(400).json({
            success: false,
            error: '해당 날짜에 이미 다른 공휴일이 등록되어 있습니다.'
          });
        }
      }
      
      updateData.date = newDate;
      updateData.year = newYear;
      updateData.month = newMonth;
      updateData.day = newDay;
    }
    
    // 공휴일 업데이트
    holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: holiday
    });
  } catch (error) {
    console.error('공휴일 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      message: error.message
    });
  }
};

/**
 * @desc    공휴일 삭제
 * @route   DELETE /api/holidays/:id
 * @access  Private
 */
exports.deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!holiday) {
      return res.status(404).json({
        success: false,
        error: '공휴일을 찾을 수 없습니다.'
      });
    }
    
    await holiday.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('공휴일 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      message: error.message
    });
  }
};

/**
 * @desc    연도별 공휴일 삭제
 * @route   DELETE /api/holidays/year/:year
 * @access  Private
 */
exports.deleteHolidaysByYear = async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    
    if (isNaN(year)) {
      return res.status(400).json({
        success: false,
        error: '유효한 연도를 입력해주세요.'
      });
    }
    
    const result = await Holiday.deleteMany({
      user: req.user.id,
      year
    });
    
    res.status(200).json({
      success: true,
      count: result.deletedCount,
      message: `${year}년 공휴일 ${result.deletedCount}개가 삭제되었습니다.`
    });
  } catch (error) {
    console.error('연도별 공휴일 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      message: error.message
    });
  }
}; 