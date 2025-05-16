import React from "react";
import { formatMessageDate } from "../../utils/formatters";

const DateDivider = ({ date }) => {
  // Tạo định dạng ISO cho việc lưu trữ ngày
  const isoDate = new Date(date).toISOString().split("T")[0]; // YYYY-MM-DD

  return (
    <div className="flex items-center justify-center my-4" data-date={isoDate}>
      <div className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-600 font-medium">
        {formatMessageDate(date)}
      </div>
    </div>
  );
};

export default DateDivider;
