from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, UniqueConstraint, Enum, Date, Boolean
from werkzeug.security import generate_password_hash, check_password_hash
from schema import Role
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, date


class User(Base):
    __tablename__ = 'users'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    username = Column(String, unique=True, nullable=False)
    name = Column(String, unique=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    role = Column(Enum(Role), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)
    courses = relationship("Course", back_populates="lecturer")
    enrollments = relationship("Enrollment", back_populates="student")
    student_assignment_submissions = relationship(
        "AssignmentSubmission",
        back_populates="student",
        foreign_keys="AssignmentSubmission.student_id"
    )
    lecturer_assignment_submissions = relationship(
        "AssignmentTemplate",
        back_populates="lecturer",
        foreign_keys="AssignmentTemplate.lecturer_id"
    )

    assigned_departments_student = relationship(
        "StudentDepartment",
        back_populates="student",
        cascade="all, delete-orphan")

    graded_assignments = relationship(
        "AssignmentGrade",
        back_populates="graded_by",
        foreign_keys="AssignmentGrade.graded_by_id"
    )
    credentials = relationship("PasskeyCredential", back_populates="user")

    assigned_departments = relationship(
        "LecturerDepartmentAndLevel",
        back_populates="lecturer",
        cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def normalize(self):
        self.name = self.name.strip().lower()
        self.username = self.username.strip().lower()
        self.email = self.email.strip().lower()


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    grade_point = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    syllabus_path = Column(String, nullable=True)
    department_id = department_id = Column(Integer, ForeignKey(
        "departments.id"), nullable=False)

    lecturer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # assignment_id = Column(Integer, ForeignKey(
    #     "assignment_templates.id"), nullable=False)
    level_id = Column(Integer, ForeignKey("levels.id"))

    lecturer = relationship("User", back_populates="courses")
    department = relationship(
        "Department", back_populates="courses")
    levels = relationship('Level')

    enrollments = relationship(
        "Enrollment",
        back_populates="course",
        cascade="all, delete-orphan"
    )
    assignments = relationship(
        "AssignmentTemplate",
        back_populates="course",
        cascade="all, delete-orphan"
    )


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (
        UniqueConstraint('student_id', 'course_id', name='uix_student_course'),
    )

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    status = Column(String, default="pending")

    student = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


class AssignmentGrade(Base):
    __tablename__ = "assignment_grades"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey(
        "assignment_submissions.id"), nullable=False, unique=True)
    score = Column(Float, nullable=False)  
    # letter_grade = Column(String, nullable=False)  
    feedback = Column(String, nullable=True)

    graded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("AssignmentSubmission", back_populates="grade")
    graded_by = relationship("User")


class AssignmentTemplate(Base):
    __tablename__ = "assignment_templates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    weight = Column(Float, nullable=False, default=1.0)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    lecturer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    lecturer = relationship(
        "User", back_populates="lecturer_assignment_submissions", foreign_keys=[lecturer_id])

    course = relationship("Course", back_populates="assignments")


class Faculty(Base):
    __tablename__ = 'faculties'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    departments = relationship("Department", back_populates="faculty")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey(
        "assignment_templates.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text_submission = Column(String, nullable=True)
    submission_path = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    student = relationship(
        "User", back_populates="student_assignment_submissions", foreign_keys=[student_id])
    grade = relationship(
        "AssignmentGrade", back_populates="submission", uselist=False)

    assignment = relationship("AssignmentTemplate", backref="submissions")


class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    school_sessions = relationship(
        "LecturerDepartmentAndLevel",
        back_populates="session",
        cascade="all, delete-orphan"
    )

    def check_active(self):
        today = date.today()
        return self.start_date <= today <= self.end_date


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    faculty = relationship("Faculty", back_populates="departments")
    faculty_id = Column(Integer, ForeignKey("faculties.id"), nullable=False)

    session = relationship("SessionModel", backref="departments")
    courses = relationship(
        "Course", back_populates="department", cascade="all, delete-orphan")
    lecturer_assignments = relationship(
        "LecturerDepartmentAndLevel",
        back_populates="department",
        cascade="all, delete-orphan")
    levels = relationship(
        "Level", back_populates="department", cascade="all, delete-orphan")
    student_assignments = relationship(
        "StudentDepartment",
        back_populates="department",
        cascade="all, delete-orphan")


class Level(Base):
    __tablename__ = "levels"
    __table_args__ = (
        UniqueConstraint('name', 'department_id', name='uix_level_department'),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    department_id = Column(Integer, ForeignKey(
        "departments.id"), nullable=False)

    department = relationship("Department", back_populates="levels")
    lecturer_assigned_levels = relationship(
        "LecturerDepartmentAndLevel",
        back_populates="level",
        cascade="all, delete-orphan"
    )


class LecturerDepartmentAndLevel(Base):
    __tablename__ = "lecturer_departments"

    id = Column(Integer, primary_key=True, index=True)
    lecturer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    department_id = Column(Integer, ForeignKey(
        "departments.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)

    lecturer = relationship("User", back_populates="assigned_departments")
    department = relationship(
        "Department", back_populates="lecturer_assignments")
    session = relationship("SessionModel", back_populates='school_sessions')
    level_id = Column(Integer, ForeignKey("levels.id"), nullable=False)
    level = relationship("Level", back_populates='lecturer_assigned_levels')


class StudentDepartment(Base):
    __tablename__ = "student_departments"
    __table_args__ = (
        UniqueConstraint('student_id', 'department_id',
                         name='uix_student_department'),
    )

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    department_id = Column(Integer, ForeignKey(
        "departments.id"), nullable=False)

    student = relationship(
        "User", back_populates="assigned_departments_student")
    department = relationship(
        "Department", back_populates="student_assignments")


class StudentLevelProgress(Base):
    __tablename__ = "student_level_progress"
    __table_args__ = (
        UniqueConstraint('student_id', 'session_id',
                         name='uix_student_session_once'),
    )

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    level_id = Column(Integer, ForeignKey("levels.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User")
    level = relationship("Level")
    session = relationship("SessionModel")


class StudentPromotionLog(Base):
    __tablename__ = "student_promotion_logs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    promoted_from_level_id = Column(
        Integer, ForeignKey("levels.id"), nullable=False)
    promoted_to_level_id = Column(
        Integer, ForeignKey("levels.id"), nullable=True)
    promoted_at = Column(DateTime, default=datetime.utcnow)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)

    student = relationship("User")
    from_level = relationship("Level", foreign_keys=[promoted_from_level_id])
    to_level = relationship("Level", foreign_keys=[promoted_to_level_id])
    session = relationship("SessionModel")


class PasskeyCredential(Base):
    __tablename__ = "passkey_credentials"

    id = Column(Integer, primary_key=True)
    credential_id = Column(String, nullable=False)
    public_key = Column(String, nullable=False)
    device_fingerprint = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="credentials")

    __table_args__ = (
        UniqueConstraint("user_id", "credential_id",
                         name="unique_user_credential"),
        UniqueConstraint("user_id", "device_fingerprint",
                         name="unique_user_device"),
        UniqueConstraint("user_id", "public_key",
                         name="unique_user_publickey"),
    )


class StudentResult(Base):
    __tablename__ = 'student_results'
    __table_args__ = (
        UniqueConstraint('student_id', 'course_id', name='uix_student_course_result'),
    )
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    exam_score = Column(Float, nullable=False, default=0.0)
    assignment_score = Column(Float, nullable=False, default=0.0)
    total_score = Column(Float, nullable=False, default=0.0)
    paper_grade = Column(String, nullable=False, default='F')
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User")
    course = relationship("Course")
