import { useEffect, useState } from "react";
import socketManager from "../services/SocketManager";
import useFriendStore from "../stores/friendStore";
import useAuthStore from "../stores/authStore";
import { toast } from "react-hot-toast";

/**
 * Hook để xử lý các sự kiện socket liên quan đến lời mời kết bạn
 */
const useFriendRequestSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore();
  const { fetchFriendRequests, fetchSentRequests, fetchFriends } =
    useFriendStore();
  useEffect(() => {
    if (!user) {
      console.log(
        "useFriendRequestSocket: No user logged in, skipping socket setup"
      );
      return;
    }

    console.log(
      "useFriendRequestSocket: Setting up socket listeners for user",
      user._id
    );

    // Lấy socket đã được khởi tạo từ SocketManager
    const socket = socketManager.getSocket();
    if (!socket) {
      console.warn("useFriendRequestSocket: No socket instance available");
      return;
    }

    // Kiểm tra trạng thái kết nối
    setIsConnected(socketManager.isSocketConnected());

    // Theo dõi thay đổi trạng thái kết nối
    const unsubscribe = socketManager.onConnectionChange((connected) => {
      console.log("Socket connection status changed:", connected);
      setIsConnected(connected);
    });

    const currentSocket = socket; // Xác định các handlers để có thể gỡ bỏ sau này
    const newFriendRequestHandler = (friendRequest) => {
      console.log("📩 Socket event: newFriendRequest", friendRequest);
      toast.success(
        `Bạn nhận được lời mời kết bạn từ ${
          friendRequest.sender?.name || "ai đó"
        }`
      );
      fetchFriendRequests(); // Cập nhật danh sách lời mời
    };

    const friendRequestResponseHandler = (data) => {
      console.log("📩 Socket event: friendRequestResponse", data);
      const { status, friends, request } = data;

      if (status === "accepted") {
        toast.success("Lời mời kết bạn đã được chấp nhận");

        // Nếu server trả về danh sách bạn bè, cập nhật trực tiếp
        if (friends) {
          const friendStore = useFriendStore.getState();
          friendStore.friends = friends;

          // Cập nhật danh sách lời mời đã gửi - xóa lời mời đã được chấp nhận
          if (request && request._id) {
            const updatedSentRequests = friendStore.sentRequests.filter(
              (req) => req._id !== request._id
            );
            friendStore.sentRequests = updatedSentRequests;
          }
        } else {
          // Nếu không, thì gọi API để lấy danh sách mới
          fetchFriends();
          fetchSentRequests(); // Fetch lại danh sách lời mời đã gửi
        }
      } else if (status === "rejected") {
        toast.success(data.message || "Lời mời kết bạn đã bị từ chối");

        // Cập nhật danh sách lời mời đã gửi - xóa lời mời đã bị từ chối
        if (request && request._id) {
          const friendStore = useFriendStore.getState();
          const updatedSentRequests = friendStore.sentRequests.filter(
            (req) => req._id !== request._id
          );
          friendStore.sentRequests = updatedSentRequests;
        } else {
          // Nếu không có thông tin request, thì fetch lại danh sách
          fetchSentRequests();
        }
      } else {
        // Nếu không rõ status, luôn fetch lại danh sách để cập nhật
        fetchSentRequests();
      }
    };

    const newFriendHandler = (data) => {
      fetchFriends(); // Cập nhật danh sách bạn bè
    };
    const friendRequestCancelledHandler = (data) => {
      console.log("📩 Socket event: friendRequestCancelled", data);
      if (data.success) {
        // Cập nhật danh sách lời mời đã nhận thông qua API
        fetchFriendRequests();

        // Nếu là người gửi lời mời, hiển thị thông báo đã thu hồi
        if (user && data.senderId && user._id === data.senderId) {
          toast.success("Đã hủy lời mời kết bạn thành công");
        }
        // Nếu là người nhận lời mời, hiển thị thông báo khác
        else if (!data.senderId) {
          toast.success("Lời mời kết bạn đã được thu hồi");
        }
      }
    };

    const sentFriendRequestsHandler = (sentRequests) => {
      console.log("📩 Socket event: sentFriendRequests", sentRequests);
      // Cập nhật store trực tiếp với danh sách mới
      const friendStore = useFriendStore.getState();
      friendStore.sentRequests = sentRequests;
      friendStore.isLoading = false;
    };

    // Thêm handler cho sự kiện error - ghi log và hiển thị lỗi khi cần thiết
    const errorHandler = (error) => {
      console.error("Socket error received in useFriendRequestSocket:", error);
      // Chỉ hiển thị toast thông báo lỗi nếu đó là lỗi quan trọng
      // tránh hiển thị lỗi "Lời mời kết bạn đã tồn tại" nhiều lần
      if (
        error &&
        typeof error === "object" &&
        error.message &&
        !error.message.includes("Lời mời kết bạn đã tồn tại")
      ) {
        toast.error(`Lỗi: ${error.message}`);
      }
    };

    // Đăng ký handler xử lý lỗi
    currentSocket.on("error", errorHandler);

    // Đăng ký các handlers khác
    currentSocket.on("newFriendRequest", newFriendRequestHandler);
    currentSocket.on("friendRequestResponse", friendRequestResponseHandler);
    currentSocket.on("newFriend", newFriendHandler);
    currentSocket.on("friendRequestCancelled", friendRequestCancelledHandler);
    currentSocket.on("sentFriendRequests", sentFriendRequestsHandler);

    currentSocket.on("receivedFriendRequests", (receivedRequests) => {
      console.log("📩 Socket event: receivedFriendRequests", receivedRequests);
      // Cập nhật store trực tiếp
      const friendStore = useFriendStore.getState();
      friendStore.friendRequests = receivedRequests;
      friendStore.isLoading = false;
    });

    // Không sử dụng socket để lấy dữ liệu ban đầu
    // Thay vào đó, các components sẽ gọi API qua friendStore khi cần

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
        currentSocket.off("sentFriendRequests", sentFriendRequestsHandler);
        currentSocket.off("receivedFriendRequests");
        currentSocket.off("error", errorHandler);
      }
    };
  }, [user, fetchFriendRequests, fetchSentRequests, fetchFriends]); // Phụ thuộc vào user và các hàm lấy dữ liệu

  // Các phương thức tương tác với socket
  // Lưu ý: Các phương thức này không nên được gọi trực tiếp từ UI
  // Thay vào đó, các thao tác nên được thực hiện thông qua friendStore
  // để đảm bảo dữ liệu được cập nhật đồng bộ giữa socket và API
  const sendFriendRequest = (receiverId, message = "") => {
    console.log("Socket: Sending friend request to", receiverId);
    const socket = socketManager.getSocket();
    if (socket && socket.connected && user) {
      socket.emit("sendFriendRequest", {
        senderId: user._id,
        receiverId,
        message,
      });
      return true;
    }
    return false;
  };
  const acceptFriendRequest = (requestId) => {
    console.log("Socket: Accepting friend request", requestId);
    const socket = socketManager.getSocket();
    if (socket && socket.connected && user) {
      socket.emit("respondToFriendRequest", {
        requestId,
        status: "accepted", // Sử dụng "accepted" thay vì "accept"
        userId: user._id,
      });
      return true;
    }
    return false;
  };

  const rejectFriendRequest = (requestId) => {
    console.log("Socket: Rejecting friend request", requestId);
    const socket = socketManager.getSocket();
    if (socket && socket.connected && user) {
      socket.emit("respondToFriendRequest", {
        requestId,
        status: "rejected", // Sử dụng "rejected" thay vì "reject"
        userId: user._id,
      });
      return true;
    }
    return false;
  };

  const cancelFriendRequest = (requestId) => {
    console.log("Socket: Cancelling friend request", requestId);
    const socket = socketManager.getSocket();
    if (socket && socket.connected && user) {
      socket.emit("cancelFriendRequest", {
        requestId,
        userId: user._id,
      });
      return true;
    }
    return false;
  };

  // Các phương thức để lấy dữ liệu qua socket
  // (không nên sử dụng trực tiếp, nên gọi API qua friendStore thay vì socket)
  const getFriendRequests = () => {
    console.log("Socket: Requesting received friend requests");
    const socket = socketManager.getSocket();
    if (socket && socket.connected && user) {
      socket.emit("getReceivedFriendRequests", { userId: user._id });
      return true;
    }
    return false;
  };

  const getSentFriendRequests = () => {
    console.log("Socket: Requesting sent friend requests");
    const socket = socketManager.getSocket();
    if (socket && socket.connected && user) {
      socket.emit("getSentFriendRequests", { userId: user._id });
      return true;
    }
    return false;
  };

  return {
    isConnected,
    // Các hàm này chỉ nên được sử dụng trong các trường hợp đặc biệt
    // Trong hầu hết các trường hợp, nên sử dụng các hàm từ friendStore
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    getFriendRequests,
    getSentFriendRequests,
  };
};

export default useFriendRequestSocket;
