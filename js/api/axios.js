/**
 * API 통신을 위한 Axios 인스턴스 설정
 */
// 개발/프로덕션 환경에 따라 API URL 설정
// 브라우저에서는 window.location.hostname을 기반으로 판단
const API_URL = window.location.hostname === 'localhost' 
                ? 'http://localhost:5000/api' 
                : '/.netlify/functions/api';

// Axios 인스턴스 생성 및 설정
async function getAxiosInstance() {
  try {
    // Axios 라이브러리가 로드되지 않은 경우 동적으로 로드
    if (!window.axios) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';
      script.async = true;
      document.head.appendChild(script);
      
      // 스크립트 로드 완료 대기
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });
    }
    
    // Axios 인스턴스 설정
    const instance = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // 요청 인터셉터 - JWT 토큰을 헤더에 추가
    instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // 응답 인터셉터 - 에러 처리
    instance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error('API 에러 발생:', error);
        
        if (error.response) {
          // 서버가 응답을 반환한 경우
          console.error('응답 상태:', error.response.status);
          console.error('응답 데이터:', error.response.data);
          
          if (error.response.status === 401) {
            // 인증 오류 시 로그인 페이지로 리디렉션 또는 로그인 모달 표시
            localStorage.removeItem('jwt_token');
            console.error('인증이 필요합니다. 다시 로그인해주세요.');
            
            // 로그인 모달 표시 등의 처리
            showLoginModal();
          } else if (error.response.status === 502) {
            // 502 Bad Gateway - 서버리스 함수 문제일 가능성이 높음
            console.error('서버 연결 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
            alert('서버 연결 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
          }
        } else if (error.request) {
          // 요청은 전송되었으나 응답을 받지 못한 경우
          console.error('응답을 받지 못했습니다:', error.request);
          alert('서버 응답이 없습니다. 인터넷 연결을 확인해주세요.');
        } else {
          // 요청 설정 중 오류가 발생한 경우
          console.error('요청 오류:', error.message);
          alert('요청 처리 중 오류가 발생했습니다.');
        }
        
        return Promise.reject(error);
      }
    );
    
    return instance;
  } catch (error) {
    console.error('Axios 설정 중 오류 발생:', error);
    throw error;
  }
}

// 로그인 모달 표시 함수 (필요에 따라 구현)
function showLoginModal() {
  const loginModal = document.getElementById('login-modal');
  if (loginModal) {
    // 부트스트랩 모달 표시
    const modal = new bootstrap.Modal(loginModal);
    modal.show();
  } else {
    // 로그인 페이지로 리디렉션
    window.location.href = '/login.html';
  }
}

// API 요청 함수들
const api = {
  // 인증 관련 API
  auth: {
    register: async (userData) => {
      const axios = await getAxiosInstance();
      const response = await axios.post('/auth/register', userData);
      if (response.data.token) {
        localStorage.setItem('jwt_token', response.data.token);
      }
      return response.data;
    },
    
    login: async (credentials) => {
      const axios = await getAxiosInstance();
      const response = await axios.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('jwt_token', response.data.token);
      }
      return response.data;
    },
    
    logout: async () => {
      const axios = await getAxiosInstance();
      const response = await axios.get('/auth/logout');
      localStorage.removeItem('jwt_token');
      return response.data;
    },
    
    getMe: async () => {
      const axios = await getAxiosInstance();
      const response = await axios.get('/auth/me');
      return response.data;
    }
  },
  
  // 일회성 지출/수입 관련 API
  oneTimeExpenses: {
    getAll: async (year) => {
      const axios = await getAxiosInstance();
      const url = year ? `/expenses/one-time?year=${year}` : '/expenses/one-time';
      const response = await axios.get(url);
      return response.data;
    },
    
    getById: async (id) => {
      const axios = await getAxiosInstance();
      const response = await axios.get(`/expenses/one-time/${id}`);
      return response.data;
    },
    
    create: async (expenseData) => {
      const axios = await getAxiosInstance();
      const response = await axios.post('/expenses/one-time', expenseData);
      return response.data;
    },
    
    update: async (id, expenseData) => {
      const axios = await getAxiosInstance();
      const response = await axios.put(`/expenses/one-time/${id}`, expenseData);
      return response.data;
    },
    
    delete: async (id) => {
      const axios = await getAxiosInstance();
      const response = await axios.delete(`/expenses/one-time/${id}`);
      return response.data;
    }
  },
  
  // 반복 지출/수입 관련 API
  recurringExpenses: {
    getAll: async () => {
      const axios = await getAxiosInstance();
      const response = await axios.get('/expenses/recurring');
      return response.data;
    },
    
    getById: async (id) => {
      const axios = await getAxiosInstance();
      const response = await axios.get(`/expenses/recurring/${id}`);
      return response.data;
    },
    
    create: async (expenseData) => {
      const axios = await getAxiosInstance();
      const response = await axios.post('/expenses/recurring', expenseData);
      return response.data;
    },
    
    update: async (id, expenseData) => {
      const axios = await getAxiosInstance();
      const response = await axios.put(`/expenses/recurring/${id}`, expenseData);
      return response.data;
    },
    
    delete: async (id) => {
      const axios = await getAxiosInstance();
      const response = await axios.delete(`/expenses/recurring/${id}`);
      return response.data;
    }
  },
  
  // 카테고리 관련 API
  categories: {
    getMainCategories: async () => {
      const axios = await getAxiosInstance();
      const response = await axios.get('/categories/main');
      return response.data;
    },
    
    getSubCategories: async (mainCode) => {
      const axios = await getAxiosInstance();
      const url = mainCode ? `/categories/sub?mainCode=${mainCode}` : '/categories/sub';
      const response = await axios.get(url);
      return response.data;
    },
    
    addMainCategory: async (categoryData) => {
      const axios = await getAxiosInstance();
      const response = await axios.post('/categories/main', categoryData);
      return response.data;
    },
    
    addSubCategory: async (categoryData) => {
      const axios = await getAxiosInstance();
      const response = await axios.post('/categories/sub', categoryData);
      return response.data;
    },
    
    updateMainCategory: async (id, categoryData) => {
      const axios = await getAxiosInstance();
      const response = await axios.put(`/categories/main/${id}`, categoryData);
      return response.data;
    },
    
    updateSubCategory: async (id, categoryData) => {
      const axios = await getAxiosInstance();
      const response = await axios.put(`/categories/sub/${id}`, categoryData);
      return response.data;
    },
    
    deleteMainCategory: async (id) => {
      const axios = await getAxiosInstance();
      const response = await axios.delete(`/categories/main/${id}`);
      return response.data;
    },
    
    deleteSubCategory: async (id) => {
      const axios = await getAxiosInstance();
      const response = await axios.delete(`/categories/sub/${id}`);
      return response.data;
    },
    
    updateMainCategoryByCode: async (code, categoryData) => {
      const axios = await getAxiosInstance();
      const response = await axios.put(`/categories/main/code/${code}`, categoryData);
      return response.data;
    },
    
    updateSubCategoryByCode: async (code, categoryData) => {
      const axios = await getAxiosInstance();
      const response = await axios.put(`/categories/sub/code/${code}`, categoryData);
      return response.data;
    }
  },
  
  // 공휴일 관련 API
  holidays: {
    getAll: async (year) => {
      const axios = await getAxiosInstance();
      const url = year ? `/holidays?year=${year}` : '/holidays';
      const response = await axios.get(url);
      return response.data;
    },
    
    getById: async (id) => {
      const axios = await getAxiosInstance();
      const response = await axios.get(`/holidays/${id}`);
      return response.data;
    },
    
    create: async (holidayData) => {
      const axios = await getAxiosInstance();
      const response = await axios.post('/holidays', holidayData);
      return response.data;
    },
    
    batchCreate: async (holidays) => {
      const axios = await getAxiosInstance();
      const response = await axios.post('/holidays/batch', { holidays });
      return response.data;
    },
    
    update: async (id, holidayData) => {
      const axios = await getAxiosInstance();
      const response = await axios.put(`/holidays/${id}`, holidayData);
      return response.data;
    },
    
    delete: async (id) => {
      const axios = await getAxiosInstance();
      const response = await axios.delete(`/holidays/${id}`);
      return response.data;
    },
    
    deleteByYear: async (year) => {
      const axios = await getAxiosInstance();
      const response = await axios.delete(`/holidays/year/${year}`);
      return response.data;
    }
  }
};

// API 객체를 전역 window 객체에 추가
window.api = api; 