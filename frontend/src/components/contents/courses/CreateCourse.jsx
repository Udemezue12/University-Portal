import React, { useEffect, useState } from "react";
import axios from "axios";
import ButtonComponent from "../../common/ButtonComponent";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { API_URL } from "../../api_route/api";
export default function CreateCourse() {
  const [departments, setDepartments] = useState([]);
  const [levels, setLevels] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    grade_point: "",
    department_id: "",
    level_id: "",
  });
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const csrf_token = await fetchFastCsrfToken();
    try {
      const res = await axios.get(`${API_URL}/lecturer/departments`, {
        headers: { "X-CSRF-TOKEN": csrf_token },
        withCredentials: true,
      });
      setDepartments(res.data);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      setMessage("Error loading departments.");
    }
  };

  const fetchLevels = async (deptId) => {
    const csrf_token = await fetchFastCsrfToken();
    try {
      const res = await axios.get(`${API_URL}/lecturer/levels/${deptId}`, {
        headers: { "X-CSRF-TOKEN": csrf_token },
        withCredentials: true,
      });
      setLevels(res.data);
    } catch (err) {
      console.error("Failed to fetch levels:", err);
      setMessage("Error loading levels.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "department_id") {
      setFormData((prev) => ({ ...prev, level_id: "" }));
      fetchLevels(value);
    }
  };

  const handleFileChange = (e) => {
    setSyllabusFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    const {
      title,
      description,
      grade_point,
      department_id,
      level_id,
      syllabus,
    } = formData;
    if (
      !title ||
      !description ||
      !grade_point ||
      !department_id ||
      !level_id ||
      syllabus
    ) {
      setMessage("All fields  are required.");
      return;
    }

    const csrf_token = await fetchFastCsrfToken();
    const data = new FormData();
    data.append("title", title);
    data.append("description", description);
    data.append("grade_point", grade_point);
    data.append("department_id", department_id);
    data.append("level_id", level_id);
    if (syllabusFile) {
      data.append("syllabus", syllabusFile);
    }

    try {
      const res = await axios.post(`${API_URL}/create/course`, data, {
        headers: {
          "X-CSRF-TOKEN": csrf_token,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      setMessage(res.data.message || "Course created successfully.");
      setFormData({
        title: "",
        description: "",
        grade_point: "",
        department_id: "",
        level_id: "",
      });
      setSyllabusFile(null);
      setLevels([]);
    } catch (err) {
      console.error("Course creation error:", err);
      setMessage(err.response?.data?.detail || "Failed to create course.");
    }
  };

  return (
    <div className="container mt-4">
      <h4 className="mb-3 fw-bold text-primary">Create New Course</h4>
      {message && <div className="alert alert-info">{message}</div>}

      <div className="mb-3">
        <label className="form-label fw-bold">Course Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className="form-control"
          placeholder="Enter course title"
        />
      </div>

      <div className="mb-3">
        <label className="form-label fw-bold">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="form-control"
          placeholder="Enter course description"
        />
      </div>

      <div className="mb-3">
        <label className="form-label fw-bold">Grade Point</label>
        <input
          type="number"
          name="grade_point"
          value={formData.grade_point}
          onChange={handleInputChange}
          className="form-control"
          placeholder="Enter grade point"
        />
      </div>

      <div className="mb-3">
        <label className="form-label fw-bold">Select Department</label>
        <select
          name="department_id"
          value={formData.department_id}
          onChange={handleInputChange}
          className="form-select"
        >
          <option value="">-- Select Department --</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label fw-bold">Select Level</label>
        <select
          name="level_id"
          value={formData.level_id}
          onChange={handleInputChange}
          className="form-select"
          disabled={!formData.department_id}
        >
          <option value="">-- Select Level --</option>
          {levels.map((lvl) => (
            <option key={lvl.id} value={lvl.id}>
              {lvl.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label fw-bold">Upload Syllabus (optional)</label>
        <input
          type="file"
          className="form-control"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx"
        />
      </div>

      <ButtonComponent onClick={handleSubmit} className="btn btn-primary">
        Create Course
      </ButtonComponent>
    </div>
  );
}
