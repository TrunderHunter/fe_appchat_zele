import { Phone, Search, UserRound } from "lucide-react";
import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import useFriendStore from "../../stores/friendStore";
import useAuthStore from "../../stores/authStore";
import { toast } from "react-hot-toast";

const AddFriendModal = forwardRef((props, ref) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchType, setSearchType] = useState("phone"); // 'phone' or 'name'
  const [isSearching, setIsSearching] = useState(false);
  const [maxResults, setMaxResults] = useState(10); // Giới hạn số lượng kết quả hiển thị
  const [showLimit, setShowLimit] = useState(false); // Hiển thị tùy chỉnh giới hạn
  const modalRef = useRef(null);

  const { user } = useAuthStore();
  const {
    searchResults = [],
    isLoading,
    searchUsers,
    sendFriendRequest,
    clearSearchResults,
    sentRequests = [],
    friends = [],
  } = useFriendStore();

  useImperativeHandle(ref, () => ({
    showModal: () => {
      if (modalRef.current) {
        modalRef.current.showModal();
      }
    },
    closeModal: () => {
      if (modalRef.current) {
        modalRef.current.close();
        setSearchInput("");
        clearSearchResults();
      }
    },
  }));
  const handleInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
    // Khi đổi loại tìm kiếm, nếu đang có từ khóa tìm kiếm thì tìm lại
    if (searchInput.trim() !== "") {
      setIsSearching(true);
      searchUsers(searchInput);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await sendFriendRequest(userId);
      toast.success("Đã gửi lời mời kết bạn");
    } catch (error) {
      toast.error("Không thể gửi lời mời kết bạn");
    }
  };

  // Check if user already has a pending friend request
  const hasPendingRequest = (userId) => {
    return (sentRequests || []).some(
      (request) =>
        request.receiver._id === userId && request.status === "pending"
    );
  };

  // Reset search results when modal closes
  useEffect(() => {
    const handleCloseModal = () => {
      clearSearchResults();
      setSearchInput("");
      setIsSearching(false);
    };

    const modal = modalRef.current;
    if (modal) {
      modal.addEventListener("close", handleCloseModal);
      return () => modal.removeEventListener("close", handleCloseModal);
    }
  }, [clearSearchResults]);

  // Tìm kiếm thời gian thực khi người dùng nhập
  useEffect(() => {
    // Đảm bảo chỉ tìm kiếm khi có ít nhất 1 ký tự
    if (searchInput.trim().length > 0) {
      // Thiết lập một bộ đếm thời gian để tránh gọi API quá nhiều
      const delayDebounceFn = setTimeout(() => {
        setIsSearching(true);
        searchUsers(searchInput);
      }, 500); // Đợi 500ms sau khi người dùng ngừng gõ

      return () => clearTimeout(delayDebounceFn);
    } else if (searchInput.trim() === "" && isSearching) {
      // Nếu xóa hết nội dung tìm kiếm thì xóa kết quả
      clearSearchResults();
      setIsSearching(false);
    }
  }, [searchInput, searchType]);

  // Lọc kết quả tìm kiếm để loại bỏ bản thân và bạn bè hiện tại
  const filteredResults = searchResults
    .filter((result) => {
      // Loại bỏ bản thân người dùng
      if (user && result._id === user._id) return false;

      // Loại bỏ bạn bè hiện tại
      if (friends && friends.some((friend) => friend._id === result._id))
        return false;

      return true;
    })
    .slice(0, maxResults); // Giới hạn số lượng hiển thị

  return (
    <dialog ref={modalRef} className="modal">
      <div className="modal-box max-w-md overflow-y-auto scrollbar-hide">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            ✕
          </button>
        </form>
        <h3 className="font-medium text-lg mb-4">Thêm bạn</h3>
        <div className="mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center mr-2">
              {searchType === "phone" ? (
                <Phone size={18} className="text-gray-500" />
              ) : (
                <Search size={18} className="text-gray-500" />
              )}
            </div>
            <div className="relative flex-grow">
              <div className="flex items-center join">
                <select
                  className="select select-bordered select-sm join-item rounded-r-none w-1/4"
                  value={searchType}
                  onChange={handleSearchTypeChange}
                >
                  <option value="phone">SĐT</option>
                  <option value="name">Tên</option>
                </select>{" "}
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder={
                      searchType === "phone"
                        ? "Số điện thoại"
                        : "Tên người dùng"
                    }
                    value={searchInput}
                    onChange={handleInputChange}
                    className="input input-bordered input-sm join-item rounded-l-none w-full pr-8"
                    autoFocus
                  />
                  {searchInput.trim() !== "" && (
                    <button
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => {
                        setSearchInput("");
                        clearSearchResults();
                        setIsSearching(false);
                      }}
                    >
                      <span className="text-lg">×</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>{" "}
        </div>
        {isLoading && (
          <div className="flex justify-center items-center my-2">
            <span className="loading loading-spinner loading-sm mr-2"></span>
            <span className="text-sm text-gray-500">Đang tìm kiếm...</span>
          </div>
        )}{" "}
        {/* Kết quả tìm kiếm */}
        {searchInput.trim() !== "" && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">
                Kết quả tìm kiếm{" "}
                {filteredResults.length > 0
                  ? `(${filteredResults.length}${
                      searchResults.length > filteredResults.length
                        ? `/${searchResults.length}`
                        : ""
                    })`
                  : ""}
              </h4>
              {filteredResults.length > 0 && searchResults.length > 10 && (
                <button
                  className="text-xs text-primary hover:text-primary-focus"
                  onClick={() => setShowLimit(!showLimit)}
                >
                  {showLimit ? "Ẩn tùy chỉnh" : "Tùy chỉnh hiển thị"}
                </button>
              )}
            </div>

            {showLimit && (
              <div className="mb-4 bg-base-200 p-2 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">
                    Số lượng: {maxResults}
                  </span>
                  <span className="text-xs text-gray-600">
                    Tối đa: {searchResults.length}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={searchResults.length || 1}
                  value={maxResults}
                  onChange={(e) => setMaxResults(parseInt(e.target.value))}
                  className="range range-xs range-primary"
                  step="1"
                />
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="space-y-2">
                {filteredResults.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center p-2 hover:bg-base-200 rounded-lg"
                  >
                    <div className="avatar mr-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        {user.primary_avatar ? (
                          <img src={user.primary_avatar} alt={user.name} />
                        ) : (
                          <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center">
                            <UserRound size={24} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-gray-500 text-sm">
                        {user.phone || user.email}
                      </p>
                    </div>
                    <div>
                      {hasPendingRequest(user._id) ? (
                        <button className="btn btn-sm btn-disabled" disabled>
                          Đã gửi lời mời
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline btn-primary"
                          onClick={() => handleSendFriendRequest(user._id)}
                        >
                          Kết bạn
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy người dùng nào
              </div>
            )}
          </div>
        )}
        {/* Hiển thị thông tin về giới hạn kết quả */}
        {searchInput.trim() !== "" && !isLoading && (
          <>
            {searchResults.length > 0 && filteredResults.length === 0 && (
              <div className="text-center mt-3 text-sm text-gray-500">
                <p>
                  Tìm thấy {searchResults.length} kết quả, nhưng tất cả đều là
                  bạn bè của bạn hoặc chính là bạn.
                </p>
              </div>
            )}
            {searchResults.length > filteredResults.length &&
              filteredResults.length > 0 && (
                <div className="text-center mt-3 text-sm text-gray-500">
                  <p>
                    {searchResults.length - filteredResults.length} kết quả
                    không hiển thị (bản thân hoặc bạn bè hiện tại).
                    {searchResults.length > maxResults &&
                      ` Đang hiển thị ${maxResults}/${filteredResults.length} kết quả.`}
                  </p>
                </div>
              )}
          </>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
});

AddFriendModal.displayName = "AddFriendModal";

export default AddFriendModal;
