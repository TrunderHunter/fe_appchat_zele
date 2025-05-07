import React from "react";

const Button = ({
  type = "button",
  children,
  onClick,
  disabled = false,
  className = "",
  variant = "primary",
  isLoading = false,
  size = "md",
  ...props
}) => {
  // daisyUI button variants
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    accent: "btn-accent",
    info: "btn-info",
    success: "btn-success",
    warning: "btn-warning",
    error: "btn-error",
    ghost: "btn-ghost",
    link: "btn-link",
    outline: "btn-outline",
  };

  // daisyUI button sizes
  const sizeClasses = {
    xs: "btn-xs",
    sm: "btn-sm",
    md: "", // default size
    lg: "btn-lg",
  };

  // Combine all classes
  const buttonClasses = `
    btn
    ${variantClasses[variant] || "btn-primary"}
    ${sizeClasses[size] || ""}
    ${isLoading ? "btn-disabled" : ""}
    ${className}
  `;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={buttonClasses}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="loading loading-spinner loading-sm"></span>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
