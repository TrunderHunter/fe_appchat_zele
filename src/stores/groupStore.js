import { create } from "zustand";
import { persist } from "zustand/middleware";
import groupService from "../services/groupService";
import toast from "react-hot-toast";
import socketManager from "../services/SocketManager";
import useAuthStore from "./authStore";

const useGroupStore = create(
  persist(
    (set, get) => ({
      groups: [],
      currentGroup: null,
      inviteLink: null,
      isLoading: false,
      error: null,

      // Lấy danh sách nhóm của người dùng
      fetchUserGroups: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await groupService.getUserGroups();
          set({
            groups: response.data || response, // Đảm bảo xử lý cả hai trường hợp response format
            isLoading: false,
          });
          return { success: true, groups: response.data || response };
        } catch (error) {
          console.error("Error fetching groups:", error);
          set({
            isLoading: false,
            error:
              error.response?.data?.message || "Không thể tải danh sách nhóm",
          });
          return { success: false };
        }
      },

      // Tạo nhóm mới
      createGroup: async (groupData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await groupService.createGroup(groupData);

          // Xử lý response theo đúng cấu trúc từ API
          const result = response.data || response;

          // Thêm nhóm mới vào danh sách nếu không tồn tại
          set((state) => {
            // Kiểm tra nếu nhóm đã tồn tại trong state
            const groupExists = state.groups.some(
              (g) => g._id === result.group._id
            );
            if (!groupExists) {
              return {
                groups: [...state.groups, result.group],
                isLoading: false,
              };
            }
            return { isLoading: false };
          });

          // Phát sóng sự kiện tạo nhóm mới tới socket server với thông tin của nhóm đã tạo
          const socket = socketManager.getSocket();
          if (socket) {
            socket.emit("createGroup", {
              groupData,
              existingGroupId: result.group._id,
              creatorId: useAuthStore.getState().user?._id,
            });
          }

          return {
            success: true,
            group: result.group,
            conversation: result.conversation,
          };
        } catch (error) {
          console.error("Error creating group:", error);
          set({
            isLoading: false,
            error: error.response?.data?.message || "Không thể tạo nhóm",
          });
          return { success: false };
        }
      },

      // Lấy chi tiết nhóm
      fetchGroupDetails: async (groupId) => {
        if (!groupId) {
          set({ error: "Group ID is required" });
          return { success: false };
        }
        set({ isLoading: true, error: null });
        try {
          const groupDetails = await groupService.getGroupById(groupId);
          const result = groupDetails.data || groupDetails;

          set({
            currentGroup: result,
            isLoading: false,
          });
          return { success: true, group: result };
        } catch (error) {
          console.error("Error fetching group details:", error);
          set({
            isLoading: false,
            error:
              error.response?.data?.message || "Không thể tải thông tin nhóm",
          });
          return { success: false };
        }
      },

      // Thêm thành viên vào nhóm (sử dụng socket)
      addMember: async (groupId, memberId) => {
        set({ isLoading: true, error: null });
        try {
          const socket = socketManager.getSocket();
          const currentUserId = useAuthStore.getState().user._id;

          if (!socket || !socket.connected) {
            throw new Error(
              "Không thể kết nối đến máy chủ. Vui lòng thử lại sau."
            );
          }

          // Phát sự kiện thêm thành viên qua socket
          socket.emit("addMemberToGroup", {
            groupId,
            memberId,
            addedBy: currentUserId,
          });

          // Trả về success: true ngay lập tức, phần cập nhật state sẽ được xử lý bởi socket handler
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          console.error("Error adding member:", error);
          set({
            isLoading: false,
            error: error.message || "Không thể thêm thành viên",
          });
          toast.error(error.message || "Không thể thêm thành viên");
          return { success: false };
        }
      },

      // Xóa thành viên khỏi nhóm
      removeMember: async (groupId, memberId) => {
        set({ isLoading: true, error: null });
        try {
          const socket = socketManager.getSocket();
          const currentUserId = useAuthStore.getState().user._id;

          if (!socket || !socket.connected) {
            // Nếu không có kết nối socket, sử dụng API
            const response = await groupService.removeMemberFromGroup(
              groupId,
              memberId
            );
            const result = response.data || response;

            // Cập nhật danh sách nhóm
            set((state) => ({
              groups: state.groups.map((group) =>
                group._id === groupId ? result : group
              ),
              currentGroup:
                state.currentGroup && state.currentGroup._id === groupId
                  ? result
                  : state.currentGroup,
              isLoading: false,
            }));

            return { success: true, group: result };
          }

          // Phát sự kiện xóa thành viên qua socket
          socket.emit("removeMemberFromGroup", {
            groupId,
            memberId,
            removedBy: currentUserId,
          });

          // Trả về success: true ngay lập tức, phần cập nhật state sẽ được xử lý bởi socket handler
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          console.error("Error removing member:", error);
          set({
            isLoading: false,
            error: error.response?.data?.message || "Không thể xóa thành viên",
          });
          return { success: false };
        }
      },

      // Thêm phương thức giải tán nhóm (xóa nhóm)
      dissolveGroup: async (groupId) => {
        try {
          set({ isLoading: true });
          const currentUserId = useAuthStore.getState().user._id;
          const socket = socketManager.getSocket();

          if (!socket || !socket.connected) {
            // Nếu không có kết nối socket, sử dụng API
            const response = await groupService.deleteGroup(groupId);
            const result = response.data || response;

            // Cập nhật danh sách nhóm - xóa nhóm khỏi state
            set((state) => ({
              groups: state.groups.filter((group) => group._id !== groupId),
              currentGroup:
                state.currentGroup?._id === groupId ? null : state.currentGroup,
              isLoading: false,
            }));

            return { success: true, ...result };
          }

          // Phát sự kiện giải tán nhóm qua socket
          socket.emit("deleteGroup", {
            groupId,
            userId: currentUserId,
          });

          // Vì socket sẽ nhận được sự kiện groupDeleted và cập nhật store,
          // nên ta chỉ tạm thời cập nhật state loading trước
          set({ isLoading: false });

          // Trả về success: true ngay lập tức
          return { success: true };
        } catch (error) {
          console.error("Error dissolving group:", error);
          set({
            error: error.message || "Không thể giải tán nhóm",
            isLoading: false,
          });
          return { success: false, error };
        }
      },

      // Thay đổi vai trò thành viên
      changeRole: async (groupId, memberId, role) => {
        set({ isLoading: true, error: null });
        try {
          const response = await groupService.changeRoleMember(
            groupId,
            memberId,
            role
          );
          const result = response.data || response;

          // Cập nhật danh sách nhóm
          set((state) => ({
            groups: state.groups.map((group) =>
              group._id === groupId ? result : group
            ),
            currentGroup:
              state.currentGroup && state.currentGroup._id === groupId
                ? result
                : state.currentGroup,
            isLoading: false,
          }));

          // KHÔNG gửi socket event từ đây để tránh duplicate

          return { success: true, group: result };
        } catch (error) {
          console.error("Error changing role:", error);
          set({
            isLoading: false,
            error:
              error.response?.data?.message ||
              "Không thể thay đổi vai trò thành viên",
          });
          return { success: false };
        }
      },

      // Cập nhật thông tin nhóm
      updateGroup: async (groupId, updateData) => {
        set({ isLoading: true, error: null });
        try {
          const updatedGroup = await groupService.updateGroup(
            groupId,
            updateData
          );

          // Cập nhật danh sách nhóm
          set((state) => ({
            groups: state.groups.map((group) =>
              group._id === groupId ? updatedGroup : group
            ),
            currentGroup:
              state.currentGroup && state.currentGroup._id === groupId
                ? updatedGroup
                : state.currentGroup,
            isLoading: false,
          }));

          // Sử dụng socket để cập nhật real-time
          const socket = socketManager.getSocket();
          if (socket) {
            socket.emit("updateGroup", {
              groupId,
              updateData,
              userId: get().currentUser?._id,
            });
          }

          return { success: true, group: updatedGroup };
        } catch (error) {
          set({
            isLoading: false,
            error:
              error.response?.data?.message ||
              "Không thể cập nhật thông tin nhóm",
          });
          return { success: false };
        }
      },

      // Lấy link mời tham gia nhóm
      getInviteLink: async (groupId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await groupService.getGroupInviteLink(groupId);
          set({
            inviteLink: response.invite_link,
            isLoading: false,
          });
          return { success: true, inviteLink: response.invite_link };
        } catch (error) {
          set({
            isLoading: false,
            error:
              error.response?.data?.message || "Không thể lấy liên kết mời",
          });
          return { success: false };
        }
      },

      // Cập nhật trạng thái link mời
      updateInviteLinkStatus: async (groupId, isActive) => {
        set({ isLoading: true, error: null });
        try {
          const response = await groupService.updateInviteLinkStatus(
            groupId,
            isActive
          );

          // Cập nhật link mời trong store
          if (get().inviteLink && get().inviteLink.code) {
            set((state) => ({
              inviteLink: {
                ...state.inviteLink,
                is_active: isActive,
              },
              isLoading: false,
            }));
          }

          // Sử dụng socket để cập nhật real-time
          const socket = socketManager.getSocket();
          if (socket) {
            socket.emit("updateInviteLinkStatus", {
              groupId,
              isActive,
              userId: get().currentUser?._id,
            });
          }

          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error:
              error.response?.data?.message ||
              "Không thể cập nhật trạng thái liên kết",
          });
          return { success: false };
        }
      },

      // Tạo lại link mời mới
      regenerateInviteLink: async (groupId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await groupService.regenerateInviteLink(groupId);

          // Cập nhật link mời mới trong store
          set({
            inviteLink: response.invite_link,
            isLoading: false,
          });

          // Sử dụng socket để cập nhật real-time
          const socket = socketManager.getSocket();
          if (socket) {
            socket.emit("regenerateInviteLink", {
              groupId,
              userId: get().currentUser?._id,
            });
          }

          return { success: true, inviteLink: response.invite_link };
        } catch (error) {
          set({
            isLoading: false,
            error:
              error.response?.data?.message || "Không thể tạo lại liên kết mời",
          });
          return { success: false };
        }
      },

      // Tham gia nhóm bằng link mời
      joinGroupWithInviteLink: async (inviteCode) => {
        set({ isLoading: true, error: null });
        try {
          const response = await groupService.joinGroupWithInviteLink(
            inviteCode
          );

          // Thêm nhóm mới vào danh sách
          set((state) => ({
            groups: [...state.groups, response.group],
            isLoading: false,
          }));

          // Sử dụng socket để cập nhật real-time
          const socket = socketManager.getSocket();
          if (socket) {
            socket.emit("joinGroupWithInviteLink", {
              inviteCode,
              userId: get().currentUser?._id,
            });
          }

          return { success: true, group: response.group };
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.message || "Không thể tham gia nhóm",
          });
          return { success: false };
        }
      },

      // Xóa nhóm
      deleteGroup: async (groupId) => {
        set({ isLoading: true, error: null });
        try {
          await groupService.deleteGroup(groupId);

          // Xóa nhóm khỏi danh sách
          set((state) => ({
            groups: state.groups.filter((group) => group._id !== groupId),
            currentGroup:
              state.currentGroup && state.currentGroup._id === groupId
                ? null
                : state.currentGroup,
            isLoading: false,
          }));

          // Sử dụng socket để cập nhật real-time
          const socket = socketManager.getSocket();
          if (socket) {
            socket.emit("deleteGroup", {
              groupId,
              userId: get().currentUser?._id,
            });
          }

          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.message || "Không thể xóa nhóm",
          });
          return { success: false };
        }
      },

      // Xử lý khi có member mới được thêm vào nhóm
      handleMemberAdded: (data) => {
        const { groupId, group } = data;

        set((state) => ({
          groups: state.groups.map((g) => (g._id === groupId ? group : g)),
          currentGroup:
            state.currentGroup && state.currentGroup._id === groupId
              ? group
              : state.currentGroup,
        }));
      },

      // Xử lý khi có member bị xóa khỏi nhóm
      handleMemberRemoved: (data) => {
        const { groupId, group } = data;

        set((state) => ({
          groups: state.groups.map((g) => (g._id === groupId ? group : g)),
          currentGroup:
            state.currentGroup && state.currentGroup._id === groupId
              ? group
              : state.currentGroup,
        }));
      },

      // Xử lý khi vai trò của member thay đổi
      handleRoleChanged: (data) => {
        const { groupId, group } = data;

        set((state) => ({
          groups: state.groups.map((g) => (g._id === groupId ? group : g)),
          currentGroup:
            state.currentGroup && state.currentGroup._id === groupId
              ? group
              : state.currentGroup,
        }));
      },

      // Xử lý khi thông tin nhóm được cập nhật
      handleGroupUpdated: (data) => {
        const { groupId, group } = data;

        set((state) => ({
          groups: state.groups.map((g) => (g._id === groupId ? group : g)),
          currentGroup:
            state.currentGroup && state.currentGroup._id === groupId
              ? group
              : state.currentGroup,
        }));
      }, // Xử lý khi nhóm bị xóa
      handleGroupDeleted: (data) => {
        const { groupId, deletedBy } = data;

        // Lấy tên nhóm trước khi xóa khỏi state
        const groupName =
          get().groups.find((g) => g._id === groupId)?.name || "không xác định";

        set((state) => ({
          groups: state.groups.filter((g) => g._id !== groupId),
          currentGroup:
            state.currentGroup && state.currentGroup._id === groupId
              ? null
              : state.currentGroup,
        }));

        // Chỉ thông báo nếu người hiện tại không phải là người xóa nhóm
        const currentUserId = useAuthStore.getState().user?._id;
        if (currentUserId !== deletedBy) {
          toast(`Nhóm ${groupName} đã bị giải tán`, {
            icon: "ℹ️",
          });
        }
      },

      // Xử lý khi người dùng được thêm vào nhóm
      handleAddedToGroup: (data) => {
        const { group } = data;

        set((state) => {
          // Kiểm tra nếu nhóm đã tồn tại trong state
          const groupExists = state.groups.some((g) => g._id === group._id);
          if (!groupExists) {
            return {
              groups: [...state.groups, group],
            };
          }
          return state; // Không thay đổi state nếu đã tồn tại
        });

        toast.success(`Bạn đã được thêm vào nhóm ${group.name}`);
      },

      // Xử lý khi người dùng bị xóa khỏi nhóm
      handleRemovedFromGroup: (data) => {
        const { groupId } = data;

        // Lấy tên nhóm trước khi xóa khỏi danh sách
        const removedGroupName =
          get().groups.find((g) => g._id === groupId)?.name || "nhóm";

        set((state) => ({
          groups: state.groups.filter((g) => g._id !== groupId),
          currentGroup:
            state.currentGroup && state.currentGroup._id === groupId
              ? null
              : state.currentGroup,
        }));

        // Hiển thị thông báo với tên nhóm
        toast(`Bạn đã bị xóa khỏi nhóm ${removedGroupName}`, {
          icon: "🚫",
        });
      },

      resetError: () => set({ error: null }),
      setCurrentGroup: (group) => set({ currentGroup: group }),
    }),
    {
      name: "group-storage",
      partialize: (state) => ({
        groups: state.groups,
      }),
    }
  )
);

export default useGroupStore;
