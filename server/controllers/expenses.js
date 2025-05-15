const { OneTimeExpense, RecurringExpense } = require('../models/Expense');

// @desc    모든 일회성 지출/수입 가져오기
// @route   GET /api/expenses/one-time
// @access  Private
exports.getOneTimeExpenses = async (req, res, next) => {
  try {
    const { year } = req.query;
    let query = { user: req.user.id };
    
    // 년도 필터링 (선택 사항)
    if (year) {
      // 날짜 문자열로 필터링
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    const expenses = await OneTimeExpense.find(query).sort({ date: -1 });
    
    // 응답 데이터 준비
    const formattedExpenses = expenses.map(expense => {
      return expense.toObject();
    });

    res.status(200).json({
      success: true,
      count: formattedExpenses.length,
      data: formattedExpenses
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    일회성 지출/수입 생성
// @route   POST /api/expenses/one-time
// @access  Private
exports.createOneTimeExpense = async (req, res, next) => {
  try {
    // req.user.id를 요청 객체에 추가
    req.body.user = req.user.id;
    
    // 날짜 형식 처리
    if (req.body.date && typeof req.body.date === 'string') {
      // YYYY-MM-DD 형식이면 Date 객체로 변환하되 시간 정보 제거
      const dateParts = req.body.date.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]); // 1부터 시작하는 월
        const day = parseInt(dateParts[2]);
        
        // Date 객체 생성하지 않고 문자열로 저장
        req.body.date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    
    const expense = await OneTimeExpense.create(req.body);
    
    // 응답 객체 생성
    const responseData = expense.toObject();

    res.status(201).json({
      success: true,
      data: responseData
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    특정 일회성 지출/수입 가져오기
// @route   GET /api/expenses/one-time/:id
// @access  Private
exports.getOneTimeExpense = async (req, res, next) => {
  try {
    const expense = await OneTimeExpense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: '지출/수입을 찾을 수 없습니다'
      });
    }

    // 본인의 지출/수입만 볼 수 있게 검사
    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: '이 지출/수입을 조회할 권한이 없습니다'
      });
    }
    
    // 응답 객체 생성
    const responseData = expense.toObject();

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    일회성 지출/수입 업데이트
// @route   PUT /api/expenses/one-time/:id
// @access  Private
exports.updateOneTimeExpense = async (req, res, next) => {
  try {
    let expense = await OneTimeExpense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: '지출/수입을 찾을 수 없습니다'
      });
    }

    // 본인의 지출/수입만 수정할 수 있게 검사
    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: '이 지출/수입을 수정할 권한이 없습니다'
      });
    }
    
    // 날짜 형식 처리
    if (req.body.date && typeof req.body.date === 'string') {
      // YYYY-MM-DD 형식이면 문자열 그대로 저장
      const dateParts = req.body.date.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]); 
        const day = parseInt(dateParts[2]);
        
        // 문자열 형식으로 저장
        req.body.date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    expense = await OneTimeExpense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    // 응답 객체 생성
    const responseData = expense.toObject();

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    일회성 지출/수입 삭제
// @route   DELETE /api/expenses/one-time/:id
// @access  Private
exports.deleteOneTimeExpense = async (req, res, next) => {
  try {
    const expense = await OneTimeExpense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: '지출/수입을 찾을 수 없습니다'
      });
    }

    // 본인의 지출/수입만 삭제할 수 있게 검사
    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: '이 지출/수입을 삭제할 권한이 없습니다'
      });
    }

    await expense.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    모든 반복 지출/수입 가져오기
// @route   GET /api/expenses/recurring
// @access  Private
exports.getRecurringExpenses = async (req, res, next) => {
  try {
    const expenses = await RecurringExpense.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    반복 지출/수입 생성
// @route   POST /api/expenses/recurring
// @access  Private
exports.createRecurringExpense = async (req, res, next) => {
  try {
    // req.user.id를 요청 객체에 추가
    req.body.user = req.user.id;
    
    const expense = await RecurringExpense.create(req.body);

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    특정 반복 지출/수입 가져오기
// @route   GET /api/expenses/recurring/:id
// @access  Private
exports.getRecurringExpense = async (req, res, next) => {
  try {
    const expense = await RecurringExpense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: '반복 지출/수입을 찾을 수 없습니다'
      });
    }

    // 본인의 지출/수입만 볼 수 있게 검사
    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: '이 반복 지출/수입을 조회할 권한이 없습니다'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    반복 지출/수입 업데이트
// @route   PUT /api/expenses/recurring/:id
// @access  Private
exports.updateRecurringExpense = async (req, res, next) => {
  try {
    let expense = await RecurringExpense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: '반복 지출/수입을 찾을 수 없습니다'
      });
    }

    // 본인의 지출/수입만 수정할 수 있게 검사
    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: '이 반복 지출/수입을 수정할 권한이 없습니다'
      });
    }

    expense = await RecurringExpense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    반복 지출/수입 삭제
// @route   DELETE /api/expenses/recurring/:id
// @access  Private
exports.deleteRecurringExpense = async (req, res, next) => {
  try {
    const expense = await RecurringExpense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: '반복 지출/수입을 찾을 수 없습니다'
      });
    }

    // 본인의 지출/수입만 삭제할 수 있게 검사
    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: '이 반복 지출/수입을 삭제할 권한이 없습니다'
      });
    }

    await expense.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
}; 