import React from "react";
import { Form } from "react-bootstrap";

const SelectComponent = (props) => {
  const {
    name,
    value,
    onChange,
    required = false,
    label,
    options = [],
  } = props;
  return (
    <Form.Group className="mb-4">
      <Form.Label className="fw-semibold">{label}</Form.Label>
      <Form.Select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="rounded-3 shadow-sm"
      >
        <option value="">Select...</option>
        {options.map((opt, i) => (
          <option key={i} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

export default SelectComponent;
