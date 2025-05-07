import { Search } from "lucide-react";
import { HiOutlineUserPlus } from "react-icons/hi2";
import { MdOutlineGroupAdd } from "react-icons/md";
import { useRef, useState } from "react";
import AddFriendModal from "../common/AddFriendModal";
import CreateGroupModal from "../group/CreateGroupModal";

const SearchBar = ({ searchTerm, setSearchTerm }) => {
  const addFriendModalRef = useRef(null);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);

  const handleOpenAddFriendModal = () => {
    if (addFriendModalRef.current) {
      addFriendModalRef.current.showModal();
    }
  };

  const handleOpenCreateGroupModal = () => {
    setCreateGroupModalOpen(true);
  };

  const handleCloseCreateGroupModal = () => {
    setCreateGroupModalOpen(false);
  };

  return (
    <div className="p-2 flex-row flex-shrink-0">
      <div className="relative flex items-center">
        <div className="relative flex-grow">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 text-sm focus:outline-none"
          />
        </div>
        <button
          className="ml-2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 hover:cursor-pointer"
          title="Thêm bạn"
          onClick={handleOpenAddFriendModal}
        >
          <HiOutlineUserPlus size={18} className="text-gray-600" />
        </button>
        <button
          className="ml-2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 hover:cursor-pointer"
          title="Tạo nhóm"
          onClick={handleOpenCreateGroupModal}
        >
          <MdOutlineGroupAdd size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Using the AddFriendModal component */}
      <AddFriendModal ref={addFriendModalRef} />

      {/* Using the CreateGroupModal component */}
      {createGroupModalOpen && (
        <CreateGroupModal
          isOpen={createGroupModalOpen}
          onClose={handleCloseCreateGroupModal}
        />
      )}
    </div>
  );
};

export default SearchBar;
