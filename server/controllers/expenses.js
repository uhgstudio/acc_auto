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
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    const expenses = await OneTimeExpense.find(query).sort({ date: -1 });

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

// @desc    일회성 지출/수입 생성
// @route   POST /api/expenses/one-time
// @access  Private
exports.createOneTimeExpense = async (req, res, next) => {
  try {
    // req.user.id를 요청 객체에 추가
    req.body.user = req.user.id;
    
    const expense = await OneTimeExpense.create(req.body);

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

    expense = await OneTimeExpense.findByIdAndUpdate(req.params.id, req.body, {
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