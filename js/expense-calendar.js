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
        
        // 반복 지출 항목 처리
        DataManager.data.recurringExpenses.forEach(expense => {
            // 시작 날짜와 종료 날짜 확인
            const isInDateRange = Utils.date.isDateInRange(
                new Date(year, month - 1, 1),
                expense.startDate,
                expense.endDate
            );
            
            if (isInDateRange) {
                // 해당 월에 유효한 반복 지출
                
                // 지출일이 해당 월에 존재하는지 확인 (예: 31일은 일부 달에는 없음)
                const lastDayOfMonth = new Date(year, month, 0).getDate();
                const expenseDay = Math.min(expense.day, lastDayOfMonth);
                
                // 해당 날짜에 대한 Date 객체 생성
                const expenseDate = new Date(year, month - 1, expenseDay);
                
                // 주말이나 공휴일인 경우 다음 영업일로 조정
                let actualDate = expenseDate;
                if (Utils.date.isWeekend(expenseDate) || Utils.date.isHoliday(expenseDate, DataManager.data.holidays)) {
                    actualDate = Utils.date.getNextBusinessDay(expenseDate, DataManager.data.holidays);
                }
                
                // 조정된 날짜가 해당 월에 있는지 확인
                if (actualDate.getMonth() + 1 === month) {
                    // 대분류 정보 찾기
                    const mainCategory = DataManager.data.categories.main.find(c => c.code === expense.mainCategory);
                    const isIncome = mainCategory?.type === 'income';
                    
                    expenses.push({
                        date: Utils.date.formatDate(actualDate),
                        amount: expense.amount,
                        description: expense.description,
                        mainCategory: expense.mainCategory,
                        mainCategoryName: mainCategory?.name || '미분류',
                        subCategory: expense.subCategory,
                        isIncome: isIncome,
                        isRecurring: true
                    });
                }
            }
        });
        
        // 일회성 지출 항목 처리
        DataManager.data.oneTimeExpenses.forEach(expense => {
            if (expense.date.startsWith(yearMonth)) {
                // 대분류 정보 찾기
                const mainCategory = DataManager.data.categories.main.find(c => c.code === expense.mainCategory);
                const isIncome = mainCategory?.type === 'income';
                
                expenses.push({
                    date: expense.date,
                    amount: expense.amount,
                    description: expense.description,
                    mainCategory: expense.mainCategory,
                    mainCategoryName: mainCategory?.name || '미분류',
                    subCategory: expense.subCategory,
                    isIncome: isIncome,
                    isRecurring: false
                });
            }
        });
        
        // 날짜순 정렬
        expenses.sort((a, b) => {
            return a.date.localeCompare(b.date);
        });
        
        return expenses;
    },
    
    // 지출 항목을 분류별로 요약
    summarizeExpensesByCategory(expenses) {
        const mainCategories = {};
        const subCategories = {};
        let totalIncome = 0;
        let totalExpense = 0;
        
        // 분류별로 금액 집계
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
        
        // 팝업 컨테이너 생성
        const popup = document.createElement('div');
        popup.id = 'expense-detail-popup';
        popup.className = 'expense-popup';
        
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
            <div class="popup-content">
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
                            <table class="table table-striped" id="expense-detail-list">
                                <thead>
                                    <tr>
                                        <th>날짜</th>
                                        <th>내용</th>
                                        <th>분류</th>
                                        <th>금액</th>
                                        <th>잔액</th>
                                    </tr>
                                </thead>
                                <tbody>
                                </tbody>
                            </table>
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
                                            <th>비율</th>
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
        
        // 팝업 외부 클릭시 닫기
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.remove();
            }
        });
        
        // 상세 내역 테이블 채우기
        const tbody = popup.querySelector('#expense-detail-list tbody');
        
        // 월별 초기 잔액 가져오기 (이전달 이월액)
        const monthlyBalanceData = this.calculateMonthlyBalanceWithCarryover();
        let initialBalance = 0;
        
        // 해당 월의 초기 잔액 설정 (이전달 이월액 또는 0)
        if (month > 1 && monthlyBalanceData[month-2]) {
            initialBalance = monthlyBalanceData[month-2].finalBalance;
        }
        
        // 초기 잔액 행 추가
        const initialBalanceRow = document.createElement('tr');
        initialBalanceRow.classList.add('table-light');
        initialBalanceRow.innerHTML = `
            <td colspan="3"><strong>이전 잔액</strong></td>
            <td></td>
            <td><strong>${Utils.number.formatCurrency(initialBalance)}</strong></td>
        `;
        tbody.appendChild(initialBalanceRow);
        
        // 잔액 계산을 위한 변수
        let runningBalance = initialBalance;
        
        // 날짜순으로 정렬
        expenses.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA - dateB;
        });
        
        // 지출/수입 항목 추가
        expenses.forEach(expense => {
            const tr = document.createElement('tr');
            
            // 수입/지출에 따라 스타일 변경
            const amountClass = expense.isIncome ? 'text-primary' : 'text-danger';
            const amountPrefix = expense.isIncome ? '+' : '-';
            
            // 잔액 계산
            if (expense.isIncome) {
                runningBalance += expense.amount;
            } else {
                runningBalance -= expense.amount;
            }
            
            // 잔액 표시 스타일
            const balanceClass = runningBalance >= 0 ? 'text-primary' : 'text-danger';
            
            // 중분류 이름 가져오기
            let subCategoryName = '';
            if (expense.subCategory) {
                const subCategory = DataManager.data.categories.sub.find(c => c.code === expense.subCategory);
                subCategoryName = subCategory ? ` > ${subCategory.name}` : '';
            }
            
            tr.innerHTML = `
                <td>${expense.date}${expense.isRecurring ? ' <small>(정기)</small>' : ''}</td>
                <td>${expense.description}</td>
                <td>${expense.mainCategoryName}${subCategoryName}</td>
                <td class="${amountClass}">${amountPrefix}${Utils.number.formatCurrency(expense.amount)}</td>
                <td class="${balanceClass}">${Utils.number.formatCurrency(runningBalance)}</td>
            `;
            tbody.appendChild(tr);
        });
        
        // 최종 잔액 행 추가
        const finalBalanceRow = document.createElement('tr');
        finalBalanceRow.classList.add('table-light');
        
        const finalBalanceClass = runningBalance >= 0 ? 'text-primary' : 'text-danger';
        
        finalBalanceRow.innerHTML = `
            <td colspan="3"><strong>최종 잔액</strong></td>
            <td></td>
            <td class="${finalBalanceClass}"><strong>${Utils.number.formatCurrency(runningBalance)}</strong></td>
        `;
        tbody.appendChild(finalBalanceRow);
        
        // 대분류별 요약 데이터 준비
        const categorySummary = this.summarizeExpensesByCategory(expenses);
        
        // 대분류 요약 테이블 채우기
        const mainCategorySummary = popup.querySelector('#main-category-summary tbody');
        if (mainCategorySummary) {
            const total = categorySummary.totalExpense + categorySummary.totalIncome;
            
            for (const key in categorySummary.mainCategories) {
                const category = categorySummary.mainCategories[key];
                const tr = document.createElement('tr');
                
                // 수입/지출에 따라 스타일 변경
                const amountClass = category.isIncome ? 'text-primary' : 'text-danger';
                const amountPrefix = category.isIncome ? '+' : '-';
                
                // 비율 계산 (전체 금액 대비)
                const percentage = total > 0 ? (category.amount / total) * 100 : 0;
                
                tr.innerHTML = `
                    <td>${category.name}</td>
                    <td>${category.count}건</td>
                    <td class="${amountClass}">${amountPrefix}${Utils.number.formatCurrency(category.amount)}</td>
                    <td>${Utils.number.formatPercent(percentage)}</td>
                `;
                mainCategorySummary.appendChild(tr);
            }
            
            // 합계 행 추가
            const totalTr = document.createElement('tr');
            totalTr.className = 'summary-total';
            
            totalTr.innerHTML = `
                <td>합계</td>
                <td>${categorySummary.totalCount}건</td>
                <td class="${netAmountClass}">${netAmountPrefix}${Utils.number.formatCurrency(absNetAmount)}</td>
                <td>100%</td>
            `;
            mainCategorySummary.appendChild(totalTr);
        }
        
        // 중분류 요약 테이블 채우기
        const subCategorySummary = popup.querySelector('#sub-category-summary tbody');
        if (subCategorySummary) {
            for (const key in categorySummary.subCategories) {
                const category = categorySummary.subCategories[key];
                const tr = document.createElement('tr');
                
                // 수입/지출에 따라 스타일 변경
                const amountClass = category.isIncome ? 'text-primary' : 'text-danger';
                const amountPrefix = category.isIncome ? '+' : '-';
                
                tr.innerHTML = `
                    <td>${category.mainName}</td>
                    <td>${category.name}</td>
                    <td>${category.count}건</td>
                    <td class="${amountClass}">${amountPrefix}${Utils.number.formatCurrency(category.amount)}</td>
                `;
                subCategorySummary.appendChild(tr);
            }
        }
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
        
        // 팝업 외부 클릭시 닫기
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.remove();
            }
        });
        
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
            
            // 빈 필드 확인
            if (!date || !amount || !description || !mainCategory) {
                alert('모든 필수 필드를 입력해주세요.');
                return;
            }
            
            // 일회성 지출 추가
            try {
                DataManager.addOneTimeExpense(date, parseFloat(amount), description, mainCategory, subCategory);
                
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
        
        // 반복 지출/수입 처리
        DataManager.data.recurringExpenses.forEach(expense => {
            if (expense.startDate) {
                const startDate = new Date(expense.startDate + '-01');
                let endDate;
                
                if (expense.endDate) {
                    endDate = new Date(expense.endDate + '-01');
                } else {
                    // 종료일이 없으면 현재 날짜까지로 계산
                    endDate = new Date();
                }
                
                const startYear = startDate.getFullYear();
                const startMonth = startDate.getMonth();
                const endYear = endDate.getFullYear();
                const endMonth = endDate.getMonth();
                
                // 해당 년도에 속하는 달만 계산
                if (startYear <= DataManager.data.year && DataManager.data.year <= endYear) {
                    const yearStartMonth = (startYear === DataManager.data.year) ? startMonth : 0;
                    const yearEndMonth = (endYear === DataManager.data.year) ? endMonth : 11;
                    
                    for (let month = yearStartMonth; month <= yearEndMonth; month++) {
                        // 대분류 정보 찾기
                        const mainCategory = DataManager.data.categories.main.find(c => c.code === expense.mainCategory);
                        const isIncome = mainCategory?.type === 'income';
                        
                        // 수입은 양수, 지출은 음수로 저장
                        const amount = isIncome ? expense.amount : -expense.amount;
                        monthlyBalance[month] += amount;
                    }
                }
            }
        });
        
        // 일회성 지출/수입 처리
        DataManager.data.oneTimeExpenses.forEach(expense => {
            if (expense.date) {
                const expenseDate = new Date(expense.date);
                const expenseYear = expenseDate.getFullYear();
                
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
        
        // 모든 일회성 지출/수입 항목을 직접 순회하며 정확히 계산
        DataManager.data.oneTimeExpenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            const expenseYear = expenseDate.getFullYear();
            
            // 현재 선택된 연도의 지출/수입만 계산
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
        
        // 반복 지출/수입 항목도 직접 계산
        DataManager.data.recurringExpenses.forEach(expense => {
            if (expense.startDate) {
                const startDate = new Date(expense.startDate + '-01');
                let endDate;
                
                if (expense.endDate) {
                    endDate = new Date(expense.endDate + '-01');
                } else {
                    endDate = new Date();
                }
                
                const startYear = startDate.getFullYear();
                const startMonth = startDate.getMonth();
                const endYear = endDate.getFullYear();
                const endMonth = endDate.getMonth();
                
                // 해당 년도에 속하는 달만 계산
                if (startYear <= DataManager.data.year && DataManager.data.year <= endYear) {
                    // 대분류 정보 찾기
                    const mainCategory = DataManager.data.categories.main.find(c => c.code === expense.mainCategory);
                    const isIncome = mainCategory?.type === 'income';
                    
                    const yearStartMonth = (startYear === DataManager.data.year) ? startMonth : 0;
                    const yearEndMonth = (endYear === DataManager.data.year) ? endMonth : 11;
                    
                    // 해당 연도에 포함된 월 수 계산
                    const monthCount = yearEndMonth - yearStartMonth + 1;
                    
                    // 전체 금액 계산
                    const totalAmount = expense.amount * monthCount;
                    
                    // 수입과 지출 구분해서 합산
                    if (isIncome) {
                        totalOriginalIncome += totalAmount;
                        console.log(`반복 수입: +${totalAmount} (${expense.description} x ${monthCount}개월)`);
                    } else {
                        totalOriginalExpense += totalAmount;
                        console.log(`반복 지출: -${totalAmount} (${expense.description} x ${monthCount}개월)`);
                    }
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
    }
}; 