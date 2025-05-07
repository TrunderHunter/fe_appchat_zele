import api from "../utils/apiClient";

const userService = {
  /**
   * Tải lên ảnh đại diện mới bằng file
   * @param {string} userId - ID của người dùng
   * @param {FormData} formData - FormData chứa file ảnh (với key là 'avatar')
   * @returns {Promise<Object>} - Thông tin về ảnh đại diện đã tải lên
   */
  uploadAvatar: async (userId, formData) => {
    try {
      const response = await api.post(
        `/user/upload-avatar/${userId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Tải lên ảnh đại diện bằng URL có sẵn
   * @param {string} userId - ID của người dùng
   * @param {string} imageUrl - URL của ảnh đại diện
   * @returns {Promise<Object>} - Thông tin về ảnh đại diện đã tải lên
   */
  uploadAvatarUrl: async (userId, imageUrl) => {
    try {
      const response = await api.post(`/user/upload-avatar/${userId}`, {
        imageUrl,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cập nhật ảnh đại diện chính từ các ảnh đã tải lên trước đó
   * @param {string} userId - ID của người dùng
   * @param {string} avatarUrl - URL của ảnh đại diện muốn đặt làm ảnh chính
   * @returns {Promise<Object>} - Thông tin người dùng đã cập nhật
   */
  updatePrimaryAvatar: async (userId, avatarUrl) => {
    try {
      const response = await api.put(`/user/updateAvatar/${userId}`, {
        imageUrl: avatarUrl,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy danh sách ảnh đại diện của người dùng
   * @param {string} userId - ID của người dùng
   * @returns {Promise<Array>} - Danh sách các URL ảnh đại diện
   */
  getUserAvatars: async (userId) => {
    try {
      const response = await api.get(`/user/getUser?userId=${userId}`);
      if (response && response.avatar_images) {
        return response.avatar_images;
      }
      return [];
    } catch (error) {
      throw error;
    }
  },
};

export default userService;
