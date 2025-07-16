import Cookies from "universal-cookie";
export const UserRole = localStorage.getItem("role");
export const UserDepartment = localStorage.getItem("department");

export const role = localStorage.getItem("role");
export const PasskeyRole = localStorage.getItem("role");

export const userId = localStorage.getItem("userId");
export const username = localStorage.getItem("username");

export const cookies = new Cookies();
