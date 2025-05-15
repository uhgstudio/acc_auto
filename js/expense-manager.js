/**
 * 지출 관리 모듈
 * 반복 지출, 일회성 지출 관리 기능 담당
 */
const ExpenseManager = {
    // 지출 관리 초기화
    initialize() {
        this.renderRecurringExpenses();
        this.renderOneTimeExpenses();
        this.setupExpenseEventListeners();
    },
    
    // 대분류/중분류 선택 UI 업데이트
    updateCategorySelectors() {
        // 대분류 선택 요소 업데이트
        const mainCategorySelectors = document.querySelectorAll('.main-category-selector');
        mainCategorySelectors.forEach(selector => {
            // 대분류 옵션 채우기
            this.populateMainCategorySelector(selector);
            
            // 연결된 중분류 선택 요소 찾기
            const form = selector.closest('form');
            if (form) {
                const subCategorySelector = form.querySelector('.sub-category-selector');
                if (subCategorySelector) {
                    // 이전 이벤트 리스너 제거 (이벤트 중복 방지)
                    const newSelector = selector.cloneNode(true);
                    selector.parentNode.replaceChild(newSelector, selector);
                    
                    // 대분류 변경 시 중분류 옵션 업데이트 이벤트
                    newSelector.addEventListener('change', () => {
                        const updatedSubSelector = this.populateSubCategorySelector(newSelector.value, subCategorySelector);
                        
                        // 중분류 선택기가 교체된 경우, 참조를 업데이트
                        if (updatedSubSelector !== subCategorySelector) {
                            // 이후 코드에서 참조가 필요한 경우 사용
                        }
                    });
                    
                    // 초기 중분류 옵션 채우기
                    this.populateSubCategorySelector(newSelector.value, subCategorySelector);
                }
            }
        });
    },
    
    // 대분류 선택 요소에 옵션 채우기
    populateMainCategorySelector(selector) {
        // 선택 요소 비우기
        Utils.dom.clearElement(selector);
        
        // 기본 옵션 추가
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '대분류 선택';
        selector.appendChild(defaultOption);
        
        // 대분류 옵션 추가
        DataManager.data.categories.main.forEach(category => {
            const option = document.createElement('option');
            option.value = category.code;
            option.textContent = `${category.name} (${category.code})`;
            
            // 유형 데이터 추가
            option.dataset.type = category.type;
            
            selector.appendChild(option);
        });
    },
    
    // 중분류 선택 요소에 옵션 채우기 (특정 대분류에 맞는 중분류들)
    populateSubCategorySelector(mainCode, selector) {
        // 현재 선택된 값 저장
        const currentValue = selector.value;
        
        // 이전 이벤트 리스너 제거 (이벤트 중복 방지)
        const newSelector = selector.cloneNode(false); // 내용 없이 복제
        selector.parentNode.replaceChild(newSelector, selector);
        selector = newSelector;
        
        // 선택 요소 비우기
        Utils.dom.clearElement(selector);
        
        // 기본 옵션 추가
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '중분류 선택';
        selector.appendChild(defaultOption);
        
        // 모든 중분류 또는 특정 대분류의 중분류 목록 추가
        let subCategories = [];
        if (!mainCode) {
            // 대분류가 선택되지 않은 경우 모든 중분류 표시
            subCategories = DataManager.data.categories.sub;
        } else {
            // 대분류가 선택된 경우 해당 대분류의 중분류만 표시
            subCategories = DataManager.data.categories.sub.filter(sub => sub.mainCode === mainCode);
        }
        
        subCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.code;
            
            // 대분류 정보도 함께 표시
            const mainCategory = DataManager.data.categories.main.find(main => main.code === category.mainCode);
            const mainCategoryName = mainCategory ? mainCategory.name : '';
            
            option.textContent = `${category.name} (${mainCategoryName})`;
            option.dataset.mainCode = category.mainCode; // 대분류 코드 저장
            
            // 이전에 선택된 값 유지
            if (category.code === currentValue) {
                option.selected = true;
            }
            
            selector.appendChild(option);
        });
        
        // 중분류 변경 이벤트 - 연결된 대분류 자동 선택
        selector.addEventListener('change', () => {
            if (selector.value) {
                const selectedOption = selector.options[selector.selectedIndex];
                const mainCode = selectedOption.dataset.mainCode;
                
                if (mainCode) {
                    // 연결된 대분류 선택기 찾기 (같은 폼 내)
                    const form = selector.closest('form');
                    if (form) {
                        const mainSelector = form.querySelector('.main-category-selector');
                        if (mainSelector && mainSelector.value !== mainCode) {
                            mainSelector.value = mainCode;
                        }
                    }
                }
            }
        });
        
        return selector; // 새로 만든 선택기 반환
    },
    
    // 반복 지출 목록 렌더링
    renderRecurringExpenses() {
        const recurringExpenseList = document.getElementById('recurring-expense-list');
        if (!recurringExpenseList) return;
        
        if (DataManager.data.recurringExpenses.length === 0) {
            recurringExpenseList.innerHTML = '<p>등록된 반복 지출이 없습니다.</p>';
            return;
        }
        
        let html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>반복 주기</th>
                        <th>금액</th>
                        <th>내용</th>
                        <th>분류</th>
                        <th>기간</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        DataManager.data.recurringExpenses.forEach((expense, index) => {
            // 대분류 이름 찾기
            const mainCategory = DataManager.data.categories.main.find(c => c.code === expense.mainCategory);
            const mainCategoryName = mainCategory ? mainCategory.name : '미분류';
            
            // 중분류 이름 찾기
            const subCategory = DataManager.data.categories.sub.find(c => c.code === expense.subCategory);
            const subCategoryName = subCategory ? subCategory.name : '';
            
            // 수입/지출 구분
            const isIncome = mainCategory?.type === 'income';
            const amountClass = isIncome ? 'text-primary' : 'text-danger';
            const amountPrefix = isIncome ? '+' : '-';
            
            // 반복 주기에 따른 표시
            const frequencyDisplay = expense.frequency === 'daily' 
                ? '매일' 
                : `매월 ${expense.day}일`;
            
            // 주말/공휴일 제외 옵션 표시
            let optionsDisplay = [];
            if (expense.skipWeekends) optionsDisplay.push('주말 제외');
            if (expense.skipHolidays) optionsDisplay.push('공휴일 제외');
            const optionsText = optionsDisplay.length > 0 ? ` (${optionsDisplay.join(', ')})` : '';
            
            html += `
                <tr>
                    <td>${frequencyDisplay}${optionsText}</td>
                    <td class="${amountClass}">${amountPrefix}${Utils.number.formatCurrency(expense.amount)}</td>
                    <td>${expense.description}</td>
                    <td>${mainCategoryName}${subCategoryName ? ` > ${subCategoryName}` : ''}</td>
                    <td>${expense.startDate}${expense.endDate ? ` ~ ${expense.endDate}` : ' ~'}</td>
                    <td><button class="btn btn-sm btn-danger delete-recurring-expense" data-index="${index}">삭제</button></td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        recurringExpenseList.innerHTML = html;
        
        // 삭제 버튼 이벤트 리스너 추가
        const deleteButtons = recurringExpenseList.querySelectorAll('.delete-recurring-expense');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.deleteRecurringExpense(index);
            });
        });
    },
    
    // 일회성 지출 목록 렌더링
    renderOneTimeExpenses() {
        const oneTimeExpenseList = document.getElementById('one-time-expense-list');
        if (!oneTimeExpenseList) return;
        
        // 오늘 날짜를 기본 필터로 설정
        const today = new Date();
        const defaultDate = today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
        
        // 검색 필터 UI 생성
        let filterHtml = `
            <div class="filter-container mb-3">
                <div class="row">
                    <div class="col-md-8">
                        <div class="input-group">
                            <span class="input-group-text">날짜 범위</span>
                            <input type="date" id="one-time-date-filter-start" class="form-control" value="${defaultDate}">
                            <span class="input-group-text">~</span>
                            <input type="date" id="one-time-date-filter-end" class="form-control" value="${defaultDate}">
                            <button id="apply-one-time-filter" class="btn btn-primary">적용</button>
                            <button id="reset-one-time-filter" class="btn btn-outline-secondary">전체 보기</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 필터 적용된 테이블 생성
        let html = filterHtml;
        html += `
            <div id="filtered-expenses-container">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th style="width: 15%;">날짜</th>
                            <th style="width: 15%; text-align: right;">금액</th>
                            <th style="width: 30%;">내용</th>
                            <th style="width: 30%;">분류</th>
                            <th style="width: 10%; text-align: center;">관리</th>
                        </tr>
                    </thead>
                    <tbody id="one-time-expense-body">
                    </tbody>
                </table>
            </div>
        `;
        
        oneTimeExpenseList.innerHTML = html;
        
        // 데이터가 없는 경우 메시지 표시
        if (DataManager.data.oneTimeExpenses.length === 0) {
            const tableBody = document.getElementById('one-time-expense-body');
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center">등록된 일회성 지출이 없습니다.</td></tr>`;
        } else {
            // 기본 필터 (오늘 날짜) 적용
            this.filterOneTimeExpenses(defaultDate, defaultDate);
        }
        
        // 필터 이벤트 리스너 설정
        this.setupFilterEventListeners();
    },
    
    // 일회성 지출 필터링 함수
    filterOneTimeExpenses(startDate, endDate) {
        const tableBody = document.getElementById('one-time-expense-body');
        if (!tableBody) return;
        
        let filteredItems = [];
        
        // 필터링 조건 확인
        const useFilter = startDate && endDate;
        
        if (useFilter) {
            // 날짜 범위로 필터링
            filteredItems = DataManager.data.oneTimeExpenses.filter(expense => 
                expense.date && expense.date >= startDate && expense.date <= endDate
            );
        } else {
            // 필터 없이 모든 항목 표시
            filteredItems = [...DataManager.data.oneTimeExpenses];
        }
        
        // 최신 순으로 정렬하여 표시
        filteredItems.sort((a, b) => b.date.localeCompare(a.date));
        
        // 필터링된 항목이 없는 경우
        if (filteredItems.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center">해당 기간에 데이터가 없습니다.</td></tr>`;
            return;
        }
        
        let rowsHtml = '';
        
        filteredItems.forEach((expense, i) => {
            // 원래 인덱스 찾기 (삭제 시 필요)
            const originalIndex = DataManager.data.oneTimeExpenses.findIndex(e => 
                e.date === expense.date && 
                e.amount === expense.amount && 
                e.description === expense.description
            );
            
            // 대분류 이름 찾기
            const mainCategory = DataManager.data.categories.main.find(c => c.code === expense.mainCategory);
            const mainCategoryName = mainCategory ? mainCategory.name : '미분류';
            
            // 중분류 이름 찾기
            const subCategory = DataManager.data.categories.sub.find(c => c.code === expense.subCategory);
            const subCategoryName = subCategory ? subCategory.name : '';
            
            // 수입/지출 구분
            const isIncome = mainCategory?.type === 'income';
            const amountClass = isIncome ? 'text-primary' : 'text-danger';
            const amountPrefix = isIncome ? '+' : '-';
            
            // 실입금 상태 표시
            const actualPaymentBadge = expense.isActualPayment ? 
                '<span class="badge bg-success">✓</span>' : 
                '<span class="badge bg-secondary">✗</span>';
            
            rowsHtml += `
                <tr>
                    <td>${expense.date}</td>
                    <td class="${amountClass}" style="text-align: right;">${amountPrefix}${Utils.number.formatCurrency(expense.amount)}</td>
                    <td>${expense.description}</td>
                    <td>${mainCategoryName}${subCategoryName ? ` > ${subCategoryName}` : ''} ${actualPaymentBadge}</td>
                    <td style="text-align: center;">
                        <button class="btn btn-sm btn-outline-primary edit-one-time-expense me-1" data-index="${originalIndex}">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-one-time-expense" data-index="${originalIndex}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = rowsHtml;
        
        // 수정 및 삭제 버튼 이벤트 리스너 추가
        const editButtons = tableBody.querySelectorAll('.edit-one-time-expense');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                // 수정 로직 - 나중에 구현
                console.log('수정', index);
            });
        });
        
        const deleteButtons = tableBody.querySelectorAll('.delete-one-time-expense');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                this.deleteOneTimeExpense(index);
            });
        });
    },
    
    // 필터 이벤트 리스너 설정
    setupFilterEventListeners() {
        const applyBtn = document.getElementById('apply-one-time-filter');
        const resetBtn = document.getElementById('reset-one-time-filter');
        const startDateInput = document.getElementById('one-time-date-filter-start');
        const endDateInput = document.getElementById('one-time-date-filter-end');
        
        if (applyBtn && resetBtn && startDateInput && endDateInput) {
            // 필터 적용 버튼
            applyBtn.addEventListener('click', () => {
                const startDate = startDateInput.value;
                const endDate = endDateInput.value;
                
                if (!startDate || !endDate) {
                    alert('시작 날짜와 종료 날짜를 모두 입력해주세요.');
                    return;
                }
                
                this.filterOneTimeExpenses(startDate, endDate);
            });
            
            // 전체 보기 버튼
            resetBtn.addEventListener('click', () => {
                startDateInput.value = '';
                endDateInput.value = '';
                this.filterOneTimeExpenses();
            });
        }
    },
    
    // 반복 지출 삭제
    async deleteRecurringExpense(index) {
        const expense = DataManager.data.recurringExpenses[index];
        const confirmDelete = confirm(`"${expense.description}" 항목을 삭제하시겠습니까?`);
        
        if (confirmDelete) {
            try {
                // 로딩 표시 (옵션)
                const deleteBtn = document.querySelector(`.delete-recurring-expense[data-index="${index}"]`);
                if (deleteBtn) {
                    deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
                    deleteBtn.disabled = true;
                }
                
                // 비동기 삭제 처리 (서버 API 호출 포함)
                await DataManager.removeRecurringExpense(index);
                
                // UI 업데이트
                this.renderRecurringExpenses();
                
                // 달력 업데이트를 위한 이벤트 발생
                document.dispatchEvent(new CustomEvent('expenses-updated'));
                
                // 성공 메시지 (옵션)
                Utils.showToast('반복 지출이 삭제되었습니다.', 'success');
            } catch (error) {
                console.error('반복 지출 삭제 중 오류 발생:', error);
                Utils.showToast('삭제 중 오류가 발생했습니다. 서버 연결을 확인해주세요.', 'danger');
                
                // 오류 시에도 UI 갱신
                this.renderRecurringExpenses();
            }
        }
    },
    
    // 일회성 지출 삭제
    deleteOneTimeExpense(index) {
        const expense = DataManager.data.oneTimeExpenses[index];
        const confirmDelete = confirm(`"${expense.description}" 항목을 삭제하시겠습니까?`);
        
        if (confirmDelete) {
            DataManager.removeOneTimeExpense(index);
            
            // 전체 렌더링 대신 해당 행만 삭제
            const tableBody = document.getElementById('one-time-expense-body');
            if (tableBody) {
                const row = tableBody.querySelector(`button.delete-one-time-expense[data-index="${index}"]`)?.closest('tr');
                if (row) {
                    row.remove();
                    
                    // 표시할 항목이 없으면 빈 메시지 표시
                    if (tableBody.childElementCount === 0) {
                        tableBody.innerHTML = `<tr><td colspan="5" class="text-center">해당 기간에 데이터가 없습니다.</td></tr>`;
                    }
                }
            }
            
            // 달력 업데이트를 위한 이벤트 발생
            document.dispatchEvent(new CustomEvent('expenses-updated'));
        }
    },
    
    // 항목 특정 행만 업데이트
    updateOneTimeExpenseRow(expense, originalIndex) {
        const tableBody = document.getElementById('one-time-expense-body');
        if (!tableBody) return;
        
        // 해당 행 찾기
        const row = tableBody.querySelector(`button.delete-one-time-expense[data-index="${originalIndex}"]`)?.closest('tr');
        if (!row) return;
        
        // 대분류 이름 찾기
        const mainCategory = DataManager.data.categories.main.find(c => c.code === expense.mainCategory);
        const mainCategoryName = mainCategory ? mainCategory.name : '미분류';
        
        // 중분류 이름 찾기
        const subCategory = DataManager.data.categories.sub.find(c => c.code === expense.subCategory);
        const subCategoryName = subCategory ? subCategory.name : '';
        
        // 수입/지출 구분
        const isIncome = mainCategory?.type === 'income';
        const amountClass = isIncome ? 'text-primary' : 'text-danger';
        const amountPrefix = isIncome ? '+' : '-';
        
        // 실입금 상태 표시
        const actualPaymentBadge = expense.isActualPayment ? 
            '<span class="badge bg-success">✓</span>' : 
            '<span class="badge bg-secondary">✗</span>';
        
        // 행 내용 업데이트
        row.innerHTML = `
            <td>${expense.date}</td>
            <td class="${amountClass}" style="text-align: right;">${amountPrefix}${Utils.number.formatCurrency(expense.amount)}</td>
            <td>${expense.description}</td>
            <td>${mainCategoryName}${subCategoryName ? ` > ${subCategoryName}` : ''} ${actualPaymentBadge}</td>
            <td style="text-align: center;">
                <button class="btn btn-sm btn-outline-primary edit-one-time-expense me-1" data-index="${originalIndex}">
                    <i class="bi bi-pencil-square"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-one-time-expense" data-index="${originalIndex}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        // 이벤트 리스너 다시 연결
        this.attachRowEventListeners(row);
    },
    
    // 실입금 상태 토글
    toggleActualPayment(id) {
        try {
            // 데이터 매니저에서 실입금 상태 토글 후 업데이트된 항목 가져오기
            const updatedExpense = DataManager.toggleActualPayment(id);
            
            // 인덱스 찾기
            const index = DataManager.findOneTimeExpenseIndexById(id);
            
            // 해당 항목만 UI 업데이트
            if (index !== -1) {
                this.updateOneTimeExpenseRow(updatedExpense, index);
            }
            
            // 성공 시 업데이트된 항목 반환
            return updatedExpense;
        } catch (error) {
            console.error('실입금 상태 변경 중 오류 발생:', error);
            throw error;
        }
    },
    
    // 행 이벤트 리스너 연결
    attachRowEventListeners(row) {
        // 수정 버튼 이벤트 리스너
        const editButton = row.querySelector('.edit-one-time-expense');
        if (editButton) {
            editButton.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                console.log('수정', index);
            });
        }
        
        // 삭제 버튼 이벤트 리스너
        const deleteButton = row.querySelector('.delete-one-time-expense');
        if (deleteButton) {
            deleteButton.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                this.deleteOneTimeExpense(index);
            });
        }
    },
    
    // 지출 관련 이벤트 리스너 설정
    setupExpenseEventListeners() {
        // 반복 주기 변경 시 UI 업데이트
        const recurringFrequency = document.getElementById('recurring-frequency');
        const recurringDayContainer = document.getElementById('recurring-day-container');
        
        if (recurringFrequency && recurringDayContainer) {
            recurringFrequency.addEventListener('change', () => {
                if (recurringFrequency.value === 'daily') {
                    recurringDayContainer.style.display = 'none';
                } else {
                    recurringDayContainer.style.display = 'block';
                }
            });
        }
        
        // 반복 지출 추가 폼 이벤트
        const addRecurringExpenseForm = document.getElementById('add-recurring-expense-form');
        if (addRecurringExpenseForm) {
            addRecurringExpenseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const frequency = document.getElementById('recurring-frequency').value;
                const day = document.getElementById('recurring-day').value;
                const amount = document.getElementById('recurring-amount').value;
                const description = document.getElementById('recurring-description').value;
                const startDate = document.getElementById('recurring-start-date').value;
                const endDate = document.getElementById('recurring-end-date').value || null;
                const mainCategory = document.getElementById('recurring-main-category').value;
                const subCategory = document.getElementById('recurring-sub-category').value;
                const skipWeekends = document.getElementById('recurring-skip-weekends').checked;
                const skipHolidays = document.getElementById('recurring-skip-holidays').checked;
                const isActualPayment = document.getElementById('recurring-actual-payment').checked;
                
                // 필수 입력 검증 (매월 주기일 때만 day 필수)
                if (
                    amount && 
                    description && 
                    startDate && 
                    mainCategory && 
                    (frequency === 'daily' || (frequency === 'monthly' && day))
                ) {
                    try {
                        // 금액을 문자열에서 숫자로 변환 (콤마 제거)
                        const numericAmount = parseFloat(amount.replace(/,/g, ''));
                        
                        DataManager.addRecurringExpense(frequency, day, numericAmount, description, startDate, endDate, mainCategory, subCategory, skipWeekends, skipHolidays, isActualPayment)
                            .then(result => {
                                // 입력 필드 초기화
                                document.getElementById('recurring-day').value = '';
                                document.getElementById('recurring-amount').value = '';
                                document.getElementById('recurring-description').value = '';
                                document.getElementById('recurring-end-date').value = '';
                                document.getElementById('recurring-skip-weekends').checked = false;
                                document.getElementById('recurring-skip-holidays').checked = false;
                                
                                // 목록 갱신
                                this.renderRecurringExpenses();
                                
                                // 달력 업데이트를 위한 이벤트 발생
                                document.dispatchEvent(new CustomEvent('expenses-updated'));
                                
                                // 성공 알림 표시
                                this.showNotification('success', '반복 지출이 등록되었습니다.');
                            })
                            .catch(error => {
                                console.error('반복 지출 등록 오류:', error);
                                this.showNotification('error', `오류: ${error.message}`);
                            });
                    } catch (error) {
                        alert(error.message);
                    }
                } else {
                    alert('필수 항목을 모두 입력해주세요.');
                }
            });
        }
        
        // 일회성 지출 추가 폼 이벤트
        const addOneTimeExpenseForm = document.getElementById('add-one-time-expense-form');
        if (addOneTimeExpenseForm) {
            addOneTimeExpenseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const date = document.getElementById('one-time-date').value;
                const amountInput = document.getElementById('one-time-amount').value;
                const description = document.getElementById('one-time-description').value;
                const mainCategory = document.getElementById('one-time-main-category').value;
                const subCategory = document.getElementById('one-time-sub-category').value;
                const isActualPayment = document.getElementById('one-time-actual-payment').checked;
                const vendor = document.getElementById('one-time-vendor').value || '';
                
                if (date && amountInput && description && mainCategory) {
                    try {
                        // 금액을 문자열에서 숫자로 변환 (콤마 제거)
                        const amount = parseFloat(amountInput.replace(/,/g, ''));
                        
                        if (isNaN(amount)) {
                            throw new Error('올바른 금액을 입력해주세요.');
                        }
                        
                        DataManager.addOneTimeExpense(date, amount, description, mainCategory, subCategory, isActualPayment, vendor)
                            .then(result => {
                                // 입력 필드 초기화
                                document.getElementById('one-time-amount').value = '';
                                document.getElementById('one-time-description').value = '';
                                
                                // 목록 갱신
                                this.renderOneTimeExpenses();
                                
                                // 달력 업데이트를 위한 이벤트 발생
                                document.dispatchEvent(new CustomEvent('expenses-updated'));
                                
                                // 성공 알림 표시
                                this.showNotification('success', '일회성 지출이 등록되었습니다.');
                            })
                            .catch(error => {
                                console.error('일회성 지출 등록 오류:', error);
                                this.showNotification('error', `오류: ${error.message}`);
                            });
                    } catch (error) {
                        alert(error.message);
                    }
                } else {
                    alert('필수 항목을 모두 입력해주세요.');
                }
            });
        }
        
        // 대분류 선택 시 중분류 옵션 업데이트 이벤트
        this.updateCategorySelectors();
    },
    
    // 알림 표시 메서드
    showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} mt-3`;
        notification.role = 'alert';
        notification.textContent = message;
        
        const notificationContainer = document.getElementById('notification-container');
        if (notificationContainer) {
            notificationContainer.appendChild(notification);
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    }
}; 