// src/utils/formValidators.js

export const isValidName = (name) => name && name.trim().length >= 2;

export const validateDepartmentForm = ({ name, session_id }) => {
  if (!name || !session_id) {
    return { valid: false, message: "All fields are required." };
  }

  if (!isValidName(name)) {
    return { valid: false, message: "Department name must be at least 2 characters." };
  }

  return { valid: true };
};


// src/utils/formValidators.js

export const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

export const isStrongPassword = (password) =>
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password);

export const isValidPhoneNumber = (phone) => /^[0-9]{10}$/.test(phone);



/**
 * Returns an object like:
 * {
 *   valid: boolean,
 *   message: string
 * }
 */
export const validateRegisterForm = (formData) => {
  if (
    !formData.email ||
    !formData.username ||
    !formData.password ||
    !formData.confirmPassword
  ) {
    return { valid: false, message: "All fields are required." };
  }

  //   if (!isValidName(formData.name)) {
  //     return {
  //       valid: false,
  //       message: "Invalid Name. Please enter a valid name.",
  //     };
  //   }

  if (!isValidEmail(formData.email)) {
    return {
      valid: false,
      message: "Invalid Email. Please enter a valid email.",
    };
  }

  if (!isStrongPassword(formData.password)) {
    return {
      valid: false,
      message:
        "Password must be at least 8 characters, include one uppercase letter, one number, and one special character.",
    };
  }

  if (formData.password !== formData.confirmPassword) {
    return { valid: false, message: "Passwords do not match." };
  }

  // if (!isValidPhoneNumber(formData.phone_number)) {
  //   return {
  //     valid: false,
  //     message: "Invalid Phone Number. Please enter a valid number.",
  //   };
  // }

  return { valid: true, message: "" }; // No need to show a "Validation passed" message
};
