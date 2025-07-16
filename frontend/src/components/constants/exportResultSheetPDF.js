import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportResultSheetPDF(students, department, level, course) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(`Result Sheet - ${department} - ${level} - ${course}`, 14, 20);

  const tableData = students.map((student) => [
    student.name,
    student.examScore,
    student.assignmentScore,
    student.total,
    student.grade,
  ]);

  autoTable(doc, {
    head: [["Name", "Exam Score", "Assignment Score", "Total", "Grade"]],
    body: tableData,
    startY: 30,
  });

  doc.save(`ResultSheet_${department}_${level}_${course}.pdf`);
}

export function exportStudentResultPDF(data) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Optional University Name - uncomment and set dynamically if needed
  doc.setFontSize(18);
  doc.text("University of Astrotech", pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(16);
  doc.text(`Student Result Sheet`, pageWidth / 2, 25, { align: "center" });

  doc.setFontSize(12);
  const details = [
    `Name: ${data.student_name}`,
    `Faculty: ${data.faculty}`,
    `Department: ${data.department}`,
    `Level: ${data.level}`,
    `CGPA: ${data.cgpa}`,
    `Class of Degree: ${data.class_of_degree}`,
  ];

  details.forEach((text, index) => {
    doc.text(text, 14, 40 + index * 8);
  });

  const tableData = data.results.map((item) => [
    item.course_name,
    item.assignment_score.toFixed(2),
    item.exam_score.toFixed(2),
    item.total.toFixed(2),
    item.letter_grade,
  ]);

  autoTable(doc, {
    startY: 95,
    head: [
      [
        "Course Name",
        "Assignment Score",
        "Exam Score",
        "Total",
        "Letter Grade",
      ],
    ],
    body: tableData,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: {
      fillColor: [60, 60, 60],
      halign: "center",
      valign: "middle",
      textColor: 255,
    },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 30, halign: "center" },
      3: { cellWidth: 25, halign: "center" },
      4: { cellWidth: 25, halign: "center" },
    },
    theme: "grid",
  });

  const footerY = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(11);
  doc.text("__________________________", 14, footerY);
  doc.text("Registrar's Signature", 14, footerY + 6);

  doc.text("__________________________", pageWidth - 80, footerY);
  doc.text("Date", pageWidth - 60, footerY + 6);

  doc.save(`ResultSheet_${data.student_name}.pdf`);
}
