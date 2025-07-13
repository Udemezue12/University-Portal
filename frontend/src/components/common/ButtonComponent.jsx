import React from "react";
import { Button, Spinner } from "react-bootstrap";

export const NormalButtonComponent = (props) => {
  const {
    type = "button",
    children,
    onClick,
    variant = "primary",
    className = "",
    ...rest
  } = props;
  return (
    <Button
      type={type}
      variant={variant}
      onClick={onClick}
      className={`rounded-pill px-4 ${className}`}
      {...rest}
    >
      {children}
    </Button>
  );
};

const ButtonComponent = (props) => {
  const [loading, setLoading] = React.useState(false);
  const {
    type = "button",
    onClick,
    children,
    variant = "primary",
    className = "",
    ...rest
  } = props;

  const handleClick = async (e) => {
    if (!onClick) return;
    setLoading(true);
    try {
      await onClick(e);
    } catch (err) {
      console.error("Button action failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type={type}
      onClick={handleClick}
      variant={variant}
      disabled={loading}
      className={`rounded-pill px-4 ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner animation="border" size="sm" className="me-2" />
          Loading...
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default ButtonComponent;
