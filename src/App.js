import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

// Define the Firebase configuration. REPLACE THIS WITH YOUR ACTUAL FIREBASE CONFIG
const firebaseConfig = {
 apiKey: "AIzaSyBWtsYCF9Za5hHASnrgIZtTCbT-iBUWeW8",
  authDomain: "jobtracker-9c4ad.firebaseapp.com",
  projectId: "jobtracker-9c4ad",
  storageBucket: "jobtracker-9c4ad.firebasestorage.app",
  messagingSenderId: "881941276521",
  appId: "1:881941276521:web:e84e45426ae2dac5563ff8",
  measurementId: "G-3R91XH30M9"
};

const appId = firebaseConfig.projectId; // Using projectId as app identifier for Firestore paths

// Custom Modal Component for Alerts/Confirmations
const CustomModal = ({ message, type, onConfirm, onCancel }) => {
  if (!message) return null;

  const isConfirm = type === 'confirm';
  const isAlert = type === 'alert';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 flex flex-col items-center">
        <p className={`mb-4 text-center text-lg font-semibold ${isAlert ? 'text-blue-700' : 'text-gray-800'}`}>
          {message}
        </p>
        <div className="flex space-x-4">
          {isConfirm && (
            <button
              onClick={onCancel}
              className="px-5 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors duration-200"
            >
              Cancel
            </button>
          )}
          {(isConfirm || isAlert) && (
            <button
              onClick={onConfirm}
              className={`px-5 py-2 ${isConfirm ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg transition-colors duration-200`}
            >
              {isConfirm ? 'Confirm' : 'OK'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// New Job Detail Modal Component
// This component now accepts a 'mode' prop: 'view' or 'edit'
const JobDetailModal = ({ job, mode, onSave, onCancel, showMessage, clearTextContent }) => {
  const [formData, setFormData] = useState(job);

  // Determine if fields should be read-only
  const isViewMode = mode === 'view';

  useEffect(() => {
    // Update form data if the job prop changes (e.g., when viewing/editing a different job)
    setFormData(job);
  }, [job]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewMode) { // If in view mode, submission doesn't make sense
      onCancel(); // Just close the modal
    } else {
      onSave(formData); // Pass the updated form data to the parent's updateJob function
    }
  };

  if (!job) return null; // Don't render if no job is selected

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-auto my-8">
        <h2 className="text-2xl font-bold text-indigo-800 mb-6 text-center">
          {isViewMode ? 'Application Details' : 'Edit Application'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="modalCompany" className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            {isViewMode ? (
              <p className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">{formData.company}</p>
            ) : (
              <input
                type="text"
                id="modalCompany"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                required
              />
            )}
          </div>
          <div>
            <label htmlFor="modalTitle" className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
            {isViewMode ? (
              <p className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">{formData.title}</p>
            ) : (
              <input
                type="text"
                id="modalTitle"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                required
              />
            )}
          </div>
          <div>
            <label htmlFor="modalStatus" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            {isViewMode ? (
              <p className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">{formData.status}</p>
            ) : (
              <select
                id="modalStatus"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              >
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
                <option value="Accepted">Accepted</option>
                <option value="Wishlist">Wishlist</option>
              </select>
            )}
          </div>
          <div>
            <label htmlFor="modalDateApplied" className="block text-sm font-medium text-gray-700 mb-1">Date Applied</label>
            {isViewMode ? (
              <p className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">{formData.dateApplied}</p>
            ) : (
              <input
                type="date"
                id="modalDateApplied"
                name="dateApplied"
                value={formData.dateApplied}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                required
              />
            )}
          </div>
          <div className="md:col-span-2">
            <label htmlFor="modalNotes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            {isViewMode ? (
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap min-h-[50px]">{formData.notes || 'N/A'}</div>
            ) : (
              <textarea
                id="modalNotes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-y"
              ></textarea>
            )}
          </div>

          {/* Job Description (always shown in modal, but read-only in view mode) */}
          <div className="md:col-span-2">
            <label htmlFor="modalJobDescription" className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
            {isViewMode ? (
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap min-h-[100px]">{formData.jobDescription || 'N/A'}</div>
            ) : (
              <textarea
                id="modalJobDescription"
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleChange}
                placeholder="Paste the full job description here..."
                rows="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-y"
              ></textarea>
            )}
          </div>

          {/* Resume Text (always shown in modal, but read-only in view mode) */}
          <div className="md:col-span-1">
            <label htmlFor="modalResumeText" className="block text-sm font-medium text-gray-700 mb-1">Resume Text</label>
            {isViewMode ? (
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap min-h-[100px]">{formData.resumeText || 'N/A'}</div>
            ) : (
              <textarea
                id="modalResumeText"
                name="resumeText"
                value={formData.resumeText}
                onChange={handleChange}
                placeholder="Paste your resume content here..."
                rows="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-y"
              ></textarea>
            )}
            {formData.resumeText && !isViewMode && (
              <button
                type="button"
                onClick={() => clearTextContent('resume', setFormData, formData.id)}
                className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Clear Resume Text
              </button>
            )}
          </div>

          {/* Cover Letter Text (always shown in modal, but read-only in view mode) */}
          <div className="md:col-span-1">
            <label htmlFor="modalCoverLetterText" className="block text-sm font-medium text-gray-700 mb-1">Cover Letter Text</label>
            {isViewMode ? (
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap min-h-[100px]">{formData.coverLetterText || 'N/A'}</div>
            ) : (
              <textarea
                id="modalCoverLetterText"
                name="coverLetterText"
                value={formData.coverLetterText}
                onChange={handleChange}
                placeholder="Paste your cover letter content here..."
                rows="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-y"
              ></textarea>
            )}
            {formData.coverLetterText && !isViewMode && (
              <button
                type="button"
                onClick={() => clearTextContent('coverLetter', setFormData, formData.id)}
                className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Clear Cover Letter Text
              </button>
            )}
          </div>

          <div className="md:col-span-2 flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors duration-200"
            >
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
            {!isViewMode && ( // Only show Save Changes in edit mode
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                Save Changes
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};


const App = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for authentication UI
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // State for the new job application form
  const [newJob, setNewJob] = useState({
    company: '',
    title: '',
    status: 'Applied',
    dateApplied: '',
    notes: '',
    jobDescription: '',
    resumeText: '',
    coverLetterText: '',
  });

  // State for the job currently selected for viewing or editing
  const [selectedJob, setSelectedJob] = useState(null);
  // State to control the mode of the modal: 'view' or 'edit'
  const [modalMode, setModalMode] = useState(null);


  // Custom Modal states (for alerts/confirms)
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('alert'); // 'alert' or 'confirm'
  const [modalResolve, setModalResolve] = useState(null); // Function to resolve the modal promise


  // Function to show custom modal (for alerts/confirms)
  const showModal = (message, type = 'alert') => {
    return new Promise((resolve) => {
      setModalMessage(message);
      setModalType(type);
      setModalResolve(() => resolve);
    });
  };

  const handleModalConfirm = () => {
    if (modalResolve) {
      modalResolve(true);
      setModalMessage('');
      setModalResolve(null);
    }
  };

  const handleModalCancel = () => {
    if (modalResolve) {
      modalResolve(false);
      setModalMessage('');
      setModalResolve(null);
    }
  };


  // Initialize Firebase and set up authentication listener
  useEffect(() => {
    const initFirebase = async () => {
      try {
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const firebaseAuth = getAuth(app);

        setDb(firestore);
        setAuth(firebaseAuth);

        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
          if (user) {
            setUserId(user.uid);
            setUserEmail(user.email);
          } else {
            setUserId(null);
            setUserEmail(null);
            setJobs([]); // Clear jobs on logout
          }
          setLoading(false);
          setError(null);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("Error initializing Firebase:", err);
        setError("Failed to initialize the application. Check your Firebase config.");
        setLoading(false);
      }
    };

    initFirebase();
  }, []);

  // Fetch job data when db and userId are available
  useEffect(() => {
    if (db && userId) {
      setLoading(true);
      setError(null);
      const jobsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/jobApplications`);
      const q = query(jobsCollectionRef, orderBy('dateApplied', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedJobs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dateApplied: (doc.data().dateApplied && typeof doc.data().dateApplied.toDate === 'function')
            ? doc.data().dateApplied.toDate().toISOString().split('T')[0]
            : doc.data().dateApplied,
        }));
        setJobs(fetchedJobs);
        setLoading(false);
      }, (err) => {
        console.error("Firestore error:", err);
        setError("Failed to load job applications. Please try again.");
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setJobs([]);
      setLoading(false);
    }
  }, [db, userId, appId]);

  // Handle changes in the new job form inputs
  const handleNewJobChange = (e) => {
    const { name, value } = e.target;
    setNewJob({ ...newJob, [name]: value });
  };

  // Helper function to clear text content (used in Add and Edit forms/modal)
  const clearTextContent = async (type, setStateFunc, jobId = null) => {
    const confirm = await showModal(`Are you sure you want to clear this ${type} content?`, 'confirm');
    if (!confirm) return;

    if (jobId) { // If a jobId is provided, it means we are clearing content in the modal for an existing job
      setStateFunc(prevFormData => ({
        ...prevFormData,
        [`${type}Text`]: '',
      }));
      // Also update the main jobs list to reflect the change visually without a full reload
      setJobs(prevJobs => prevJobs.map(job =>
        job.id === jobId ? { ...job, [`${type}Text`]: '' } : job
      ));
    } else { // For the new job form
      setStateFunc(prevState => ({
        ...prevState,
        [`${type}Text`]: '',
      }));
    }
    setError(null);
    showModal(`${type.charAt(0).toUpperCase() + type.slice(1)} content cleared successfully!`, 'alert');
  };


  // Add a new job application
  const addJob = async (e) => {
    e.preventDefault();
    if (!db || !userId) {
      showModal("Please sign in to add job applications.", 'alert');
      return;
    }
    if (!newJob.company || !newJob.title || !newJob.dateApplied) {
      setError("Company, Title, and Date Applied are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const jobsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/jobApplications`);
      await addDoc(jobsCollectionRef, {
        company: newJob.company,
        title: newJob.title,
        status: newJob.status,
        dateApplied: new Date(newJob.dateApplied),
        notes: newJob.notes,
        jobDescription: newJob.jobDescription,
        resumeText: newJob.resumeText,
        coverLetterText: newJob.coverLetterText,
        createdAt: serverTimestamp(),
      });
      setNewJob({ // Reset form
        company: '', title: '', status: 'Applied', dateApplied: '', notes: '', jobDescription: '',
        resumeText: '', coverLetterText: '',
      });

      showModal('Job application added successfully!', 'alert');
    } catch (err) {
      console.error("Error adding job:", err);
      setError("Failed to add job application.");
    } finally {
      setLoading(false);
    }
  };

  // Function to open the modal in 'edit' mode
  const startEditing = (job) => {
    setSelectedJob({ ...job }); // Set the job data
    setModalMode('edit');       // Set the modal mode to 'edit'
  };

  // Function to open the modal in 'view' mode
  const startViewing = (job) => {
    setSelectedJob({ ...job }); // Set the job data
    setModalMode('view');       // Set the modal mode to 'view'
  };


  // Update an existing job application (called from modal)
  const updateJob = async (updatedData) => {
    if (!db || !userId || !updatedData || !updatedData.id) {
      showModal("Please sign in to update job applications or no job selected for editing.", 'alert');
      return;
    }
    if (!updatedData.company || !updatedData.title || !updatedData.dateApplied) {
      setError("Company, Title, and Date Applied are required for update.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const jobDocRef = doc(db, `artifacts/${appId}/users/${userId}/jobApplications`, updatedData.id);
      await updateDoc(jobDocRef, {
        company: updatedData.company,
        title: updatedData.title,
        status: updatedData.status,
        dateApplied: new Date(updatedData.dateApplied),
        notes: updatedData.notes,
        jobDescription: updatedData.jobDescription,
        resumeText: updatedData.resumeText,
        coverLetterText: updatedData.coverLetterText,
      });
      setSelectedJob(null); // Close modal
      setModalMode(null);    // Clear modal mode
      showModal('Job application updated successfully!', 'alert');
    } catch (err) {
      console.error("Error updating job:", err);
      setError("Failed to update job application.");
    } finally {
      setLoading(false);
    }
  };

  // Delete a job application
  const deleteJob = async (id) => {
    if (!db || !userId) {
      showModal("Please sign in to delete job applications.", 'alert');
      return;
    }

    const confirm = await showModal("Are you sure you want to delete this job application?", 'confirm');
    if (!confirm) return;

    setLoading(true);
    setError(null);

    try {
      const jobDocRef = doc(db, `artifacts/${appId}/users/${userId}/jobApplications`, id);
      await deleteDoc(jobDocRef);
      showModal('Job application deleted successfully!', 'alert');
    } catch (err) {
      console.error("Error deleting job:", err);
      setError("Failed to delete job application.");
    } finally {
      setLoading(false);
    }
  };

  // Handle user authentication (login/register)
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        showModal('Registration successful! You are now logged in.', 'alert');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showModal('Login successful!', 'alert');
      }
      setEmail('');
      setPassword('');
    } catch (authError) {
      console.error("Authentication error:", authError);
      setError(`Authentication failed: ${authError.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle user logout
  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
      setJobs([]);
      setSelectedJob(null); // Close modal on logout
      setModalMode(null);    // Clear modal mode
      showModal('You have been signed out.', 'alert');
    } catch (err) {
      console.error("Logout error:", err);
      setError(`Logout failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-4 font-sans antialiased">
      <CustomModal
        message={modalMessage}
        type={modalType}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />

      {/* Job Detail/Edit Modal */}
      {selectedJob && modalMode && ( // Render modal if a job is selected and mode is set
        <JobDetailModal
          job={selectedJob}
          mode={modalMode} // Pass the current mode ('view' or 'edit')
          onSave={updateJob}
          onCancel={() => { setSelectedJob(null); setModalMode(null); }} // Close modal
          showMessage={showModal} // Pass showModal for internal modal messages
          clearTextContent={clearTextContent} // Pass clearTextContent
        />
      )}

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 text-center">
          💼 Job Application Tracker
        </h1>

        {/* Authentication Section */}
        {!userId ? (
          <div className="mb-8 p-6 bg-purple-50 rounded-lg shadow-inner">
            <h2 className="text-2xl font-bold text-purple-800 mb-4 text-center">
              {isRegistering ? 'Register Account' : 'Login'}
            </h2>
            <form onSubmit={handleAuth} className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="auth-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 shadow-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="auth-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  id="auth-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 shadow-sm"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  {isRegistering ? 'Register' : 'Login'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="px-6 py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  {isRegistering ? 'Already have an account? Login' : 'New user? Register'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-gray-100 rounded-lg shadow-inner flex flex-col sm:flex-row justify-between items-center">
            <p className="text-md text-gray-700 mb-2 sm:mb-0">
              Logged in as: <span className="font-semibold text-indigo-700">{userEmail || 'N/A'}</span>
            </p>
            <p className="text-sm text-gray-600 break-all mb-2 sm:mb-0">
              User ID: <span className="font-mono text-indigo-600">{userId}</span>
            </p>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Error and Loading Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="ml-3 text-indigo-700">Loading...</p>
          </div>
        )}

        {/* Job Tracker Features (only visible if logged in) */}
        {userId ? (
          <>
            {/* Add New Job Form */}
            <div className="mb-8 p-6 bg-indigo-50 rounded-lg shadow-inner">
              <h2 className="text-2xl font-bold text-indigo-800 mb-4 text-center">Add New Application</h2>
              <form onSubmit={addJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={newJob.company}
                    onChange={handleNewJobChange}
                    placeholder="Company Name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newJob.title}
                    onChange={handleNewJobChange}
                    placeholder="Job Title (e.g., Software Engineer)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={newJob.status}
                    onChange={handleNewJobChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Wishlist">Wishlist</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="dateApplied" className="block text-sm font-medium text-gray-700 mb-1">Date Applied</label>
                  <input
                    type="date"
                    id="dateApplied"
                    name="dateApplied"
                    value={newJob.dateApplied}
                    onChange={handleNewJobChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={newJob.notes}
                    onChange={handleNewJobChange}
                    placeholder="Any relevant notes about the application..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-y"
                  ></textarea>
                </div>

                {/* Job Description for New Job */}
                <div className="md:col-span-2">
                  <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                  <textarea
                    id="jobDescription"
                    name="jobDescription"
                    value={newJob.jobDescription}
                    onChange={handleNewJobChange}
                    placeholder="Paste the full job description here..."
                    rows="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-y"
                  ></textarea>
                </div>

                {/* Resume Text Area for New Job */}
                <div className="md:col-span-1">
                  <label htmlFor="resumeText" className="block text-sm font-medium text-gray-700 mb-1">Resume Text</label>
                  <textarea
                    id="resumeText"
                    name="resumeText"
                    value={newJob.resumeText}
                    onChange={handleNewJobChange}
                    placeholder="Paste your resume content here..."
                    rows="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-y"
                  ></textarea>
                  {newJob.resumeText && (
                    <button
                      type="button"
                      onClick={() => clearTextContent('resume', setNewJob)}
                      className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Clear Resume Text
                    </button>
                  )}
                </div>

                {/* Cover Letter Text Area for New Job */}
                <div className="md:col-span-1">
                  <label htmlFor="coverLetterText" className="block text-sm font-medium text-gray-700 mb-1">Cover Letter Text</label>
                  <textarea
                    id="coverLetterText"
                    name="coverLetterText"
                    value={newJob.coverLetterText}
                    onChange={handleNewJobChange}
                    placeholder="Paste your cover letter content here..."
                    rows="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-y"
                  ></textarea>
                  {newJob.coverLetterText && (
                    <button
                      type="button"
                      onClick={() => clearTextContent('coverLetter', setNewJob)}
                      className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Clear Cover Letter Text
                    </button>
                  )}
                </div>

                <div className="md:col-span-2 text-center">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Add Application
                  </button>
                </div>
              </form>
            </div>

            {/* Job List */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Your Applications</h2>
            {jobs.length === 0 && !loading && (
              <p className="text-center text-gray-600">No job applications added yet. Start by adding one above!</p>
            )}

            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                  {/* Display Job Details (Regular view - only essential info) */}
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{job.title} at {job.company}</h3>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full
                        ${job.status === 'Applied' ? 'bg-blue-100 text-blue-800' : ''}
                        ${job.status === 'Interview' ? 'bg-purple-100 text-purple-800' : ''}
                        ${job.status === 'Offer' ? 'bg-green-100 text-green-800' : ''}
                        ${job.status === 'Rejected' ? 'bg-red-100 text-red-800' : ''}
                        ${job.status === 'Accepted' ? 'bg-teal-100 text-teal-800' : ''}
                        ${job.status === 'Wishlist' ? 'bg-yellow-100 text-yellow-800' : ''}
                      `}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">Applied on: <span className="font-medium">{job.dateApplied}</span></p>
                    {job.notes && (
                      <p className="text-gray-700 text-sm mb-3 whitespace-pre-wrap">{job.notes}</p>
                    )}

                    <div className="flex space-x-2 justify-end mt-4">
                      {/* New View Details Button */}
                      <button
                        onClick={() => startViewing(job)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => startEditing(job)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteJob(job.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-gray-600 mt-8">Please login or register to manage your job applications.</p>
        )}
      </div>
    </div>
  );
};

export default App;
