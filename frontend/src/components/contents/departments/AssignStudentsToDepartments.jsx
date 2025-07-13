import React, { useEffect, useState } from "react";
import axios from "axios";
import ButtonComponent from "../../common/ButtonComponent";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { API_URL } from './../../api_route/api';

export default function AssignStudentToLevel() {
  const [students, setStudents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const csrf_token = await fetchFastCsrfToken();
    try {
      const [studentsRes, levelsRes, departmentsRes] = await Promise.all([
        axios.get(`${API_URL}/students`, {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        }),
        axios.get(`${API_URL}/levels`, {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        }),
        axios.get(`${API_URL}/departments`, {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        }),
      ]);

      setStudents(studentsRes.data || []);
      setLevels(levelsRes.data || []);
      setDepartments(departmentsRes.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setMessage("Failed to load data.");
    }
  };

  const handleAssign = async () => {
    if (!selectedStudent || !selectedLevel || !selectedDepartment) {
      setMessage("Please select all fields.");
      return;
    }

    const csrf_token = await fetchFastCsrfToken();

    try {
      await axios.post(
        `${API_URL}/assign-student`,
        {
          student_id: selectedStudent,
          level_id: selectedLevel,
          department_id: selectedDepartment,
        },
        {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        }
      );
      setMessage("Student assigned successfully.");
    } catch (err) {
      console.error("Assignment error:", err);
      setMessage(err.response?.data?.detail || "Assignment failed.");
    }
  };

  return (
    <div className="container mt-4">
      <h4 className="mb-3 fw-bold text-primary">
        Assign Student to Department and Level
      </h4>
      {message && <div className="alert alert-info">{message}</div>}

    
      <div className="mb-3">
        <label className="form-label fw-bold">Select Student</label>
        <select
          className="form-select"
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
        >
          <option value="">-- Select Student --</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
      </div>

   
      <div className="mb-3">
        <label className="form-label fw-bold">Select Department</label>
        <select
          className="form-select"
          value={selectedDepartment}
          onChange={(e) => {
            setSelectedDepartment(e.target.value);
            setSelectedLevel(""); 
          }}
        >
          <option value="">-- Select Department --</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      {/* Level Select */}
      <div className="mb-3">
        <label className="form-label fw-bold">Select Level</label>
        <select
          className="form-select"
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          disabled={!selectedDepartment}
        >
          <option value="">-- Select Level --</option>
          {levels
            .filter(
              (level) => level.department_id === parseInt(selectedDepartment)
            )
            .map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
        </select>
      </div>

      
      <ButtonComponent onClick={handleAssign} className="btn btn-success">
        Assign
      </ButtonComponent>
    </div>
  );
}
