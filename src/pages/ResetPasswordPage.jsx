import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import FormInput from "../components/common/FormInput";
import Button from "../components/common/Button";
import useAuthStore from "../stores/authStore";
import { useRedirectIfAuthenticated } from "../hooks/useAuth";
import { toast } from "react-hot-toast";

const ResetPasswordPage = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  const { resetPassword, isLoading, error, resetError } = useAuthStore();
  const { isLoading: isCheckingAuth } = useRedirectIfAuthenticated();

  // Nếu không có email, chuyển hướng về trang quên mật khẩu
  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  // Hiển thị thông báo lỗi nếu có
  useEffect(() => {
    if (error) {
      toast.error(error);
      resetError();
    }
  }, [error, resetError]);

  // Xử lý nhập OTP
  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Chỉ lấy ký tự đầu tiên
    newOtp[index] = value.substring(0, 1);
    setOtp(newOtp);

    // Tự động focus vào ô tiếp theo
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Xử lý phím xóa để quay lại ô trước
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số OTP");
      return false;
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "Mật khẩu mới là bắt buộc";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Xác nhận mật khẩu là bắt buộc";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await resetPassword(
      email,
      otp.join(""),
      formData.newPassword
    );
    if (result.success) {
      toast.success("Đặt lại mật khẩu thành công!");
      navigate("/login");
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-base-content">
          Đặt lại mật khẩu
        </h2>
        <p className="mt-2 text-center text-sm text-base-content/70">
          Nhập mã OTP đã được gửi đến email {email}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text font-medium">Mã OTP</span>
                </label>
                <div className="flex justify-center space-x-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="input input-bordered w-12 h-12 text-center text-xl"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>

              <FormInput
                label="Mật khẩu mới"
                name="newPassword"
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={formData.newPassword}
                onChange={handleChange}
                error={errors.newPassword}
              />

              <FormInput
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
              />

              <div>
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Xác nhận
                </Button>
              </div>

              <div className="text-center mt-4">
                <Link to="/login" className="link link-primary">
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
