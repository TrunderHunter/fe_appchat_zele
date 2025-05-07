import React, { useState, useRef, useEffect } from "react";
import FriendList from "../components/friends/FriendList";
import SidebarNavigation from "../components/friends/SidebarNavigation";
import FriendRequestsContent from "../components/friends/FriendRequestsContent";
import GroupsCommunitiesList from "../components/friends/GroupsCommunitiesList";
import GroupInvitesContent from "../components/friends/GroupInvitesContent";
import SearchBar from "../components/chat/SearchBar";
import AddFriendModal from "../components/common/AddFriendModal";
import useFriendStore from "../stores/friendStore";

const FriendsPage = () => {
  const [activeTab, setActiveTab] = useState("friends");
  const [searchTerm, setSearchTerm] = useState("");
  const addFriendModalRef = useRef(null);
  const { fetchFriendRequests, fetchSentRequests, fetchFriends } =
    useFriendStore();

  // Fetch all friend-related data when the component loads
  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
    fetchSentRequests();
  }, [fetchFriends, fetchFriendRequests, fetchSentRequests]);

  const handleAddFriendClick = () => {
    if (addFriendModalRef.current) {
      addFriendModalRef.current.showModal();
    }
  };

  return (
    <div className="flex w-full h-full">
      <div className="w-[360px] flex flex-col h-full border-r bg-white">
        {/* Sidebar navigation */}
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <SidebarNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onAddFriendClick={handleAddFriendClick}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden mb-5">
        {activeTab === "friends" && <FriendList />}
        {activeTab === "requests" && <FriendRequestsContent />}
        {activeTab === "suggestions" && <GroupsCommunitiesList />}
        {activeTab === "group-invites" && <GroupInvitesContent />}
      </div>

      {/* Add Friend Modal */}
      <AddFriendModal ref={addFriendModalRef} />
    </div>
  );
};

export default FriendsPage;
