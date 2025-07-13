import React from "react";
import { useLocation, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import FastLogin from "./components/auth/login";
import StudentRegister from "./components/auth/StudentRegister";
import {
  AuthProtectedRoutes,
  IsAdminProtectedRoutes,
  IsLecturerProtectedRoutes,
  IsStudentProtectedRoutes,
} from "./components/constants/ProtectedRoutes";
import AdminRegister from "./components/auth/AdminRegister";
import LecturerRegister from "./components/auth/LecturerRegister";
import CreateCourse from "./components/contents/courses/CreateCourse";
import AssignmentViewWithSubmit from "./components/contents/assignments/StudentAssignmnetView";
import AssignmentSubmitPage from "./components/contents/assignments/AssignmnetSubmissionPage";
import CreateSession from "./components/contents/sessions/CreateSession";
import CreateFaculty from "./components/contents/courses/CreateFaculty";
import CreateDepartment from "./components/contents/departments/CreateDepartments";
import CreateLevel from "./components/contents/courses/CreateLevel";
import CreateAssignmentForm from "./components/contents/assignments/CreateAssignment";
import SubmittedAssignments from "./components/contents/assignments/SubmittedAssignments";
import GradeAssignment from "./components/contents/assignments/GradeAssignment";
import ViewProfile from "./components/students/ViewProfile";
import ViewAssignments from "./components/students/ViewAssignments";
import AdminStudentAssignments from "./components/contents/enrollments/AdminStudentAssignments";
import AdminStudentDepartments from "./components/contents/enrollments/AdminStudentView";
import ViewDepartmentCourses from "./components/students/ViewDepartments";
import AdminEnrollmentView from "./components/contents/enrollments/AdminEnrollMentView";
import CourseList from "./components/contents/courses/ViewCourses";
import ViewEnrolledCourses from "./components/students/ViewEnrollments";
import EnrollmentList from "./components/contents/enrollments/EnrollmentList";
import CourseRecommendation from "./components/AI/CourseRecommend";
import SyllabusGenerator from "./components/AI/SyllabusGenerator";
import UpdateCourse from "./components/contents/courses/UpdateCourse";
import { GeminiSyllabusGenerator } from "./components/AI/SyllabusGenerator";
import { UnifiedCourseRecommendation } from "./components/AI/CourseRecommend";
import AssignStudentToLevel from "./components/contents/departments/AssignStudentsToDepartments";
import AssignLecturerToLevelsBySession from "./components/contents/departments/AssignLecturersToDepartments";
import Home from "./components/home/Home";
// import ErrorPage from "./components/auth/ErrorPage";
import LecturerGradedAssignments from "./components/contents/assignments/AllGradedStudentAssignments";
import StudentResultSheet from "./components/contents/assignments/StudentResultSheet";
import PasskeyRegister from "./components/passkeys/PasskeyRegister";
import PasskeyLogin from "./components/passkeys/PasskeyLogin";
import UniversityNavbar from "./navbar/Navbar";
import AdminDashboard from "./components/Dashboards/AdminDashboard";
import StudentDashboard from "./components/Dashboards/StudentDashboard";
import LecturerDashboard from "./components/Dashboards/LecturerDashboard";
import Footer from "./components/common/Footer";
import LogoutModal from "./components/auth/logout";
import AutoLogoutManager from './components/auth/autoLogout';

export default function App() {
  const location = useLocation();
  const noNavBar = [
    "/",
    "/login",
    "/student/register",
    "/lecturer/register",
    "/admin/register",
    "/passkey/login",
  ].includes(location.pathname);
  return (
    <AutoLogoutManager>
      <>
        {!noNavBar && <UniversityNavbar />}

        {noNavBar && (
          <Routes>
            <Route path="/login" element={<FastLogin />} />
            <Route path="/" element={<Home />} />
            <Route path="/student/register" element={<StudentRegister />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route path="/lecturer/register" element={<LecturerRegister />} />
            <Route path="/passkey/login" element={<PasskeyLogin />} />
           
          </Routes>
        )}

        {!noNavBar && (
          <div className="container mt-4">
            <Routes>
              <Route element={<AuthProtectedRoutes />}>
                <Route path="/logout" element={<LogoutModal />} />
                <Route path="/passkey/register" element={<PasskeyRegister />} />
                
                <Route path="/profile" element={<ViewProfile />} />

                <Route element={<IsAdminProtectedRoutes />}>
                  <Route path="/session/create" element={<CreateSession />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/faculty/create" element={<CreateFaculty />} />
                  <Route
                    path="/department/create"
                    element={<CreateDepartment />}
                  />
                  <Route path="/levels/create" element={<CreateLevel />} />
                  <Route
                    path="/admin/students/enrollments"
                    element={<AdminEnrollmentView />}
                  />
                  <Route
                    path="/assign/lecturer"
                    element={<AssignLecturerToLevelsBySession />}
                  />
                  <Route
                    path="/assign/student"
                    element={<AssignStudentToLevel />}
                  />
                </Route>

                <Route element={<IsLecturerProtectedRoutes />}>
                  <Route
                    path="/syllabus/generate"
                    element={<SyllabusGenerator />}
                  />
                  <Route
                    path="/gemini/syllabus/generate"
                    element={<GeminiSyllabusGenerator />}
                  />
                  <Route
                    path="/graded/assignments"
                    element={<LecturerGradedAssignments />}
                  />
                  <Route path="/courses/create" element={<CreateCourse />} />
                  <Route
                    path="/lecturer/grade-assignment/:submissionId"
                    element={<GradeAssignment />}
                  />
                  <Route path="/courses" element={<CourseList />} />
                  <Route
                    path="/lecturer/dashboard"
                    element={<LecturerDashboard />}
                  />

                  <Route
                    path="/courses/update/:courseId"
                    element={<UpdateCourse />}
                  />
                  <Route
                    path="/all/assignments"
                    element={<SubmittedAssignments />}
                  />

                  <Route
                    path="/create/assignment"
                    element={<CreateAssignmentForm />}
                  />
                </Route>
                <Route element={<IsStudentProtectedRoutes />}>
                  <Route
                    path="/student/assignments"
                    element={<AssignmentViewWithSubmit />}
                  />
                  <Route
                    path="/assignments/:id/submit"
                    element={<AssignmentSubmitPage />}
                  />
                  <Route
                    path="/student/department-courses"
                    element={<ViewDepartmentCourses />}
                  />
                  <Route
                    path="/student/course/recommend"
                    element={<CourseRecommendation />}
                  />
                  <Route
                    path="/course/recommend"
                    element={<UnifiedCourseRecommendation />}
                  />
                  <Route path="/student/courses" element={<EnrollmentList />} />
                  <Route
                    path="/student/dashboard"
                    element={<StudentDashboard />}
                  />
                </Route>

                {/*  */}
                {/*  */}
                {/*  */}
                {/*  */}
                {/*  */}
                {/*  */}

                <Route
                  path="/student/enrolled-courses"
                  element={<ViewEnrolledCourses />}
                />

                <Route path="/my/results" element={<StudentResultSheet />} />
                <Route
                  path="/admin/student/assignment"
                  element={<AdminStudentAssignments />}
                />
                <Route
                  path="/admin/students/departments"
                  element={<AdminStudentDepartments />}
                />

                <Route
                  path="/student/assignments"
                  element={<ViewAssignments />}
                />
              </Route>
            </Routes>
          </div>
        )}
        <Footer />
      </>
    </AutoLogoutManager>
  );
}
