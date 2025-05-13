/**
 * 지출 달력 모듈
 * 월별 지출 달력 표시 및 요약 기능 담당
 */
const ExpenseCalendar = {
    // 달력 초기화
    initialize() {
        this.renderCalendar();
        this.setupCalendarEventListeners();
    },
    
    // 달력 렌더링
    renderCalendar() {
        const calendarContainer = document.getElementById('expense-calendar');
        calendarContainer.innerHTML = '';
        
        const year = DataManager.data.year;
        document.getElementById('calendar-year').textContent = year;

        // 월별 잔액 데이터 계산 (이월 포함)
        const monthlyBalanceData = this.calculateMonthlyBalanceWithCarryover();

        // 12개월 생성
        for (let month = 0; month < 12; month++) {
            const monthDiv = document.createElement('div');
            monthDiv.className = 'month-card';
            
            const monthTitle = document.createElement('div');
            monthTitle.className = 'month-header';
            monthTitle.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <span>${month + 1}월</span>
                    <button class="btn btn-sm btn-success add-expense-btn" data-month="${month + 1}">
                        <i class="bi bi-plus"></i>
                    </button>
                </div>
            `;
            monthDiv.appendChild(monthTitle);
            
            const monthBody = document.createElement('div');
            monthBody.className = 'month-body';
            
            // 해당 월의 지출 항목들 계산
            const expenses = this.getMonthlyExpenses(year, month + 1);
            
            // 지출 요약 계산
            const categorySummary = this.summarizeExpensesByCategory(expenses);
            
            // 이월 잔액 정보
            const monthData = monthlyBalanceData[month];
            
            if (Object.keys(categorySummary.mainCategories).length > 0) {
                // 이월 잔액 표시
                if (month > 0 && monthData && monthData.carryoverFromPrev !== 0) {
                    const carryoverDiv = document.createElement('div');
                    carryoverDiv.className = 'carryover-info mb-2';
                    
                    const isPositive = monthData.carryoverFromPrev > 0;
                    const colorClass = isPositive ? 'text-primary' : 'text-danger';
                    const prefix = isPositive ? '+' : '';
                    
                    carryoverDiv.innerHTML = `
                        <small>
                            <i class="bi bi-arrow-return-right"></i> 
                            이월: <span class="${colorClass}">${prefix}${Utils.number.formatCurrency(monthData.carryoverFromPrev)}</span>
                        </small>
                    `;
                    monthBody.appendChild(carryoverDiv);
                }
                
                // 요약 테이블 생성
                const summaryTable = document.createElement('table');
                summaryTable.className = 'summary-table';
                
                // 테이블 헤더
                const tableHeader = document.createElement('thead');
                tableHeader.innerHTML = `
                    <tr>
                        <th>분류</th>
                        <th>건수</th>
                        <th>금액</th>
                    </tr>
                `;
                summaryTable.appendChild(tableHeader);
                
                // 테이블 바디
                const tableBody = document.createElement('tbody');
                
                // 대분류별 요약 행 추가
                for (const categoryCode in categorySummary.mainCategories) {
                    const category = categorySummary.mainCategories[categoryCode];
                    const row = document.createElement('tr');
                    
                    // 금액 스타일 설정 (수입/지출에 따라)
                    const amountClass = category.isIncome ? 'text-primary' : 'text-danger';
                    const amountSign = category.isIncome ? '+' : '-';
                    
                    row.innerHTML = `
                        <td>${category.name}</td>
                        <td>${category.count}건</td>
                        <td class="${amountClass}">${amountSign}${Utils.number.formatCurrency(category.amount)}</td>
                    `;
                    tableBody.appendChild(row);
                }
                
                // 최종 잔액 행 추가
                const finalBalanceRow = document.createElement('tr');
                finalBalanceRow.classList.add('table-primary');
                
                if (monthData) {
                    const isPositiveFinal = monthData.finalBalance >= 0;
                    const finalColorClass = isPositiveFinal ? 'text-primary' : 'text-danger';
                    const finalPrefix = isPositiveFinal ? '+' : '';
                    
                    finalBalanceRow.innerHTML = `
                        <td colspan="2" class="text-end" style="font-size: 14px;"><strong>최종 잔액</strong></td>
                        <td class="${finalColorClass}" style="text-align: right;"><strong>${finalPrefix}${Utils.number.formatCurrency(monthData.finalBalance)}</strong></td>
                    `;
                } else {
                    finalBalanceRow.innerHTML = `
                        <td colspan="2" class="text-end" style="font-size: 14px;"><strong>최종 잔액</strong></td>
                        <td class="text-primary" style="text-align: right;"><strong>+${Utils.number.formatCurrency(0)}</strong></td>
                    `;
                }
                
                tableBody.appendChild(finalBalanceRow);
                
                summaryTable.appendChild(tableBody);
                monthBody.appendChild(summaryTable);
            } else {
                // 지출 항목이 없는 경우
                // 이월 잔액은 있을 수 있음
                if (month > 0 && monthData && monthData.carryoverFromPrev !== 0) {
                    const carryoverDiv = document.createElement('div');
                    carryoverDiv.className = 'carryover-info mb-2';
                    
                    const isPositive = monthData.carryoverFromPrev > 0;
                    const colorClass = isPositive ? 'text-primary' : 'text-danger';
                    const prefix = isPositive ? '+' : '';
                    
                    carryoverDiv.innerHTML = `
                        <small>
                            <i class="bi bi-arrow-return-right"></i> 
                            이월: <span class="${colorClass}">${prefix}${Utils.number.formatCurrency(monthData.carryoverFromPrev)}</span>
                        </small>
                    `;
                    monthBody.appendChild(carryoverDiv);
                    
                    // 최종 잔액도 표시
                    const finalBalanceDiv = document.createElement('div');
                    finalBalanceDiv.className = 'final-balance-info mb-2';
                    
                    const isFinalPositive = monthData.finalBalance > 0;
                    const finalColorClass = isFinalPositive ? 'text-primary' : 'text-danger';
                    const finalPrefix = isFinalPositive ? '+' : '';
                    
                    finalBalanceDiv.innerHTML = `
                        <div class="text-center py-2">
                            <strong>최종 잔액: <span class="${finalColorClass}">${finalPrefix}${Utils.number.formatCurrency(monthData.finalBalance)}</span></strong>
                        </div>
                    `;
                    monthBody.appendChild(finalBalanceDiv);
                } else {
                    const noExpenseMsg = document.createElement('p');
                    noExpenseMsg.className = 'no-expense-msg';
                    noExpenseMsg.textContent = '등록된 지출이 없습니다.';
                    monthBody.appendChild(noExpenseMsg);
                }
            }
            
            // 상세 버튼 추가
            if (expenses.length > 0) {
                const detailBtn = document.createElement('button');
                detailBtn.className = 'btn btn-sm btn-outline-primary detail-btn';
                detailBtn.textContent = '상세 보기';
                detailBtn.dataset.month = month + 1;
                detailBtn.addEventListener('click', () => this.showExpenseDetail(month + 1, expenses));
                monthBody.appendChild(detailBtn);
            }
            
            monthDiv.appendChild(monthBody);
            calendarContainer.appendChild(monthDiv);
        }
        
        // 지출 추가 버튼에 이벤트 리스너 추가
        this.setupAddExpenseButtons();
    },
    
    // 월별 지출 항목 가져오기
    getMonthlyExpenses(year, month) {
        const expenses = [];
        const yearStr = year.toString();
        const monthStr = month.toString().padStart(2, '0');
        const yearMonth = `${yearStr}-${monthStr}`;
        
        // 일회성 지출 항목 처리 (반복 지출로 생성된 항목 포함)
        DataManager.data.oneTimeExpenses.forEach((expense, index) => {
            // 날짜가 유효한지 확인
            if (!expense.date) return;
            
            // 날짜가 문자열인지 확인하고 문자열로 변환
            const dateStr = typeof expense.date === 'string' ? expense.date : 
                           (expense.date instanceof Date ? expense.date.toISOString().split('T')[0] : null);
            
            // 날짜가 유효하지 않으면 건너뜀
            if (!dateStr) return;
            
            // 해당 월의 지출만 필터링
            if (dateStr.startsWith(yearMonth)) {
                // 대분류 정보 찾기
                const mainCategory = DataManager.data.categories.main.find(c => c.code === expense.mainCategory);
                const isIncome = mainCategory?.type === 'income';
                
                // 중분류 정보 찾기
                const subCategory = DataManager.data.categories.sub.find(c => c.code === expense.subCategory);
                
                // 지출/수입 항목 추가
                expenses.push({
                    id: expense.id || `onetime-${index}`,  // 고유 ID 사용, 없으면 인덱스 기반 ID 사용
                    dbIndex: index,  // 데이터베이스 배열 인덱스 (디버깅용)
                    date: dateStr,   // 문자열로 변환된 날짜 사용
                    description: expense.description,
                    amount: expense.amount,
                    mainCategory: expense.mainCategory,
                    mainCategoryName: mainCategory?.name || '',
                    subCategory: expense.subCategory,
                    subCategoryName: subCategory?.name || '',
                    isIncome: isIncome,
                    isRecurring: false,
                    tags: expense.tags || [],
                    memo: expense.memo || '',
                    recurringId: expense.recurringId || null,
                    isActualPayment: expense.isActualPayment,
                    vendor: expense.vendor || '' // 거래처 정보 추가
                });
            }
        });
        
        // 날짜 기준 오름차순 정렬 (1일부터 시작)
        expenses.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        return expenses;
    },
    
    // 날짜가 지정된 범위 내에 있는지 확인하는 유틸리티 함수
    isDateInRange(targetDateObj, startDateStr, endDateStr) {
        if (!startDateStr) return false; // 시작일이 없으면 범위에 포함되지 않음
        
        // 타겟 날짜: 월의 첫날
        const targetDate = targetDateObj instanceof Date ? targetDateObj : new Date(targetDateObj);
        const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth();
        
        // 타겟 월의 마지막 날짜 (월 전체 비교를 위해)
        const targetMonthLastDay = new Date(targetYear, targetMonth + 1, 0);
        
        // 시작일
        const startDate = new Date(startDateStr);
        
        // 종료일 (없으면 미래 날짜)
        let endDate;
        if (endDateStr) {
            endDate = new Date(endDateStr);
        } else {
            // 종료일이 없으면 미래 날짜로 설정 (사실상 무제한)
            endDate = new Date(9999, 11, 31);
        }
        
        // 날짜 시간 정보 제거 (시간 차이로 인한 오차 방지)
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999); // 종료일 포함하기 위해 그날의 마지막 시간으로 설정
        targetDate.setHours(0, 0, 0, 0);
        targetMonthLastDay.setHours(23, 59, 59, 999);

        // 월 범위 확인: 타겟 월이 시작일과 종료일 사이에 있는지 확인
        // (1) 타겟 월의 마지막 날이 시작일보다 이전이면 범위에 포함되지 않음
        if (targetMonthLastDay < startDate) {
            return false;
        }
        
        // (2) 타겟 월의 첫날이 종료일보다 이후면 범위에 포함되지 않음
        if (targetDate > endDate) {
            return false;
        }
        
        return true;
    },
    
    // 지출 항목을 분류별로 요약
    summarizeExpensesByCategory(expenses) {
        const mainCategories = {};
        const subCategories = {};
        let totalIncome = 0;
        let totalExpense = 0;
        
        // 분류별로 금액 집계 - 모든 항목 포함
        expenses.forEach(expense => {
            // 대분류 집계
            const mainKey = expense.mainCategory || 'NONE';
            // 대분류 객체 찾기 (type 속성 가져오기 위함)
            const mainCategoryObj = DataManager.data.categories.main.find(c => c.code === mainKey);
            const mainName = mainCategoryObj ? mainCategoryObj.name : '미분류';
            const isIncome = mainCategoryObj?.type === 'income';
            
            if (!mainCategories[mainKey]) {
                mainCategories[mainKey] = {
                    code: mainKey,
                    name: mainName,
                    count: 0,
                    amount: 0,
                    isIncome: isIncome
                };
            }
            
            mainCategories[mainKey].count++;
            mainCategories[mainKey].amount += expense.amount;
            
            // 중분류 집계
            if (expense.subCategory) {
                const subKey = expense.subCategory;
                const subCategoryObj = DataManager.data.categories.sub.find(c => c.code === subKey);
                const subName = subCategoryObj ? subCategoryObj.name : '미분류';
                
                const combinedKey = `${mainKey}-${subKey}`;
                
                if (!subCategories[combinedKey]) {
                    subCategories[combinedKey] = {
                        mainCode: mainKey,
                        mainName: mainName,
                        code: subKey,
                        name: subName,
                        count: 0,
                        amount: 0,
                        isIncome: isIncome
                    };
                }
                
                subCategories[combinedKey].count++;
                subCategories[combinedKey].amount += expense.amount;
            }
            
            // 수입/지출 합계 계산
            if (isIncome) {
                totalIncome += expense.amount;
            } else {
                totalExpense += expense.amount;
            }
        });
        
        return {
            mainCategories,
            subCategories,
            totalCount: expenses.length,
            totalIncome,
            totalExpense
        };
    },
    
    // 월별 지출 상세 내역 팝업 표시
    showExpenseDetail(month, expenses, savedFilterState = null) {
        // 기존 팝업 제거
        const existingPopup = document.getElementById('expense-detail-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // 페이징 변수 초기화 - 페이징 제거하여 미사용
        // const itemsPerPage = 10; // 페이지당 항목 수
        // let currentPage = 1;
        
        // 팝업 컨테이너 생성
        const popup = document.createElement('div');
        popup.id = 'expense-detail-popup';
        popup.className = 'expense-popup';
        popup.style.maxWidth = '100%';  // 팝업을 화면 크기에 맞춤
        
        // 수입/지출 계산
        let totalIncome = 0;
        let totalExpense = 0;
        
        expenses.forEach(expense => {
            if (expense.isIncome) {
                totalIncome += expense.amount;
            } else {
                totalExpense += expense.amount;
            }
        });
        
        // 순수입 계산
        const netAmount = totalIncome - totalExpense;
        const netAmountPrefix = netAmount >= 0 ? '+' : '-';
        const netAmountClass = netAmount >= 0 ? 'text-primary' : 'text-danger';
        const absNetAmount = Math.abs(netAmount);
        
        // 필터 UI 생성 함수
        const createFilterUI = () => {
            // 대분류 옵션 생성
            let mainCategoryOptions = '<option value="">전체</option>';
            DataManager.data.categories.main.forEach(cat => {
                mainCategoryOptions += `<option value="${cat.code}">${cat.name}</option>`;
            });
            
            return `
                <div class="row mb-3 mt-2">
                    <div class="col-md-12">
                        <div class="input-group mb-2" style="max-width: 550px;">
                            <span class="input-group-text">날짜 범위</span>
                            <input type="date" id="date-filter-start" class="form-control" value="${DataManager.data.year}-${month.toString().padStart(2, '0')}-01">
                            <span class="input-group-text">~</span>
                            <input type="date" id="date-filter-end" class="form-control" value="${DataManager.data.year}-${month.toString().padStart(2, '0')}-${new Date(DataManager.data.year, month, 0).getDate().toString().padStart(2, '0')}">
                            <button id="apply-date-filter" class="btn btn-primary">적용</button>
                            <button id="reset-date-filter" class="btn btn-outline-secondary">초기화</button>
                        </div>
                        <div class="d-flex flex-wrap gap-2">
                            <div class="input-group" style="max-width: 200px;">
                                <span class="input-group-text">대분류</span>
                                <select id="main-category-filter" class="form-select form-select-sm">
                                    ${mainCategoryOptions}
                                </select>
                            </div>
                            <div class="input-group" style="max-width: 200px;">
                                <span class="input-group-text">중분류</span>
                                <select id="sub-category-filter" class="form-select form-select-sm">
                                    <option value="">전체</option>
                                </select>
                            </div>
                            <div class="input-group" style="max-width: 200px;">
                                <span class="input-group-text">거래처</span>
                                <input type="text" id="vendor-filter" class="form-control form-control-sm" placeholder="거래처">
                            </div>
                            <div class="input-group" style="max-width: 200px;">
                                <span class="input-group-text">내용</span>
                                <input type="text" id="description-filter" class="form-control form-control-sm" placeholder="내용">
                            </div>
                        </div>
                    </div>
                </div>
            `;
        };
        
        // 팝업 내용 생성 - 페이징 UI 제거, 필터 UI 추가
        popup.innerHTML = `
            <div class="popup-content" style="max-width: 1600px; width: 98%;">
                <div class="popup-header">
                    <h3>${DataManager.data.year}년 ${month}월 지출 내역</h3>
                    <button id="close-popup" class="close-popup-btn">&times;</button>
                </div>
                <div class="popup-body">
                    <ul class="nav nav-tabs" id="expenseDetailTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="detail-tab" data-bs-toggle="tab" data-bs-target="#detail-content" type="button" role="tab" aria-controls="detail-content" aria-selected="true">상세 내역</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="summary-tab" data-bs-toggle="tab" data-bs-target="#summary-content" type="button" role="tab" aria-controls="summary-content" aria-selected="false">요약</button>
                        </li>
                    </ul>
                    <div class="tab-content" id="expenseDetailTabContent">
                        <div class="tab-pane fade show active" id="detail-content" role="tabpanel" aria-labelledby="detail-tab">
                            <!-- 필터 영역 -->
                            ${createFilterUI()}
                            
                            <div class="d-flex justify-content-between align-items-center my-2">
                                <div class="d-flex align-items-center">
                                    <div class="me-3">
                                        <span class="badge bg-primary">총 ${expenses.length}개 항목</span>
                                        <span class="badge bg-primary">수입: ${Utils.number.formatCurrency(totalIncome)}</span>
                                        <span class="badge bg-danger">지출: ${Utils.number.formatCurrency(totalExpense)}</span>
                                        <span class="badge ${netAmountClass}">순액: ${netAmountPrefix}${Utils.number.formatCurrency(absNetAmount)}</span>
                                    </div>
                                </div>
                                <div>
                                    <button id="add-expense-in-detail" class="btn btn-sm btn-success">
                                        <i class="bi bi-plus"></i> 새 항목 추가
                                    </button>
                                </div>
                            </div>
                            <div class="table-responsive">
                                <table class="table table-hover" id="expense-detail-list">
                                    <thead>
                                        <tr>
                                            <th class="sortable-col" data-field="date" style="width: 9%;">날짜</th>
                                            <th class="sortable-col" data-field="vendor" style="width: 10%;">거래처</th>
                                            <th class="sortable-col" data-field="description" style="width: 24%;">내용</th>
                                            <th class="sortable-col" data-field="category" style="width: 7%;">분류</th>
                                            <th class="text-end sortable-col" data-field="amount" style="width: 15%;">금액</th>
                                            <th class="text-end" style="width: 15%;">잔액</th>
                                            <th style="width: 8%;">액션</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- 여기에 항목이 동적으로 추가됩니다 -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="tab-pane fade" id="summary-content" role="tabpanel" aria-labelledby="summary-tab">
                            <div class="summary-container">
                                <h4>대분류별 요약</h4>
                                <table class="table table-striped" id="main-category-summary">
                                    <thead>
                                        <tr>
                                            <th>분류</th>
                                            <th>건수</th>
                                            <th>금액</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    </tbody>
                                </table>
                                
                                <h4>중분류별 요약</h4>
                                <table class="table table-striped" id="sub-category-summary">
                                    <thead>
                                        <tr>
                                            <th>중분류</th>
                                            <th>건수</th>
                                            <th>금액</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // 닫기 버튼 이벤트 설정
        const closeBtn = popup.querySelector('#close-popup');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                popup.remove();
            });
        }
        
        // 필터 상태 저장 변수
        let filterState = {
            startDate: `${DataManager.data.year}-${month.toString().padStart(2, '0')}-01`,
            endDate: `${DataManager.data.year}-${month.toString().padStart(2, '0')}-${new Date(DataManager.data.year, month, 0).getDate().toString().padStart(2, '0')}`,
            mainCategory: '',
            subCategory: '',
            vendor: '',
            description: ''
        };
        
        // 저장된 필터 상태가 있으면 복원
        if (savedFilterState) {
            filterState = {...savedFilterState};
        }
        
        // 필터 상태 적용 함수
        const applyFilterState = () => {
            document.getElementById('date-filter-start').value = filterState.startDate;
            document.getElementById('date-filter-end').value = filterState.endDate;
            document.getElementById('main-category-filter').value = filterState.mainCategory;
            document.getElementById('vendor-filter').value = filterState.vendor || '';
            document.getElementById('description-filter').value = filterState.description || '';
            
            // 대분류 값에 따라 중분류 옵션 업데이트
            updateSubCategoryOptions();
            
            // 중분류 값 설정 (옵션 업데이트 후)
            document.getElementById('sub-category-filter').value = filterState.subCategory || '';
        };
        
        // 중분류 옵션 업데이트 함수
        const updateSubCategoryOptions = () => {
            const mainCategoryCode = document.getElementById('main-category-filter').value;
            const subCategorySelect = document.getElementById('sub-category-filter');
            
            // 기존 옵션 제거 (첫 번째 옵션 '전체' 유지)
            while (subCategorySelect.options.length > 1) {
                subCategorySelect.remove(1);
            }
            
            // 선택된 대분류에 해당하는 중분류 옵션 추가
            if (mainCategoryCode) {
                const subCategories = DataManager.data.categories.sub.filter(sub => 
                    sub.mainCode === mainCategoryCode
                );
                
                subCategories.forEach(sub => {
                    const option = document.createElement('option');
                    option.value = sub.code;
                    option.textContent = sub.name;
                    subCategorySelect.appendChild(option);
                });
            }
        };
        
        // 대분류 변경 이벤트 리스너
        document.getElementById('main-category-filter').addEventListener('change', () => {
            filterState.mainCategory = document.getElementById('main-category-filter').value;
            filterState.subCategory = ''; // 대분류 변경 시 중분류 초기화
            updateSubCategoryOptions();
            applyFilters();
        });
        
        // 중분류 변경 이벤트 리스너
        document.getElementById('sub-category-filter').addEventListener('change', () => {
            filterState.subCategory = document.getElementById('sub-category-filter').value;
            applyFilters();
        });
        
        // 거래처 필터 이벤트 리스너
        document.getElementById('vendor-filter').addEventListener('input', () => {
            filterState.vendor = document.getElementById('vendor-filter').value.trim();
            applyFilters();
        });
        
        // 내용 필터 이벤트 리스너
        document.getElementById('description-filter').addEventListener('input', () => {
            filterState.description = document.getElementById('description-filter').value.trim();
            applyFilters();
        });
        
        // 날짜 필터 변수 초기화
        let filteredExpenses = [...expenses]; // 원본 데이터의 복사본으로 시작
        
        // 필터 적용 함수 - 모든 필터 조건 적용
        const applyFilters = () => {
            // 필터 상태 업데이트
            filterState.startDate = document.getElementById('date-filter-start').value;
            filterState.endDate = document.getElementById('date-filter-end').value;
            filterState.mainCategory = document.getElementById('main-category-filter').value;
            filterState.subCategory = document.getElementById('sub-category-filter').value;
            filterState.vendor = document.getElementById('vendor-filter').value.trim();
            filterState.description = document.getElementById('description-filter').value.trim();
            
            // 필터링 적용
            filteredExpenses = expenses.filter(expense => {
                // 날짜 필터
                if (filterState.startDate && filterState.endDate) {
                    if (expense.date < filterState.startDate || expense.date > filterState.endDate) {
                        return false;
                    }
                }
                
                // 대분류 필터
                if (filterState.mainCategory && expense.mainCategory !== filterState.mainCategory) {
                    return false;
                }
                
                // 중분류 필터
                if (filterState.subCategory && expense.subCategory !== filterState.subCategory) {
                    return false;
                }
                
                // 거래처 필터
                const vendorFilter = filterState.vendor.toLowerCase();
                if (vendorFilter && !(expense.vendor || '').toLowerCase().includes(vendorFilter)) {
                    return false;
                }
                
                // 내용 필터
                const descFilter = filterState.description.toLowerCase();
                if (descFilter && !(expense.description || '').toLowerCase().includes(descFilter)) {
                    return false;
                }
                
                return true;
            });
            
            // 테이블 다시 렌더링
            renderExpenseTable();
            updateFilteredSummary();
        };
        
        // 날짜 필터 이벤트 리스너 설정
        const applyFilterBtn = popup.querySelector('#apply-date-filter');
        const resetFilterBtn = popup.querySelector('#reset-date-filter');
        
        if (applyFilterBtn && resetFilterBtn) {
            // 필터 적용 버튼
            applyFilterBtn.addEventListener('click', applyFilters);
            
            // 필터 초기화 버튼
            resetFilterBtn.addEventListener('click', () => {
                // 필터 상태 초기화
                filterState = {
                    startDate: `${DataManager.data.year}-${month.toString().padStart(2, '0')}-01`,
                    endDate: `${DataManager.data.year}-${month.toString().padStart(2, '0')}-${new Date(DataManager.data.year, month, 0).getDate().toString().padStart(2, '0')}`,
                    mainCategory: '',
                    subCategory: '',
                    vendor: '',
                    description: ''
                };
                
                // UI에 필터 상태 적용
                applyFilterState();
                
                // 필터링된 데이터 초기화
                filteredExpenses = [...expenses];
                renderExpenseTable();
                updateFilteredSummary();
            });
        }
        
        // 상세 내역 테이블 채우기
        const tbody = popup.querySelector('#expense-detail-list tbody');
        
        // 월별 초기 잔액 가져오기 (이전달 이월액)
        const monthlyBalanceData = this.calculateMonthlyBalanceWithCarryover();
        let initialBalance = 0;
        
        // 해당 월의 초기 잔액 설정 (이전달 이월액 또는 0)
        if (month > 1 && monthlyBalanceData[month-2]) {
            initialBalance = monthlyBalanceData[month-2].finalBalance;
        }
        
        // 상세 내역 테이블 렌더링 - 페이징 제거, 모든 항목 표시
        const renderExpenseTable = () => {
            const tbody = popup.querySelector('#expense-detail-list tbody');
            
            // 페이지 로딩 효과 적용
            tbody.classList.add('loading-page');
            
            // 약간의 지연 후 내용 업데이트 (부드러운 전환 효과 위해)
            setTimeout(() => {
                // 기존 테이블 내용 초기화
                tbody.innerHTML = '';
                
                // 초기 잔액 행 추가
                const initialBalanceRow = document.createElement('tr');
                initialBalanceRow.classList.add('table-light');
                initialBalanceRow.innerHTML = `
                    <td></td>
                    <td></td>
                    <td></td>
                    <td class="text-end" style="font-size: 13px;"><strong>이전 잔액</strong></td>
                    <td></td>
                    <td class="text-end" style="font-size: 13px;"><strong>${Utils.number.formatCurrency(initialBalance)}</strong></td>
                    <td></td>
                `;
                tbody.appendChild(initialBalanceRow);
                
                // 잔액 계산을 위한 변수
                let runningBalance = initialBalance;
                
                // 필터링된 항목이 없는 경우
                if (filteredExpenses.length === 0) {
                    const noDataRow = document.createElement('tr');
                    noDataRow.innerHTML = `
                        <td colspan="7" class="text-center">해당 날짜 범위에 데이터가 없습니다.</td>
                    `;
                    tbody.appendChild(noDataRow);
                } else {
                    // 모든 항목 표시, 날짜 오름차순으로 이미 정렬되어 있음
                    for (let i = 0; i < filteredExpenses.length; i++) {
                        const expense = filteredExpenses[i];
                        
                        // 대분류 정보 찾기
                        const mainCategory = DataManager.data.categories.main.find(c => c.code === expense.mainCategory) || { name: '미분류' };
                        
                        // 중분류 정보 찾기
                        const subCategory = DataManager.data.categories.sub.find(c => c.code === expense.subCategory) || { name: '' };
                        
                        // 분류 표시 설정 - 중분류가 있으면 중분류만, 없으면 대분류 표시
                        const categoryDisplay = subCategory.name ? subCategory.name : mainCategory.name;
                        
                        // 잔액 업데이트
                        if (expense.isIncome) {
                            runningBalance += expense.amount;
                        } else {
                            runningBalance -= expense.amount;
                        }
                        
                        const row = document.createElement('tr');
                        row.classList.add(expense.isIncome ? 'expense-income' : 'expense-outgoing');
                        
                        // 금액 스타일 설정 (수입/지출에 따라)
                        const amountClass = expense.isIncome ? 'text-primary' : 'text-danger';
                        const amountPrefix = expense.isIncome ? '+' : '-';
                        
                        // 실입금 여부 아이콘
                        const actualPaymentBadge = expense.isActualPayment ? 
                            `<span class="badge bg-success actual-payment-badge" data-id="${expense.id}">✓</span>` : 
                            `<span class="badge bg-secondary actual-payment-badge" data-id="${expense.id}">✗</span>`;
                        
                        // 잔액 스타일 설정
                        const balanceClass = runningBalance >= 0 ? 'text-primary' : 'text-danger';
                        const balancePrefix = runningBalance >= 0 ? '+' : '-';
                        
                        // 항목 테이블 행 생성 - 폰트 크기 더 작게 조정
                        row.innerHTML = `
                            <td class="expense-date" style="width: 9%;">${expense.date}</td>
                            <td class="expense-vendor" style="width: 10%;">${expense.vendor || ''}</td>
                            <td class="expense-description" style="width: 24%;">${expense.description || ''}</td>
                            <td class="expense-category" style="width: 7%;">${categoryDisplay}</td>
                            <td class="expense-amount text-end ${amountClass}" style="width: 15%;">${amountPrefix}${Utils.number.formatCurrency(expense.amount)}</td>
                            <td class="expense-balance text-end ${balanceClass}" style="width: 15%;">${balancePrefix}${Utils.number.formatCurrency(Math.abs(runningBalance))}</td>
                            <td class="expense-actions" style="width: 10%;">
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary edit-expense-btn" data-id="${expense.id}">
                                        <i class="bi bi-pencil-square"></i>
                                    </button>
                                    <button class="btn btn-outline-danger delete-expense-btn" data-id="${expense.id}">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </td>
                        `;
                        tbody.appendChild(row);
                    }
                }
                
                // 최종 잔액 행 추가
                const finalBalanceRow = document.createElement('tr');
                finalBalanceRow.classList.add('table-primary');
                
                const isPositiveFinal = runningBalance >= 0;
                const finalColorClass = isPositiveFinal ? 'text-primary' : 'text-danger';
                const finalPrefix = isPositiveFinal ? '+' : '';
                
                finalBalanceRow.innerHTML = `
                    <td></td>
                    <td></td>
                    <td></td>
                    <td class="text-end" style="font-size: 13px;"><strong>최종 잔액</strong></td>
                    <td></td>
                    <td class="${finalColorClass}" style="text-align: right;"><strong>${finalPrefix}${Utils.number.formatCurrency(runningBalance)}</strong></td>
                    <td></td>
                `;
                tbody.appendChild(finalBalanceRow);
                
                // 수정 및 삭제 버튼 클릭 이벤트 추가
                setupItemActionButtons(popup);
                
                // 페이지 로딩 완료 효과
                tbody.classList.remove('loading-page');
                tbody.classList.add('page-loaded');
            }, 150); // 150ms 지연 - 시각적 효과용
        };
        
        // 잔액 재계산 함수
        const recalculateBalances = (startRow) => {
            // 초기 잔액 값 가져오기
            const tbody = popup.querySelector('#expense-detail-list tbody');
            const initialBalanceRow = tbody.querySelector('tr.table-light');
            let initialBalance = 0;
            
            if (initialBalanceRow) {
                const balanceText = initialBalanceRow.querySelector('td:nth-child(6)').textContent;
                initialBalance = parseFloat(balanceText.replace(/[^\d.-]/g, '')) || 0;
                // 음수 값 처리 (마이너스가 텍스트에 포함되어 있는 경우)
                if (balanceText.includes('-')) {
                    initialBalance = -initialBalance;
                }
            }
            
            // 모든 항목 행 가져오기 (첫 번째 행은 초기 잔액 행이므로 제외)
            const itemRows = Array.from(tbody.querySelectorAll('tr:not(.table-light):not(.table-primary)'));
            
            // 잔액 계산을 위한 변수
            let runningBalance = initialBalance;
            let shouldUpdate = false;
            
            for (const row of itemRows) {
                // startRow부터 업데이트 시작
                if (row === startRow) {
                    shouldUpdate = true;
                }
                
                // 금액과 수입/지출 여부 확인
                const amountCell = row.querySelector('.expense-amount');
                const isIncome = amountCell.classList.contains('text-primary');
                const amountText = amountCell.textContent;
                
                // 정확한 금액 추출 (+ 또는 - 기호와 쉼표 제거, 원 문자 제거)
                const cleanedText = amountText.replace(/[,원]/g, '');
                let amount = 0;
                
                // 먼저 숫자만 추출
                const numericValue = parseFloat(cleanedText.replace(/[^0-9.]/g, ''));
                
                // 수입/지출 여부에 따라 부호 처리
                amount = isIncome ? numericValue : numericValue;
                
                // 잔액 업데이트
                if (isIncome) {
                    runningBalance += amount;
                } else {
                    runningBalance -= amount;
                }
                
                // 해당 행의 잔액 셀 업데이트 (startRow부터 시작)
                if (shouldUpdate) {
                    const balanceCell = row.querySelector('.expense-balance');
                    const isPositive = runningBalance >= 0;
                    const balanceClass = isPositive ? 'text-primary' : 'text-danger';
                    const balancePrefix = isPositive ? '+' : '-';
                    
                    balanceCell.className = `expense-balance text-end ${balanceClass}`;
                    balanceCell.textContent = `${balancePrefix}${Utils.number.formatCurrency(Math.abs(runningBalance))}`;
                }
            }
            
            // 최종 잔액 행 업데이트
            const finalBalanceRow = tbody.querySelector('tr.table-primary');
            if (finalBalanceRow) {
                const finalBalanceCell = finalBalanceRow.querySelector('td:nth-child(6)');
                const isPositive = runningBalance >= 0;
                const finalColorClass = isPositive ? 'text-primary' : 'text-danger';
                const finalPrefix = isPositive ? '+' : '';
                
                finalBalanceCell.className = finalColorClass;
                finalBalanceCell.innerHTML = `<strong>${finalPrefix}${Utils.number.formatCurrency(runningBalance)}</strong>`;
            }
        };
        
        // 항목별 액션 버튼 설정 함수
        const setupItemActionButtons = (popupElem) => {
            // 수정 버튼 클릭 이벤트
            popupElem.querySelectorAll('.edit-expense-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const expenseId = parseInt(btn.dataset.id);
                    // 최신 데이터를 가져오기 위해 DataManager에서 직접 조회
                    const updatedExpenses = this.getMonthlyExpenses(DataManager.data.year, month);
                    const expense = updatedExpenses.find(e => e.id === expenseId);
                    
                    if (expense) {
                        // 현재 스크롤 위치 저장
                        const scrollTop = popupElem.querySelector('.table-responsive')?.scrollTop || 0;
                        filterState.scrollTop = scrollTop;
                        
                        // 현재 열려 있는 팝업의 ID를 저장 (나중에 참조하기 위해)
                        this.currentDetailPopup = popup;
                        
                        // 현재 필터 상태 저장 후 수정 폼으로 전달
                        this.showEditExpenseForm(expenseId, expense, month, filterState);
                    }
                });
            });
            
            // 삭제 버튼 클릭 이벤트
            popupElem.querySelectorAll('.delete-expense-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const expenseId = parseInt(btn.dataset.id);
                    
                    if (confirm('정말로 이 항목을 삭제하시겠습니까?')) {
                        try {
                            // 항목 삭제
                            DataManager.removeOneTimeExpense(expenseId);
                            
                            // 해당 행 직접 제거
                            const row = btn.closest('tr');
                            if (row) {
                                // 다음 행부터 잔액 재계산
                                const nextRow = row.nextElementSibling;
                                row.remove();
                                
                                if (nextRow) {
                                    recalculateBalances(nextRow);
                                }
                                
                                // 항목 수 업데이트
                                const itemCountBadge = popup.querySelector('span.badge.bg-primary');
                                if (itemCountBadge) {
                                    const currentCount = parseInt(itemCountBadge.textContent.match(/\d+/)[0]) - 1;
                                    itemCountBadge.textContent = `총 ${currentCount}개 항목`;
                                }
                                
                                // 달력 갱신 (메인 달력 뷰 업데이트)
                                this.renderCalendar();
                                
                                // 이벤트 발생 (다른 컴포넌트에 알림)
                                document.dispatchEvent(new CustomEvent('expenses-updated'));
                            }
                        } catch (error) {
                            console.error('항목 삭제 중 오류 발생:', error);
                            alert('항목 삭제 중 오류가 발생했습니다.');
                        }
                    }
                });
            });
        };
        
        // 새 항목 추가 버튼 이벤트 설정
        const addExpenseBtn = popup.querySelector('#add-expense-in-detail');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => {
                // 현재 팝업을 닫지 않고 지출 추가 폼을 포함한 임시 팝업 생성
                this.showAddExpenseFormInline(month, popup);
            });
        }
        
        // 초기 테이블 렌더링
        renderExpenseTable();
        
        // 요약 탭 데이터 설정
        const mainCategorySummary = popup.querySelector('#main-category-summary tbody');
        const subCategorySummary = popup.querySelector('#sub-category-summary tbody');
        
        // 카테고리별 요약 계산
        const summary = this.summarizeExpensesByCategory(expenses);
        
        // 대분류 요약 테이블 채우기
        Object.values(summary.mainCategories).forEach(category => {
            const row = document.createElement('tr');
            
            // 금액 스타일 설정 (수입/지출에 따라)
            const amountClass = category.isIncome ? 'text-primary' : 'text-danger';
            const amountSign = category.isIncome ? '+' : '-';
            
            row.innerHTML = `
                <td>${category.name}</td>
                <td>${category.count}건</td>
                <td class="${amountClass}">${amountSign}${Utils.number.formatCurrency(category.amount)}</td>
            `;
            mainCategorySummary.appendChild(row);
        });
        
        // 중분류 요약 테이블 채우기
        Object.values(summary.subCategories).forEach(subCategory => {
            const row = document.createElement('tr');
            
            // 금액 스타일 설정 (수입/지출에 따라)
            const amountClass = subCategory.isIncome ? 'text-primary' : 'text-danger';
            const amountSign = subCategory.isIncome ? '+' : '-';
            
            row.innerHTML = `
                <td>${subCategory.name}</td>
                <td>${subCategory.count}건</td>
                <td class="${amountClass}">${amountSign}${Utils.number.formatCurrency(subCategory.amount)}</td>
            `;
            subCategorySummary.appendChild(row);
        });
        
        // 팝업에 recalculateBalances 함수 저장 (나중에 참조하기 위함)
        popup.recalculateBalances = recalculateBalances;
        popup.setupItemActionButtons = setupItemActionButtons;
    },
    
    // 지출 수정 폼 표시
    showEditExpenseForm(expenseId, expense, month, filterState) {
        // 필터 상태 저장
        this.savedFilterState = filterState;
        
        // 기존 팝업 제거
        const existingPopup = document.getElementById('edit-expense-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // 디버깅: expense 객체 확인
        console.log('수정할 항목:', expense);
        
        // 팝업 컨테이너 생성
        const popup = document.createElement('div');
        popup.id = 'edit-expense-popup';
        popup.className = 'expense-popup';
        
        // 팝업 내용 생성 (ID 필드에 실제 고유 ID 저장) - 금액 필드를 맨 아래로 이동
        popup.innerHTML = `
            <div class="popup-content">
                <div class="popup-header">
                    <h3>지출/수입 항목 수정</h3>
                    <button id="close-edit-expense-popup" class="close-popup-btn">&times;</button>
                </div>
                <div class="popup-body">
                    <form id="edit-expense-form">
                        <input type="hidden" id="expense-id" value="${expense.id}">
                        <div class="mb-3">
                            <label for="edit-expense-date" class="form-label">날짜:</label>
                            <input type="date" id="edit-expense-date" class="form-control" value="${expense.date}" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-expense-vendor" class="form-label">거래처:</label>
                            <input type="text" id="edit-expense-vendor" class="form-control" value="${expense.vendor || ''}" placeholder="거래처명">
                        </div>
                        <div class="mb-3">
                            <label for="edit-expense-description" class="form-label">내용:</label>
                            <input type="text" id="edit-expense-description" class="form-control" value="${expense.description}" placeholder="지출 내용" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-expense-main-category" class="form-label">대분류:</label>
                            <select id="edit-expense-main-category" class="form-control main-category-selector" required data-selected="${expense.mainCategory}"></select>
                        </div>
                        <div class="mb-3">
                            <label for="edit-expense-sub-category" class="form-label">중분류:</label>
                            <select id="edit-expense-sub-category" class="form-control sub-category-selector" data-selected="${expense.subCategory || ''}"></select>
                        </div>
                        <div class="mb-3">
                            <div class="form-check">
                                <input type="checkbox" id="edit-expense-actual-payment" class="form-check-input" ${expense.isActualPayment === true ? 'checked' : ''}>
                                <label for="edit-expense-actual-payment" class="form-check-label">실입금 항목</label>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="edit-expense-amount" class="form-label">금액:</label>
                            <input type="number" id="edit-expense-amount" class="form-control" value="${expense.amount}" placeholder="금액" required>
                        </div>
                        <button type="submit" class="btn btn-primary">저장</button>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // 닫기 버튼 이벤트
        popup.querySelector('#close-edit-expense-popup').addEventListener('click', () => {
            popup.remove();
        });
        
        // ESC 키로 팝업 닫기
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                popup.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // 팝업 외부 클릭시 닫기 기능 제거
        
        // 대분류 선택기 초기화 및 선택된 값 설정
        CategoryManager.updateMainCategorySelectors();
        
        // 선택된 대분류 설정
        const mainCategorySelect = document.getElementById('edit-expense-main-category');
        if (mainCategorySelect) {
            mainCategorySelect.value = expense.mainCategory;
            
            // 대분류에 맞는 중분류 옵션 업데이트
            const subCategorySelect = document.getElementById('edit-expense-sub-category');
            CategoryManager.populateSubCategorySelector(expense.mainCategory, subCategorySelect);
            
            // 선택된 중분류 설정
            if (expense.subCategory && subCategorySelect) {
                subCategorySelect.value = expense.subCategory;
            }
            
            // 대분류 변경 시 중분류 옵션 업데이트
            mainCategorySelect.addEventListener('change', () => {
                const mainCode = mainCategorySelect.value;
                if (mainCode) {
                    CategoryManager.populateSubCategorySelector(mainCode, subCategorySelect);
                } else {
                    // 대분류가 선택되지 않은 경우 중분류 초기화
                    Utils.dom.clearElement(subCategorySelect);
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = '중분류 선택';
                    subCategorySelect.appendChild(defaultOption);
                }
            });
        }
        
        // 폼 제출 이벤트
        const editExpenseForm = popup.querySelector('#edit-expense-form');
        editExpenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const id = document.getElementById('expense-id').value;
            const date = document.getElementById('edit-expense-date').value;
            const amount = document.getElementById('edit-expense-amount').value;
            const description = document.getElementById('edit-expense-description').value;
            const mainCategory = document.getElementById('edit-expense-main-category').value;
            const subCategory = document.getElementById('edit-expense-sub-category').value;
            const isActualPayment = document.getElementById('edit-expense-actual-payment').checked;
            const vendor = document.getElementById('edit-expense-vendor').value || '';
            
            console.log('수정 폼 제출:');
            console.log('- ID:', id, '(타입:', typeof id, ')');
            console.log('- 날짜:', date);
            console.log('- 금액:', amount);
            console.log('- 내용:', description);
            console.log('- 대분류:', mainCategory);
            console.log('- 중분류:', subCategory);
            console.log('- 실입금 여부:', isActualPayment);
            console.log('- 원본 항목:', expense);
            
            // 빈 필드 확인
            if (!date || !amount || !description || !mainCategory) {
                alert('모든 필수 필드를 입력해주세요.');
                return;
            }
            
            try {
                // expense 객체에서 원본 고유 ID 가져오기
                const originalId = expense.id;
                console.log('원본 고유 ID:', originalId, '(타입:', typeof originalId, ')');
                
                // 일회성 지출 수정 (고유 ID 사용)
                console.log('updateOneTimeExpense 호출 직전, ID:', originalId);
                
                // 디버깅: ID가 문자열이면 숫자로 변환
                const numericId = parseInt(originalId);
                console.log('변환된 ID:', numericId, '(타입:', typeof numericId, ')');
                
                // 숫자 ID로 항목 업데이트 시도
                const updatedExpense = DataManager.updateOneTimeExpense(
                    isNaN(numericId) ? originalId : numericId,
                    date,
                    parseFloat(amount),
                    description,
                    mainCategory,
                    subCategory,
                    isActualPayment,
                    document.getElementById('edit-expense-vendor').value || ''
                );
                
                console.log('수정 성공, 업데이트된 항목:', updatedExpense);
                
                // 달력 갱신
                this.renderCalendar();
                
                // 지출 데이터 변경 이벤트 발생
                document.dispatchEvent(new CustomEvent('expenses-updated'));
                
                // 성공 메시지
                alert('항목이 수정되었습니다.');
                
                // 수정 팝업 닫기
                popup.remove();
                
                // 상세보기 팝업이 있는 경우 직접 항목 업데이트
                if (this.currentDetailPopup) {
                    const detailTable = this.currentDetailPopup.querySelector('#expense-detail-list tbody');
                    if (detailTable) {
                        // 해당 행 찾기
                        const rows = Array.from(detailTable.querySelectorAll('tr:not(.table-light):not(.table-primary)'));
                        let updatedRow = null;
                        
                        for (const row of rows) {
                            const actionBtns = row.querySelectorAll('button[data-id]');
                            for (const btn of actionBtns) {
                                if (parseInt(btn.dataset.id) === numericId) {
                                    updatedRow = row;
                                    break;
                                }
                            }
                            
                            if (updatedRow) break;
                        }
                        
                        if (updatedRow) {
                            // 필요한 데이터 갱신
                            const mainCategory = DataManager.data.categories.main.find(c => c.code === mainCategory);
                            const subCategoryObj = DataManager.data.categories.sub.find(c => c.code === subCategory);
                            const isIncome = mainCategory?.type === 'income';
                            
                            // 금액 셀 업데이트
                            const amountCell = updatedRow.querySelector('.expense-amount');
                            if (amountCell) {
                                const amountClass = isIncome ? 'text-primary' : 'text-danger';
                                const amountPrefix = isIncome ? '+' : '-';
                                amountCell.className = `expense-amount ${amountClass}`;
                                amountCell.textContent = `${amountPrefix}${Utils.number.formatCurrency(amount)}`;
                            }
                            
                            // 날짜 및 설명 업데이트
                            const dateCell = updatedRow.querySelector('td:first-child');
                            if (dateCell) dateCell.textContent = date;
                            
                            const descriptionCell = updatedRow.querySelector('td:nth-child(3)');
                            if (descriptionCell) descriptionCell.textContent = description;
                            
                            // 분류 업데이트
                            const categoryCell = updatedRow.querySelector('td:nth-child(4)');
                            if (categoryCell) {
                                // 분류 표시 방식 변경 - 중분류가 있으면 중분류만, 없으면 대분류 표시
                                const categoryDisplay = subCategoryObj?.name ? subCategoryObj.name : mainCategory?.name;
                                categoryCell.textContent = categoryDisplay;
                            }
                            
                            // 거래처 업데이트
                            const vendorCell = updatedRow.querySelector('td:nth-child(5)');
                            if (vendorCell) vendorCell.textContent = vendor;
                            
                            // 실입금 배지 업데이트
                            const badgeCell = updatedRow.querySelector('td:nth-child(6)');
                            if (badgeCell) {
                                const badge = badgeCell.querySelector('.actual-payment-badge');
                                if (badge) {
                                    if (isActualPayment) {
                                        badge.className = 'badge bg-success actual-payment-badge';
                                        badge.textContent = '✓';
                                    } else {
                                        badge.className = 'badge bg-secondary actual-payment-badge';
                                        badge.textContent = '✗';
                                    }
                                }
                            }
                            
                            // 행부터 잔액 재계산
                            recalculateBalances(updatedRow);
                        }
                    }
                    
                    // 저장된 스크롤 위치 복원
                    if (this.savedFilterState && this.savedFilterState.scrollTop !== undefined) {
                        const tableContainer = this.currentDetailPopup.querySelector('.table-responsive');
                        if (tableContainer) {
                            tableContainer.scrollTop = this.savedFilterState.scrollTop;
                        }
                    }
                }
            } catch (error) {
                console.error('수정 오류 발생:', error);
                alert('수정 중 오류가 발생했습니다: ' + error.message);
            }
        });
    },
    
    // 달력 이벤트 리스너 설정
    setupCalendarEventListeners() {
        // 년도 이동 버튼 (이전년도)
        const prevYearBtn = document.getElementById('prev-year-btn');
        if (prevYearBtn) {
            prevYearBtn.addEventListener('click', () => {
                DataManager.changeYear(DataManager.data.year - 1);
                this.renderCalendar();
            });
        }
        
        // 년도 이동 버튼 (다음년도)
        const nextYearBtn = document.getElementById('next-year-btn');
        if (nextYearBtn) {
            nextYearBtn.addEventListener('click', () => {
                DataManager.changeYear(DataManager.data.year + 1);
                this.renderCalendar();
            });
        }
    },
    
    // 지출 추가 버튼에 이벤트 리스너 추가
    setupAddExpenseButtons() {
        const addExpenseButtons = document.querySelectorAll('.add-expense-btn');
        addExpenseButtons.forEach(button => {
            button.addEventListener('click', () => {
                const month = button.dataset.month;
                this.showAddExpenseForm(month);
            });
        });
    },
    
    // 지출 추가 폼 표시 - 기본 버전 (월별 달력에서 호출)
    showAddExpenseForm(month) {
        // 기존 팝업 제거
        const existingPopup = document.getElementById('add-expense-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // 현재 년도 가져오기
        const year = DataManager.data.year;
        
        // 해당 월의 기본 날짜 설정 (해당 월의 1일)
        const defaultDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        
        // 팝업 컨테이너 생성
        const popup = document.createElement('div');
        popup.id = 'add-expense-popup';
        popup.className = 'expense-popup';
        
        // 팝업 내용 생성 - 금액 입력창을 제일 아래로 이동
        popup.innerHTML = `
            <div class="popup-content">
                <div class="popup-header">
                    <h3>${year}년 ${month}월 지출 등록</h3>
                    <button id="close-add-expense-popup" class="close-popup-btn">&times;</button>
                </div>
                <div class="popup-body">
                    <form id="add-expense-form">
                        <div class="mb-3">
                            <label for="expense-date" class="form-label">날짜:</label>
                            <input type="date" id="expense-date" class="form-control" value="${defaultDate}" required>
                        </div>
                        <div class="mb-3">
                            <label for="expense-vendor" class="form-label">거래처:</label>
                            <input type="text" id="expense-vendor" class="form-control" placeholder="거래처명">
                        </div>
                        <div class="mb-3">
                            <label for="expense-description" class="form-label">내용:</label>
                            <input type="text" id="expense-description" class="form-control" placeholder="지출 내용" required>
                        </div>
                        <div class="mb-3">
                            <label for="expense-main-category" class="form-label">대분류:</label>
                            <select id="expense-main-category" class="form-control main-category-selector" required></select>
                        </div>
                        <div class="mb-3">
                            <label for="expense-sub-category" class="form-label">중분류:</label>
                            <select id="expense-sub-category" class="form-control sub-category-selector"></select>
                        </div>
                        <div class="mb-3">
                            <div class="form-check">
                                <input type="checkbox" id="expense-actual-payment" class="form-check-input">
                                <label for="expense-actual-payment" class="form-check-label">실입금 항목</label>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="expense-amount" class="form-label">금액:</label>
                            <input type="number" id="expense-amount" class="form-control" placeholder="금액" required>
                        </div>
                        <button type="submit" class="btn btn-primary">등록</button>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // 닫기 버튼 이벤트
        popup.querySelector('#close-add-expense-popup').addEventListener('click', () => {
            popup.remove();
        });
        
        // ESC 키로 팝업 닫기
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                popup.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // 팝업 외부 클릭시 닫기 기능 제거
        
        // 대분류 선택기 초기화
        CategoryManager.updateMainCategorySelectors();
        
        // 폼 제출 이벤트
        const addExpenseForm = popup.querySelector('#add-expense-form');
        addExpenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const date = document.getElementById('expense-date').value;
            const amount = document.getElementById('expense-amount').value;
            const description = document.getElementById('expense-description').value;
            const mainCategory = document.getElementById('expense-main-category').value;
            const subCategory = document.getElementById('expense-sub-category').value;
            const isActualPayment = document.getElementById('expense-actual-payment').checked;
            const vendor = document.getElementById('expense-vendor').value || '';
            
            // 빈 필드 확인
            if (!date || !amount || !description || !mainCategory) {
                alert('모든 필수 필드를 입력해주세요.');
                return;
            }
            
            // 일회성 지출 추가
            try {
                DataManager.addOneTimeExpense(date, parseFloat(amount), description, mainCategory, subCategory, isActualPayment, vendor);
                
                // 달력 업데이트
                this.renderCalendar();
                
                // 지출 데이터 변경 이벤트 발생
                document.dispatchEvent(new CustomEvent('expenses-updated'));
                
                // 성공 메시지
                alert('지출이 성공적으로 등록되었습니다.');
                
                // 팝업 닫기
                popup.remove();
            } catch (error) {
                alert('지출 등록 중 오류가 발생했습니다: ' + error.message);
            }
        });
        
        // 대분류 변경 시 중분류 업데이트
        const mainCategorySelect = document.getElementById('expense-main-category');
        const subCategorySelect = document.getElementById('expense-sub-category');
        
        mainCategorySelect.addEventListener('change', () => {
            const mainCode = mainCategorySelect.value;
            if (mainCode) {
                // 대분류에 맞는 중분류 옵션 업데이트
                CategoryManager.populateSubCategorySelector(mainCode, subCategorySelect);
            } else {
                // 대분류가 선택되지 않은 경우 중분류 초기화
                Utils.dom.clearElement(subCategorySelect);
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = '중분류 선택';
                subCategorySelect.appendChild(defaultOption);
            }
        });
    },
    
    // 지출 추가 폼을 현재 팝업 내에 표시 (상세보기에서 닫지 않고 사용)
    showAddExpenseFormInline(month, parentPopup) {
        // 임시 팝업 컨테이너 생성
        const inlinePopup = document.createElement('div');
        inlinePopup.id = 'add-expense-inline-popup';
        inlinePopup.className = 'inline-popup';
        
        // 현재 필터 상태 저장
        let filterState = {};
        if (parentPopup) {
            filterState = {
                startDate: document.getElementById('date-filter-start')?.value,
                endDate: document.getElementById('date-filter-end')?.value,
                mainCategory: document.getElementById('main-category-filter')?.value,
                subCategory: document.getElementById('sub-category-filter')?.value,
                vendor: document.getElementById('vendor-filter')?.value,
                description: document.getElementById('description-filter')?.value,
                scrollTop: parentPopup.querySelector('.table-responsive')?.scrollTop || 0
            };
        }
        
        // 현재 월의 날짜를 기본값으로 설정
        const now = new Date();
        let defaultDate = `${DataManager.data.year}-${month.toString().padStart(2, '0')}`;
        
        // 현재 월이 이번 달과 같으면 오늘 날짜, 아니면 해당 월의 1일로 설정
        if (DataManager.data.year === now.getFullYear() && month === now.getMonth() + 1) {
            defaultDate = `${defaultDate}-${now.getDate().toString().padStart(2, '0')}`;
        } else {
            defaultDate = `${defaultDate}-01`;
        }
        
        // 팝업 내용 생성 - 금액 필드를 맨 아래로 이동
        inlinePopup.innerHTML = `
            <div class="popup-content">
                <div class="popup-header">
                    <h3>지출/수입 항목 추가</h3>
                    <button id="close-inline-popup" class="close-popup-btn">&times;</button>
                </div>
                <div class="popup-body">
                    <form id="add-expense-inline-form">
                        <div class="mb-3">
                            <label for="add-expense-inline-date" class="form-label">날짜:</label>
                            <input type="date" id="add-expense-inline-date" class="form-control" value="${defaultDate}" required>
                        </div>
                        <div class="mb-3">
                            <label for="add-expense-inline-vendor" class="form-label">거래처:</label>
                            <input type="text" id="add-expense-inline-vendor" class="form-control" placeholder="거래처명">
                        </div>
                        <div class="mb-3">
                            <label for="add-expense-inline-description" class="form-label">내용:</label>
                            <input type="text" id="add-expense-inline-description" class="form-control" placeholder="지출 내용" required>
                        </div>
                        <div class="mb-3">
                            <label for="add-expense-inline-main-category" class="form-label">대분류:</label>
                            <select id="add-expense-inline-main-category" class="form-control main-category-selector" required></select>
                        </div>
                        <div class="mb-3">
                            <label for="add-expense-inline-sub-category" class="form-label">중분류:</label>
                            <select id="add-expense-inline-sub-category" class="form-control sub-category-selector"></select>
                        </div>
                        <div class="mb-3">
                            <div class="form-check">
                                <input type="checkbox" id="add-expense-inline-actual-payment" class="form-check-input" checked>
                                <label for="add-expense-inline-actual-payment" class="form-check-label">실입금 항목</label>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="add-expense-inline-amount" class="form-label">금액:</label>
                            <input type="number" id="add-expense-inline-amount" class="form-control" placeholder="금액" required>
                        </div>
                        <button type="submit" class="btn btn-primary">저장</button>
                        <button type="button" id="cancel-add-expense-inline" class="btn btn-secondary">취소</button>
                    </form>
                </div>
            </div>
        `;
        
        // 부모 요소에 임시 팝업 추가
        if (parentPopup) {
            // 부모 팝업의 본문 앞에 추가
            const parentBody = parentPopup.querySelector('.popup-body');
            if (parentBody) {
                parentBody.insertBefore(inlinePopup, parentBody.firstChild);
            }
        } else {
            document.body.appendChild(inlinePopup);
        }
        
        // 대분류 선택기 초기화
        CategoryManager.updateMainCategorySelectors();
        
        // 대분류 변경 이벤트 - 중분류 옵션 업데이트
        const mainCategorySelect = document.getElementById('add-expense-inline-main-category');
        const subCategorySelect = document.getElementById('add-expense-inline-sub-category');
        
        if (mainCategorySelect && subCategorySelect) {
            mainCategorySelect.addEventListener('change', () => {
                const mainCode = mainCategorySelect.value;
                if (mainCode) {
                    CategoryManager.populateSubCategorySelector(mainCode, subCategorySelect);
                } else {
                    // 대분류가 선택되지 않은 경우 중분류 초기화
                    Utils.dom.clearElement(subCategorySelect);
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = '중분류 선택';
                    subCategorySelect.appendChild(defaultOption);
                }
            });
        }
        
        // 인라인 팝업 닫기 함수
        const closeInlinePopup = () => {
            const popup = document.getElementById('add-expense-inline-popup');
            if (popup) {
                popup.remove();
            }
        };
        
        // ESC 키로 팝업 닫기
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeInlinePopup();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // 닫기 버튼 이벤트
        inlinePopup.querySelector('#close-inline-popup').addEventListener('click', closeInlinePopup);
        
        // 취소 버튼 이벤트
        inlinePopup.querySelector('#cancel-add-expense-inline').addEventListener('click', closeInlinePopup);
        
        // 폼 제출 이벤트
        const form = inlinePopup.querySelector('#add-expense-inline-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // 폼 데이터 가져오기
                const date = document.getElementById('add-expense-inline-date').value;
                const amount = document.getElementById('add-expense-inline-amount').value;
                const description = document.getElementById('add-expense-inline-description').value;
                const mainCategory = document.getElementById('add-expense-inline-main-category').value;
                const subCategory = document.getElementById('add-expense-inline-sub-category').value;
                const isActualPayment = document.getElementById('add-expense-inline-actual-payment').checked;
                const vendor = document.getElementById('add-expense-inline-vendor').value || '';
                
                // 빈 필드 확인
                if (!date || !amount || !description || !mainCategory) {
                    alert('모든 필수 필드를 입력해주세요.');
                    return;
                }
                
                try {
                    // DataManager를 통해 일회성 지출 항목 추가
                    DataManager.addOneTimeExpense(
                        date,
                        parseFloat(amount),
                        description,
                        mainCategory,
                        subCategory || null,
                        isActualPayment,
                        vendor
                    );
                    
                    // 달력 갱신
                    this.renderCalendar();
                    
                    // 지출 데이터 변경 이벤트 발생
                    document.dispatchEvent(new CustomEvent('expenses-updated'));
                    
                    // 성공 메시지
                    alert('항목이 추가되었습니다.');
                    
                    // 인라인 팝업 닫고 상세보기 업데이트
                    closeInlinePopup();
                    const updatedExpenses = this.getMonthlyExpenses(DataManager.data.year, month);
                    
                    // 상위 팝업이 있으면 제거하고 다시 열기
                    if (parentPopup) {
                        parentPopup.remove();
                        this.showExpenseDetail(month, updatedExpenses, filterState);
                        
                        // 스크롤 위치 복원 (약간의 지연 후)
                        setTimeout(() => {
                            const newPopup = document.getElementById('expense-detail-popup');
                            if (newPopup && filterState.scrollTop) {
                                const tableContainer = newPopup.querySelector('.table-responsive');
                                if (tableContainer) {
                                    tableContainer.scrollTop = filterState.scrollTop;
                                }
                            }
                        }, 200);
                    }
                } catch (error) {
                    console.error('지출 항목 추가 중 오류 발생:', error);
                    alert('지출 항목 추가 중 오류가 발생했습니다.');
                }
            });
        }
    },
    
    // 이월 잔액 계산
    calculateMonthlyBalanceWithCarryover() {
        // 월별 잔액 계산을 위한 배열 (1월부터 12월까지)
        const monthlyBalance = Array(12).fill(0);
        
        // 일회성 지출/수입 처리
        DataManager.data.oneTimeExpenses.forEach(expense => {
            if (expense.date) {
                const expenseDate = new Date(expense.date);
                const expenseYear = expenseDate.getFullYear();
                
                // 현재 연도의 지출만 처리, 실입금 항목 여부와 상관없이 모든 항목 포함
                if (expenseYear === DataManager.data.year) {
                    const expenseMonth = expenseDate.getMonth();
                    
                    // 대분류 정보 찾기
                    const mainCategory = DataManager.data.categories.main.find(c => c.code === expense.mainCategory);
                    const isIncome = mainCategory?.type === 'income';
                    
                    // 수입은 양수, 지출은 음수로 저장
                    const amount = isIncome ? expense.amount : -expense.amount;
                    monthlyBalance[expenseMonth] += amount;
                }
            }
        });
        
        // 이월 잔액을 포함한 월별 데이터 (원본 금액, 이월액, 최종 잔액)
        const monthlyData = monthlyBalance.map((balance, index) => ({
            month: index + 1,
            originalBalance: balance, // 해당 월의 실제 수입/지출 금액 (이월 전)
            carryoverFromPrev: 0,     // 이전 달에서 이월된 금액
            finalBalance: balance     // 최종 잔액 (원래 금액 + 이월 금액)
        }));
        
        // 이월액 계산 (1월부터 11월까지)
        for (let i = 0; i < 11; i++) {
            const currentMonth = monthlyData[i];
            const nextMonth = monthlyData[i + 1];
            
            // 현재 달의 최종 잔액을 다음 달의 이월액으로 설정
            nextMonth.carryoverFromPrev = currentMonth.finalBalance;
            // 다음 달의 최종 잔액은 원래 잔액 + 이월액
            nextMonth.finalBalance = nextMonth.originalBalance + nextMonth.carryoverFromPrev;
        }
        
        return monthlyData;
    },

    // 월별 지출/수입 요약
    summarizeMonthlyData(monthlyData) {
        // 각 월별 순수 수입/지출 계산 (이월 제외)
        let totalOriginalIncome = 0;  // 순수 수입 합계
        let totalOriginalExpense = 0;  // 순수 지출 합계
        
        console.log('월별 원본 데이터 요약:');
        
        // 모든 일회성 지출/수입 항목을 직접 순회하며 정확히 계산, 실입금 여부 상관없이 모든 항목 포함
        DataManager.data.oneTimeExpenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            const expenseYear = expenseDate.getFullYear();
            
            // 현재 선택된 연도의 지출/수입만 계산하고, 모든 항목 포함
            if (expenseYear === DataManager.data.year) {
                // 대분류 정보 찾기
                const mainCategory = DataManager.data.categories.main.find(c => c.code === expense.mainCategory);
                const isIncome = mainCategory?.type === 'income';
                
                // 수입과 지출 구분해서 합산
                if (isIncome) {
                    totalOriginalIncome += expense.amount;
                    console.log(`일회성 수입: +${expense.amount} (${expense.description}), 날짜: ${expense.date}`);
                } else {
                    totalOriginalExpense += expense.amount;
                    console.log(`일회성 지출: -${expense.amount} (${expense.description}), 날짜: ${expense.date}`);
                }
            }
        });
        
        console.log('총 순수 수입:', totalOriginalIncome);
        console.log('총 순수 지출:', totalOriginalExpense);
        
        // 최종 12월 누적 잔액 (연간 순수입/지출)
        const finalBalance = monthlyData[11]?.finalBalance || 0;
        
        return {
            totalOriginalIncome,
            totalOriginalExpense,
            finalBalance
        };
    },
    
    // 공휴일인지 확인하는 함수
    isHoliday(date) {
        // 날짜 포맷: YYYY-MM-DD
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 월은 0부터 시작하므로 +1
        const day = date.getDate();
        
        // 주요 공휴일 목록 (월-일 형식으로 고정된 공휴일만)
        const fixedHolidays = {
            '1-1': '신정',
            '3-1': '삼일절',
            '5-5': '어린이날',
            '6-6': '현충일',
            '8-15': '광복절',
            '10-3': '개천절',
            '10-9': '한글날',
            '12-25': '크리스마스'
        };
        
        // 월-일 형식의 키 생성
        const key = `${month}-${day}`;
        
        // 고정 공휴일인지 확인
        if (fixedHolidays[key]) {
            return true;
        }
        
        // 설날, 추석 등 음력 공휴일은 더 복잡한 계산이 필요하지만 여기서는 생략
        // 실제 구현 시에는 음력-양력 변환 알고리즘 또는 외부 라이브러리 사용 권장
        
        return false;
    },
    
    // 월별 지출 상세 요약 표시
    showMonthlyDetail(month) {
        // 이전 팝업이 있으면 제거
        const existingPopup = document.querySelector('.popup-container');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // 월별 데이터 가져오기
        const monthData = this.months[month - 1];
        if (!monthData) {
            alert('해당 월의 데이터가 없습니다.');
            return;
        }
        
        // 팝업 생성
        const popup = document.createElement('div');
        popup.classList.add('popup-container');
        
        // 팝업 내용 생성
        popup.innerHTML = `
            <div class="popup-content" style="max-width: 1200px; width: 95%;">
                <div class="popup-header">
                    <h3>${DataManager.data.year}년 ${month}월 지출 내역</h3>
                    <button id="close-popup" class="close-popup-btn">&times;</button>
                </div>
                <div class="popup-body">
                    <div class="mb-3 d-flex justify-content-between align-items-center">
                        <div>
                            <strong class="text-primary me-3">수입 합계: ${Utils.number.formatCurrency(monthData.totalIncome)}</strong>
                            <strong class="text-danger me-3">지출 합계: ${Utils.number.formatCurrency(monthData.totalExpense)}</strong>
                            <strong>잔액: ${Utils.number.formatCurrency(monthData.totalIncome - monthData.totalExpense)}</strong>
                        </div>
                        <div>
                            <input type="text" id="month-search" class="form-control" placeholder="검색..." style="width: 200px;">
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover" id="expense-detail-list">
                            <thead>
                                <tr>
                                    <th class="sortable-col" data-field="date" style="width: 9%;">날짜</th>
                                    <th class="sortable-col" data-field="vendor" style="width: 10%;">거래처</th>
                                    <th class="sortable-col" data-field="description" style="width: 24%;">내용</th>
                                    <th class="sortable-col" data-field="category" style="width: 7%;">분류</th>
                                    <th class="text-end sortable-col" data-field="amount" style="width: 12%;">금액</th>
                                    <th class="text-end sortable-col" data-field="balance" style="width: 12%;">잔액</th>
                                    <th class="text-center" style="width: 8%;">실입금</th>
                                    <th class="text-center" style="width: 15%;">액션</th>
                                </tr>
                            </thead>
                            <tbody id="expense-detail-body"></tbody>
                        </table>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <button id="prev-page" class="btn btn-sm btn-outline-secondary">이전</button>
                        <span id="page-info">1 / 1</span>
                        <button id="next-page" class="btn btn-sm btn-outline-secondary">다음</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // 닫기 버튼에 이벤트 리스너
        document.getElementById('close-popup').addEventListener('click', () => {
            popup.remove();
        });
        
        // ESC 키로 팝업 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.querySelector('.popup-container')) {
                popup.remove();
            }
        });
        
        // 데이터 표시
        this.renderMonthDetail(month);
        
        // 정렬 이벤트 설정
        document.querySelectorAll('.sortable-col').forEach(col => {
            col.addEventListener('click', (e) => {
                const field = e.target.dataset.field;
                this.sortExpenseDetails(field);
            });
        });
        
        // 검색 기능 설정
        document.getElementById('month-search').addEventListener('input', (e) => {
            this.searchExpenseDetails(e.target.value);
        });
        
        // 페이지 이동 버튼 이벤트
        document.getElementById('prev-page').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderMonthDetail(month);
            }
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.renderMonthDetail(month);
            }
        });
    },
    
    generateMonthHTML(month, monthId) {
        const isCurrentMonth = new Date().getMonth() + 1 === month;
        const cardClass = isCurrentMonth ? 'month-card current-month' : 'month-card';
        
        // 해당 월의 데이터 가져오기
        const monthData = this.months[month - 1] || {
            totalIncome: 0,
            totalExpense: 0,
            categories: [],
            items: []
        };
        
        // 항목이 있는지 확인
        const hasData = monthData.items.length > 0;
        
        // 잔액 계산
        const balance = monthData.totalIncome - monthData.totalExpense;
        const balanceClass = balance >= 0 ? 'text-primary' : 'text-danger';
        const balancePrefix = balance >= 0 ? '+' : '';
        
        // 요약 테이블 생성
        let summaryTableHTML = `
            <table class="summary-table">
                <thead>
                    <tr>
                        <th>구분</th>
                        <th class="text-end">금액</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>수입</td>
                        <td class="text-end text-primary">+${Utils.number.formatCurrency(monthData.totalIncome)}</td>
                    </tr>
                    <tr>
                        <td>지출</td>
                        <td class="text-end text-danger">-${Utils.number.formatCurrency(monthData.totalExpense)}</td>
                    </tr>
                </tbody>
            </table>
        `;
        
        // 카테고리별 요약 테이블
        let categoryTableHTML = '';
        if (hasData && monthData.categories.length > 0) {
            categoryTableHTML = `
                <div class="mt-3">
                    <h6 class="mb-2">분류별 요약</h6>
                    <table class="summary-table">
                        <thead>
                            <tr>
                                <th>분류</th>
                                <th class="text-end">금액</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            monthData.categories.forEach(category => {
                const isIncome = category.isIncome;
                const amountClass = isIncome ? 'text-primary' : 'text-danger';
                const amountPrefix = isIncome ? '+' : '-';
                
                categoryTableHTML += `
                    <tr>
                        <td>${category.name || '미분류'}</td>
                        <td class="text-end ${amountClass}">${amountPrefix}${Utils.number.formatCurrency(category.amount)}</td>
                    </tr>
                `;
            });
            
            categoryTableHTML += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        // 월 카드 HTML 생성
        return `
            <div class="${cardClass}" id="${monthId}">
                <div class="month-header">
                    <span>${month}월</span>
                    <span class="${balanceClass}">${balancePrefix}${Utils.number.formatCurrency(balance)}</span>
                </div>
                <div class="month-body">
                    ${summaryTableHTML}
                    ${hasData ? categoryTableHTML : '<p class="text-center text-muted my-3">데이터가 없습니다.</p>'}
                    ${hasData ? `<button class="btn btn-sm btn-outline-primary w-100 mt-2" data-month="${month}">상세 보기</button>` : ''}
                </div>
            </div>
        `;
    }
}; 