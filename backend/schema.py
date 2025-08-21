from datetime import date, datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, confloat, field_validator


class CourseOut(BaseModel):
    id: int
    title: str
    description: str
    lecturer_name: str
    department_name: str
    level_name: str

    class Config:
        form_atrributes = True


class Role(str, Enum):
    STUDENT = "student"
    LECTURER = "lecturer"
    ADMIN = "admin"


class UserBase(BaseModel):
    email: EmailStr
    username: str
    name: str
    role: Role


class UserProfile(BaseModel):
    id: int
    username: str
    email: EmailStr
    name: str
    role: str
    created_at: datetime

    class Config:
        form_atrributes = True


class UserCreate(UserBase):
    password: str


class UserRegisterInput(BaseModel):
    username: str
    email: EmailStr
    password: str
    name: str
    role: str


class UserLoginInput(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    role: str

    class Config:
        from_attributes = True


class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    syllabus_path: Optional[str] = None

    @field_validator("syllabus_path")
    def validate_syllabus_extension(cls, v):
        if v and not v.lower().endswith((".pdf", ".docx")):
            raise ValueError("Syllabus must be a PDF or DOCX file")
        return v


class CourseCreate(CourseBase):
    pass


class CourseResponse(BaseModel):
    id: int
    title: str
    description: str
    grade_point: int
    lecturer_name: Optional[str] = None
    department_name: Optional[str] = None
    level_name: Optional[str] = None
    syllabus_path: Optional[str]

    class Config:
        from_attributes = True


class CourseInEnrollmentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    grade_point: int
    lecturer_name: str
    department_name: str

    class Config:
        from_attributes = True


class CourseCreateResponse(BaseModel):
    status: str
    message: str
    data: CourseResponse


class EnrollmentBase(BaseModel):
    student_id: int
    course_id: int
    status: str = "pending"


class EnrollmentCreate(EnrollmentBase):
    pass


class EnrollCourseBaseResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    grade_point: int
    lecturer_name: Optional[str]
    department_name: Optional[str]

    class Config:
        from_attributes = True


class EnrollmentResponse(BaseModel):
    id: int
    status: str
    course: EnrollCourseBaseResponse

    class Config:
        from_attributes = True


class ApproveCourseInEnrollmentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    grade_point: int
    lecturer_name: Optional[str]
    department_name: Optional[str]

    class Config:
        from_attributes = True


class ApproveEnrollmentResponse(BaseModel):
    id: int
    status: str
    course: ApproveCourseInEnrollmentResponse

    class Config:
        from_attributes = True


# class LecturerInfo(BaseModel):
#     id: int
#     name: str
#     email: str
#     # department: Optional[str]

#     class Config:
#         from_attributes = True


class FacultyBase(BaseModel):
    name: str


class FacultyCreate(FacultyBase):
    pass


class FacultyOut(FacultyBase):
    id: int

    class Config:
        from_attributes = True


class LevelBase(BaseModel):
    name: str
    department_id: int


class LevelCreate(LevelBase):
    pass


class LevelOut(LevelBase):
    id: int
    name: str
    department_id: int

    class Config:
        from_attributes = True


class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    submission_path: Optional[str] = None
    grade: Optional[confloat(ge=0, le=100)] = None
    weight: confloat(ge=0, le=1) = 1.0

    @field_validator("submission_path")
    def validate_submission_extension(cls, v):
        if v and not v.lower().endswith((".pdf", ".docx")):
            raise ValueError("Submission must be a PDF or DOCX file")
        return v


class AssignmentCreate(AssignmentBase):
    student_id: int
    course_id: int
    text_submission: Optional[str] = None


class AssignmentTemplateCreate(BaseModel):
    course_id: int
    title: str
    description: Optional[str]
    weight: float = 1.0


class AssignmentGradeUpdate(BaseModel):
    grade: confloat(ge=0, le=100)


class AssignmentSubmissionInput(BaseModel):
    assignment_id: int
    course_id: int
    text_submission: Optional[str]
    submission_path: Optional[str]


class AssignmentOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    weight: float
    course_title: Optional[str]
    course_id: int
    lecturer_id: int
    submitted: Optional[bool]
    student_name: Optional[str] = None
    submission_path: Optional[str] = None
    grade: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        form_atrributes = True


class AssignmentResponse(AssignmentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    student_id: int
    course_id: int
    graded_by_id: Optional[int] = None
    student: Optional[UserResponse] = None
    graded_by: Optional[UserResponse] = None
    course: Optional[CourseResponse] = None

    class Config:
        from_attributes = True


class SessionMiniOut(BaseModel):
    id: int
    name: str

    class Config:
        form_atrributes = True


class AssignLecturerInput(BaseModel):
    lecturer_id: int
    department_id: int
    level_id: List[int]
    session_id: int


class AssignStudentInput(BaseModel):
    student_id: int
    department_id: int
    level_id: int


class PromoteInput(BaseModel):
    student_id: int


class SessionOut(BaseModel):
    id: int
    name: str
    start_date: date
    end_date: date
    is_active: bool

    class Config:
        form_atrributes = True


class RecommendRequest(BaseModel):
    interests: list[str]


class SyllabusRequest(BaseModel):
    topic: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    name: str
    role: Role
    created_at: datetime
    updated_at: datetime

    class Config:
        form_atrributes = True


class SessionCreate(BaseModel):
    name: str
    start_date: date
    end_date: date


class LecturerInfo(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        form_atrributes = True


# class CourseInfo(BaseModel):
#     id: int
#     title: str
#     description: Optional[str]
#     grade_point: int
#     lecturer: Optional[LecturerInfo]

#     class Config:
#         form_atrributes = True


class CourseInfo(BaseModel):
    id: int
    title: str
    description: Optional[str]
    grade_point: int
    lecturer_name: Optional[str]
    department_name: Optional[str]

    @classmethod
    def from_attributes(cls, obj):
        return cls(
            id=obj.id,
            title=obj.title,
            description=obj.description,
            grade_point=obj.grade_point,
            lecturer_name=obj.lecturer.name if obj.lecturer else "N/A",
            department_name=obj.department.name if obj.department else "N/A",
        )

    class Config:
        from_attributes = True


# class CourseInfo(BaseModel):
# #     id: int
# #     title: str
# #     description: Optional[str]
# #     lecturer: Optional[LecturerInfo]


class AssignmentView(BaseModel):
    id: int
    title: str
    description: Optional[str]
    grade: Optional[float]
    weight: float
    created_at: datetime
    course: CourseInfo

    class Config:
        form_atrributes = True


class EnrollmentView(BaseModel):
    id: int
    course: CourseInfo
    status: str

    class Config:
        form_atrributes = True


class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=2)

    session_id: int
    faculty_id: int


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentResponse(BaseModel):
    id: int
    name: str
    session_name: str
    faculty_name: str

    class Config:
        from_attributes = True


class DepartmentRes(BaseModel):
    id: int
    name: str

    class Config:
        form_atrribute = True


class LevelResponse(BaseModel):
    id: int
    name: str
    department_id: int

    class Config:
        form_atrribute = True


class DepartmentOut(DepartmentBase):
    id: int
    name: str
    session: Optional[SessionOut]
    faculty_id: int

    class Config:
        from_attributes = True


class GPAResponse(BaseModel):
    student: str
    gpa: float
    cgpa: float
    total_credit_units: int
    course_results: List["CourseGrade"]


class CourseGrade(BaseModel):
    course: str
    credit_unit: int
    grade_letter: str
    grade_point: float
    percentage: float


class AssignmentDetailOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    weight: float
    course_id: int
    course_title: str
    lecturer_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SubmittedAssignmentOut(BaseModel):
    submission_id: int
    assignment_id: int
    assignment_title: str
    course_id: int
    course_title: str
    student_id: int
    student_name: str
    text_submission: Optional[str] = None
    submission_path: Optional[str] = None
    submitted_at: datetime

    class Config:
        from_attributes = True


class GradeAssignmentDetailOut(BaseModel):
    submission_id: int
    student_name: str
    assignment_title: str
    course_title: str
    text_submission: Optional[str]
    submission_path: Optional[str]
    submitted_at: datetime

    class Config:
        from_attributes = True


class GradeAssignmentInput(BaseModel):
    submission_id: int = Field(..., gt=0)
    score: float = Field(..., gt=0, lt=101)
    feedback: Optional[str] = None


class StudentResultSchema(BaseModel):
    course: str
    score: float
    grade: str
    grade_point: int
    assignment_id: int


class StudentResultResponse(BaseModel):
    results: List[StudentResultSchema]


class CredentialAttestation(BaseModel):
    credential_id: str
    public_key: str
    device_fingerprint: str


# class StartLoginRequest(BaseModel):
#     username: str


class VerifyLoginRequest(BaseModel):
    credential_id: str


class StudentResultCreate(BaseModel):
    student_id: int
    course_id: int
    exam_score: float


class StudentResultOut(BaseModel):
    id: int
    student_id: int
    student_name: str
    course_id: int
    exam_score: Optional[float] = None
    assignment_score: float
    total_score: Optional[float] = None
    paper_grade: Optional[str] = None
    has_result: bool

    class Config:
        from_attributes = True


class AdminLecturerOut(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class AdminStudentOut(BaseModel):
    id: int
    name: str
    email: str
    level: Optional[str]
    department: Optional[str]

    class Config:
        from_attributes = True


class DepartmentWithLevelsStudents(BaseModel):
    department_name: str
    levels: List[dict]

    class Config:
        from_attributes = True


# .//////////////////////////////


class LecturerCourseResponse(BaseModel):
    id: int
    title: str
    grade_point: int
    department_id: int
    level_id: Optional[int]

    class Config:
        form_atrributes = True


class StudentResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    username: str

    class Config:
        form_atrributes = True


class StudentOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class StudentAddResultOut(BaseModel):
    id: int
    student_id: int
    student: StudentOut
    course_id: int
    exam_score: Optional[float] = None
    assignment_score: float
    total_score: Optional[float] = None
    paper_grade: Optional[str] = None
    has_result: bool

    class Config:
        from_attributes = True


class StudentResultSubmissionSchema(BaseModel):
    student_id: int
    course_id: int
    exam_score: float

    class Config:
        from_attributes = True


class ResultSubmissionResponse(BaseModel):
    status: str
    message: str


class StudentResultView(BaseModel):
    student_id: int
    student_name: str
    exam_score: float
    assignment_score: float
    total_score: float
    paper_grade: str


class StudentResultListResponse(BaseModel):
    results: List[StudentResultView]
