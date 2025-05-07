import React, { forwardRef } from "react";

const FormInput = forwardRef(
  (
    {
      label,
      name,
      type = "text",
      placeholder,
      error,
      onChange,
      onBlur,
      value,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className="form-control w-full mb-4">
        {label && (
          <label htmlFor={name} className="label">
            <span className="label-text font-medium">{label}</span>
          </label>
        )}

        <input
          id={name}
          name={name}
          type={type}
          ref={ref}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          value={value}
          className={`input input-bordered w-full ${
            error ? "input-error" : ""
          } ${className}`}
          {...props}
        />

        {error && (
          <label className="label">
            <span className="label-text-alt text-error">{error}</span>
          </label>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export default FormInput;
