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
                if (month > 0 && monthData.carryoverFromPrev !== 0) {
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
                
                // 해당 월 순수 수입/지출 정보 표시
                if (month === 4) { // 5월 달에 대해 명확한 정보 표시
                    const originalBalanceDiv = document.createElement('div');
                    originalBalanceDiv.className = 'mb-2 p-2 bg-light border-start border-primary border-3';
                    
                    originalBalanceDiv.innerHTML = `
                        <div>
                            <small>순수 수입: <span class="text-primary">+${Utils.number.formatCurrency(categorySummary.totalIncome)}</span></small>
                        </div>
                        <div>
                            <small>순수 지출: <span class="text-danger">-${Utils.number.formatCurrency(categorySummary.totalExpense)}</span></small>
                        </div>
                    `;
                    monthBody.appendChild(originalBalanceDiv);
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
                finalBalanceRow.className = 'summary-total';
                
                const isPositiveFinal = monthData.finalBalance >= 0;
                const finalColorClass = isPositiveFinal ? 'text-primary' : 'text-danger';
                const finalPrefix = isPositiveFinal ? '+' : '';
                
                finalBalanceRow.innerHTML = `
                    <td colspan="2"><strong>최종 잔액</strong></td>
                    <td class="${finalColorClass}"><strong>${finalPrefix}${Utils.number.formatCurrency(monthData.finalBalance)}</strong></td>
                `;
                tableBody.appendChild(finalBalanceRow);
                
                summaryTable.appendChild(tableBody);
                monthBody.appendChild(summaryTable);
            } else {
                // 지출 항목이 없는 경우
                // 이월 잔액은 있을 수 있음
                if (month > 0 && monthData.carryoverFromPrev !== 0) {
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
            // 해당 월의 지출만 필터링
            if (expense.date && expense.date.startsWith(yearMonth)) {
                // 대분류 정보 찾기
                const mainCategory = DataManager.data.categories.main.find(c => c.code === expense.mainCategory);
                const isIncome = mainCategory?.type === 'income';
                
                // 중분류 정보 찾기
                const subCategory = DataManager.data.categories.sub.find(c => c.code === expense.subCategory);
                
                // 지출/수입 항목 추가
                expenses.push({
                    id: expense.id || `onetime-${index}`,  // 고유 ID 사용, 없으면 인덱스 기반 ID 사용
                    dbIndex: index,  // 데이터베이스 배열 인덱스 (디버깅용)
                    date: expense.date,
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
                    isActualPayment: expense.isActualPayment
                });
            }
        });
        
        // 날짜 기준 내림차순 정렬
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        
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
            const mainName = expense.mainCategoryName || '미분류';
            
            // 대분류 객체 찾기 (type 속성 가져오기 위함)
            const mainCategoryObj = DataManager.data.categories.main.find(c => c.code === mainKey);
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
    showExpenseDetail(month, expenses) {
        // 기존 팝업 제거
        const existingPopup = document.getElementById('expense-detail-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // 페이징 설정
        const itemsPerPage = 10; // 페이지당 항목 수
        let currentPage = 1;
        
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
        
        // 팝업 내용 생성
        popup.innerHTML = `
            <div class="popup-content" style="max-width: 1400px; width: 95%;">
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
                            <!-- 날짜 검색 필터 추가 -->
                            <div class="row mb-3 mt-2">
                                <div class="col-md-6">
                                    <div class="input-group">
                                        <span class="input-group-text">날짜 범위</span>
                                        <input type="date" id="date-filter-start" class="form-control" value="${DataManager.data.year}-${month.toString().padStart(2, '0')}-01">
                                        <span class="input-group-text">~</span>
                                        <input type="date" id="date-filter-end" class="form-control" value="${DataManager.data.year}-${month.toString().padStart(2, '0')}-${new Date(DataManager.data.year, month, 0).getDate().toString().padStart(2, '0')}">
                                        <button id="apply-date-filter" class="btn btn-primary">적용</button>
                                        <button id="reset-date-filter" class="btn btn-outline-secondary">초기화</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center my-2">
                                <div class="d-flex align-items-center">
                                    <div class="me-3">
                                        <span class="badge bg-primary">총 ${expenses.length}개 항목</span>
                                        <span class="badge bg-primary">수입: ${Utils.number.formatCurrency(totalIncome)}</span>
                                        <span class="badge bg-danger">지출: ${Utils.number.formatCurrency(totalExpense)}</span>
                                        <span class="badge ${netAmountClass}">순액: ${netAmountPrefix}${Utils.number.formatCurrency(absNetAmount)}</span>
                                    </div>
                                    <button id="prevPage" class="pagination-button"><i class="bi bi-chevron-left"></i> 이전</button>
                                    <div class="page-info">
                                        <span id="currentPageDisplay">1</span> / <span id="totalPagesDisplay">1</span>
                                        <span class="small text-muted ms-2">(${Math.min(1, expenses.length)}-${Math.min(itemsPerPage, expenses.length)}/${expenses.length}개)</span>
                                    </div>
                                    <button id="nextPage" class="pagination-button">다음 <i class="bi bi-chevron-right"></i></button>
                                </div>
                                <div>
                                    <button id="add-expense-in-detail" class="btn btn-sm btn-success">
                                        <i class="bi bi-plus"></i> 새 항목 추가
                                    </button>
                                </div>
                            </div>
                            <div class="table-responsive">
                                <table class="table table-hover" id="expense-detail-list" style="width: 100%; table-layout: fixed;">
                                    <thead>
                                        <tr>
                                            <th style="width: 15%; font-size: 15px; background-color: #f0f0f0;">날짜</th>
                                            <th style="width: 25%; font-size: 15px; background-color: #f0f0f0;">내용</th>
                                            <th style="width: 20%; font-size: 15px; background-color: #f0f0f0;">분류</th>
                                            <th style="width: 15%; font-size: 15px; background-color: #f0f0f0; text-align: right;">금액</th>
                                            <th style="width: 7%; font-size: 15px; background-color: #f0f0f0; text-align: center;">실입금</th>
                                            <th style="width: 12%; font-size: 15px; background-color: #f0f0f0; text-align: right;">잔액</th>
                                            <th style="width: 10%; font-size: 15px; background-color: #f0f0f0; text-align: center;">관리</th>
                                        </tr>
                                    </thead>
                                    <tbody>
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
                                            <th>대분류</th>
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
        
        // 팝업 내부 탭 초기화
        const tabButtons = popup.querySelectorAll('#expenseDetailTabs [data-bs-toggle="tab"]');
        const tabContents = popup.querySelectorAll('#expenseDetailTabContent .tab-pane');
            
        tabButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                    
                // 모든 탭 버튼 비활성화
                tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-selected', 'false');
                });
                    
                // 클릭한 탭 버튼 활성화
                this.classList.add('active');
                this.setAttribute('aria-selected', 'true');
                    
                // 모든 탭 콘텐츠 숨기기
                tabContents.forEach(content => {
                    content.classList.remove('show', 'active');
                });
                    
                // 클릭한 탭에 해당하는 콘텐츠 표시
                const targetId = this.getAttribute('data-bs-target');
                const targetContent = popup.querySelector(targetId);
                if (targetContent) {
                    targetContent.classList.add('show', 'active');
                }
            });
        });
        
        // 팝업 닫기 버튼 이벤트
        popup.querySelector('#close-popup').addEventListener('click', () => {
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
        
        // 날짜 필터 변수 초기화
        let filteredExpenses = [...expenses]; // 원본 데이터의 복사본으로 시작
        
        // 날짜 필터 적용 함수
        const applyDateFilter = () => {
            const startDate = document.getElementById('date-filter-start').value;
            const endDate = document.getElementById('date-filter-end').value;
            
            if (!startDate || !endDate) {
                alert('시작 날짜와 종료 날짜를 모두 입력해주세요.');
                return;
            }
            
            // 필터링된 지출 항목 업데이트
            filteredExpenses = expenses.filter(expense => {
                return expense.date >= startDate && expense.date <= endDate;
            });
            
            // 페이지 리셋 후 테이블 다시 렌더링
            currentPage = 1;
            renderExpenseTable();
            
            // 필터링 결과 요약 업데이트
            updateFilteredSummary();
        };
        
        // 필터링된 요약 정보 업데이트
        const updateFilteredSummary = () => {
            let totalFilteredIncome = 0;
            let totalFilteredExpense = 0;
            
            filteredExpenses.forEach(expense => {
                if (expense.isIncome) {
                    totalFilteredIncome += expense.amount;
                } else {
                    totalFilteredExpense += expense.amount;
                }
            });
            
            const netFilteredAmount = totalFilteredIncome - totalFilteredExpense;
            const netFilteredPrefix = netFilteredAmount >= 0 ? '+' : '-';
            const netFilteredClass = netFilteredAmount >= 0 ? 'text-primary' : 'text-danger';
            const absNetFilteredAmount = Math.abs(netFilteredAmount);
            
            // 배지 업데이트
            const badgeContainer = popup.querySelector('.me-3');
            badgeContainer.innerHTML = `
                <span class="badge bg-primary">총 ${filteredExpenses.length}개 항목</span>
                <span class="badge bg-primary">수입: ${Utils.number.formatCurrency(totalFilteredIncome)}</span>
                <span class="badge bg-danger">지출: ${Utils.number.formatCurrency(totalFilteredExpense)}</span>
                <span class="badge ${netFilteredClass}">순액: ${netFilteredPrefix}${Utils.number.formatCurrency(absNetFilteredAmount)}</span>
            `;
        };
        
        // 날짜 필터 이벤트 리스너 설정
        const applyFilterBtn = popup.querySelector('#apply-date-filter');
        const resetFilterBtn = popup.querySelector('#reset-date-filter');
        
        if (applyFilterBtn && resetFilterBtn) {
            // 필터 적용 버튼
            applyFilterBtn.addEventListener('click', applyDateFilter);
            
            // 필터 초기화 버튼
            resetFilterBtn.addEventListener('click', () => {
                // 날짜 필드 초기화
                document.getElementById('date-filter-start').value = `${DataManager.data.year}-${month.toString().padStart(2, '0')}-01`;
                document.getElementById('date-filter-end').value = `${DataManager.data.year}-${month.toString().padStart(2, '0')}-${new Date(DataManager.data.year, month, 0).getDate().toString().padStart(2, '0')}`;
                
                // 필터링된 데이터 초기화
                filteredExpenses = [...expenses];
                currentPage = 1;
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
        
        // 페이징 처리 함수
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
                    <td colspan="3" class="text-start" style="font-size: 14px;"><strong>이전 잔액</strong></td>
                    <td class="text-end"></td>
                    <td></td>
                    <td class="text-end" style="font-size: 14px;"><strong>${Utils.number.formatCurrency(initialBalance)}</strong></td>
                    <td></td>
                `;
                tbody.appendChild(initialBalanceRow);
                
                // 잔액 계산을 위한 변수
                let runningBalance = initialBalance;
                
                // 현재 페이지에 표시할 항목 범위 계산
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = Math.min(startIndex + itemsPerPage, filteredExpenses.length);
                
                // 필터링된 항목이 없는 경우
                if (filteredExpenses.length === 0) {
                    const noDataRow = document.createElement('tr');
                    noDataRow.innerHTML = `
                        <td colspan="7" class="text-center">해당 날짜 범위에 데이터가 없습니다.</td>
                    `;
                    tbody.appendChild(noDataRow);
                } else {
                    // 해당 페이지 범위의 항목만 표시
                    for (let i = 0; i < filteredExpenses.length; i++) {
                        // 모든 항목에 대해 잔액을 계산하지만, 현재 페이지 항목만 표시
                        const expense = filteredExpenses[i];
                        
                        // 대분류 정보 찾기
                        const mainCategory = DataManager.data.categories.main.find(c => c.code === expense.mainCategory) || { name: '미분류' };
                        
                        // 중분류 정보 찾기
                        const subCategory = DataManager.data.categories.sub.find(c => c.code === expense.subCategory) || { name: '' };
                        
                        // 잔액 계산
                        if (mainCategory.type === 'income') {
                            runningBalance += expense.amount;
                        } else {
                            runningBalance -= expense.amount;
                        }
                        
                        // 현재 페이지 범위에 있는 항목만 테이블에 추가
                        if (i >= startIndex && i < endIndex) {
                            const tr = document.createElement('tr');
                            
                            // 수입/지출에 따라 스타일 적용
                            const amountClass = mainCategory.type === 'income' ? 'text-primary' : 'text-danger';
                            const amountPrefix = mainCategory.type === 'income' ? '+' : '-';
                            
                            // 실제 입금 여부 배지
                            const actualPaymentBadge = expense.isActualPayment ? 
                                '<span class="badge bg-success actual-payment-badge" data-id="' + expense.id + '">✓</span>' : 
                                '<span class="badge bg-secondary actual-payment-badge" data-id="' + expense.id + '">✗</span>';
                            
                            tr.innerHTML = `
                                <td style="font-size: 14px;">${expense.date}</td>
                                <td style="font-size: 14px; word-break: break-all; overflow-wrap: break-word;">${expense.description}</td>
                                <td style="font-size: 14px;">${mainCategory.name} > ${subCategory.name}</td>
                                <td class="text-end ${amountClass}" style="font-size: 14px;">${amountPrefix}${Utils.number.formatCurrency(expense.amount)}</td>
                                <td class="text-center">${actualPaymentBadge}</td>
                                <td class="text-end" style="font-size: 14px;">${Utils.number.formatCurrency(runningBalance)}</td>
                                <td class="text-center">
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary btn-sm edit-expense-btn" data-id="${expense.id}">
                                            <i class="bi bi-pencil-square"></i>
                                        </button>
                                        <button class="btn btn-outline-danger btn-sm delete-expense-btn" data-id="${expense.id}">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            `;
                            
                            tbody.appendChild(tr);
                        }
                    }
                }
                
                // 최종 잔액 행 추가
                const finalBalanceRow = document.createElement('tr');
                finalBalanceRow.classList.add('table-primary');
                finalBalanceRow.innerHTML = `
                    <td colspan="5" class="text-end" style="font-size: 14px;"><strong>최종 잔액</strong></td>
                    <td class="text-end" style="font-size: 14px;"><strong>${Utils.number.formatCurrency(runningBalance)}</strong></td>
                    <td></td>
                `;
                tbody.appendChild(finalBalanceRow);
                
                // 페이징 표시 업데이트
                const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / itemsPerPage));
                const currentPageDisplay = popup.querySelector('#currentPageDisplay');
                const totalPagesDisplay = popup.querySelector('#totalPagesDisplay');
                const prevBtn = popup.querySelector('#prevPage');
                const nextBtn = popup.querySelector('#nextPage');
                
                currentPageDisplay.textContent = currentPage;
                totalPagesDisplay.textContent = totalPages;
                
                // 현재 표시 중인 아이템 범위 계산
                const startItem = filteredExpenses.length > 0 ? startIndex + 1 : 0;
                const endItem = Math.min(endIndex, filteredExpenses.length);
                
                // 페이지 상태 업데이트
                const pageInfoContainer = popup.querySelector('.page-info');
                pageInfoContainer.innerHTML = `
                    <span id="currentPageDisplay">${currentPage}</span>
                    <span>/</span>
                    <span id="totalPagesDisplay">${totalPages}</span>
                    <span class="small text-muted ms-2">(${startItem}-${endItem}/${filteredExpenses.length}개)</span>
                `;
                
                prevBtn.disabled = currentPage === 1;
                nextBtn.disabled = currentPage === totalPages || filteredExpenses.length === 0;
                
                // 수정 및 삭제 버튼 클릭 이벤트 추가
                setupItemActionButtons(popup);
                
                // 실입금 배지 클릭 이벤트 추가
                const actualPaymentBadges = popup.querySelectorAll('.actual-payment-badge');
                actualPaymentBadges.forEach(badge => {
                    badge.style.cursor = 'pointer';
                    badge.title = '클릭하여 실입금 상태 변경';
                    
                    badge.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const expenseId = parseInt(badge.dataset.id);
                        
                        try {
                            // 데이터 매니저에서 실입금 상태 토글
                            const updatedExpense = DataManager.toggleActualPayment(expenseId);
                            
                            // UI 업데이트
                            if (updatedExpense.isActualPayment) {
                                badge.className = 'badge bg-success actual-payment-badge';
                                badge.textContent = '✓';
                            } else {
                                badge.className = 'badge bg-secondary actual-payment-badge';
                                badge.textContent = '✗';
                            }
                            
                            // 전체 테이블 다시 렌더링 (잔액 갱신을 위해)
                            popup.remove();
                            const updatedExpenses = this.getMonthlyExpenses(DataManager.data.year, month);
                            this.showExpenseDetail(month, updatedExpenses);
                            
                        } catch (error) {
                            console.error('실입금 상태 변경 중 오류 발생:', error);
                            alert('실입금 상태 변경 중 오류가 발생했습니다.');
                        }
                    });
                });
                
                // 페이지 로딩 완료 효과
                tbody.classList.remove('loading-page');
                tbody.classList.add('page-loaded');
            }, 150); // 150ms 지연 - 시각적 효과용
        };
        
        // 항목별 액션 버튼 설정 함수
        const setupItemActionButtons = (popupElem) => {
            // 수정 버튼 클릭 이벤트
            popupElem.querySelectorAll('.edit-expense-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const expenseId = parseInt(btn.dataset.id);
                    const expense = expenses.find(e => e.id === expenseId);
                    if (expense) {
                        this.showEditExpenseForm(expenseId, expense, month);
                        popup.remove(); // 현재 팝업 닫기
                    }
                });
            });
            
            // 삭제 버튼 클릭 이벤트
            popupElem.querySelectorAll('.delete-expense-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const expenseId = parseInt(btn.dataset.id);
                    
                    if (confirm('정말로 이 항목을 삭제하시겠습니까?')) {
                        // 항목 삭제
                        DataManager.removeOneTimeExpense(expenseId);
                        
                        // 삭제 후 팝업 다시 열기
                        popup.remove();
                        const updatedExpenses = this.getMonthlyExpenses(DataManager.data.year, month);
                        this.showExpenseDetail(month, updatedExpenses);
                    }
                });
            });
        };
        
        // 페이지 이동 버튼 이벤트 설정
        const prevPageBtn = popup.querySelector('#prevPage');
        const nextPageBtn = popup.querySelector('#nextPage');
        
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderExpenseTable();
            }
        });
        
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderExpenseTable();
            }
        });
        
        // 새 항목 추가 버튼 이벤트 설정
        const addExpenseBtn = popup.querySelector('#add-expense-in-detail');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => {
                // 팝업 닫기
                popup.remove();
                
                // 해당 월의 지출 추가 폼 표시
                this.showAddExpenseForm(month);
            });
        }
        
        // 키보드 페이지 이동 지원
        popup.addEventListener('keydown', (e) => {
            // 왼쪽 화살표 - 이전 페이지
            if (e.key === 'ArrowLeft' && !prevPageBtn.disabled) {
                prevPageBtn.click();
            }
            // 오른쪽 화살표 - 다음 페이지
            else if (e.key === 'ArrowRight' && !nextPageBtn.disabled) {
                nextPageBtn.click();
            }
        });
        
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
                <td>${subCategory.mainCategoryName}</td>
                <td>${subCategory.name}</td>
                <td>${subCategory.count}건</td>
                <td class="${amountClass}">${amountSign}${Utils.number.formatCurrency(subCategory.amount)}</td>
            `;
            subCategorySummary.appendChild(row);
        });
    },
    
    // 지출 수정 폼 표시
    showEditExpenseForm(expenseId, expense, month) {
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
        
        // 팝업 내용 생성 (ID 필드에 실제 고유 ID 저장)
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
                            <label for="edit-expense-amount" class="form-label">금액:</label>
                            <input type="number" id="edit-expense-amount" class="form-control" value="${expense.amount}" placeholder="금액" required>
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
                    isActualPayment
                );
                
                console.log('수정 성공, 업데이트된 항목:', updatedExpense);
                
                // 달력 갱신
                this.renderCalendar();
                
                // 지출 데이터 변경 이벤트 발생
                document.dispatchEvent(new CustomEvent('expenses-updated'));
                
                // 성공 메시지
                alert('항목이 수정되었습니다.');
                
                // 상세보기 팝업 다시 표시
                popup.remove();
                
                // 기존 상세보기 팝업 닫기
                const detailPopup = document.getElementById('expense-detail-popup');
                if (detailPopup) {
                    detailPopup.remove();
                }
                
                // 새로운 지출 항목 리스트로 상세보기 팝업 다시 표시
                const updatedExpenses = this.getMonthlyExpenses(DataManager.data.year, month);
                this.showExpenseDetail(month, updatedExpenses);
                
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
    
    // 지출 추가 폼 표시
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
        
        // 팝업 내용 생성
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
                            <label for="expense-amount" class="form-label">금액:</label>
                            <input type="number" id="expense-amount" class="form-control" placeholder="금액" required>
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
            
            // 빈 필드 확인
            if (!date || !amount || !description || !mainCategory) {
                alert('모든 필수 필드를 입력해주세요.');
                return;
            }
            
            // 일회성 지출 추가
            try {
                DataManager.addOneTimeExpense(date, parseFloat(amount), description, mainCategory, subCategory, isActualPayment);
                
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
    }
}; 