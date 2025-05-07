import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Button from "../components/common/Button";
import useAuthStore from "../stores/authStore";
import { toast } from "react-hot-toast";
import { useRedirectIfAuthenticated } from "../hooks/useAuth";

const VerifyOTPPage = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  const { verifyOTP, resendOTP, isLoading, error, resetError } = useAuthStore();
  const [resendLoading, setResendLoading] = useState(false);
  const { isLoading: isCheckingAuth } = useRedirectIfAuthenticated();

  // Nếu không có email, chuyển hướng về trang đăng ký
  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  // Hiển thị thông báo lỗi nếu có
  useEffect(() => {
    if (error) {
      toast.error(error);
      resetError();
    }
  }, [error, resetError]);

  // Đếm ngược thời gian có thể gửi lại OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

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

  // Gửi lại mã OTP
  const handleResendOTP = async () => {
    setResendLoading(true);
    const result = await resendOTP(email);
    setResendLoading(false);

    if (result.success) {
      toast.success("Mã OTP đã được gửi lại thành công!");
      setCountdown(60);
      setCanResend(false);
      // Reset các ô OTP
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0].focus();
    }
  };

  // Xác thực OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số OTP");
      return;
    }

    const result = await verifyOTP(email, otpValue);
    if (result.success) {
      toast.success("Xác thực tài khoản thành công!");
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
          Xác thực tài khoản
        </h2>
        <p className="mt-2 text-center text-sm text-base-content/70">
          Nhập mã OTP đã được gửi đến email {email}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="flex justify-center space-x-2 mb-6">
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

              <div>
                <Button
                  type="submit"
                  className="w-full mb-4"
                  isLoading={isLoading}
                >
                  Xác thực
                </Button>
              </div>

              <div className="text-center">
                {canResend ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResendOTP}
                    isLoading={resendLoading}
                  >
                    Gửi lại mã OTP
                  </Button>
                ) : (
                  <p className="text-base-content/70">
                    Gửi lại mã sau {countdown} giây
                  </p>
                )}
              </div>

              <div className="mt-4 text-center">
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

export default VerifyOTPPage;
