/**
 * 분류 관리 모듈
 * 대분류, 중분류 관리 기능 담당
 */
const CategoryManager = {
    // 분류 목록 로드
    initialize() {
        this.renderMainCategories();
        this.renderSubCategories();
        this.setupCategoryEventListeners();
        this.updateMainCategorySelectors();
    },
    
    // 대분류 목록 렌더링
    renderMainCategories() {
        const mainCategoryList = document.getElementById('main-category-list');
        if (!mainCategoryList) return;
        
        if (DataManager.data.categories.main.length === 0) {
            mainCategoryList.innerHTML = '<p>등록된 대분류가 없습니다.</p>';
            return;
        }
        
        let html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>코드</th>
                        <th>분류명</th>
                        <th>유형</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        DataManager.data.categories.main.forEach((category, index) => {
            const typeLabel = category.type === 'income' ? '수입' : '지출';
            const typeClass = category.type === 'income' ? 'text-primary' : 'text-danger';
            
            html += `
                <tr>
                    <td>${category.code}</td>
                    <td>${category.name}</td>
                    <td><span class="${typeClass}">${typeLabel}</span></td>
                    <td><button class="btn btn-sm btn-danger delete-main-category" data-index="${index}">삭제</button></td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        mainCategoryList.innerHTML = html;
        
        // 삭제 버튼 이벤트 리스너 추가
        const deleteButtons = mainCategoryList.querySelectorAll('.delete-main-category');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.deleteMainCategory(index);
            });
        });
    },
    
    // 중분류 목록 렌더링
    renderSubCategories() {
        const subCategoryList = document.getElementById('sub-category-list');
        if (!subCategoryList) return;
        
        if (DataManager.data.categories.sub.length === 0) {
            subCategoryList.innerHTML = '<p>등록된 중분류가 없습니다.</p>';
            return;
        }
        
        let html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>대분류</th>
                        <th>코드</th>
                        <th>분류명</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        DataManager.data.categories.sub.forEach((category, index) => {
            // 대분류 정보 찾기
            const mainCategory = DataManager.data.categories.main.find(main => main.code === category.mainCode);
            const mainCategoryName = mainCategory ? mainCategory.name : '(삭제됨)';
            
            html += `
                <tr>
                    <td>${mainCategoryName} (${category.mainCode})</td>
                    <td>${category.code}</td>
                    <td>${category.name}</td>
                    <td><button class="btn btn-sm btn-danger delete-sub-category" data-index="${index}">삭제</button></td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        subCategoryList.innerHTML = html;
        
        // 삭제 버튼 이벤트 리스너 추가
        const deleteButtons = subCategoryList.querySelectorAll('.delete-sub-category');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.deleteSubCategory(index);
            });
        });
    },
    
    // 대분류 삭제
    deleteMainCategory(index) {
        try {
            const category = DataManager.data.categories.main[index];
            const confirmDelete = confirm(`대분류 '${category.name}'을(를) 삭제하시겠습니까?`);
            
            if (confirmDelete) {
                DataManager.removeMainCategory(index);
                this.renderMainCategories();
                
                // 중분류 선택 옵션 업데이트
                this.updateMainCategorySelectors();
            }
        } catch (error) {
            alert(error.message);
        }
    },
    
    // 중분류 삭제
    deleteSubCategory(index) {
        try {
            const category = DataManager.data.categories.sub[index];
            const confirmDelete = confirm(`중분류 '${category.name}'을(를) 삭제하시겠습니까?`);
            
            if (confirmDelete) {
                DataManager.removeSubCategory(index);
                this.renderSubCategories();
                
                // 중분류 선택 옵션 업데이트
                this.updateSubCategorySelectors();
            }
        } catch (error) {
            alert(error.message);
        }
    },
    
    // 분류 관련 이벤트 리스너 설정
    setupCategoryEventListeners() {
        // 대분류 추가 버튼 이벤트
        const addMainCategoryBtn = document.getElementById('add-main-category-btn');
        if (addMainCategoryBtn) {
            addMainCategoryBtn.addEventListener('click', () => {
                const code = document.getElementById('main-category-code').value.trim().toUpperCase();
                const name = document.getElementById('main-category-name').value.trim();
                const type = document.querySelector('input[name="category-type"]:checked').value;
                
                if (code && name) {
                    try {
                        DataManager.addMainCategory(code, name, type);
                        
                        // 입력 필드 초기화
                        document.getElementById('main-category-code').value = '';
                        document.getElementById('main-category-name').value = '';
                        
                        // 대분류 목록 갱신
                        this.renderMainCategories();
                        
                        // 대분류 선택 목록 갱신
                        this.updateMainCategorySelectors();
                    } catch (error) {
                        alert(error.message);
                    }
                } else {
                    alert('분류 코드와 분류명을 모두 입력해주세요.');
                }
            });
        }
        
        // 중분류 추가 버튼 이벤트
        const addSubCategoryBtn = document.getElementById('add-sub-category-btn');
        if (addSubCategoryBtn) {
            addSubCategoryBtn.addEventListener('click', () => {
                const mainCodeSelect = document.getElementById('sub-category-main');
                const mainCode = mainCodeSelect.value;
                const code = document.getElementById('sub-category-code').value.trim().toUpperCase();
                const name = document.getElementById('sub-category-name').value.trim();
                
                if (mainCode && code && name) {
                    try {
                        DataManager.addSubCategory(mainCode, code, name);
                        
                        // 입력 필드 초기화
                        document.getElementById('sub-category-code').value = '';
                        document.getElementById('sub-category-name').value = '';
                        
                        // 중분류 목록 갱신
                        this.renderSubCategories();
                        
                        // 중분류 선택 목록 갱신
                        this.updateSubCategorySelectors();
                    } catch (error) {
                        alert(error.message);
                    }
                } else {
                    alert('대분류, 코드, 분류명을 모두 입력해주세요.');
                }
            });
        }
    },
    
    // 대분류 선택 요소들 업데이트
    updateMainCategorySelectors() {
        // 대분류 선택 요소 찾기
        const mainCategorySelectors = document.querySelectorAll('.main-category-selector');
        
        // 각 선택 요소 업데이트
        mainCategorySelectors.forEach(selector => {
            const currentValue = selector.value;
            
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
                
                // 이전에 선택된 값 유지
                if (category.code === currentValue) {
                    option.selected = true;
                }
                
                selector.appendChild(option);
            });
            
            // 중분류 추가 페이지의 대분류 선택기인 경우
            if (selector.id === 'sub-category-main') {
                selector.addEventListener('change', () => {
                    const subCategoryCode = document.getElementById('sub-category-code');
                    if (subCategoryCode && selector.value) {
                        // 선택한 대분류에 따라 중분류 옵션 업데이트
                        this.populateSubCategorySelector(selector.value, subCategoryCode);
                    }
                });
            }
            
            // 다른 일반적인 대분류 선택기의 경우 change 이벤트 트리거
            if (selector.id !== 'sub-category-main') {
                // change 이벤트 트리거 (중분류 선택 업데이트를 위해)
                selector.dispatchEvent(new Event('change'));
            }
        });
        
        // 중분류 관리 탭의 대분류 선택기 특별 처리
        const subCategoryMain = document.getElementById('sub-category-main');
        if (subCategoryMain) {
            // 대분류가 선택되어 있다면 해당 대분류에 맞는 중분류 목록을 보여줌
            if (subCategoryMain.value) {
                const subCategoryCode = document.getElementById('sub-category-code');
                if (subCategoryCode) {
                    this.populateSubCategorySelector(subCategoryMain.value, subCategoryCode);
                }
            }
        }
    },
    
    // 중분류 선택 요소들 업데이트
    updateSubCategorySelectors() {
        // 필요한 경우에만 구현
    },
    
    // 중분류 선택 요소에 옵션 채우기 (특정 대분류에 맞는 중분류들)
    populateSubCategorySelector(mainCode, selector) {
        // 선택 요소 비우기
        Utils.dom.clearElement(selector);
        
        // 기본 옵션 추가
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '중분류 선택';
        selector.appendChild(defaultOption);
        
        // 선택한 대분류에 맞는 중분류 옵션 추가
        const subCategories = DataManager.data.categories.sub.filter(sub => sub.mainCode === mainCode);
        
        subCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.code;
            option.textContent = `${category.name} (${category.code})`;
            selector.appendChild(option);
        });
    }
}; 