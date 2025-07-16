// StudentRow.jsx
import React, { useState, useEffect } from "react";
import { Form } from "react-bootstrap";

export function calculateGrade(total) {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 45) return "D";
  return "F";
}

export default function StudentRow({ student, onScoreChange }) {
  const [examScore, setExamScore] = useState(student.exam_score || "");
  const assignmentScore = parseFloat(student.assignment_score || 0);

  const total = parseFloat(examScore || 0) + assignmentScore;
  const grade = calculateGrade(total);

  useEffect(() => {
    if (!student.has_result) {
      onScoreChange(
        student.student_id,
        examScore,
        assignmentScore,
        total,
        grade
      );
    }
  }, [
    examScore,
    onScoreChange,
    student.student_id,
    assignmentScore,
    total,
    grade,
    student.has_result,
  ]);

  return (
    <tr>
      <td>{student.student_name}</td>
      <td>
        {student.has_result ? (
          student.exam_score
        ) : (
          <Form.Control
            type="number"
            min={0}
            max={70}
            value={examScore}
            onChange={(e) => setExamScore(e.target.value)}
          />
        )}
      </td>
      <td>{assignmentScore}</td>
      <td>{total}</td>
      <td>{grade}</td>
    </tr>
  );
}
