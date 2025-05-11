import api from "../utils/apiClient";

const groupService = {
  // Tạo nhóm chat mới
  createGroup: async (groupData) => {
    try {
      const formData = new FormData();

      // Thêm các trường cơ bản
      formData.append("name", groupData.name);

      if (groupData.description) {
        formData.append("description", groupData.description);
      }

      // Thêm danh sách thành viên - đảm bảo gửi đúng định dạng mà backend mong đợi
      if (groupData.members && groupData.members.length > 0) {
        // Sửa: thêm từng thành viên một thay vì gửi dưới dạng chuỗi JSON
        groupData.members.forEach((memberId, index) => {
          formData.append(`members[${index}]`, memberId);
        });
      }

      // Thêm avatar nếu có
      if (groupData.avatar instanceof File) {
        formData.append("avatar", groupData.avatar);
      } else if (groupData.avatar) {
        formData.append("avatar", groupData.avatar);
      }

      // Log formData để debug
      console.log("FormData entries:");
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      return await api.post("/group/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.error(
        "Error creating group:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Lấy danh sách nhóm của người dùng
  getUserGroups: async () => {
    try {
      return await api.get("/group");
    } catch (error) {
      throw error;
    }
  },

  // Lấy chi tiết của một nhóm
  getGroupById: async (groupId) => {
    try {
      return await api.get(`/group/${groupId}`);
    } catch (error) {
      throw error;
    }
  },

  // Thêm thành viên vào nhóm
  addMemberToGroup: async (groupId, memberId) => {
    try {
      return await api.post("/group/member/add", { groupId, memberId });
    } catch (error) {
      throw error;
    }
  },

  // Xóa thành viên khỏi nhóm
  removeMemberFromGroup: async (groupId, memberId) => {
    try {
      return await api.post("/group/member/remove", { groupId, memberId });
    } catch (error) {
      throw error;
    }
  },

  // Thay đổi vai trò thành viên
  changeRoleMember: async (groupId, memberId, role) => {
    try {
      return await api.put("/group/member/role", { groupId, memberId, role });
    } catch (error) {
      throw error;
    }
  },
  // Cập nhật thông tin nhóm
  updateGroup: async (groupId, updateData, isFormData = false) => {
    try {
      let formData;
      
      // Nếu đã là FormData thì sử dụng trực tiếp
      if (isFormData && updateData instanceof FormData) {
        formData = updateData;
      } else {
        // Không thì tạo mới FormData
        formData = new FormData();

        // Thêm các trường cần cập nhật
        if (updateData.name) {
          formData.append("name", updateData.name);
        }

        if (updateData.description) {
          formData.append("description", updateData.description);
        }

        if (updateData.settings) {
          formData.append("settings", JSON.stringify(updateData.settings));
        }
        
        // Kiểm tra nếu có yêu cầu xóa avatar
        if (updateData.removeAvatar) {
          formData.append("removeAvatar", "true");
        }
      }

      // Thêm avatar mới nếu có
      if (updateData.avatar instanceof File) {
        formData.append("avatar", updateData.avatar);
      } else if (updateData.avatar) {
        formData.append("avatar", updateData.avatar);
      }

      return await api.put(`/group/${groupId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      throw error;
    }
  },

  // Lấy link tham gia nhóm
  getGroupInviteLink: async (groupId) => {
    try {
      return await api.get(`/group/${groupId}/invite`);
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật trạng thái link tham gia (bật/tắt)
  updateInviteLinkStatus: async (groupId, isActive) => {
    try {
      return await api.put(`/group/${groupId}/invite`, { isActive });
    } catch (error) {
      throw error;
    }
  },

  // Tạo lại link tham gia mới
  regenerateInviteLink: async (groupId) => {
    try {
      return await api.post(`/group/${groupId}/invite/regenerate`);
    } catch (error) {
      throw error;
    }
  },

  // Tham gia nhóm bằng link mời
  joinGroupWithInviteLink: async (inviteCode) => {
    try {
      return await api.get(`/group/join/${inviteCode}`);
    } catch (error) {
      throw error;
    }
  },
  // Xóa nhóm
  deleteGroup: async (groupId) => {
    try {
      return await api.delete(`/group/${groupId}`);
    } catch (error) {
      throw error;
    }
  },

  // Chuyển quyền sở hữu nhóm
  transferOwnership: async (groupId, newOwnerId) => {
    try {
      return await api.post(`/group/transfer-ownership`, {
        groupId,
        newOwnerId,
      });
    } catch (error) {
      throw error;
    }
  },
};

export default groupService;
