import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormInput from "../components/common/FormInput";
import Button from "../components/common/Button";
import useAuthStore from "../stores/authStore";
import { useRedirectIfAuthenticated } from "../hooks/useAuth";
import { toast } from "react-hot-toast";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const { register, isLoading, error, resetError } = useAuthStore();
  const navigate = useNavigate();
  const { isLoading: isCheckingAuth } = useRedirectIfAuthenticated();

  useEffect(() => {
    if (error) {
      toast.error(error);
      resetError();
    }
  }, [error, resetError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = "Họ tên là bắt buộc";

    if (!formData.email) newErrors.email = "Email là bắt buộc";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email không hợp lệ";

    if (!formData.phone) newErrors.phone = "Số điện thoại là bắt buộc";
    else if (!/^[0-9]{10}$/.test(formData.phone))
      newErrors.phone = "Số điện thoại phải có 10 chữ số";

    if (!formData.password) newErrors.password = "Mật khẩu là bắt buộc";
    else if (formData.password.length < 6)
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";

    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Xác nhận mật khẩu là bắt buộc";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const userData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    };

    const result = await register(userData);
    if (result.success) {
      toast.success("Đăng ký thành công! Hãy xác thực OTP để hoàn tất.");
      navigate("/verify-otp", { state: { email: formData.email } });
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
          Đăng ký tài khoản mới
        </h2>
        <p className="mt-2 text-center text-sm text-base-content/70">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="font-medium text-primary hover:text-primary-focus"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <FormInput
                label="Họ tên"
                name="name"
                placeholder="Họ và tên của bạn"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
              />

              <FormInput
                label="Email"
                name="email"
                type="email"
                placeholder="Email của bạn"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />

              <FormInput
                label="Số điện thoại"
                name="phone"
                placeholder="Số điện thoại của bạn"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
              />

              <FormInput
                label="Mật khẩu"
                name="password"
                type="password"
                placeholder="Mật khẩu (ít nhất 6 ký tự)"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
              />

              <FormInput
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
              />

              <div>
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Đăng ký
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
