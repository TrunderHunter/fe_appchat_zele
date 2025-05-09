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

      toast(`Một thành viên đã bị xóa khỏi nhóm`, {
        icon: "ℹ️",
      });
    });

    // Xử lý khi người dùng bị xóa khỏi nhóm
    socket.on("removedFromGroup", (data) => {
      console.log("🔔 Socket event: removedFromGroup", data);

      // Xử lý xóa nhóm
      handleRemovedFromGroup(data);

      if (data.conversationId) {
        console.log("Removing conversation:", data.conversationId);

        // Xóa conversation khỏi danh sách
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

    // Xử lý khi vai trò thành viên thay đổi
    socket.on("memberRoleChanged", (data) => {
      console.log("🔔 Socket event: memberRoleChanged", data);
      handleRoleChanged(data);
      toast(
        `Vai trò của ${
          data.memberId === user._id ? "bạn" : "một thành viên"
        } đã được thay đổi`,
        {
          icon: "ℹ️",
        }
      );
    });

    // Xử lý khi thông tin nhóm được cập nhật
    socket.on("groupInfoUpdated", (data) => {
      console.log("🔔 Socket event: groupInfoUpdated", data);
      handleGroupUpdated(data);
      toast("Thông tin nhóm đã được cập nhật", {
        icon: "ℹ️",
      });
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
    });

    // Xử lý khi liên kết mời được tạo lại
    socket.on("inviteLinkRegenerated", (data) => {
      console.log("🔔 Socket event: inviteLinkRegenerated", data);
      // Có thể thêm xử lý cập nhật liên kết mời mới ở đây
    });

    // Lắng nghe các lỗi từ server
    socket.on("error", (error) => {
      console.error("Socket error received:", error);
      // Chỉ hiển thị lỗi nếu là lỗi quan trọng
      if (typeof error === "object" && error.message) {
        if (
          !error.message.includes("not found") &&
          !error.message.includes("Không thể tải")
        ) {
          toast.error(`Lỗi: ${error.message}`);
        }
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
      socket.off("conversationInfoUpdated");
      socket.off("newGroupCreated");
      socket.off("groupDeleted");
      socket.off("joinedGroupViaLink");
      socket.off("memberJoinedViaLink");
      socket.off("inviteLinkStatusUpdated");
      socket.off("inviteLinkRegenerated");
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
  ]);

  return { isConnected };
};

export default useGroupSocket;
