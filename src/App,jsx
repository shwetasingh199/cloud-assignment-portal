import { useEffect, useMemo, useState } from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth, db } from "./firebase";

import "./App.css";


// ======================================================
// HELPERS
// ======================================================

const emptyAssignment = {
  title: "",
  description: "",
  course: "",
  deadline: "",
  maxMarks: 100,
};

const emptySubmission = {
  content: "",
};

function formatDate(value) {
  if (!value) return "No deadline";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "No deadline";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTimeLeft(deadline) {
  if (!deadline) return null;

  const difference = new Date(deadline).getTime() - Date.now();

  if (difference <= 0) {
    return {
      expired: true,
      text: "Deadline passed",
    };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));

  const hours = Math.floor(
    (difference % (1000 * 60 * 60 * 24)) /
      (1000 * 60 * 60)
  );

  const minutes = Math.floor(
    (difference % (1000 * 60 * 60)) /
      (1000 * 60)
  );

  if (days > 0) {
    return {
      expired: false,
      text: `${days}d ${hours}h left`,
    };
  }

  if (hours > 0) {
    return {
      expired: false,
      text: `${hours}h ${minutes}m left`,
    };
  }

  return {
    expired: false,
    text: `${minutes}m left`,
  };
}

function getInitials(name = "") {
  const parts = name.trim().split(" ");

  if (parts.length === 1) {
    return parts[0]?.slice(0, 2).toUpperCase() || "U";
  }

  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
}

function getSubmissionForAssignment(
  submissions,
  assignmentId,
  uid
) {
  return submissions.find(
    (submission) =>
      submission.assignmentId === assignmentId &&
      submission.studentUid === uid
  );
}


// ======================================================
// APP
// ======================================================

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState("dashboard");

  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [authMode, setAuthMode] = useState("login");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [assignmentForm, setAssignmentForm] =
    useState(emptyAssignment);

  const [editingAssignmentId, setEditingAssignmentId] =
    useState(null);

  const [showAssignmentModal, setShowAssignmentModal] =
    useState(false);

  const [selectedAssignment, setSelectedAssignment] =
    useState(null);

  const [submissionForm, setSubmissionForm] =
    useState(emptySubmission);

  const [showSubmissionModal, setShowSubmissionModal] =
    useState(false);

  const [showGradingModal, setShowGradingModal] =
    useState(false);

  const [gradingData, setGradingData] = useState({
    submissionId: "",
    marks: "",
    feedback: "",
  });

  const [search, setSearch] = useState("");

  const [courseFilter, setCourseFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [toast, setToast] = useState("");

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );


  // ======================================================
  // AUTH LISTENER
  // ======================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);

        if (!currentUser) {
          setProfile(null);
          setLoading(false);
          return;
        }

        try {
          const profileRef = doc(
            db,
            "users",
            currentUser.uid
          );

          const profileSnap = await getDoc(profileRef);

          if (profileSnap.exists()) {
            setProfile(profileSnap.data());
          } else {
            const fallbackProfile = {
              name:
                currentUser.displayName ||
                currentUser.email?.split("@")[0] ||
                "User",

              email: currentUser.email || "",

              role: "student",

              createdAt: serverTimestamp(),
            };

            await setDoc(
              profileRef,
              fallbackProfile,
              { merge: true }
            );

            setProfile(fallbackProfile);
          }
        } catch (error) {
          console.error(error);

          setProfile({
            name:
              currentUser.email?.split("@")[0] ||
              "User",

            email: currentUser.email || "",

            role: "student",
          });
        }

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);


  // ======================================================
  // LOAD DATA
  // ======================================================

  useEffect(() => {
    if (!user || !profile) return;

    loadAssignments();
    loadSubmissions();
  }, [user, profile]);


  async function loadAssignments() {
    try {
      const snapshot = await getDocs(
        collection(db, "assignments")
      );

      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      data.sort((a, b) => {
        return (
          new Date(a.deadline || 0).getTime() -
          new Date(b.deadline || 0).getTime()
        );
      });

      setAssignments(data);
    } catch (error) {
      console.error(error);
      showToast("Unable to load assignments");
    }
  }


  async function loadSubmissions() {
    try {
      const snapshot = await getDocs(
        collection(db, "submissions")
      );

      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      setSubmissions(data);
    } catch (error) {
      console.error(error);
      showToast("Unable to load submissions");
    }
  }


  // ======================================================
  // TOAST
  // ======================================================

  function showToast(message) {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 3000);
  }


  // ======================================================
  // AUTH
  // ======================================================

  async function handleAuth(e) {
    e.preventDefault();

    setAuthError("");
    setAuthLoading(true);

    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(
          auth,
          authForm.email,
          authForm.password
        );

        showToast("Login successful");
      } else {
        const result =
          await createUserWithEmailAndPassword(
            auth,
            authForm.email,
            authForm.password
          );

        const profileData = {
          name:
            authForm.name.trim() ||
            authForm.email.split("@")[0],

          email: authForm.email,

          role: authForm.role,

          createdAt: serverTimestamp(),
        };

        await setDoc(
          doc(db, "users", result.user.uid),
          profileData
        );

        setProfile(profileData);

        showToast("Account created successfully");
      }
    } catch (error) {
      console.error(error);

      let message =
        "Something went wrong. Please try again.";

      if (error.code === "auth/invalid-credential") {
        message =
          "Invalid email or password.";
      }

      if (error.code === "auth/email-already-in-use") {
        message =
          "This email is already registered.";
      }

      if (error.code === "auth/weak-password") {
        message =
          "Password must be at least 6 characters.";
      }

      if (error.code === "auth/invalid-email") {
        message =
          "Please enter a valid email address.";
      }

      if (
        error.code ===
        "auth/operation-not-allowed"
      ) {
        message =
          "Enable Email/Password authentication in Firebase Console.";
      }

      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  }


  async function handleLogout() {
    await signOut(auth);

    setUser(null);
    setProfile(null);
    setPage("dashboard");
  }


  // ======================================================
  // ASSIGNMENTS
  // ======================================================

  function openCreateAssignment() {
    setEditingAssignmentId(null);
    setAssignmentForm(emptyAssignment);
    setShowAssignmentModal(true);
  }


  function openEditAssignment(assignment) {
    setEditingAssignmentId(assignment.id);

    setAssignmentForm({
      title: assignment.title || "",
      description: assignment.description || "",
      course: assignment.course || "",
      deadline: assignment.deadline || "",
      maxMarks: assignment.maxMarks || 100,
    });

    setShowAssignmentModal(true);
  }


  async function saveAssignment(e) {
    e.preventDefault();

    if (!assignmentForm.title.trim()) {
      showToast("Enter assignment title");
      return;
    }

    if (!assignmentForm.course.trim()) {
      showToast("Enter course name");
      return;
    }

    if (!assignmentForm.deadline) {
      showToast("Select assignment deadline");
      return;
    }

    try {
      const assignmentData = {
        title: assignmentForm.title.trim(),

        description:
          assignmentForm.description.trim(),

        course: assignmentForm.course.trim(),

        deadline: assignmentForm.deadline,

        maxMarks: Number(
          assignmentForm.maxMarks || 100
        ),

        teacherUid: user.uid,

        teacherName:
          profile?.name || "Teacher",

        updatedAt: serverTimestamp(),
      };


      if (editingAssignmentId) {
        await updateDoc(
          doc(
            db,
            "assignments",
            editingAssignmentId
          ),
          assignmentData
        );

        showToast("Assignment updated");
      } else {
        await addDoc(
          collection(db, "assignments"),
          {
            ...assignmentData,
            createdAt: serverTimestamp(),
          }
        );

        showToast("Assignment created");
      }

      setShowAssignmentModal(false);

      setAssignmentForm(emptyAssignment);

      setEditingAssignmentId(null);

      await loadAssignments();
    } catch (error) {
      console.error(error);
      showToast("Unable to save assignment");
    }
  }


  async function deleteAssignment(id) {
    const confirmed = window.confirm(
      "Delete this assignment?"
    );

    if (!confirmed) return;

    try {
      await deleteDoc(
        doc(db, "assignments", id)
      );

      showToast("Assignment deleted");

      await loadAssignments();
    } catch (error) {
      console.error(error);
      showToast("Unable to delete assignment");
    }
  }


  // ======================================================
  // SUBMISSION
  // ======================================================

  function openSubmission(assignment) {
    const existing = getSubmissionForAssignment(
      submissions,
      assignment.id,
      user.uid
    );

    setSelectedAssignment(assignment);

    setSubmissionForm({
      content: existing?.content || "",
    });

    setShowSubmissionModal(true);
  }


  async function submitAssignment(e) {
    e.preventDefault();

    if (!submissionForm.content.trim()) {
      showToast(
        "Enter your submission or project link"
      );

      return;
    }

    try {
      const existing = getSubmissionForAssignment(
        submissions,
        selectedAssignment.id,
        user.uid
      );

      const now = new Date();

      const deadline = selectedAssignment.deadline
        ? new Date(selectedAssignment.deadline)
        : null;

      const status =
        deadline && now > deadline
          ? "late"
          : "submitted";


      const data = {
        assignmentId:
          selectedAssignment.id,

        assignmentTitle:
          selectedAssignment.title,

        studentUid: user.uid,

        studentName:
          profile?.name || "Student",

        studentEmail:
          profile?.email || user.email,

        content:
          submissionForm.content.trim(),

        status,

        marks:
          existing?.marks ?? null,

        feedback:
          existing?.feedback || "",

        maxMarks:
          Number(
            selectedAssignment.maxMarks || 100
          ),

        submittedAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      };


      if (existing) {
        await updateDoc(
          doc(
            db,
            "submissions",
            existing.id
          ),
          data
        );

        showToast("Submission updated");
      } else {
        await addDoc(
          collection(db, "submissions"),
          data
        );

        showToast("Assignment submitted");
      }

      setShowSubmissionModal(false);

      setSubmissionForm(emptySubmission);

      await loadSubmissions();
    } catch (error) {
      console.error(error);
      showToast("Unable to submit assignment");
    }
  }


  // ======================================================
  // GRADING
  // ======================================================

  function openGrading(submission) {
    setGradingData({
      submissionId: submission.id,

      marks:
        submission.marks === null ||
        submission.marks === undefined
          ? ""
          : submission.marks,

      feedback:
        submission.feedback || "",
    });

    setShowGradingModal(true);
  }


  async function saveGrade(e) {
    e.preventDefault();

    if (gradingData.marks === "") {
      showToast("Enter marks");
      return;
    }

    const submission = submissions.find(
      (item) =>
        item.id === gradingData.submissionId
    );

    if (!submission) return;

    const marks = Number(
      gradingData.marks
    );

    if (
      marks < 0 ||
      marks > Number(submission.maxMarks || 100)
    ) {
      showToast(
        `Marks must be between 0 and ${
          submission.maxMarks || 100
        }`
      );

      return;
    }

    try {
      await updateDoc(
        doc(
          db,
          "submissions",
          gradingData.submissionId
        ),
        {
          marks,

          feedback:
            gradingData.feedback.trim(),

          status: "graded",

          gradedAt: serverTimestamp(),
        }
      );

      showToast("Grade saved");

      setShowGradingModal(false);

      await loadSubmissions();
    } catch (error) {
      console.error(error);
      showToast("Unable to save grade");
    }
  }


  // ======================================================
  // FILTERS
  // ======================================================

  const courses = useMemo(() => {
    const unique = [
      ...new Set(
        assignments
          .map((item) => item.course)
          .filter(Boolean)
      ),
    ];

    return unique;
  }, [assignments]);


  function getStudentStatus(assignment) {
    const submission =
      getSubmissionForAssignment(
        submissions,
        assignment.id,
        user?.uid
      );

    if (submission?.status === "graded") {
      return "graded";
    }

    if (submission) {
      return submission.status === "late"
        ? "late"
        : "submitted";
    }

    if (
      assignment.deadline &&
      new Date(assignment.deadline) < new Date()
    ) {
      return "overdue";
    }

    return "pending";
  }


  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const searchText = search
        .toLowerCase()
        .trim();

      const matchesSearch =
        !searchText ||
        assignment.title
          ?.toLowerCase()
          .includes(searchText) ||
        assignment.course
          ?.toLowerCase()
          .includes(searchText) ||
        assignment.description
          ?.toLowerCase()
          .includes(searchText);

      const matchesCourse =
        courseFilter === "all" ||
        assignment.course === courseFilter;

      const status =
        profile?.role === "student"
          ? getStudentStatus(assignment)
          : "all";

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      return (
        matchesSearch &&
        matchesCourse &&
        matchesStatus
      );
    });
  }, [
    assignments,
    submissions,
    search,
    courseFilter,
    statusFilter,
    profile,
  ]);


  // ======================================================
  // DASHBOARD STATS
  // ======================================================

  const studentStats = useMemo(() => {
    const mySubmissions =
      submissions.filter(
        (item) =>
          item.studentUid === user?.uid
      );

    const graded =
      mySubmissions.filter(
        (item) =>
          item.status === "graded"
      ).length;

    const submitted =
      mySubmissions.filter(
        (item) =>
          item.status === "submitted"
      ).length;

    const late =
      mySubmissions.filter(
        (item) =>
          item.status === "late"
      ).length;

    const pending =
      assignments.filter(
        (assignment) =>
          getStudentStatus(assignment) ===
          "pending"
      ).length;

    return {
      total: assignments.length,
      submitted,
      graded,
      late,
      pending,
    };
  }, [
    assignments,
    submissions,
    user,
  ]);


  const teacherStats = useMemo(() => {
    const ownAssignments =
      assignments.filter(
        (item) =>
          item.teacherUid === user?.uid
      );

    const assignmentIds =
      new Set(
        ownAssignments.map(
          (item) => item.id
        )
      );

    const received =
      submissions.filter(
        (item) =>
          assignmentIds.has(
            item.assignmentId
          )
      );

    const graded =
      received.filter(
        (item) =>
          item.status === "graded"
      );

    return {
      assignments:
        ownAssignments.length,

      submissions:
        received.length,

      graded:
        graded.length,

      pending:
        received.length -
        graded.length,
    };
  }, [
    assignments,
    submissions,
    user,
  ]);


  // ======================================================
  // DARK MODE
  // ======================================================

  useEffect(() => {
    localStorage.setItem(
      "darkMode",
      darkMode
    );
  }, [darkMode]);


  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading portal...</p>
      </div>
    );
  }


  // ======================================================
  // AUTH SCREEN
  // ======================================================

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <div className="brand-large">
            <div className="brand-icon">
              🎓
            </div>

            <div>
              <h1>EduSubmit</h1>
              <p>
                Assignment & Feedback Portal
              </p>
            </div>
          </div>

          <div className="auth-info">
            <h2>
              Simple assignment management.
            </h2>

            <p>
              Create assignments, submit work,
              track deadlines and manage feedback
              from one place.
            </p>

            <div className="feature-list">
              <div>
                ✓ Easy assignment submission
              </div>

              <div>
                ✓ Deadline tracking
              </div>

              <div>
                ✓ Teacher feedback
              </div>

              <div>
                ✓ Student progress tracking
              </div>
            </div>
          </div>
        </div>


        <div className="auth-card-wrapper">
          <form
            className="auth-card"
            onSubmit={handleAuth}
          >
            <div className="mobile-brand">
              🎓 EduSubmit
            </div>

            <h2>
              {authMode === "login"
                ? "Welcome back"
                : "Create account"}
            </h2>

            <p className="auth-subtitle">
              {authMode === "login"
                ? "Sign in to continue"
                : "Create your portal account"}
            </p>


            {authMode === "register" && (
              <>
                <label>Full Name</label>

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={authForm.name}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      name: e.target.value,
                    })
                  }
                  required
                />


                <label>Role</label>

                <select
                  value={authForm.role}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      role: e.target.value,
                    })
                  }
                >
                  <option value="student">
                    Student
                  </option>

                  <option value="teacher">
                    Teacher
                  </option>
                </select>
              </>
            )}


            <label>Email</label>

            <input
              type="email"
              placeholder="you@example.com"
              value={authForm.email}
              onChange={(e) =>
                setAuthForm({
                  ...authForm,
                  email: e.target.value,
                })
              }
              required
            />


            <label>Password</label>

            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({
                  ...authForm,
                  password: e.target.value,
                })
              }
              required
            />


            {authError && (
              <div className="auth-error">
                {authError}
              </div>
            )}


            <button
              className="primary-btn full-btn"
              disabled={authLoading}
            >
              {authLoading
                ? "Please wait..."
                : authMode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>


            <div className="auth-switch">
              {authMode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}

              <button
                type="button"
                onClick={() => {
                  setAuthMode(
                    authMode === "login"
                      ? "register"
                      : "login"
                  );

                  setAuthError("");
                }}
              >
                {authMode === "login"
                  ? "Register"
                  : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }


  // ======================================================
  // SIDEBAR
  // ======================================================

  const navItems = [
    {
      id: "dashboard",
      icon: "▦",
      label: "Dashboard",
    },

    {
      id: "assignments",
      icon: "📝",
      label: "Assignments",
    },

    ...(profile?.role === "teacher"
      ? [
          {
            id: "submissions",
            icon: "📥",
            label: "Submissions",
          },
        ]
      : []),

    {
      id: "profile",
      icon: "👤",
      label: "Profile",
    },
  ];


  // ======================================================
  // MAIN APP
  // ======================================================

  return (
    <div
      className={
        darkMode
          ? "app dark-mode"
          : "app"
      }
    >

      {toast && (
        <div className="toast">
          ✓ {toast}
        </div>
      )}


      <aside className="sidebar">

        <div className="sidebar-brand">
          <div className="sidebar-logo">
            🎓
          </div>

          <div>
            <strong>EduSubmit</strong>
            <span>Portal</span>
          </div>
        </div>


        <div className="sidebar-user">
          <div className="avatar">
            {getInitials(profile?.name)}
          </div>

          <div>
            <strong>
              {profile?.name ||
                user.email}
            </strong>

            <span>
              {profile?.role === "teacher"
                ? "Teacher"
                : "Student"}
            </span>
          </div>
        </div>


        <nav className="sidebar-nav">
          <div className="nav-heading">
            MAIN MENU
          </div>

          {navItems.map((item) => (
            <button
              key={item.id}
              className={
                page === item.id
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() =>
                setPage(item.id)
              }
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              {item.label}
            </button>
          ))}
        </nav>


        <div className="sidebar-bottom">

          <button
            className="nav-item"
            onClick={() =>
              setDarkMode(!darkMode)
            }
          >
            <span className="nav-icon">
              {darkMode ? "☀️" : "🌙"}
            </span>

            {darkMode
              ? "Light Mode"
              : "Dark Mode"}
          </button>


          <button
            className="nav-item logout-btn"
            onClick={handleLogout}
          >
            <span className="nav-icon">
              ⇥
            </span>

            Logout
          </button>

        </div>
      </aside>


      <main className="main-content">

        <header className="topbar">

          <div>
            <h2>
              {page === "dashboard"
                ? "Dashboard"
                : page === "assignments"
                ? "Assignments"
                : page === "submissions"
                ? "Submissions"
                : "My Profile"}
            </h2>

            <p>
              {page === "dashboard"
                ? `Welcome back, ${
                    profile?.name ||
                    "User"
                  }`
                : "Manage your academic work"}
            </p>
          </div>


          <div className="topbar-right">

            <div className="top-role">
              {profile?.role === "teacher"
                ? "👨‍🏫 Teacher"
                : "🎓 Student"}
            </div>

            <div className="top-avatar">
              {getInitials(
                profile?.name
              )}
            </div>

          </div>

        </header>


        <div className="content-area">

          {/* ==================================================
              DASHBOARD
          ================================================== */}

          {page === "dashboard" && (
            <>
              <div className="welcome-banner">
                <div>
                  <span className="banner-small">
                    {profile?.role ===
                    "teacher"
                      ? "TEACHER PORTAL"
                      : "STUDENT PORTAL"}
                  </span>

                  <h1>
                    Hello,{" "}
                    {profile?.name ||
                      "there"}{" "}
                    👋
                  </h1>

                  <p>
                    {profile?.role ===
                    "teacher"
                      ? "Create assignments, review submissions and give feedback."
                      : "Stay on top of your assignments and deadlines."}
                  </p>
                </div>

                <div className="banner-icon">
                  🎓
                </div>
              </div>


              <div className="stats-grid">

                {profile?.role ===
                "teacher" ? (
                  <>
                    <StatCard
                      icon="📝"
                      title="Assignments"
                      value={
                        teacherStats.assignments
                      }
                      subtitle="Created by you"
                    />

                    <StatCard
                      icon="📥"
                      title="Submissions"
                      value={
                        teacherStats.submissions
                      }
                      subtitle="Received"
                    />

                    <StatCard
                      icon="✓"
                      title="Graded"
                      value={
                        teacherStats.graded
                      }
                      subtitle="Completed"
                    />

                    <StatCard
                      icon="⏳"
                      title="To Review"
                      value={
                        teacherStats.pending
                      }
                      subtitle="Awaiting grading"
                    />
                  </>
                ) : (
                  <>
                    <StatCard
                      icon="📚"
                      title="Total"
                      value={
                        studentStats.total
                      }
                      subtitle="Assignments"
                    />

                    <StatCard
                      icon="⏳"
                      title="Pending"
                      value={
                        studentStats.pending
                      }
                      subtitle="Need submission"
                    />

                    <StatCard
                      icon="✓"
                      title="Submitted"
                      value={
                        studentStats.submitted
                      }
                      subtitle="Awaiting grade"
                    />

                    <StatCard
                      icon="🏆"
                      title="Graded"
                      value={
                        studentStats.graded
                      }
                      subtitle="Completed"
                    />
                  </>
                )}

              </div>


              <div className="section-header">
                <div>
                  <h3>
                    {profile?.role ===
                    "teacher"
                      ? "Recent Assignments"
                      : "Upcoming Assignments"}
                  </h3>

                  <p>
                    Keep track of your latest
                    academic activity.
                  </p>
                </div>

                <button
                  className="text-btn"
                  onClick={() =>
                    setPage("assignments")
                  }
                >
                  View all →
                </button>
              </div>


              <div className="assignment-grid">

                {assignments
                  .slice(0, 4)
                  .map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={
                        assignment
                      }
                      role={
                        profile?.role
                      }
                      status={
                        profile?.role ===
                        "student"
                          ? getStudentStatus(
                              assignment
                            )
                          : null
                      }
                      submission={
                        profile?.role ===
                        "student"
                          ? getSubmissionForAssignment(
                              submissions,
                              assignment.id,
                              user.uid
                            )
                          : null
                      }
                      onSubmit={() =>
                        openSubmission(
                          assignment
                        )
                      }
                      onEdit={() =>
                        openEditAssignment(
                          assignment
                        )
                      }
                      onDelete={() =>
                        deleteAssignment(
                          assignment.id
                        )
                      }
                    />
                  ))}

                {assignments.length ===
                  0 && (
                  <EmptyState
                    message={
                      profile?.role ===
                      "teacher"
                        ? "Create your first assignment."
                        : "No assignments available yet."
                    }
                  />
                )}

              </div>
            </>
          )}


          {/* ==================================================
              ASSIGNMENTS
          ================================================== */}

          {page === "assignments" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>
                    Assignments
                  </h1>

                  <p>
                    Search and manage
                    assignments.
                  </p>
                </div>

                {profile?.role ===
                  "teacher" && (
                  <button
                    className="primary-btn"
                    onClick={
                      openCreateAssignment
                    }
                  >
                    + Create Assignment
                  </button>
                )}
              </div>


              <div className="filters">

                <div className="search-box">
                  🔍

                  <input
                    placeholder="Search assignments..."
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                  />
                </div>


                <select
                  value={courseFilter}
                  onChange={(e) =>
                    setCourseFilter(
                      e.target.value
                    )
                  }
                >
                  <option value="all">
                    All Courses
                  </option>

                  {courses.map(
                    (course) => (
                      <option
                        key={course}
                        value={course}
                      >
                        {course}
                      </option>
                    )
                  )}
                </select>


                {profile?.role ===
                  "student" && (
                  <select
                    value={
                      statusFilter
                    }
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value
                      )
                    }
                  >
                    <option value="all">
                      All Status
                    </option>

                    <option value="pending">
                      Pending
                    </option>

                    <option value="submitted">
                      Submitted
                    </option>

                    <option value="late">
                      Late
                    </option>

                    <option value="graded">
                      Graded
                    </option>

                    <option value="overdue">
                      Overdue
                    </option>
                  </select>
                )}

              </div>


              <div className="assignment-grid">

                {filteredAssignments.map(
                  (assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={
                        assignment
                      }
                      role={
                        profile?.role
                      }
                      status={
                        profile?.role ===
                        "student"
                          ? getStudentStatus(
                              assignment
                            )
                          : null
                      }
                      submission={
                        profile?.role ===
                        "student"
                          ? getSubmissionForAssignment(
                              submissions,
                              assignment.id,
                              user.uid
                            )
                          : null
                      }
                      onSubmit={() =>
                        openSubmission(
                          assignment
                        )
                      }
                      onEdit={() =>
                        openEditAssignment(
                          assignment
                        )
                      }
                      onDelete={() =>
                        deleteAssignment(
                          assignment.id
                        )
                      }
                    />
                  )
                )}

                {filteredAssignments.length ===
                  0 && (
                  <EmptyState
                    message="No assignments match your search."
                  />
                )}

              </div>
            </>
          )}


          {/* ==================================================
              TEACHER SUBMISSIONS
          ================================================== */}

          {page === "submissions" &&
            profile?.role ===
              "teacher" && (
              <>
                <div className="page-heading">
                  <div>
                    <h1>
                      Student Submissions
                    </h1>

                    <p>
                      Review work and provide
                      marks and feedback.
                    </p>
                  </div>
                </div>


                <div className="submission-list">

                  {submissions.length ===
                    0 && (
                    <EmptyState
                      message="No submissions received yet."
                    />
                  )}


                  {submissions.map(
                    (submission) => (
                      <div
                        className="submission-card"
                        key={
                          submission.id
                        }
                      >

                        <div className="submission-main">

                          <div className="student-avatar">
                            {getInitials(
                              submission.studentName
                            )}
                          </div>

                          <div>
                            <h3>
                              {
                                submission.assignmentTitle
                              }
                            </h3>

                            <p>
                              {
                                submission.studentName
                              }{" "}
                              •{" "}
                              {
                                submission.studentEmail
                              }
                            </p>

                            <div className="submission-content">
                              {
                                submission.content
                              }
                            </div>
                          </div>

                        </div>


                        <div className="submission-side">

                          <StatusBadge
                            status={
                              submission.status
                            }
                          />

                          {submission.marks !==
                            null &&
                            submission.marks !==
                              undefined && (
                              <div className="marks-display">
                                <strong>
                                  {
                                    submission.marks
                                  }
                                </strong>
                                /
                                {
                                  submission.maxMarks ||
                                  100
                                }
                              </div>
                            )}


                          <button
                            className="secondary-btn"
                            onClick={() =>
                              openGrading(
                                submission
                              )
                            }
                          >
                            {submission.status ===
                            "graded"
                              ? "Edit Grade"
                              : "Grade"}
                          </button>

                        </div>

                      </div>
                    )
                  )}

                </div>
              </>
            )}


          {/* ==================================================
              PROFILE
          ================================================== */}

          {page === "profile" && (
            <div className="profile-page">

              <div className="profile-header">

                <div className="profile-avatar">
                  {getInitials(
                    profile?.name
                  )}
                </div>

                <div>
                  <h1>
                    {profile?.name}
                  </h1>

                  <p>
                    {profile?.email}
                  </p>

                  <span className="role-badge">
                    {profile?.role ===
                    "teacher"
                      ? "Teacher"
                      : "Student"}
                  </span>
                </div>

              </div>


              <div className="profile-grid">

                <div className="profile-card">
                  <h3>
                    Personal Information
                  </h3>

                  <div className="profile-row">
                    <span>
                      Full Name
                    </span>

                    <strong>
                      {profile?.name ||
                        "Not available"}
                    </strong>
                  </div>

                  <div className="profile-row">
                    <span>
                      Email
                    </span>

                    <strong>
                      {profile?.email ||
                        user.email}
                    </strong>
                  </div>

                  <div className="profile-row">
                    <span>
                      Role
                    </span>

                    <strong>
                      {profile?.role ===
                      "teacher"
                        ? "Teacher"
                        : "Student"}
                    </strong>
                  </div>
                </div>


                <div className="profile-card">
                  <h3>
                    Account Overview
                  </h3>

                  <div className="mini-stat">
                    <strong>
                      {assignments.length}
                    </strong>

                    <span>
                      Total Assignments
                    </span>
                  </div>

                  <div className="mini-stat">
                    <strong>
                      {submissions.filter(
                        (item) =>
                          item.studentUid ===
                          user.uid
                      ).length}
                    </strong>

                    <span>
                      My Submissions
                    </span>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>


      {/* ======================================================
          ASSIGNMENT MODAL
      ====================================================== */}

      {showAssignmentModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowAssignmentModal(false)
          }
        >
          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">
              <div>
                <h2>
                  {editingAssignmentId
                    ? "Edit Assignment"
                    : "Create Assignment"}
                </h2>

                <p>
                  Add assignment details
                  and choose a deadline.
                </p>
              </div>

              <button
                className="close-btn"
                onClick={() =>
                  setShowAssignmentModal(
                    false
                  )
                }
              >
                ×
              </button>
            </div>


            <form
              onSubmit={saveAssignment}
              className="modal-form"
            >

              <label>
                Assignment Title
              </label>

              <input
                type="text"
                placeholder="e.g. Machine Learning Project"
                value={
                  assignmentForm.title
                }
                onChange={(e) =>
                  setAssignmentForm({
                    ...assignmentForm,
                    title:
                      e.target.value,
                  })
                }
                required
              />


              <label>
                Description
              </label>

              <textarea
                placeholder="Describe the assignment..."
                value={
                  assignmentForm.description
                }
                onChange={(e) =>
                  setAssignmentForm({
                    ...assignmentForm,
                    description:
                      e.target.value,
                  })
                }
                rows="4"
              />


              <div className="form-two-columns">

                <div>
                  <label>
                    Course
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. Cloud Computing"
                    value={
                      assignmentForm.course
                    }
                    onChange={(e) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        course:
                          e.target.value,
                      })
                    }
                    required
                  />
                </div>


                <div>
                  <label>
                    Maximum Marks
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      assignmentForm.maxMarks
                    }
                    onChange={(e) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        maxMarks:
                          e.target.value,
                      })
                    }
                    required
                  />
                </div>

              </div>


              {/* IMPORTANT CALENDAR FIELD */}

              <label>
                Deadline
              </label>

              <div className="deadline-input-wrapper">

                <input
                  type="datetime-local"
                  value={
                    assignmentForm.deadline
                  }
                  onChange={(e) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      deadline:
                        e.target.value,
                    })
                  }
                  required
                />

                <span className="calendar-icon">
                  📅
                </span>

              </div>


              {assignmentForm.deadline && (
                <div className="deadline-preview">
                  📅 Deadline:{" "}
                  <strong>
                    {formatDateTime(
                      assignmentForm.deadline
                    )}
                  </strong>
                </div>
              )}


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    setShowAssignmentModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                >
                  {editingAssignmentId
                    ? "Update Assignment"
                    : "Create Assignment"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}


      {/* ======================================================
          SUBMISSION MODAL
      ====================================================== */}

      {showSubmissionModal &&
        selectedAssignment && (
          <div
            className="modal-overlay"
            onClick={() =>
              setShowSubmissionModal(
                false
              )
            }
          >
            <div
              className="modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="modal-header">
                <div>
                  <h2>
                    Submit Assignment
                  </h2>

                  <p>
                    {
                      selectedAssignment.title
                    }
                  </p>
                </div>

                <button
                  className="close-btn"
                  onClick={() =>
                    setShowSubmissionModal(
                      false
                    )
                  }
                >
                  ×
                </button>
              </div>


              <div className="assignment-detail-box">

                <div>
                  <span>
                    Course
                  </span>

                  <strong>
                    {
                      selectedAssignment.course
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Deadline
                  </span>

                  <strong>
                    {formatDateTime(
                      selectedAssignment.deadline
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Maximum Marks
                  </span>

                  <strong>
                    {
                      selectedAssignment.maxMarks
                    }
                  </strong>
                </div>

              </div>


              <form
                onSubmit={
                  submitAssignment
                }
                className="modal-form"
              >

                <label>
                  Your Submission
                </label>

                <textarea
                  rows="8"
                  placeholder="Paste your answer, project description, GitHub link, deployment link, etc."
                  value={
                    submissionForm.content
                  }
                  onChange={(e) =>
                    setSubmissionForm({
                      content:
                        e.target.value,
                    })
                  }
                  required
                />


                <p className="form-hint">
                  File upload is not used in
                  this simplified version.
                  You can paste a GitHub,
                  Google Drive or project link
                  here.
                </p>


                <div className="modal-actions">

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() =>
                      setShowSubmissionModal(
                        false
                      )
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-btn"
                  >
                    Submit Assignment
                  </button>

                </div>

              </form>

            </div>
          </div>
        )}


      {/* ======================================================
          GRADING MODAL
      ====================================================== */}

      {showGradingModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowGradingModal(false)
          }
        >
          <div
            className="modal small-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">
              <div>
                <h2>
                  Grade Submission
                </h2>

                <p>
                  Add marks and feedback.
                </p>
              </div>

              <button
                className="close-btn"
                onClick={() =>
                  setShowGradingModal(
                    false
                  )
                }
              >
                ×
              </button>
            </div>


            <form
              onSubmit={saveGrade}
              className="modal-form"
            >

              <label>
                Marks
              </label>

              <input
                type="number"
                min="0"
                value={
                  gradingData.marks
                }
                onChange={(e) =>
                  setGradingData({
                    ...gradingData,
                    marks:
                      e.target.value,
                  })
                }
                required
              />


              <label>
                Feedback
              </label>

              <textarea
                rows="6"
                placeholder="Write feedback for the student..."
                value={
                  gradingData.feedback
                }
                onChange={(e) =>
                  setGradingData({
                    ...gradingData,
                    feedback:
                      e.target.value,
                  })
                }
              />


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    setShowGradingModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                >
                  Save Grade
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}


// ======================================================
// STAT CARD
// ======================================================

function StatCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div className="stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {subtitle}
        </small>
      </div>

    </div>
  );
}


// ======================================================
// ASSIGNMENT CARD
// ======================================================

function AssignmentCard({
  assignment,
  role,
  status,
  submission,
  onSubmit,
  onEdit,
  onDelete,
}) {
  const timeLeft =
    getTimeLeft(
      assignment.deadline
    );

  return (
    <div className="assignment-card">

      <div className="assignment-card-top">

        <div className="course-icon">
          📚
        </div>

        {role === "student" && (
          <StatusBadge
            status={status}
          />
        )}

      </div>


      <div className="assignment-card-body">

        <span className="course-name">
          {assignment.course}
        </span>

        <h3>
          {assignment.title}
        </h3>

        <p>
          {assignment.description ||
            "No description provided."}
        </p>

      </div>


      <div className="assignment-meta">

        <div>
          <span>
            📅 Deadline
          </span>

          <strong>
            {formatDate(
              assignment.deadline
            )}
          </strong>
        </div>


        <div>
          <span>
            🕐 Time
          </span>

          <strong>
            {timeLeft?.expired
              ? "Expired"
              : timeLeft?.text ||
                "No deadline"}
          </strong>
        </div>


        <div>
          <span>
            🎯 Marks
          </span>

          <strong>
            {assignment.maxMarks ||
              100}
          </strong>
        </div>

      </div>


      {role === "student" &&
        submission?.marks !==
          null &&
        submission?.marks !==
          undefined && (
          <div className="grade-result">
            <span>
              Your Grade
            </span>

            <strong>
              {submission.marks}/
              {submission.maxMarks ||
                assignment.maxMarks ||
                100}
            </strong>
          </div>
        )}


      {role === "student" && (
        <button
          className="primary-btn full-btn"
          onClick={onSubmit}
        >
          {submission
            ? "Update Submission"
            : "Submit Assignment"}
        </button>
      )}


      {role === "teacher" && (
        <div className="card-actions">

          <button
            className="secondary-btn"
            onClick={onEdit}
          >
            Edit
          </button>

          <button
            className="danger-btn"
            onClick={onDelete}
          >
            Delete
          </button>

        </div>
      )}

    </div>
  );
}


// ======================================================
// STATUS BADGE
// ======================================================

function StatusBadge({ status }) {
  const labels = {
    pending: "Pending",
    submitted: "Submitted",
    late: "Late",
    graded: "Graded",
    overdue: "Overdue",
  };

  return (
    <span
      className={`status-badge ${
        status || "pending"
      }`}
    >
      {status === "graded"
        ? "✓ "
        : status === "late"
        ? "⚠ "
        : status === "overdue"
        ? "!"
        : ""}

      {labels[status] ||
        status ||
        "Pending"}
    </span>
  );
}


// ======================================================
// EMPTY STATE
// ======================================================

function EmptyState({
  message,
}) {
  return (
    <div className="empty-state">

      <div className="empty-icon">
        📭
      </div>

      <h3>
        Nothing here yet
      </h3>

      <p>
        {message}
      </p>

    </div>
  );
}