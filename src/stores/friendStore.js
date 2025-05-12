import { create } from "zustand";
import { persist } from "zustand/middleware";
import friendService from "../services/friendService";
import toast from "react-hot-toast";
import socketManager from "../services/SocketManager";
import useAuthStore from "./authStore";

const useFriendStore = create(
  persist(
    (set, get) => ({
      friends: [],
      friendRequests: [],
      sentRequests: [],
      searchResults: [],
      isLoading: false,
      error: null,

      // Thiết lập config cho store
      config: {
        preferSocket: true, // Mặc định, ưu tiên sử dụng socket khi có thể
      },

      // Chuyển đổi giữa API và socket
      setPreferSocket: (value) => {
        set((state) => ({
          ...state,
          config: {
            ...state.config,
            preferSocket: !!value,
          },
        }));
      },

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
      }, // Lấy danh sách lời mời kết bạn đã nhận
      fetchFriendRequests: async () => {
        set({ isLoading: true, error: null });

        // Sử dụng API để lấy dữ liệu - phương pháp chuẩn, không dùng socket cho việc này
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
      }, // Lấy danh sách lời mời kết bạn đã gửi
      fetchSentRequests: async () => {
        set({ isLoading: true, error: null });

        // Sử dụng API để lấy dữ liệu ban đầu - cách tiếp cận tốt nhất
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
      }, // Gửi lời mời kết bạn
      sendFriendRequest: async (receiverId, message = "") => {
        set({ isLoading: true, error: null });
        try {
          const socket = socketManager.getSocket();
          const { user } = useAuthStore.getState();

          // Nếu socket đang hoạt động, ưu tiên sử dụng socket
          if (socket && socket.connected && user?._id) {
            // Sử dụng Promise để đợi phản hồi từ socket
            return new Promise((resolve) => {
              // Đăng ký lắng nghe sự kiện thành công (danh sách lời mời đã gửi được cập nhật)
              socket.once("sentFriendRequests", (sentRequests) => {
                // Cập nhật store với danh sách mới
                set({
                  sentRequests: sentRequests,
                  isLoading: false,
                });
                toast.success("Đã gửi lời mời kết bạn thành công");
                resolve({ success: true, sentRequests });
              });

              // Đăng ký lắng nghe sự kiện lỗi
              socket.once("error", (error) => {
                console.error("Socket error received:", error);
                set({
                  isLoading: false,
                  error:
                    typeof error === "string"
                      ? error
                      : error.message || "Không thể gửi lời mời kết bạn",
                });
                toast.error(
                  typeof error === "string"
                    ? error
                    : error.message || "Không thể gửi lời mời kết bạn"
                );
                resolve({ success: false });
              });

              // Gửi yêu cầu qua socket
              socket.emit("sendFriendRequest", {
                senderId: user._id,
                receiverId: receiverId,
                message: message,
              });

              // Lấy danh sách lời mời đã gửi ngay sau khi gửi
              setTimeout(() => {
                socket.emit("getSentFriendRequests", { userId: user._id });
              }, 300);
            });
          } else {
            // Fallback: Sử dụng API khi socket không khả dụng
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
          }
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
      }, // Phản hồi lời mời kết bạn (chấp nhận/từ chối)
      respondToFriendRequest: async (requestId, status) => {
        set({ isLoading: true, error: null });
        try {
          const socket = socketManager.getSocket();
          const { user } = useAuthStore.getState();

          // Nếu socket đang hoạt động, ưu tiên sử dụng socket
          if (socket && socket.connected && user?._id) {
            // Sử dụng Promise để đợi phản hồi từ socket
            return new Promise((resolve) => {
              // Lắng nghe sự kiện phản hồi một lần
              socket.once("friendRequestResponse", (data) => {
                const { status, request, friends } = data;

                // Cập nhật danh sách lời mời kết bạn
                const updatedRequests = get().friendRequests.filter(
                  (req) => req._id !== requestId
                );

                // Nếu được chấp nhận và server gửi kèm danh sách bạn bè mới
                if (status === "accepted" && friends) {
                  set({
                    friendRequests: updatedRequests,
                    friends: friends,
                    isLoading: false,
                  });
                  toast.success("Đã chấp nhận lời mời kết bạn");
                } else if (status === "rejected") {
                  set({
                    friendRequests: updatedRequests,
                    isLoading: false,
                  });
                  toast.success("Đã từ chối lời mời kết bạn");
                } else {
                  set({
                    friendRequests: updatedRequests,
                    isLoading: false,
                  });
                }

                resolve({ success: true, request, friends });
              });

              // Lắng nghe lỗi
              socket.once("error", (error) => {
                console.error("Socket error received:", error);
                set({
                  isLoading: false,
                  error:
                    typeof error === "string"
                      ? error
                      : error.message || "Không thể phản hồi lời mời kết bạn",
                });
                toast.error(
                  typeof error === "string"
                    ? error
                    : error.message || "Không thể phản hồi lời mời kết bạn"
                );
                resolve({ success: false });
                // Fallback sang API nếu socket gặp lỗi
                setTimeout(() => {
                  get().respondToFriendRequestWithAPI(requestId, status);
                }, 500);
              });
              // Gửi sự kiện
              socket.emit("respondToFriendRequest", {
                requestId,
                status: status, // Gửi đúng định dạng "accepted" hoặc "rejected"
                userId: user._id,
              });
            });
          } else {
            // Fallback: Sử dụng API khi socket không khả dụng
            return get().respondToFriendRequestWithAPI(requestId, status);
          }
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

      // Hàm helper cho việc phản hồi lời mời kết bạn qua API
      respondToFriendRequestWithAPI: async (requestId, status) => {
        try {
          const updatedRequest = await friendService.respondToFriendRequest(
            requestId,
            status
          );

          // Cập nhật danh sách lời mời kết bạn
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
      }, // Hủy lời mời kết bạn đã gửi
      cancelFriendRequest: async (requestId) => {
        set({ isLoading: true, error: null });
        try {
          const socket = socketManager.getSocket();
          const { user } = useAuthStore.getState();

          // Nếu socket đang hoạt động, ưu tiên sử dụng socket
          if (socket && socket.connected && user?._id) {
            // Tìm thông tin về lời mời kết bạn để biết receiver
            const friendRequest = get().sentRequests.find(
              (request) => request._id === requestId
            );

            // Cập nhật trước UI để tránh lag
            if (friendRequest) {
              const updatedSentRequests = get().sentRequests.filter(
                (request) => request._id !== requestId
              );

              set({
                sentRequests: updatedSentRequests,
                isLoading: false,
              });
            }

            // Sử dụng Promise để đợi phản hồi từ socket
            return new Promise((resolve) => {
              // Lắng nghe sự kiện phản hồi một lần
              socket.once("friendRequestCancelled", (data) => {
                if (data.success) {
                  // Cập nhật đã được thực hiện trước đó
                  set({ isLoading: false });

                  toast.success("Đã hủy lời mời kết bạn");
                  resolve({ success: true });

                  // Không cần gọi getSentFriendRequests vì UI đã cập nhật trước đó
                } else {
                  // Nếu không thành công, cần fetch lại để đồng bộ
                  set({ isLoading: false });
                  toast.error(data.message || "Không thể hủy lời mời kết bạn");
                  resolve({ success: false });

                  // Fetch lại danh sách lời mời đã gửi
                  get().fetchSentRequests();
                }
              });

              // Lắng nghe lỗi
              socket.once("error", (error) => {
                console.error("Socket error received:", error);
                set({
                  isLoading: false,
                  error:
                    typeof error === "string"
                      ? error
                      : error.message || "Không thể hủy lời mời kết bạn",
                });
                toast.error(
                  typeof error === "string"
                    ? error
                    : error.message || "Không thể hủy lời mời kết bạn"
                );
                resolve({ success: false });
                // Fallback sang API nếu socket gặp lỗi
                setTimeout(() => {
                  get().cancelFriendRequestWithAPI(requestId);
                }, 500);
              });

              // Gửi sự kiện
              socket.emit("cancelFriendRequest", {
                requestId,
                userId: user._id,
              });
            });
          } else {
            // Fallback: Sử dụng API khi socket không khả dụng
            return get().cancelFriendRequestWithAPI(requestId);
          }
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

      // Hàm helper cho việc hủy lời mời kết bạn qua API
      cancelFriendRequestWithAPI: async (requestId) => {
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
