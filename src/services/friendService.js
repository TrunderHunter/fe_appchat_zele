import api from "../utils/apiClient";

const friendService = {
  // Gửi lời mời kết bạn
  sendFriendRequest: async (receiverId, message = "") => {
    try {
      return await api.post("/friend-request/send", { receiverId, message });
    } catch (error) {
      throw error;
    }
  },

  // Phản hồi lời mời kết bạn (chấp nhận hoặc từ chối)
  respondToFriendRequest: async (requestId, status) => {
    try {
      return await api.put("/friend-request/respond", { requestId, status });
    } catch (error) {
      throw error;
    }
  },

  // Hủy lời mời kết bạn đã gửi
  cancelFriendRequest: async (requestId) => {
    try {
      return await api.delete(`/friend-request/cancel/${requestId}`);
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách lời mời kết bạn đã nhận
  getFriendRequests: async () => {
    try {
      return await api.get("/friend-request/list");
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách lời mời kết bạn đã gửi
  getSentFriendRequests: async () => {
    try {
      return await api.get("/friend-request/sent");
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách bạn bè
  getUserFriends: async (userId = null) => {
    try {
      const url = userId ? `/user/${userId}/friends` : "/user/friends";
      return await api.get(url);
    } catch (error) {
      throw error;
    }
  },

  // Tìm kiếm người dùng theo tên hoặc số điện thoại
  searchUsers: async (query) => {
    try {
      let data = null;
      if (query) {
        data = await api.get(
          `/user/searchByNameOrPhone?query=${encodeURIComponent(query)}`
        );
      }
      console.log("searchUsers", data);
      return data;
    } catch (error) {
      throw error;
    }
  },
};

export default friendService;
