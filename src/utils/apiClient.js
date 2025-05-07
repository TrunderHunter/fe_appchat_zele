import axios from "axios";
import { toast } from "react-hot-toast";

// Lấy URL API từ biến môi trường hoặc sử dụng giá trị mặc định
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Tạo instance Axios với cấu hình mặc định
const apiClient = axios.create({
  baseURL: API_URL,
  // timeout: 10000, // Timeout 10s
  withCredentials: true, // QUAN TRỌNG: Gửi cookie với mỗi request để xác thực
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Không cần đặt token vào header nữa vì cookie sẽ tự động được gửi đi
    // với mỗi request nếu withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Kiểm tra cấu trúc response từ server và trích xuất dữ liệu
    // Nếu response có cấu trúc { status, message, data }
    if (response.data && typeof response.data === "object") {
      // Nếu request thành công, trả về trực tiếp data
      if (response.data.status === "success") {
        // Lưu ý: Không cần lưu token vào localStorage nữa
        // vì server sẽ tự động thiết lập cookie

        return response.data.data;
      }

      // Nếu có thông báo thành công từ API, hiển thị nó
      if (response.data.message && response.config.method !== "get") {
        toast.success(response.data.message);
      }
    }

    // Nếu không có cấu trúc cụ thể hoặc là request GET, trả về response bình thường
    return response.data;
  },
  (error) => {
    // Xử lý lỗi response
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi kết nối đến máy chủ";

    // Hiển thị thông báo lỗi chỉ khi không phải lỗi xác thực từ checkAuth
    const isCheckAuthRequest = error.config?.url?.includes("/auth/check-auth");
    if (!isCheckAuthRequest) {
      toast.error(errorMessage);
    }

    // Xử lý lỗi 401 - Unauthorized (token hết hạn hoặc không hợp lệ)
    if (error.response?.status === 401) {
      console.log("Unauthorized access");
      // Không cần xóa token từ localStorage nữa
      // Server sẽ xử lý việc xóa/vô hiệu hóa cookie
    }

    return Promise.reject(error);
  }
);

// Helper functions để làm việc với API
const api = {
  /**
   * GET request
   * @param {string} url - URL endpoint
   * @param {Object} params - URL parameters
   * @param {Object} config - Axios config
   */
  get: (url, params = {}, config = {}) => {
    return apiClient.get(url, { ...config, params });
  },

  /**
   * POST request
   * @param {string} url - URL endpoint
   * @param {Object} data - Request body
   * @param {Object} config - Axios config
   */
  post: (url, data = {}, config = {}) => {
    return apiClient.post(url, data, config);
  },

  /**
   * PUT request
   * @param {string} url - URL endpoint
   * @param {Object} data - Request body
   * @param {Object} config - Axios config
   */
  put: (url, data = {}, config = {}) => {
    return apiClient.put(url, data, config);
  },

  /**
   * PATCH request
   * @param {string} url - URL endpoint
   * @param {Object} data - Request body
   * @param {Object} config - Axios config
   */
  patch: (url, data = {}, config = {}) => {
    return apiClient.patch(url, data, config);
  },

  /**
   * DELETE request
   * @param {string} url - URL endpoint
   * @param {Object} config - Axios config
   */
  delete: (url, config = {}) => {
    return apiClient.delete(url, config);
  },
};

export default api;
