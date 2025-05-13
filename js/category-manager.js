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
        
        // 순서대로 정렬
        const sortedCategories = [...DataManager.data.categories.main].sort((a, b) => a.order - b.order);
        
        let html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>순서</th>
                        <th>코드</th>
                        <th>분류명</th>
                        <th>유형</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        sortedCategories.forEach((category, index) => {
            const typeLabel = category.type === 'income' ? '수입' : '지출';
            const typeClass = category.type === 'income' ? 'text-primary' : 'text-danger';
            
            // 실제 인덱스 (정렬되지 않은 원본 배열에서의 위치)
            const originalIndex = DataManager.data.categories.main.findIndex(c => c.code === category.code);
            
            html += `
                <tr>
                    <td>${category.order}</td>
                    <td>${category.code}</td>
                    <td>${category.name}</td>
                    <td><span class="${typeClass}">${typeLabel}</span></td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary edit-main-category" data-index="${originalIndex}" title="이름 변경">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-primary move-up" data-index="${originalIndex}" ${index === 0 ? 'disabled' : ''}>
                                <i class="bi bi-arrow-up"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-primary move-down" data-index="${originalIndex}" ${index === sortedCategories.length - 1 ? 'disabled' : ''}>
                                <i class="bi bi-arrow-down"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-main-category" data-index="${originalIndex}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        mainCategoryList.innerHTML = html;
        
        // 수정 버튼 이벤트 리스너 추가
        const editButtons = mainCategoryList.querySelectorAll('.edit-main-category');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.edit-main-category').dataset.index);
                this.showEditMainCategoryDialog(index);
            });
        });
        
        // 삭제 버튼 이벤트 리스너 추가
        const deleteButtons = mainCategoryList.querySelectorAll('.delete-main-category');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.delete-main-category').dataset.index);
                this.deleteMainCategory(index);
            });
        });
        
        // 위로 이동 버튼 이벤트 리스너 추가
        const moveUpButtons = mainCategoryList.querySelectorAll('.move-up');
        moveUpButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.move-up').dataset.index);
                this.moveMainCategoryUp(index);
            });
        });
        
        // 아래로 이동 버튼 이벤트 리스너 추가
        const moveDownButtons = mainCategoryList.querySelectorAll('.move-down');
        moveDownButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.move-down').dataset.index);
                this.moveMainCategoryDown(index);
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
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary edit-sub-category" data-index="${index}" title="이름 변경">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-sub-category" data-index="${index}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        subCategoryList.innerHTML = html;
        
        // 수정 버튼 이벤트 리스너 추가
        const editButtons = subCategoryList.querySelectorAll('.edit-sub-category');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.showEditSubCategoryDialog(index);
            });
        });
        
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
        // 모든 중분류 선택기 찾기
        const subCategorySelectors = document.querySelectorAll('.sub-category-selector');
        
        // 각 중분류 선택기 업데이트
        subCategorySelectors.forEach(selector => {
            const currentValue = selector.value;
            
            // 선택기 비우기
            Utils.dom.clearElement(selector);
            
            // 기본 옵션 추가
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '중분류 선택';
            selector.appendChild(defaultOption);
            
            // 모든 중분류 옵션 추가
            DataManager.data.categories.sub.forEach(category => {
                const option = document.createElement('option');
                option.value = category.code;
                option.textContent = `${category.name} (${category.code})`;
                option.dataset.mainCode = category.mainCode; // 대분류 코드 저장
                
                // 이전에 선택된 값 유지
                if (category.code === currentValue) {
                    option.selected = true;
                }
                
                selector.appendChild(option);
            });
            
            // 중분류 변경 시 대분류 자동 선택 이벤트 추가
            selector.addEventListener('change', () => {
                const selectedOption = selector.options[selector.selectedIndex];
                if (selectedOption && selectedOption.dataset.mainCode) {
                    // 대응하는 대분류 선택기 찾기 (같은 폼 내에 있는 main-category-selector 클래스를 가진 요소)
                    const form = selector.closest('form');
                    if (form) {
                        const mainSelector = form.querySelector('.main-category-selector');
                        if (mainSelector) {
                            mainSelector.value = selectedOption.dataset.mainCode;
                        }
                    }
                }
            });
        });
    },
    
    // 중분류 선택 요소에 옵션 채우기 (특정 대분류에 맞는 중분류들)
    populateSubCategorySelector(mainCode, selector) {
        // 현재 선택된 값 저장
        const currentValue = selector.value;
        
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
            option.dataset.mainCode = category.mainCode; // 대분류 코드 저장
            
            // 이전에 선택된 값 유지
            if (category.code === currentValue) {
                option.selected = true;
            }
            
            selector.appendChild(option);
        });
    },
    
    // 대분류 순서 위로 이동
    moveMainCategoryUp(index) {
        const categories = DataManager.data.categories.main;
        const currentCategory = categories[index];
        
        // 현재 순서보다 작은 순서를 가진 카테고리 중 가장 큰 순서 찾기
        const prevCategory = categories
            .filter(c => c.order < currentCategory.order)
            .sort((a, b) => b.order - a.order)[0];
        
        if (prevCategory) {
            // 순서 교환
            const tempOrder = currentCategory.order;
            currentCategory.order = prevCategory.order;
            prevCategory.order = tempOrder;
            
            // 데이터 저장
            DataManager.saveData();
            
            // 목록 갱신
            this.renderMainCategories();
        }
    },
    
    // 대분류 순서 아래로 이동
    moveMainCategoryDown(index) {
        const categories = DataManager.data.categories.main;
        const currentCategory = categories[index];
        
        // 현재 순서보다 큰 순서를 가진 카테고리 중 가장 작은 순서 찾기
        const nextCategory = categories
            .filter(c => c.order > currentCategory.order)
            .sort((a, b) => a.order - b.order)[0];
        
        if (nextCategory) {
            // 순서 교환
            const tempOrder = currentCategory.order;
            currentCategory.order = nextCategory.order;
            nextCategory.order = tempOrder;
            
            // 데이터 저장
            DataManager.saveData();
            
            // 목록 갱신
            this.renderMainCategories();
        }
    },
    
    // 대분류 이름 변경 다이얼로그 표시
    showEditMainCategoryDialog(index) {
        const category = DataManager.data.categories.main[index];
        if (!category) return;
        
        const newName = prompt(`대분류 '${category.name}' (${category.code})의 새 이름을 입력하세요:`, category.name);
        
        if (newName !== null && newName.trim() !== '') {
            try {
                DataManager.updateMainCategoryName(index, newName);
                
                // 성공 메시지
                alert(`대분류명이 '${newName}'으로 변경되었습니다.`);
                
                // 화면 갱신
                this.renderMainCategories();
                this.renderSubCategories(); // 연결된 중분류 표시도 갱신
                
                // 대분류 선택 옵션 업데이트
                this.updateMainCategorySelectors();
            } catch (error) {
                alert(error.message);
            }
        }
    },
    
    // 중분류 이름 변경 다이얼로그 표시
    showEditSubCategoryDialog(index) {
        const category = DataManager.data.categories.sub[index];
        if (!category) return;
        
        // 연결된 대분류 찾기
        const mainCategory = DataManager.data.categories.main.find(c => c.code === category.mainCode);
        const mainCategoryName = mainCategory ? mainCategory.name : '(삭제됨)';
        
        const newName = prompt(`중분류 '${category.name}' (${category.code}, 대분류: ${mainCategoryName})의 새 이름을 입력하세요:`, category.name);
        
        if (newName !== null && newName.trim() !== '') {
            try {
                DataManager.updateSubCategoryName(index, newName);
                
                // 성공 메시지
                alert(`중분류명이 '${newName}'으로 변경되었습니다.`);
                
                // 화면 갱신
                this.renderSubCategories();
                
                // 중분류 선택 옵션 업데이트
                this.updateSubCategorySelectors();
            } catch (error) {
                alert(error.message);
            }
        }
    }
}; 