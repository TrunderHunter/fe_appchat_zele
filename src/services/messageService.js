import api from "../utils/apiClient";

const messageService = {
  // Lấy tin nhắn theo ID cuộc trò chuyện với phân trang
  getMessagesByConversationId: async (
    conversationId,
    limit = 5,
    before_id = null
  ) => {
    try {
      let url = `/message/getByConversation/${conversationId}?limit=${limit}`;
      if (before_id) {
        url += `&before_id=${before_id}`;
      }
      return await api.get(url);
    } catch (error) {
      throw error;
    }
  },

  // Gửi tin nhắn cá nhân (1-1)
  sendMessage: async (receiverId, messageData, file = null) => {
    try {
      // Tạo FormData nếu có file đính kèm
      if (file) {
        const formData = new FormData();
        formData.append("receiverId", receiverId);
        formData.append("message_type", messageData.message_type || "text");

        if (messageData.content) {
          formData.append("content", messageData.content);
        }

        if (messageData.mentions) {
          formData.append("mentions", JSON.stringify(messageData.mentions));
        }

        if (messageData.self_destruct_timer) {
          formData.append(
            "self_destruct_timer",
            messageData.self_destruct_timer
          );
        }

        formData.append("file", file);

        return await api.post("/message/send", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Không có file, gửi JSON thông thường
        return await api.post("/message/send", {
          receiverId,
          ...messageData,
        });
      }
    } catch (error) {
      throw error;
    }
  },

  // Gửi tin nhắn nhóm
  sendGroupMessage: async (conversationId, messageData, file = null) => {
    try {
      // Tạo FormData nếu có file đính kèm
      if (file) {
        const formData = new FormData();
        formData.append("conversationId", conversationId);
        formData.append("message_type", messageData.message_type || "text");

        if (messageData.content) {
          formData.append("content", messageData.content);
        }

        if (messageData.mentions) {
          formData.append("mentions", JSON.stringify(messageData.mentions));
        }

        if (messageData.self_destruct_timer) {
          formData.append(
            "self_destruct_timer",
            messageData.self_destruct_timer
          );
        }
        formData.append("file", file);

        return await api.post("/message/send-group", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Không có file, gửi JSON thông thường
        return await api.post("/message/send-group", {
          conversationId,
          ...messageData,
        });
      }
    } catch (error) {
      throw error;
    }
  },

  // Thu hồi tin nhắn
  revokeMessage: async (messageId) => {
    try {
      return await api.put(`/message/revoke/${messageId}`);
    } catch (error) {
      throw error;
    }
  },

  // Chuyển tiếp tin nhắn
  forwardMessage: async (receiverId, originalMessageId, isGroup = false) => {
    try {
      return await api.post("/message/forward", {
        receiverId,
        originalMessageId,
        isGroup,
      });
    } catch (error) {
      throw error;
    }
  },
};

export default messageService;
