import { create } from "zustand";
import authService from "../services/authService";
import { persist } from "zustand/middleware";
import useConversationStore from "./conversationStore";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Đăng ký tài khoản
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.register(userData);
          set({ isLoading: false });
          return { success: true, email: userData.email };
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.message || "Đăng ký thất bại",
          });
          return { success: false };
        }
      },

      // Xác thực OTP đăng ký
      verifyOTP: async (email, otp) => {
        set({ isLoading: true, error: null });
        try {
          await authService.verifyOTP(email, otp);
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.message || "Xác thực OTP thất bại",
          });
          return { success: false };
        }
      },

      // Gửi lại OTP
      resendOTP: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await authService.resendOTP(email);
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.message || "Gửi lại OTP thất bại",
          });
          return { success: false };
        }
      },

      // Đăng nhập
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          // apiClient đã trả về trực tiếp data.data từ server (user và accessToken)
          const data = await authService.login(email, password);

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true, user: data.user };
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.message || "Đăng nhập thất bại",
          });
          return { success: false };
        }
      },

      // Cập nhật thông tin người dùng
      updateUserProfile: async (userData) => {
        set({ isLoading: false, error: null });
        try {
          const currentUser = get().user;
          if (!currentUser || !currentUser._id) {
            throw new Error("Không có thông tin người dùng");
          }

          // Gọi API cập nhật
          const updatedUser = await authService.updateUserProfile(
            currentUser._id,
            userData
          );

          // Chỉ cập nhật các trường đã thay đổi thay vì thay thế toàn bộ object
          // Sử dụng cách tương tự như updatePrimaryAvatar
          set((state) => ({
            user: {
              ...state.user,
              // Chỉ cập nhật các trường trong userData mà không lấy toàn bộ updatedUser
              ...userData,
            },
            isLoading: false,
          }));

          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error:
              error.response?.data?.message || "Cập nhật thông tin thất bại",
          });
          return {
            success: false,
            message:
              error.response?.data?.message || "Cập nhật thông tin thất bại",
          };
        }
      },

      // Cập nhật avatar chính mà không làm mới toàn bộ dữ liệu người dùng
      updatePrimaryAvatar: async (avatarUrl) => {
        try {
          const currentUser = get().user;
          if (!currentUser || !currentUser._id) {
            throw new Error("Không có thông tin người dùng");
          }

          // Import userService trực tiếp để tránh lỗi import cycle
          const userService = (await import("../services/userService")).default;

          // Gọi API cập nhật avatar chính
          const response = await userService.updatePrimaryAvatar(
            currentUser._id,
            avatarUrl
          );

          if (response) {
            // Chỉ cập nhật trường avatar mà không thay đổi các trường khác
            set((state) => ({
              user: {
                ...state.user,
                primary_avatar: avatarUrl,
              },
            }));

            return { success: true };
          }

          return { success: false };
        } catch (error) {
          console.error("Lỗi cập nhật avatar:", error);
          set({
            error: error.response?.data?.message || "Cập nhật avatar thất bại",
          });
          return { success: false };
        }
      },

      // Quên mật khẩu
      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await authService.forgotPassword(email);
          set({ isLoading: false });
          return { success: true, email };
        } catch (error) {
          set({
            isLoading: false,
            error:
              error.response?.data?.message ||
              "Gửi yêu cầu quên mật khẩu thất bại",
          });
          return { success: false };
        }
      },

      // Đặt lại mật khẩu
      resetPassword: async (email, otp, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          await authService.resetPassword(email, otp, newPassword);
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.message || "Đặt lại mật khẩu thất bại",
          });
          return { success: false };
        }
      },

      // Kiểm tra trạng thái xác thực
      checkAuth: async () => {
        // Don't check auth if we're already checking or if a previous check recently failed
        const state = get();
        if (state.isLoading || state.authCheckFailed) {
          return { success: false };
        }

        set({ isLoading: true, error: null });
        try {
          const authData = await authService.checkAuth();

          set({
            user: authData.user,
            isAuthenticated: authData.isAuthenticated,
            isLoading: false,
            authCheckFailed: false,
          });
          // console.log("Auth data:", isAuthenticated);
          return {
            success: authData.isAuthenticated,
            user: authData.user,
          };
        } catch (error) {
          console.log(
            "Authentication check failed:",
            error.message || "Unknown error"
          );
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            authCheckFailed: true,
          });

          // Reset the authCheckFailed flag after 5 seconds
          setTimeout(() => {
            set((state) => ({ ...state, authCheckFailed: false }));
          }, 5000);

          return { success: false };
        }
      },

      // Đăng xuất
      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
          // Reset conversation store để tránh dữ liệu cũ còn lưu lại sau khi đăng nhập lại
          useConversationStore.getState().resetConversationStore();

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.message || "Đăng xuất thất bại",
          });

          return { success: false };
        }
      },

      // Reset trạng thái lỗi
      resetError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
