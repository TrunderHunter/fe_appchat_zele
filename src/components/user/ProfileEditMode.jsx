import React from "react";
import { ChevronLeft, X } from "lucide-react";

const ProfileEditMode = ({
  contentClasses,
  formData,
  handleChange,
  handleDateChange,
  generateDays,
  generateMonths,
  generateYears,
  handleBackToView,
  handleUpdateProfile,
  handleClose,
}) => {
  return (
    <div className={contentClasses}>
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <button
          onClick={handleBackToView}
          className="text-gray-500 hover:text-gray-700 mr-4"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-semibold flex-1">
          Cập nhật thông tin cá nhân
        </h2>
        <button
          className="btn btn-sm btn-circle btn-ghost"
          onClick={handleClose}
        >
          <X size={20} />
        </button>
      </div>

      {/* Form cập nhật thông tin */}
      <div className="p-4">
        {/* Tên hiển thị */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Tên hiển thị
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:border-blue-500 focus:outline-none"
            placeholder="Nhập tên hiển thị của bạn"
          />
        </div>

        {/* Số điện thoại */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Số điện thoại
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:border-blue-500 focus:outline-none"
            placeholder="Nhập số điện thoại của bạn"
          />
        </div>

        {/* Thông tin cá nhân */}
        <h3 className="text-lg font-medium my-4">Thông tin cá nhân</h3>

        {/* Giới tính */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Giới tính
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="gender"
                value="Nam"
                checked={formData.gender === "Nam"}
                onChange={handleChange}
                className="radio radio-primary mr-2"
              />
              Nam
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="gender"
                value="Nữ"
                checked={formData.gender === "Nữ"}
                onChange={handleChange}
                className="radio radio-primary mr-2"
              />
              Nữ
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="gender"
                value="Khác"
                checked={formData.gender === "Khác"}
                onChange={handleChange}
                className="radio radio-primary mr-2"
              />
              Khác
            </label>
          </div>
        </div>

        {/* Ngày sinh */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Ngày sinh
          </label>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={formData.dob.day}
              onChange={(e) => handleDateChange("day", e.target.value)}
              className="select select-bordered w-full"
            >
              {generateDays().map((day) => (
                <option key={`day-${day}`} value={day}>
                  {day}
                </option>
              ))}
            </select>

            <select
              value={formData.dob.month}
              onChange={(e) => handleDateChange("month", e.target.value)}
              className="select select-bordered w-full"
            >
              {generateMonths().map((month) => (
                <option key={`month-${month}`} value={month}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={formData.dob.year}
              onChange={(e) => handleDateChange("year", e.target.value)}
              className="select select-bordered w-full"
            >
              {generateYears().map((year) => (
                <option key={`year-${year}`} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Nút Huỷ và Cập nhật */}
      <div className="flex justify-end gap-2 p-4 border-t">
        <button className="btn btn-outline" onClick={handleBackToView}>
          Huỷ
        </button>
        <button className="btn btn-primary" onClick={handleUpdateProfile}>
          Cập nhật
        </button>
      </div>
    </div>
  );
};

export default ProfileEditMode;
