import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormInput from "../components/common/FormInput";
import Button from "../components/common/Button";
import useAuthStore from "../stores/authStore";
import { toast } from "react-hot-toast";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const {
    forgotPassword,
    isLoading,
    error: storeError,
    resetError,
  } = useAuthStore();

  useEffect(() => {
    if (storeError) {
      toast.error(storeError);
      resetError();
    }
  }, [storeError, resetError]);

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError("");
  };

  const validateEmail = () => {
    if (!email) {
      setError("Email là bắt buộc");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email không hợp lệ");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    const result = await forgotPassword(email);
    if (result.success) {
      toast.success("Mã OTP đã được gửi tới email của bạn");
      navigate("/reset-password", { state: { email } });
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-base-content">
          Quên mật khẩu
        </h2>
        <p className="mt-2 text-center text-sm text-base-content/70">
          Nhập email của bạn để nhận mã OTP đặt lại mật khẩu
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <FormInput
                label="Email"
                name="email"
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={handleChange}
                error={error}
              />

              <div>
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Gửi mã OTP
                </Button>
              </div>
            </form>

            <div className="divider">Hoặc</div>

            <div className="text-center">
              <Link to="/login" className="btn btn-outline btn-primary btn-sm">
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
