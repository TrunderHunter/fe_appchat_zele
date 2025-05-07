import React from "react";
import { MdOutlineGroupAdd } from "react-icons/md";

const GroupInvitesContent = () => {
  return (
    <div className="flex flex-col h-full w-full bg-white p-6">
      <h3 className="text-xl font-semibold mb-4">Lời mời vào nhóm</h3>
      <div className="text-gray-500 flex flex-col items-center justify-center h-full">
        <div className="bg-gray-100 rounded-full p-6 mb-4">
          <MdOutlineGroupAdd size={48} className="text-gray-400" />
        </div>
        <p>Chưa có lời mời vào nhóm nào</p>
      </div>
    </div>
  );
};

export default GroupInvitesContent;
