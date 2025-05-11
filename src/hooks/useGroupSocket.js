import { useEffect, useState } from "react";
import socketManager from "../services/SocketManager";
import useGroupStore from "../stores/groupStore";
import useAuthStore from "../stores/authStore";
import useConversationStore from "../stores/conversationStore";
import toast from "react-hot-toast";

/**
 * Hook để kết nối các sự kiện socket liên quan đến nhóm với store
 */
const useGroupSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore();
  const {
    handleMemberAdded,
    handleMemberRemoved,
    handleRoleChanged,
    handleGroupUpdated,
    handleGroupDeleted,
    handleAddedToGroup,
    handleRemovedFromGroup,
  } = useGroupStore();

  const {
    addNewConversation,
    updateConversation,
    updateConversationParticipants,
    removeConversation,
  } = useConversationStore();

  useEffect(() => {
    if (!user) {
      console.log("useGroupSocket: No user logged in, skipping socket setup");
      return;
    }

    console.log(
      "useGroupSocket: Setting up socket listeners for user",
      user._id
    );

    // Lấy socket đã được khởi tạo từ SocketManager
    const socket = socketManager.getSocket();
    if (!socket) {
      console.warn("useGroupSocket: No socket instance available");
      return;
    }

    // Kiểm tra trạng thái kết nối
    setIsConnected(socketManager.isSocketConnected());

    // Theo dõi thay đổi trạng thái kết nối
    const unsubscribe = socketManager.onConnectionChange((connected) => {
      console.log("Socket connection status changed:", connected);
      setIsConnected(connected);
    });

    // Xử lý khi có thành viên mới được thêm vào nhóm
    socket.on("memberAddedToGroup", (data) => {
      console.log("🔔 Socket event: memberAddedToGroup", data);
      handleMemberAdded(data);

      // Cập nhật conversation nếu có
      if (data.conversation) {
        updateConversation(data.conversation);
        // Cập nhật danh sách người tham gia trong conversation
        updateConversationParticipants(
          data.conversation._id,
          data.group.members
        );
      }

      toast(
        `${
          data.newMember?.user?.name || "Thành viên mới"
        } đã được thêm vào nhóm`,
        {
          icon: "ℹ️",
        }
      );
    });

    // Xử lý khi người dùng được thêm vào nhóm
    socket.on("addedToGroup", (data) => {
      console.log("🔔 Socket event: addedToGroup", data);
      handleAddedToGroup(data);

      // Nếu nhóm có conversation_id, thêm conversation mới
      if (data.conversation) {
        console.log(
          "Adding new conversation from addedToGroup event:",
          data.conversation
        );
        addNewConversation(data.conversation);
      } else if (data.group?.conversation_id) {
        console.log(
          "Creating conversation object from group data:",
          data.group
        );
        addNewConversation({
          _id: data.group.conversation_id,
          name: data.group.name,
          avatar: data.group.avatar,
          type: "group",
          participants: data.group.members.map((m) => ({
            user_id: m.user._id || m.user,
            name: m.user.name,
          })),
          group_id: data.group._id,
          updated_at: data.group.updated_at,
        });
      }
    });    // Lắng nghe khi có tin nhắn nhóm bị thu hồi
    socket.on("messageRevoked", ({ messageId, is_revoked, isGroupMessage, conversationId }) => {
      console.log("🔔 Group message revoked:", messageId, "in conversation:", conversationId);
      
      if (isGroupMessage && conversationId) {
        // Cập nhật tin nhắn trong store để hiển thị trạng thái thu hồi
        const { updateRevokedMessage } = useConversationStore.getState();
        
        // Kiểm tra xem tin nhắn này thuộc về cuộc trò chuyện nhóm hiện tại không
        const { currentConversation } = useConversationStore.getState();
        const isCurrentConversation = currentConversation && 
                                    currentConversation._id === conversationId;
        
        // Log để debug
        console.log(`Is message in current conversation: ${isCurrentConversation}`);
        console.log(`Current conversation ID: ${currentConversation?._id}, Message conversation ID: ${conversationId}`);
        
        // Cập nhật trạng thái tin nhắn
        updateRevokedMessage(messageId);
        
        // Chỉ hiển thị toast nếu đang ở trong cuộc trò chuyện nhóm này
        if (isCurrentConversation) {
          toast.success("Tin nhắn nhóm đã được thu hồi");
        }
        
        // Đóng toast "đang thu hồi" nếu có
        toast.dismiss("revoking");
      }
    });

    // Xử lý khi thành viên bị xóa khỏi nhóm
    socket.on("memberRemovedFromGroup", (data) => {
      console.log("🔔 Socket event: memberRemovedFromGroup", data);
      handleMemberRemoved(data);

      // Cập nhật conversation nếu có thông tin group
      if (data.group && data.group.conversation_id) {
        updateConversationParticipants(
          data.group.conversation_id,
          data.group.members
        );
      }

      // Nếu đây là kết quả của việc chuyển quyền admin và rời nhóm
      if (data.wasAdmin && data.newAdminId) {
        const adminName =
          data.group.members.find(
            (m) => (m.user._id || m.user) === data.newAdminId
          )?.user?.name || "Thành viên khác";

        toast.success(
          `Quyền quản trị viên đã được chuyển cho ${adminName} và ${
            data.removedMember === user._id ? "bạn" : "một thành viên"
          } đã rời nhóm`,
          { duration: 5000 }
        );
      } else {
        // Nếu là người dùng tự rời nhóm
        if (data.removedBy === data.removedMember) {
          toast("Một thành viên đã rời nhóm", { icon: "ℹ️" });
        }
        // Nếu là bị ai đó xóa khỏi nhóm
        else {
          // Tìm thông tin về người xóa (nếu có)
          const removerRole = data.removerRole || ""; // Nhận vai trò từ socket
          const removedUserName = data.removedMemberName || "Một thành viên";

          // Hiển thị thông báo với nội dung chi tiết hơn về người thực hiện
          if (removerRole === "admin") {
            toast.success(
              `${removedUserName} đã bị quản trị viên xóa khỏi nhóm`,
              {
                icon: "👮",
                duration: 4000,
              }
            );
          } else if (removerRole === "moderator") {
            toast.success(
              `${removedUserName} đã bị điều hành viên xóa khỏi nhóm`,
              {
                icon: "🛡️",
                duration: 4000,
              }
            );
          } else {
            toast(`${removedUserName} đã bị xóa khỏi nhóm`, { icon: "ℹ️" });
          }
        }
      }
    }); // Xử lý khi người dùng bị xóa khỏi nhóm
    socket.on("removedFromGroup", (data) => {
      console.log("🔔 Socket event: removedFromGroup", data);

      // Xử lý xóa nhóm
      handleRemovedFromGroup(data);

      if (data.conversationId) {
        console.log("Removing conversation:", data.conversationId);

        // Xóa conversation khỏi danh sách
        removeConversation(data.conversationId);
      }

      // Hiển thị thông báo dựa vào từng loại sự kiện
      if (data.byTransfer) {
        toast.success("Bạn đã chuyển quyền quản trị viên và rời khỏi nhóm", {
          duration: 5000,
        });
      } else if (data.selfRemoved) {
        toast.success("Bạn đã rời khỏi nhóm", {
          duration: 3000,
        });
      } else if (data.byAdmin) {
        toast.error("Bạn đã bị quản trị viên xóa khỏi nhóm", {
          icon: "👮",
          duration: 5000,
        });
      } else if (data.byModerator) {
        toast.error("Bạn đã bị điều hành viên xóa khỏi nhóm", {
          icon: "🛡️",
          duration: 5000,
        });
      } else {
        toast.error("Bạn đã bị xóa khỏi nhóm", {
          duration: 4000,
        });
      }

      // Đóng các modal liên quan nếu đang mở
      try {
        const modalContext = window.modalContext;
        if (modalContext && typeof modalContext.closeAllModals === "function") {
          modalContext.closeAllModals();
        }
      } catch (err) {
        console.error("Cannot close modals:", err);
      }
    }); // Xử lý khi vai trò thành viên thay đổi
    socket.on("memberRoleChanged", (data) => {
      console.log("🔔 Socket event: memberRoleChanged", data);
      handleRoleChanged(data);

      // Định dạng thông báo dựa trên vai trò mới được gán
      const isCurrentUser = data.memberId === user._id;
      const targetText = isCurrentUser ? "bạn" : "một thành viên";

      // Kiểm tra xem đây có phải là chuyển quyền admin trước khi rời nhóm hay không
      if (data.wasAdmin && data.newRole === "admin") {
        toast.success(
          `Quyền quản trị viên đã được chuyển cho ${
            data.memberId === user._id ? "bạn" : "một thành viên khác"
          }`
        );
      }
      // Xử lý trường hợp chuyển quyền admin
      else if (data.newRole === "admin") {
        toast.success(
          `${isCurrentUser ? "Bạn" : "Thành viên"} đã trở thành trưởng nhóm`,
          { duration: 3000 }
        );
      }
      // Xử lý trường hợp hạ quyền admin xuống thành viên thường
      else if (data.previousRole === "admin" && data.newRole === "member") {
        toast(
          `${
            isCurrentUser ? "Bạn" : "Trưởng nhóm cũ"
          } đã chuyển thành thành viên thường`,
          {
            icon: "ℹ️",
            duration: 4000,
          }
        );
      }
      // Xử lý trường hợp gán quyền moderator
      else if (data.newRole === "moderator") {
        toast.success(
          `${
            isCurrentUser ? "Bạn" : "Một thành viên"
          } đã được cấp quyền điều hành viên`,
          { duration: 3000 }
        );
      }
      // Xử lý trường hợp thu hồi quyền moderator
      else if (data.previousRole === "moderator" && data.newRole === "member") {
        toast(`Quyền điều hành viên của ${targetText} đã bị thu hồi`, {
          icon: "ℹ️",
        });
      }
      // Các trường hợp khác
      else {
        toast(
          `Vai trò của ${
            data.memberId === user._id ? "bạn" : "một thành viên"
          } đã được thay đổi thành ${
            data.newRole === "admin"
              ? "quản trị viên"
              : data.newRole === "moderator"
              ? "điều hành viên"
              : "thành viên"
          }`,
          {
            icon: "ℹ️",
          }
        );
      }
    });

    // Xử lý khi thông tin nhóm được cập nhật
    socket.on("groupInfoUpdated", (data) => {
      console.log("🔔 Socket event: groupInfoUpdated", data);
      handleGroupUpdated(data);
      toast("Thông tin nhóm đã được cập nhật", {
        icon: "ℹ️",
      });
    });

    // Xử lý khi quyền sở hữu nhóm được chuyển giao
    socket.on("ownershipTransferred", (data) => {
      console.log("🔔 Socket event: ownershipTransferred", data);
      handleGroupUpdated(data);

      const isCurrentUserNewOwner = data.newOwnerId === user._id;
      const isCurrentUserPreviousOwner = data.previousOwnerId === user._id;

      if (isCurrentUserNewOwner) {
        toast.success("Bạn đã trở thành chủ sở hữu mới của nhóm này", {
          duration: 5000,
        });
      } else if (isCurrentUserPreviousOwner) {
        toast.success("Bạn đã chuyển quyền sở hữu nhóm thành công", {
          duration: 5000,
        });
      } else {
        toast("Nhóm có chủ sở hữu mới", {
          icon: "ℹ️",
        });
      }
    });

    // Xử lý khi có sự kiện cập nhật thông tin cuộc trò chuyện
    socket.on("conversationInfoUpdated", (data) => {
      console.log("🔔 Socket event: conversationInfoUpdated", data);
      if (data.conversation) {
        updateConversation(data.conversation);
      } else if (data.conversationId) {
        // Cập nhật thông tin cơ bản nếu không có đầy đủ thông tin conversation
        updateConversation({
          _id: data.conversationId,
          name: data.name,
          avatar: data.avatar,
          updated_at: new Date(),
        });
      }
    });

    // Xử lý khi nhóm mới được tạo
    socket.on("newGroupCreated", (data) => {
      console.log("🔔 Socket event: newGroupCreated", data);
      // Thêm nhóm vào danh sách nếu người dùng là thành viên
      const isMember = data.group?.members?.some(
        (m) => (m.user._id || m.user) === user._id
      );

      if (isMember) {
        handleAddedToGroup(data);

        // Nếu có thông tin conversation, thêm vào danh sách
        if (data.conversation) {
          console.log(
            "Adding conversation from newGroupCreated event:",
            data.conversation
          );
          addNewConversation(data.conversation);
        }
      }
    });

    // Xử lý khi nhận được sự kiện có cuộc trò chuyện mới
    socket.on("newConversation", (data) => {
      console.log("🔔 Socket event: newConversation", data);
      if (data.conversation) {
        addNewConversation(data.conversation);
      }
    });

    // Xử lý khi nhóm bị xóa
    socket.on("groupDeleted", (data) => {
      console.log("🔔 Socket event: groupDeleted", data);
      handleGroupDeleted(data);

      // Xóa conversation khỏi danh sách nếu có conversationId
      if (data.conversationId) {
        console.log(
          "Removing conversation due to group deletion:",
          data.conversationId
        );
        removeConversation(data.conversationId);
      }

      // Đóng các modal liên quan nếu đang mở
      try {
        const modalContext = window.modalContext;
        if (modalContext && typeof modalContext.closeAllModals === "function") {
          modalContext.closeAllModals();
        }
      } catch (err) {
        console.error("Cannot close modals:", err);
      }
    });

    // Xử lý khi người dùng tham gia nhóm bằng link
    socket.on("joinedGroupViaLink", (data) => {
      console.log("🔔 Socket event: joinedGroupViaLink", data);
      handleAddedToGroup(data);
      toast.success(`Bạn đã tham gia nhóm ${data.group?.name}`);
    });

    // Xử lý khi có người khác tham gia nhóm bằng link
    socket.on("memberJoinedViaLink", (data) => {
      console.log("🔔 Socket event: memberJoinedViaLink", data);
      handleMemberAdded(data);
      toast(
        `${
          data.newMember?.user?.name || "Thành viên mới"
        } đã tham gia nhóm qua link mời`,
        {
          icon: "ℹ️",
        }
      );
    });

    // Xử lý khi trạng thái liên kết mời được cập nhật
    socket.on("inviteLinkStatusUpdated", (data) => {
      console.log("🔔 Socket event: inviteLinkStatusUpdated", data);
      // Có thể thêm xử lý cập nhật trạng thái liên kết mời ở đây
    });    // Xử lý khi liên kết mời được tạo lại
    socket.on("inviteLinkRegenerated", (data) => {
      console.log("🔔 Socket event: inviteLinkRegenerated", data);
      // Có thể thêm xử lý cập nhật liên kết mời mới ở đây
    });
    
    // Lắng nghe khi có tin nhắn bị thu hồi (đặc biệt là trong nhóm)
    socket.on("messageRevoked", ({ messageId, is_revoked, isGroupMessage, conversationId }) => {
      console.log("🔔 Group Socket: Message revoked:", messageId, "isGroupMessage:", isGroupMessage);
      // Cập nhật tin nhắn trong store để hiển thị trạng thái thu hồi
      const { updateRevokedMessage } = useConversationStore.getState();
      updateRevokedMessage(messageId);
      
      // Hiển thị thông báo chỉ khi đây là tin nhắn nhóm
      if (isGroupMessage) {
        toast.success("Tin nhắn nhóm đã được thu hồi");
      }
    }); // Lắng nghe các lỗi từ server
    socket.on("error", (error) => {
      console.error("Socket error received:", error);
      // Xử lý lỗi revokeMessage đặc biệt
      if (error === "Error revoking message") {
        toast.dismiss("revoking");
        toast.error(
          "Không thể thu hồi tin nhắn, bạn chỉ có thể thu hồi tin nhắn của mình"
        );
        return;
      }

      // Xử lý lỗi tin nhắn không tồn tại
      if (error === "Message not found") {
        toast.dismiss("revoking");
        toast.error("Tin nhắn không tồn tại hoặc đã bị xóa");
        return;
      }

      // Xử lý lỗi không có quyền thu hồi tin nhắn
      if (error === "You are not allowed to revoke this message") {
        toast.dismiss("revoking");
        toast.error("Bạn không có quyền thu hồi tin nhắn này");
        return;
      }

      // Chỉ hiển thị lỗi nếu là lỗi quan trọng
      if (typeof error === "object" && error.message) {
        if (
          !error.message.includes("not found") &&
          !error.message.includes("Không thể tải")
        ) {
          toast.error(`Lỗi: ${error.message}`);
        }
      } else if (typeof error === "string") {
        // Xử lý lỗi chuỗi không được xử lý bởi các điều kiện trên
        toast.error(`Lỗi: ${error}`);
      }
    });

    // Cleanup function
    return () => {
      console.log("useGroupSocket: Cleaning up socket listeners");
      socket.off("memberAddedToGroup");
      socket.off("addedToGroup");
      socket.off("memberRemovedFromGroup");
      socket.off("removedFromGroup");
      socket.off("memberRoleChanged");
      socket.off("groupInfoUpdated");
      socket.off("ownershipTransferred");
      socket.off("conversationInfoUpdated");
      socket.off("newGroupCreated");
      socket.off("groupDeleted");
      socket.off("joinedGroupViaLink");      socket.off("memberJoinedViaLink");
      socket.off("inviteLinkStatusUpdated");
      socket.off("inviteLinkRegenerated");
      socket.off("messageRevoked");
      socket.off("newConversation");
      socket.off("error");
      unsubscribe(); // Hủy đăng ký theo dõi thay đổi trạng thái kết nối
    };
  }, [
    user,
    handleMemberAdded,
    handleMemberRemoved,
    handleRoleChanged,
    handleGroupUpdated,
    handleGroupDeleted,
    handleAddedToGroup,
    handleRemovedFromGroup,
    addNewConversation,
    updateConversation,
    updateConversationParticipants,
    removeConversation,
  ]);

  return { isConnected };
};

export default useGroupSocket;
