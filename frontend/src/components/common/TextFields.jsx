import React from "react";
import { Controller } from "react-hook-form";

export default function BootstrapTextFields(props) {
  const { name, control, label, placeholder } = props;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <div className="mb-3">
          <label htmlFor={name} className="form-label">
            {label}
          </label>
          <input
            type="text"
            id={name}
            className={`form-control ${error ? "is-invalid" : ""}`}
            placeholder={placeholder}
            value={value || ""}
            onChange={onChange}
          />
          {error && <div className="invalid-feedback">{error.message}</div>}
        </div>
      )}
    />
  );
}
      