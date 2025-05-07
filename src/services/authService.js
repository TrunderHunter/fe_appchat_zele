import api from "../utils/apiClient";

const authService = {
  // Đăng ký tài khoản
  register: async (userData) => {
    try {
      return await api.post("/auth/register", userData);
    } catch (error) {
      throw error;
    }
  },

  // Xác thực OTP đăng ký
  verifyOTP: async (email, otp) => {
    try {
      return await api.post("/auth/verify-otp", { email, otp });
    } catch (error) {
      throw error;
    }
  },

  // Gửi lại OTP đăng ký
  resendOTP: async (email) => {
    try {
      return await api.post("/auth/resend-otp", { email });
    } catch (error) {
      throw error;
    }
  },

  // Đăng nhập
  login: async (email, password) => {
    try {
      return await api.post("/auth/login", { email, password });
    } catch (error) {
      throw error;
    }
  },

  // Quên mật khẩu - yêu cầu OTP
  forgotPassword: async (email) => {
    try {
      return await api.post("/auth/forgot-password", { email });
    } catch (error) {
      throw error;
    }
  },

  // Đặt lại mật khẩu với OTP
  resetPassword: async (email, otp, newPassword) => {
    try {
      return await api.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
    } catch (error) {
      throw error;
    }
  },

  // Kiểm tra trạng thái xác thực
  checkAuth: async () => {
    try {
      return await api.get("/auth/check-auth");
    } catch (error) {
      throw error;
    }
  },

  // Lấy thông tin người dùng
  getUserProfile: async (userId) => {
    try {
      return await api.get(`/user/getUser?userId=${userId}`);
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật thông tin người dùng
  updateUserProfile: async (userId, userData) => {
    try {
      // Xử lý đặc biệt cho trường avatar nếu có
      if (userData.avatar) {
        // Đặt tên trường là imageUrl theo yêu cầu của backend
        userData.imageUrl = userData.avatar;
        delete userData.avatar;
      }

      return await api.put(`/user/update/${userId}`, userData);
    } catch (error) {
      throw error;
    }
  },

  // Đăng xuất
  logout: async () => {
    try {
      // Gọi API đăng xuất - server sẽ xóa cookie
      const result = await api.post("/auth/logout");
      // Không cần xóa token từ localStorage nữa
      return result;
    } catch (error) {
      throw error;
    }
  },
};

export default authService;
