import { create } from "zustand";
import { persist } from "zustand/middleware";
import friendService from "../services/friendService";
import toast from "react-hot-toast";

const useFriendStore = create(
  persist(
    (set, get) => ({
      friends: [],
      friendRequests: [],
      sentRequests: [],
      searchResults: [],
      isLoading: false,
      error: null,

      // Lấy danh sách bạn bè
      fetchFriends: async () => {
        set({ isLoading: true, error: null });
        try {
          const friends = await friendService.getUserFriends();
          set({
            friends: friends,
            isLoading: false,
          });
          return { success: true, friends: friends };
        } catch (error) {
          set({
            isLoading: false,
            error:
              error.response?.data?.message || "Không thể tải danh sách bạn bè",
          });
          return { success: false };
        }
      },

      // Lấy danh sách lời mời kết bạn đã nhận
      fetchFriendRequests: async () => {
        set({ isLoading: true, error: null });
        try {
          const friendRequests = await friendService.getFriendRequests();
          set({
            friendRequests: friendRequests,
            isLoading: false,
          });
          return { success: true, requests: friendRequests };
        } catch (error) {
          set({
            isLoading: false,
            error:
              error.response?.data?.message ||
              "Không thể tải danh sách lời mời kết bạn",
          });
          return { success: false };
        }
      },

      // Lấy danh sách lời mời kết bạn đã gửi
      fetchSentRequests: async () => {
        set({ isLoading: true, error: null });
        try {
          const sentRequests = await friendService.getSentFriendRequests();
          set({
            sentRequests: sentRequests,
            isLoading: false,
          });
          return { success: true, requests: sentRequests };
        } catch (error) {
          set({
            isLoading: false,
            error:
              error.response?.data?.message ||
              "Không thể tải danh sách lời mời đã gửi",
          });
          return { success: false };
        }
      },

      // Gửi lời mời kết bạn
      sendFriendRequest: async (receiverId, message = "") => {
        set({ isLoading: true, error: null });
        try {
          const newRequest = await friendService.sendFriendRequest(
            receiverId,
            message
          );

          // Cập nhật danh sách lời mời đã gửi
          const currentSentRequests = get().sentRequests;
          set({
            sentRequests: [...currentSentRequests, newRequest],
            isLoading: false,
          });

          toast.success("Đã gửi lời mời kết bạn thành công");
          return { success: true, request: newRequest };
        } catch (error) {
          set({
            isLoading: false,
            error:
              error.response?.data?.message || "Không thể gửi lời mời kết bạn",
          });
          toast.error(
            error.response?.data?.message || "Không thể gửi lời mời kết bạn"
          );
          return { success: false };
        }
      },

      // Phản hồi lời mời kết bạn (chấp nhận/từ chối)
      respondToFriendRequest: async (requestId, status) => {
        set({ isLoading: true, error: null });
        try {
          const updatedRequest = await friendService.respondToFriendRequest(
            requestId,
            status
          );

          // Cập nhật danh sách lời mời kết bạn và danh sách bạn bè
          const updatedRequests = get().friendRequests.filter(
            (request) => request._id !== requestId
          );

          set({ friendRequests: updatedRequests, isLoading: false });

          // Nếu chấp nhận thì cập nhật danh sách bạn bè
          if (status === "accepted") {
            const friends = await friendService.getUserFriends();
            set({ friends: friends });
            toast.success("Đã chấp nhận lời mời kết bạn");
          } else {
            toast.success("Đã từ chối lời mời kết bạn");
          }

          return { success: true, request: updatedRequest };
        } catch (error) {
          set({
            isLoading: false,
            error:
              error.response?.data?.message ||
              "Không thể phản hồi lời mời kết bạn",
          });
          toast.error(
            error.response?.data?.message ||
              "Không thể phản hồi lời mời kết bạn"
          );
          return { success: false };
        }
      },

      // Hủy lời mời kết bạn đã gửi
      cancelFriendRequest: async (requestId) => {
        set({ isLoading: true, error: null });
        try {
          await friendService.cancelFriendRequest(requestId);

          // Cập nhật danh sách lời mời đã gửi
          const updatedSentRequests = get().sentRequests.filter(
            (request) => request._id !== requestId
          );

          set({
            sentRequests: updatedSentRequests,
            isLoading: false,
          });

          toast.success("Đã hủy lời mời kết bạn");
          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error:
              error.response?.data?.message || "Không thể hủy lời mời kết bạn",
          });
          toast.error(
            error.response?.data?.message || "Không thể hủy lời mời kết bạn"
          );
          return { success: false };
        }
      },

      // Tìm kiếm người dùng
      searchUsers: async (query) => {
        set({ isLoading: true, error: null });
        try {
          const users = await friendService.searchUsers(query);
          set({
            searchResults: users,
            isLoading: false,
          });
          return { success: true, users: users };
        } catch (error) {
          set({
            isLoading: false,
            error:
              error.response?.data?.message || "Không thể tìm kiếm người dùng",
          });
          return { success: false };
        }
      },

      // Reset trạng thái lỗi
      resetError: () => set({ error: null }),

      // Xóa kết quả tìm kiếm
      clearSearchResults: () => set({ searchResults: [] }),
    }),
    {
      name: "friend-storage",
      partialize: (state) => ({
        friends: state.friends,
      }),
    }
  )
);

export default useFriendStore;
