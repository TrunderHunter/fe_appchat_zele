import { useEffect, useRef } from "react";
import useFriendStore from "../stores/friendStore";
import { toast } from "react-hot-toast";

/**
 * Hook để xử lý các sự kiện socket liên quan đến lời mời kết bạn
 * @param {Object} socket - Socket.io client instance
 */
const useFriendRequestSocket = (socket) => {
  const { fetchFriendRequests, fetchSentRequests, fetchFriends } =
    useFriendStore();

  // Sử dụng ref để theo dõi socket mà không trigger re-render
  const socketRef = useRef(socket);

  // Cập nhật ref khi socket thay đổi
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    // Nếu không có socket, không làm gì cả
    if (!socketRef.current) return;

    const currentSocket = socketRef.current;

    // Xác định các handlers để có thể gỡ bỏ sau này
    const newFriendRequestHandler = (friendRequest) => {
      toast.success(
        `Bạn nhận được lời mời kết bạn từ ${
          friendRequest.sender?.name || "ai đó"
        }`
      );
      fetchFriendRequests(); // Cập nhật danh sách lời mời
    };

    const friendRequestResponseHandler = (data) => {
      const { status } = data;

      if (status === "accepted") {
        toast.success("Lời mời kết bạn đã được chấp nhận");
        fetchFriends(); // Cập nhật danh sách bạn bè
      } else if (status === "rejected") {
        toast.info(data.message || "Lời mời kết bạn đã bị từ chối");
      }

      // Cập nhật danh sách lời mời đã gửi
      fetchSentRequests();
    };

    const newFriendHandler = (data) => {
      fetchFriends(); // Cập nhật danh sách bạn bè
    };

    const friendRequestCancelledHandler = (data) => {
      if (data.success) {
        fetchFriendRequests(); // Cập nhật danh sách lời mời
        toast.info("Lời mời kết bạn đã được thu hồi");
      }
    };

    // Đăng ký các handlers
    currentSocket.on("newFriendRequest", newFriendRequestHandler);
    currentSocket.on("friendRequestResponse", friendRequestResponseHandler);
    currentSocket.on("newFriend", newFriendHandler);
    currentSocket.on("friendRequestCancelled", friendRequestCancelledHandler);

    // Cập nhật danh sách ban đầu khi kết nối socket thành công
    if (currentSocket.connected) {
      fetchFriendRequests();
      fetchSentRequests();
      fetchFriends();
    }

    // Cleanup listeners khi component unmount hoặc socket thay đổi
    return () => {
      // Chỉ gỡ bỏ listeners khi socket vẫn còn tồn tại và có phương thức off
      if (currentSocket && typeof currentSocket.off === "function") {
        currentSocket.off("newFriendRequest", newFriendRequestHandler);
        currentSocket.off(
          "friendRequestResponse",
          friendRequestResponseHandler
        );
        currentSocket.off("newFriend", newFriendHandler);
        currentSocket.off(
          "friendRequestCancelled",
          friendRequestCancelledHandler
        );
      }
    };
  }, []); // Chỉ chạy một lần khi mount, sử dụng ref để truy cập socket mới nhất

  return null;
};

export default useFriendRequestSocket;
