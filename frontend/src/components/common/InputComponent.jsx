import React from "react";
import { Form } from "react-bootstrap";

export default function InputComponent(props) {
  const {
    label,
    type = "text",
    name,
    required = false,
    onChange,
    placeholder,
    value,
  } = props;
  return (
    <Form.Group className="mb-4">
      <Form.Label className="fw-semibold">{label}</Form.Label>
      <Form.Control
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={onChange}
        className="rounded-3 shadow-sm"
      ></Form.Control>
    </Form.Group>
  );
}
