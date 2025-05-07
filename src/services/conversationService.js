import api from "../utils/apiClient";

const conversationService = {
  // Lấy danh sách cuộc trò chuyện của người dùng hiện tại
  getUserConversations: async () => {
    try {
      return await api.get("/conversation/getAll");
    } catch (error) {
      throw error;
    }
  },

  // Lấy cuộc trò chuyện giữa hai người dùng (nếu đã tồn tại)
  getConversationBetweenUsers: async (userId1, userId2) => {
    try {
      return await api.get(
        `/conversation/checkBetweenUsers?userId1=${userId1}&userId2=${userId2}`
      );
    } catch (error) {
      // Nếu cuộc trò chuyện không tồn tại, trả về null thay vì ném lỗi
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },
  
  // Lấy thông tin cuộc trò chuyện theo ID
  getConversationById: async (conversationId) => {
    try {
      return await api.get(`/conversation/${conversationId}`);
    } catch (error) {
      // Nếu cuộc trò chuyện không tồn tại, trả về null thay vì ném lỗi
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }
};

export default conversationService;
