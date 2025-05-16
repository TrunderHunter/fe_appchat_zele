import React from "react";
import { formatMessageDate } from "../../utils/formatters";

const StickyDateHeader = ({ currentDate }) => {
  if (!currentDate) return null;

  return (
    <div className="sticky top-0 z-10 flex justify-center items-center py-2">
      <div className="px-3 py-1 bg-white bg-opacity-80 backdrop-blur-sm shadow-sm rounded-full text-xs text-gray-600 font-medium border border-gray-200">
        {formatMessageDate(currentDate)}
      </div>
    </div>
  );
};

export default StickyDateHeader;
