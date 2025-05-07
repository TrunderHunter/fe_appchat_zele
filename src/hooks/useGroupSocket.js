import { useEffect } from "react";
import socketManager from "../services/SocketManager";
import useGroupStore from "../stores/groupStore";
import useAuthStore from "../stores/authStore";
import useConversationStore from "../stores/conversationStore";
import toast from "react-hot-toast";

/**
 * Hook để kết nối các sự kiện socket liên quan đến nhóm với store
 */
const useGroupSocket = () => {
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

  const { addNewConversation } = useConversationStore();

  useEffect(() => {
    if (!user?._id) return;

    // Xử lý khi có thành viên mới được thêm vào nhóm
    socketManager.setGroupEventHandler("onMemberAddedToGroup", (data) => {
      handleMemberAdded(data);
      toast.info(
        `${
          data.newMember?.user?.name || "Thành viên mới"
        } đã được thêm vào nhóm`
      );
    });

    // Xử lý khi người dùng được thêm vào nhóm
    socketManager.setGroupEventHandler("onAddedToGroup", (data) => {
      handleAddedToGroup(data);
      // Nếu nhóm có conversation_id, thêm conversation mới
      if (data.group?.conversation_id) {
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
    socketManager.setGroupEventHandler("onMemberRemovedFromGroup", (data) => {
      handleMemberRemoved(data);
      toast.info(`Một thành viên đã bị xóa khỏi nhóm`);
    });

    // Xử lý khi người dùng bị xóa khỏi nhóm
    socketManager.setGroupEventHandler("onRemovedFromGroup", (data) => {
      handleRemovedFromGroup(data);
    });

    // Xử lý khi vai trò thành viên thay đổi
    socketManager.setGroupEventHandler("onMemberRoleChanged", (data) => {
      handleRoleChanged(data);
      toast.info(
        `Vai trò của ${
          data.memberId === user._id ? "bạn" : "một thành viên"
        } đã được thay đổi`
      );
    });

    // Xử lý khi thông tin nhóm được cập nhật
    socketManager.setGroupEventHandler("onGroupInfoUpdated", (data) => {
      handleGroupUpdated(data);
      toast.info("Thông tin nhóm đã được cập nhật");
    });

    // Xử lý khi nhóm mới được tạo
    socketManager.setGroupEventHandler("onNewGroupCreated", (data) => {
      // Thêm nhóm vào danh sách nếu người dùng là thành viên
      const isMember = data.group?.members?.some(
        (m) => (m.user._id || m.user) === user._id
      );

      if (isMember) {
        handleAddedToGroup(data);
      }
    });

    // Xử lý khi nhóm bị xóa
    socketManager.setGroupEventHandler("onGroupDeleted", (data) => {
      handleGroupDeleted(data);
    });

    // Xử lý khi người dùng tham gia nhóm bằng link
    socketManager.setGroupEventHandler("onJoinedGroupViaLink", (data) => {
      handleAddedToGroup(data);
      toast.success(`Bạn đã tham gia nhóm ${data.group?.name}`);
    });

    // Xử lý khi có người khác tham gia nhóm bằng link
    socketManager.setGroupEventHandler("onMemberJoinedViaLink", (data) => {
      handleMemberAdded(data);
      toast.info(
        `${
          data.newMember?.user?.name || "Thành viên mới"
        } đã tham gia nhóm qua link mời`
      );
    });

    return () => {
      // Cleanup khi component unmount
      socketManager.clearGroupEventHandler("onMemberAddedToGroup");
      socketManager.clearGroupEventHandler("onAddedToGroup");
      socketManager.clearGroupEventHandler("onMemberRemovedFromGroup");
      socketManager.clearGroupEventHandler("onRemovedFromGroup");
      socketManager.clearGroupEventHandler("onMemberRoleChanged");
      socketManager.clearGroupEventHandler("onGroupInfoUpdated");
      socketManager.clearGroupEventHandler("onNewGroupCreated");
      socketManager.clearGroupEventHandler("onGroupDeleted");
      socketManager.clearGroupEventHandler("onJoinedGroupViaLink");
      socketManager.clearGroupEventHandler("onMemberJoinedViaLink");
    };
  }, [
    user?._id,
    handleMemberAdded,
    handleMemberRemoved,
    handleRoleChanged,
    handleGroupUpdated,
    handleGroupDeleted,
    handleAddedToGroup,
    handleRemovedFromGroup,
    addNewConversation,
  ]);

  return null;
};

export default useGroupSocket;
