import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Check,
  X,
  UserRound,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import useFriendStore from "../../stores/friendStore";
import { toast } from "react-hot-toast";

const FriendRequestsContent = () => {
  const {
    friendRequests = [],
    sentRequests = [],
    searchResults,
    isLoading,
    fetchFriendRequests,
    fetchSentRequests,
    respondToFriendRequest,
    cancelFriendRequest,
    searchUsers,
    clearSearchResults,
    sendFriendRequest,
  } = useFriendStore();

  // State for UI controls
  const [showAllSentRequests, setShowAllSentRequests] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Number of sent requests and suggestions to show initially
  const initialSentRequestsCount = 3;
  const initialSuggestionsCount = 3;

  // Load friend requests when component mounts
  useEffect(() => {
    fetchFriendRequests();
    fetchSentRequests();

    // For now, we'll use a dummy set of suggested friends
    // In a real implementation, this would come from an API
    setSuggestedFriends([
      {
        _id: "sug1",
        name: "Kiều Oanh",
        mutualGroup: "1 nhóm chung",
        primary_avatar: "https://placehold.co/40",
      },
      {
        _id: "sug2",
        name: "Nguyễn Duy Nam",
        mutualGroup: "1 nhóm chung",
        primary_avatar: "https://placehold.co/40",
      },
      {
        _id: "sug3",
        name: "Nguyễn Hồng Phúc",
        mutualGroup: "1 nhóm chung",
        primary_avatar: "https://placehold.co/40",
      },
    ]);
  }, []);

  // Handle user search
  useEffect(() => {
    if (searchTerm.trim()) {
      const searchTimer = setTimeout(() => {
        searchUsers(searchTerm);
      }, 500);
      return () => clearTimeout(searchTimer);
    } else {
      clearSearchResults();
    }
  }, [searchTerm]);

  // Display limited or all sent requests based on showAllSentRequests state
  const displayedSentRequests = showAllSentRequests
    ? sentRequests || []
    : (sentRequests || []).slice(0, initialSentRequestsCount);

  // Display limited or all friend suggestions based on showAllSuggestions state
  const displayedSuggestions = showAllSuggestions
    ? suggestedFriends || []
    : (suggestedFriends || []).slice(0, initialSuggestionsCount);

  const handleAcceptRequest = async (requestId) => {
    try {
      await respondToFriendRequest(requestId, "accepted");
    } catch (error) {
      toast.error("Không thể chấp nhận lời mời kết bạn");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await respondToFriendRequest(requestId, "rejected");
    } catch (error) {
      toast.error("Không thể từ chối lời mời kết bạn");
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await cancelFriendRequest(requestId);
    } catch (error) {
      toast.error("Không thể thu hồi lời mời kết bạn");
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await sendFriendRequest(userId);
      // Sau khi gửi lời mời thành công, cập nhật lại danh sách gợi ý
      setSuggestedFriends(
        suggestedFriends.filter((friend) => friend._id !== userId)
      );
    } catch (error) {
      toast.error("Không thể gửi lời mời kết bạn");
    }
  };

  const toggleShowAllSentRequests = () => {
    setShowAllSentRequests(!showAllSentRequests);
  };

  const toggleShowAllSuggestions = () => {
    setShowAllSuggestions(!showAllSuggestions);
  };

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-y-auto">
      {/* Lời mời đã nhận */}
      <div className="p-4 border-b">
        <h3 className="text-base font-medium text-gray-700 mb-2">
          Lời mời đã nhận ({friendRequests.length})
        </h3>

        {isLoading ? (
          <div className="text-center py-6">Đang tải...</div>
        ) : friendRequests.length > 0 ? (
          <div className="space-y-3">
            {friendRequests.map((request) => (
              <div key={request._id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center overflow-hidden">
                      {request.sender?.primary_avatar ? (
                        <img
                          src={request.sender.primary_avatar}
                          alt={request.sender.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserRound size={24} />
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex-grow">
                    <div className="flex items-center">
                      <h4 className="font-medium">{request.sender?.name}</h4>
                      <span className="ml-2 text-sm text-gray-500">
                        {formatDate(request.created_at)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p>
                        {request.message ||
                          `Xin chào, mình là ${request.sender?.name}. Kết bạn với mình nhé!`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex mt-3 gap-2">
                  <button
                    onClick={() => handleRejectRequest(request._id)}
                    className="flex-1 py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-center"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => handleAcceptRequest(request._id)}
                    className="flex-1 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-center"
                  >
                    Đồng ý
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 flex flex-col items-center justify-center py-8">
            <div className="bg-gray-100 rounded-full p-6 mb-4">
              <UserPlus size={48} className="text-gray-400" />
            </div>
            <p>Chưa có lời mời kết bạn nào</p>
          </div>
        )}
      </div>

      {/* Lời mời đã gửi */}
      <div className="p-4 border-b">
        <h3 className="text-base font-medium text-gray-700 mb-2">
          Lời mời đã gửi ({sentRequests.length})
        </h3>

        {isLoading ? (
          <div className="text-center py-6">Đang tải...</div>
        ) : sentRequests.length > 0 ? (
          <div className="space-y-3">
            {displayedSentRequests.map((request) => (
              <div
                key={request._id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-violet-500 text-white flex items-center justify-center overflow-hidden">
                    {request.receiver?.primary_avatar ? (
                      <img
                        src={request.receiver.primary_avatar}
                        alt={request.receiver.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserRound size={20} />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center">
                      <h4 className="font-medium">{request.receiver?.name}</h4>
                      <span className="ml-2 text-xs text-gray-500">
                        {formatDate(request.created_at)}
                      </span>
                    </div>
                    {request.message && (
                      <p className="text-xs text-gray-500">{request.message}</p>
                    )}
                  </div>
                </div>

                <button
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                  onClick={() => handleCancelRequest(request._id)}
                >
                  Thu hồi lời mời
                </button>
              </div>
            ))}

            {sentRequests.length > initialSentRequestsCount && (
              <div className="flex justify-center">
                <button
                  onClick={toggleShowAllSentRequests}
                  className="flex items-center gap-2 px-4 py-2 text-blue-500 hover:underline"
                >
                  {showAllSentRequests ? (
                    <>
                      <span>Thu gọn</span>
                      <ChevronUp size={16} />
                    </>
                  ) : (
                    <>
                      <span>Xem thêm</span>
                      <ChevronDown size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-6">
            Bạn chưa gửi lời mời kết bạn nào
          </div>
        )}
      </div>

      {/* Gợi ý kết bạn */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-medium text-gray-700">
            Gợi ý kết bạn ({suggestedFriends.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {displayedSuggestions.map((friend) => (
            <div
              key={friend._id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center overflow-hidden">
                  {friend.primary_avatar ? (
                    <img
                      src={friend.primary_avatar}
                      alt={friend.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserRound size={20} />
                  )}
                </div>
                <div className="ml-3">
                  <h4 className="font-medium">{friend.name}</h4>
                  {friend.mutualGroup && (
                    <p className="text-xs text-gray-500">
                      {friend.mutualGroup}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100">
                  Bỏ qua
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  onClick={() => handleSendRequest(friend._id)}
                >
                  Kết bạn
                </button>
              </div>
            </div>
          ))}

          {suggestedFriends.length > initialSuggestionsCount && (
            <div className="flex justify-center">
              <button
                onClick={toggleShowAllSuggestions}
                className="flex items-center gap-2 px-4 py-2 text-blue-500 hover:underline"
              >
                {showAllSuggestions ? (
                  <>
                    <span>Thu gọn</span>
                    <ChevronUp size={16} />
                  </>
                ) : (
                  <>
                    <span>Xem thêm</span>
                    <ChevronDown size={16} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendRequestsContent;
