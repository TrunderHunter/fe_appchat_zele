import { Phone, Search, UserRound } from "lucide-react";
import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import useFriendStore from "../../stores/friendStore";
import { toast } from "react-hot-toast";

const AddFriendModal = forwardRef((props, ref) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchType, setSearchType] = useState("phone"); // 'phone' or 'name'
  const [isSearching, setIsSearching] = useState(false);
  const modalRef = useRef(null);

  const {
    searchResults = [],
    isLoading,
    searchUsers,
    sendFriendRequest,
    clearSearchResults,
    sentRequests = [],
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
  };

  const handleSearch = () => {
    if (searchInput.trim() === "") {
      toast.error("Vui lòng nhập thông tin tìm kiếm");
      return;
    }

    setIsSearching(true);
    searchUsers(searchInput);
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
                </select>
                <input
                  type="text"
                  placeholder={
                    searchType === "phone" ? "Số điện thoại" : "Tên người dùng"
                  }
                  value={searchInput}
                  onChange={handleInputChange}
                  className="input input-bordered input-sm join-item rounded-l-none w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            className="btn btn-primary w-full"
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Đang tìm kiếm...
              </>
            ) : (
              "Tìm kiếm"
            )}
          </button>
        </div>

        {/* Kết quả tìm kiếm */}
        {isSearching && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Kết quả tìm kiếm{" "}
              {(searchResults || []).length > 0
                ? `(${searchResults.length})`
                : ""}
            </h4>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : (searchResults || []).length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((user) => (
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
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
});

AddFriendModal.displayName = "AddFriendModal";

export default AddFriendModal;
