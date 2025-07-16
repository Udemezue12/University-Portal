import React, { useEffect, useState } from "react";
import axios from "axios";
import ButtonComponent from "../../common/ButtonComponent";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { API_URL } from "../../api_route/api";
export default function AssignLecturerToLevelsBySession() {
  const [lecturers, setLecturers] = useState([]);
  const [levels, setLevels] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState({});
  const [selectedSession, setSelectedSession] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    const csrf_token = await fetchFastCsrfToken();
    try {
      const [lectRes, levelRes, deptRes, sessRes] = await Promise.all([
        axios.get(`${API_URL}/lecturers`, {
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
        axios.get(`${API_URL}/school/`, {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        }),
      ]);

      setLecturers(lectRes.data || []);
      setLevels(levelRes.data || []);
      setDepartments(deptRes.data || []);
      setSessions(sessRes.data || []);
    } catch (err) {
      setMessage("Failed to fetch data.");
    }
  };

  const toggleLevel = (lecturerId, levelId) => {
    setSelectedLevels((prev) => {
      const current = prev[lecturerId] || [];
      return {
        ...prev,
        [lecturerId]: current.includes(levelId)
          ? current.filter((id) => id !== levelId)
          : [...current, levelId],
      };
    });
  };

  const assignLevels = async (lecturerId) => {
    const selectedLevelIds = selectedLevels[lecturerId] || [];
    if (!selectedSession) {
      setMessage("Please select a session.");
      return;
    }
    if (selectedLevelIds.length === 0) {
      setMessage("Please select at least one level.");
      return;
    }

    const selectedDepartments = levels
      .filter((lvl) => selectedLevelIds.includes(lvl.id))
      .map((lvl) => lvl.department_id);

    const uniqueDepartmentIds = [...new Set(selectedDepartments)];

    const departmentId = uniqueDepartmentIds[0];

    try {
      const csrf_token = await fetchFastCsrfToken();

      await axios.post(
        `${API_URL}/assign/lecturer`,
        {
          lecturer_id: lecturerId,
          department_id: departmentId,
          level_id: selectedLevelIds,
          session_id: selectedSession,
        },
        {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        }
      );

      setMessage("Lecturer successfully assigned to levels and department.");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.detail || "Failed to assign lecturer.");
    }
  };

  return (
    <div className="container mt-4">
      <h4 className="mb-3 fw-bold text-success">
        Assign Lecturer to Levels (Per Session)
      </h4>
      {message && <div className="alert alert-info">{message}</div>}

      <div className="mb-4">
        <label className="form-label fw-bold">Select Session</label>
        <select
          className="form-select"
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
        >
          <option value="">-- Select Session --</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.start_date} - {s.end_date})
            </option>
          ))}
        </select>
      </div>

      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th>Lecturer</th>
            <th>Email</th>
            <th>Select Levels</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {lecturers.map((lecturer) => (
            <tr key={lecturer.id}>
              <td>{lecturer.name}</td>
              <td>{lecturer.email}</td>
              <td>
                {levels.map((level) => {
                  const dept = departments.find(
                    (d) => d.id === level.department_id
                  );
                  return (
                    <div key={level.id} className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`lvl-${lecturer.id}-${level.id}`}
                        checked={(selectedLevels[lecturer.id] || []).includes(
                          level.id
                        )}
                        onChange={() => toggleLevel(lecturer.id, level.id)}
                      />
                      <label
                        htmlFor={`lvl-${lecturer.id}-${level.id}`}
                        className="form-check-label"
                      >
                        {level.name} ({dept?.name})
                      </label>
                    </div>
                  );
                })}
              </td>
              <td>
                <ButtonComponent
                  label="Assign"
                  onClick={() => assignLevels(lecturer.id)}
                  className="btn btn-success btn-sm"
                >
                  Assign
                </ButtonComponent>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
