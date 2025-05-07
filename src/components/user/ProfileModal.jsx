import React, { useRef, useEffect, useState } from "react";
import { useModalContext } from "../../context/ModalContext";
import ProfileViewMode from "./ProfileViewMode";
import ProfileEditMode from "./ProfileEditMode";
import ProfileAvatarMode from "./ProfileAvatarMode";
import useAuthStore from "../../stores/authStore";
import userService from "../../services/userService";
import toast from "react-hot-toast";

const ProfileModal = () => {
  const modalRef = useRef(null);
  const { isProfileViewModeOpen, closeProfileViewModeModal } =
    useModalContext();

  const user = useAuthStore((state) => state.user);
  const updateUserProfile = useAuthStore((state) => state.updateUserProfile);

  // State để quản lý chế độ (view/edit/avatar) hiện tại
  const [mode, setMode] = useState("view");
  // State để quản lý hiệu ứng slide
  const [slideDirection, setSlideDirection] = useState(""); // "", "slide", "slide-back"
  // State để hiển thị các mode trong quá trình chuyển đổi
  const [isTransitioning, setIsTransitioning] = useState(false);

  // State cho chức năng cập nhật avatar
  const [avatars, setAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // State để lưu trữ dữ liệu form
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    gender: "Nam", // Mặc định là Nam
    dob: {
      day: "1",
      month: "1",
      year: "2000",
    },
  });

  // Khởi tạo formData từ thông tin user hiện tại
  useEffect(() => {
    if (user) {
      const dobParts = user.dob ? new Date(user.dob) : new Date();

      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        gender: user.gender || "Nam",
        dob: {
          day: dobParts.getDate().toString(),
          month: (dobParts.getMonth() + 1).toString(),
          year: dobParts.getFullYear().toString(),
        },
      });

      // Khởi tạo danh sách avatar và avatar đang được chọn
      if (user.avatar_images && user.avatar_images.length > 0) {
        setAvatars(user.avatar_images);
        setSelectedAvatar(user.primary_avatar || user.avatar_images[0]);
      }
    }
  }, [user]);

  // Mở modal khi state thay đổi
  useEffect(() => {
    if (isProfileViewModeOpen && modalRef.current) {
      modalRef.current.showModal();
      setMode("view");
      setSlideDirection("");
      setIsTransitioning(false);
    } else if (modalRef.current) {
      modalRef.current.close();
    }
  }, [isProfileViewModeOpen]);

  // Format birthday để hiển thị trong ProfileViewMode
  const formatBirthday = (dateString) => {
    if (!dateString) return "Không xác định";
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Avatar mặc định
  const defaultAvatar =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23CCCCCC'/%3E%3Ctext x='50' y='62' font-size='35' text-anchor='middle' fill='%23FFFFFF'%3EU%3C/text%3E%3C/svg%3E";

  // Xử lý khi người dùng click vào nền để đóng modal
  const handleModalBackdropClick = (e) => {
    const modalBox = document.querySelector(".profile-modal-box");
    if (modalBox && !modalBox.contains(e.target)) {
      closeProfileViewModeModal();
    }
  };

  // Chuyển sang chế độ cập nhật avatar với hiệu ứng slide từ phải sang trái
  const handleSwitchToAvatar = () => {
    setIsTransitioning(true);
    setSlideDirection("slide");

    setTimeout(() => {
      setMode("avatar");
      setSlideDirection("");
      setIsTransitioning(false);
    }, 300); // Đợi hiệu ứng slide hoàn tất
  };

  // Chuyển sang chế độ chỉnh sửa với hiệu ứng slide từ phải sang trái
  const handleSwitchToEdit = () => {
    setIsTransitioning(true);
    setSlideDirection("slide");

    setTimeout(() => {
      setMode("edit");
      setSlideDirection("");
      setIsTransitioning(false);
    }, 300); // Đợi hiệu ứng slide hoàn tất
  };

  // Quay lại chế độ xem với hiệu ứng slide từ trái sang phải
  const handleBackToView = () => {
    setIsTransitioning(true);
    setSlideDirection("slide-back");

    setTimeout(() => {
      setMode("view");
      setSlideDirection("");
      setIsTransitioning(false);
    }, 300); // Đợi hiệu ứng slide hoàn tất
  };

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Xử lý thay đổi ngày tháng năm sinh
  const handleDateChange = (type, value) => {
    setFormData((prev) => ({
      ...prev,
      dob: {
        ...prev.dob,
        [type]: value,
      },
    }));
  };

  // Tạo danh sách ngày
  const generateDays = () => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push(i.toString());
    }
    return days;
  };

  // Tạo danh sách tháng
  const generateMonths = () => {
    const months = [];
    for (let i = 1; i <= 12; i++) {
      months.push(i.toString());
    }
    return months;
  };

  // Tạo danh sách năm
  const generateYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 100; i <= currentYear; i++) {
      years.push(i.toString());
    }
    return years.reverse();
  };

  // Xử lý khi cập nhật thông tin
  const handleUpdateProfile = async () => {
    try {
      // Tạo đối tượng dob từ dữ liệu form
      const { day, month, year } = formData.dob;
      const dob = new Date(`${year}-${month}-${day}`);

      const profileData = {
        name: formData.name,
        phone: formData.phone,
        gender: formData.gender,
        dob: dob.toISOString(),
      };

      // Gọi API cập nhật thông tin
      const result = await updateUserProfile(profileData);

      if (result.success) {
        toast.success("Cập nhật thông tin thành công!");
        handleBackToView(); // Quay lại chế độ xem
      } else {
        toast.error(result.message || "Cập nhật thông tin thất bại!");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      toast.error("Đã xảy ra lỗi khi cập nhật thông tin!");
    }
  };

  // Xử lý khi chọn file ảnh
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Kiểm tra định dạng file
    if (!file.type.match("image.*")) {
      toast.error("Vui lòng chọn file hình ảnh");
      return;
    }

    // Kiểm tra kích thước file (tối đa 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 10MB");
      return;
    }

    try {
      setIsUploading(true);

      // Tạo FormData để gửi file
      const formData = new FormData();
      formData.append("avatar", file);

      // Gọi API thông qua userService
      const data = await userService.uploadAvatar(user._id, formData);

      // Sử dụng getUserAvatars để lấy danh sách avatar mới nhất
      const updatedAvatars = await userService.getUserAvatars(user._id);

      // Lấy avatar mới nhất (được thêm vào sau cùng)
      if (updatedAvatars && updatedAvatars.length > 0) {
        // Nếu có avatar mới, thêm vào danh sách và chọn nó
        const newAvatar = data.avatarUrl;
        setAvatars(updatedAvatars);
        setSelectedAvatar(newAvatar);
        toast.success("Tải lên ảnh đại diện thành công");
      } else {
        toast.error("Không thể tải ảnh đại diện, vui lòng thử lại");
      }
    } catch (error) {
      console.error("Lỗi khi tải lên avatar:", error);
      toast.error("Đã xảy ra lỗi khi tải lên avatar");
    } finally {
      setIsUploading(false);
    }
  };

  // Xử lý khi lưu avatar đã chọn
  const handleSaveAvatar = async () => {
    if (!selectedAvatar) {
      toast.error("Vui lòng chọn một ảnh đại diện");
      return;
    }

    try {
      setIsUploading(true);

      // Gọi API thông qua userService
      await userService.updatePrimaryAvatar(user._id, selectedAvatar);

      // Cập nhật state của user trong authStore
      useAuthStore.setState((state) => ({
        user: {
          ...state.user,
          primary_avatar: selectedAvatar,
        },
      }));

      toast.success("Cập nhật ảnh đại diện thành công");

      // Chuyển về màn hình xem
      setTimeout(() => {
        handleBackToView();
      }, 300);
    } catch (error) {
      console.error("Lỗi khi cập nhật avatar:", error);
      toast.error("Đã xảy ra lỗi khi cập nhật avatar");
    } finally {
      setIsUploading(false);
    }
  };

  // Component nút upload avatar
  const AvatarUploadButton = ({ onFileSelect }) => (
    <div className="mb-4">
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              ></path>
            </svg>
            <p className="text-sm text-gray-500 mt-2">
              Kéo thả hoặc nhấn để tải lên
            </p>
            <p className="text-xs text-gray-500">PNG, JPG (Tối đa 10MB)</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={onFileSelect}
            disabled={isUploading}
          />
        </label>
      </div>
    </div>
  );

  // Component grid hiển thị avatar
  const AvatarSelectionGrid = ({ avatars, selectedAvatar, onSelect }) => (
    <div className="grid grid-cols-4 gap-4 mt-4">
      {avatars.map((avatar, index) => (
        <div
          key={`avatar-${index}`}
          className={`relative rounded-lg overflow-hidden cursor-pointer ${
            selectedAvatar === avatar ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={() => onSelect(avatar)}
        >
          <img
            src={avatar}
            alt={`Avatar ${index + 1}`}
            className="w-full h-24 object-cover"
          />
          {selectedAvatar === avatar && (
            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (!isProfileViewModeOpen) return null;

  return (
    <dialog
      ref={modalRef}
      className="modal profile-modal"
      onClick={handleModalBackdropClick}
    >
      <div className="modal-box profile-modal-box max-w-3xl p-0 bg-white">
        <div className="profile-mode-container">
          <div
            className={`profile-mode-wrapper ${
              slideDirection ? `${slideDirection}-exit-active` : ""
            }`}
          >
            {(mode === "view" || isTransitioning) && (
              <div
                className={`profile-mode ${
                  isTransitioning && mode !== "view" ? "absolute inset-0" : ""
                }`}
              >
                <ProfileViewMode
                  contentClasses=""
                  user={user}
                  defaultAvatar={defaultAvatar}
                  formatBirthday={formatBirthday}
                  handleSwitchToAvatar={handleSwitchToAvatar}
                  handleSwitchToEdit={handleSwitchToEdit}
                  handleClose={closeProfileViewModeModal}
                />
              </div>
            )}

            {(mode === "edit" ||
              (isTransitioning && (mode === "view" || mode === "avatar"))) && (
              <div
                className={`profile-mode ${
                  isTransitioning && mode !== "edit" ? "absolute inset-0" : ""
                }`}
              >
                <ProfileEditMode
                  contentClasses=""
                  formData={formData}
                  handleChange={handleChange}
                  handleDateChange={handleDateChange}
                  generateDays={generateDays}
                  generateMonths={generateMonths}
                  generateYears={generateYears}
                  handleBackToView={handleBackToView}
                  handleUpdateProfile={handleUpdateProfile}
                  handleClose={closeProfileViewModeModal}
                />
              </div>
            )}

            {(mode === "avatar" || (isTransitioning && mode === "view")) && (
              <div
                className={`profile-mode ${
                  isTransitioning && mode !== "avatar" ? "absolute inset-0" : ""
                }`}
              >
                <ProfileAvatarMode
                  contentClasses=""
                  avatars={avatars}
                  selectedAvatar={selectedAvatar}
                  isUploading={isUploading}
                  handleFileSelect={handleFileSelect}
                  setSelectedAvatar={setSelectedAvatar}
                  handleBackToView={handleBackToView}
                  handleSaveAvatar={handleSaveAvatar}
                  handleClose={closeProfileViewModeModal}
                  AvatarUploadButton={AvatarUploadButton}
                  AvatarSelectionGrid={AvatarSelectionGrid}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export default ProfileModal;
