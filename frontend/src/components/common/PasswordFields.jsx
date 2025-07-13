import React, { useState } from "react";
import { Controller } from "react-hook-form";

export default function BoostrapPasswordFields(props) {
  const { label, name, placeholder, control } = props;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <div className="mb-3">
          <label htmlFor={name} className="form-label">
            {label}
          </label>
          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              id={name}
              className={`form-control${error ? " is-invalid" : ""}`}
              onChange={onChange}
              placeholder={placeholder}
              value={value || ""}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
            {error && <div className="invalid-feedback d-block">{error.message}</div>}
          </div>
        </div>
      )}
    />
  );
}
