import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword, // For user registration
  signInWithEmailAndPassword,     // For user login
  signOut,                        // For user logout
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

// For Firestore collection path, we'll use the projectId as a unique app identifier
const appId = firebaseConfig.projectId;

// Main App component for the Job Tracker
const App = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null); // User ID from Firebase Auth
  const [userEmail, setUserEmail] = useState(null); // User email for display
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for authentication UI
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Toggle between login/register

  // State for the new job application form
  const [newJob, setNewJob] = useState({
    company: '',
    title: '',
    status: 'Applied',
    dateApplied: '',
    notes: '',
  });

  // State for editing an existing job application
  const [editingJob, setEditingJob] = useState(null);

  // Initialize Firebase and set up authentication listener
  useEffect(() => {
    const initFirebase = async () => {
      try {
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const firebaseAuth = getAuth(app);

        setDb(firestore);
        setAuth(firebaseAuth);

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
          if (user) {
            setUserId(user.uid);
            setUserEmail(user.email); // Set email if available
            setLoading(false); // Auth state determined
          } else {
            // No user signed in, clear user data and indicate not loading
            setUserId(null);
            setUserEmail(null);
            setLoading(false);
          }
          setError(null); // Clear auth-related errors on state change
        });

        return () => unsubscribe(); // Cleanup auth listener on unmount
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
      // Construct the collection path for private user data
      const jobsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/jobApplications`);
      // Create a query to order jobs by dateApplied (descending)
      const q = query(jobsCollectionRef, orderBy('dateApplied', 'desc'));

      // Subscribe to real-time updates from Firestore
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedJobs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Ensure dateApplied is formatted as a string for input fields
          dateApplied: doc.data().dateApplied?.toDate ? doc.data().dateApplied.toDate().toISOString().split('T')[0] : doc.data().dateApplied,
        }));
        setJobs(fetchedJobs);
        setLoading(false);
      }, (err) => {
        console.error("Firestore error:", err);
        setError("Failed to load job applications. Please try again.");
        setLoading(false);
      });

      return () => unsubscribe(); // Cleanup snapshot listener when component unmounts or dependencies change
    } else {
      // If no user is logged in, clear jobs and indicate not loading
      setJobs([]);
      setLoading(false);
    }
  }, [db, userId, appId]);

  // Handle changes in the new job form inputs
  const handleNewJobChange = (e) => {
    const { name, value } = e.target;
    setNewJob({ ...newJob, [name]: value });
  };

  // Handle changes in the editing job form inputs
  const handleEditJobChange = (e) => {
    const { name, value } = e.target;
    setEditingJob({ ...editingJob, [name]: value });
  };

  // Add a new job application
  const addJob = async (e) => {
    e.preventDefault();
    if (!db || !userId) {
      setError("Please sign in to add job applications.");
      return;
    }
    if (!newJob.company || !newJob.title || !newJob.dateApplied) {
      setError("Company, Title, and Date Applied are required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const jobsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/jobApplications`);
      await addDoc(jobsCollectionRef, {
        ...newJob,
        dateApplied: new Date(newJob.dateApplied), // Convert to Firestore Timestamp
        createdAt: serverTimestamp(), // Add a timestamp for creation
      });
      setNewJob({ company: '', title: '', status: 'Applied', dateApplied: '', notes: '' }); // Reset form
    } catch (err) {
      console.error("Error adding job:", err);
      setError("Failed to add job application.");
    } finally {
      setLoading(false);
    }
  };

  // Set the job to be edited
  const startEditing = (job) => {
    setEditingJob({ ...job });
  };

  // Update an existing job application
  const updateJob = async (e) => {
    e.preventDefault();
    if (!db || !userId || !editingJob) {
      setError("Please sign in to update job applications or no job selected for editing.");
      return;
    }
    if (!editingJob.company || !editingJob.title || !editingJob.dateApplied) {
      setError("Company, Title, and Date Applied are required for update.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const jobDocRef = doc(db, `artifacts/${appId}/users/${userId}/jobApplications`, editingJob.id);
      await updateDoc(jobDocRef, {
        company: editingJob.company,
        title: editingJob.title,
        status: editingJob.status,
        dateApplied: new Date(editingJob.dateApplied), // Convert to Firestore Timestamp
        notes: editingJob.notes,
      });
      setEditingJob(null); // Exit editing mode
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
      setError("Please sign in to delete job applications.");
      return;
    }

    // Custom confirmation modal implementation
    const confirmDelete = await new Promise(resolve => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 flex flex-col items-center">
          <p class="mb-4 text-center text-lg font-semibold">Are you sure you want to delete this job application?</p>
          <div class="flex space-x-4">
            <button id="cancelBtn" class="px-5 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors duration-200">Cancel</button>
            <button id="confirmBtn" class="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200">Delete</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('confirmBtn').onclick = () => {
        document.body.removeChild(modal);
        resolve(true);
      };
      document.getElementById('cancelBtn').onclick = () => {
        document.body.removeChild(modal);
        resolve(false);
      };
    });

    if (!confirmDelete) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const jobDocRef = doc(db, `artifacts/${appId}/users/${userId}/jobApplications`, id);
      await deleteDoc(jobDocRef);
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
        // Using a simple alert for now, consider a custom modal/toast for production
        alert('Registration successful! You are now logged in.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        // Using a simple alert for now, consider a custom modal/toast for production
        alert('Login successful!');
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
      setJobs([]); // Clear jobs on logout
      setEditingJob(null); // Clear editing state
      // Using a simple alert for now, consider a custom modal/toast for production
      alert('You have been signed out.');
    } catch (err) {
      console.error("Logout error:", err);
      setError(`Logout failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-4 font-sans antialiased">
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
                  {editingJob && editingJob.id === job.id ? (
                    // Edit Form
                    <form onSubmit={updateJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="editCompany" className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <input
                          type="text"
                          id="editCompany"
                          name="company"
                          value={editingJob.company}
                          onChange={handleEditJobChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="editTitle" className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                        <input
                          type="text"
                          id="editTitle"
                          name="title"
                          value={editingJob.title}
                          onChange={handleEditJobChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="editStatus" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          id="editStatus"
                          name="status"
                          value={editingJob.status}
                          onChange={handleEditJobChange}
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
                        <label htmlFor="editDateApplied" className="block text-sm font-medium text-gray-700 mb-1">Date Applied</label>
                        <input
                          type="date"
                          id="editDateApplied"
                          name="dateApplied"
                          value={editingJob.dateApplied}
                          onChange={handleEditJobChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor="editNotes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                          id="editNotes"
                          name="notes"
                          value={editingJob.notes}
                          onChange={handleEditJobChange}
                          rows="3"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-y"
                        ></textarea>
                      </div>
                      <div className="md:col-span-2 flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingJob(null)}
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    // Display Job Details
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
                      <div className="flex space-x-2 justify-end">
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
                  )}
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
