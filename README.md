
# 📊 Multi-User Job Application Tracker

A **robust job tracking app** built with **React**, designed to help individuals manage job applications efficiently. It supports **secure multi-user access** and uses **Firebase** for backend services, including authentication and real-time data storage.

---

## ✨ Features

- 🔐 **Secure User Authentication** – Email/password-based login & registration  
- 💾 **Persistent Data Storage** – All job data is saved in **Firebase Firestore**  
- 🔄 **Real-time Updates** – Instant sync across sessions and devices  
- 🛠️ **Full CRUD Operations** – Add, view, edit, and delete applications  
- 📌 **Application Status Tracking** – Sort by status (Applied, Interview, Offer, etc.)  
- 🗒️ **Notes & Date Tracking** – Add notes and submission date for each job  
- 📱 **Responsive UI** – Built with **Tailwind CSS** for a modern look  
- 💸 **Free Hosting & Backend** – Uses Firebase's free tier

---

## 🚀 Getting Started

### ✅ Prerequisites

Ensure you have:
- [Node.js (LTS)](https://nodejs.org/) installed
- A **GitHub account**
- A **Google account** to use Firebase

---

## 📁 Project Structure Setup

```bash
my-job-tracker/
├── public/
│   └── index.html
├── src/
│   ├── App.js
│   ├── index.js
│   └── index.css
├── .gitignore
├── package.json
├── tailwind.config.js
└── README.md
```

### ⚙️ Steps

1. **Create Project Directory**
   ```bash
   mkdir my-job-tracker
   cd my-job-tracker
   ```

2. **Create Subfolders**
   ```bash
   mkdir public src
   ```

3. **Add Files**
   - `public/index.html`
   - `src/App.js`
   - `src/index.js`
   - `src/index.css`
   - `package.json`
   - `tailwind.config.js`
   - `.gitignore`
   - `README.md`

---

## 🔑 Firebase Configuration

### 1. Create Firebase Project
- Go to [Firebase Console](https://console.firebase.google.com/)
- Click **"Add Project"**

### 2. Add Web App
- Click `</>` (Web) icon
- Copy the `firebaseConfig` and paste it in `App.js`

### 3. Enable Email/Password Auth
- Go to: **Build → Authentication → Sign-in method**
- Enable **Email/Password**

### 4. Setup Firestore
- Navigate to **Build → Firestore Database**
- Click **"Create database"**
- Choose **"Start in production mode"**

### 5. Firestore Security Rules
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/jobApplications/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 📦 Install & Run

```bash
npm install
# or
yarn install
```

### ⚠️ Update package.json

```json
"homepage": "http://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME"
```

### ⚠️ Add Firebase Config in App.js

Replace the placeholder values in:
```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  ...
};
```

---

## 🌐 Deployment – GitHub Pages

### 1. Build Project
```bash
npm run build
```

### 2. Initialize Git & Push
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 3. Deploy to GitHub Pages
```bash
npm run deploy
```

### 4. Enable GitHub Pages

On GitHub:
- Go to **Settings → Pages**
- Set the source to `gh-pages` branch
- Save

> Your app will be live shortly at the URL you specified in `package.json`.

---

## 🛠️ Technologies Used

- ⚛️ React
- 🌬️ Tailwind CSS
- 🔐 Firebase Authentication
- 🔥 Firebase Firestore
- 🌍 GitHub Pages
- 📦 gh-pages npm package

---

## 🤝 Contribution

Feel free to fork this repo, improve it, and submit PRs. Contributions are welcome!

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
