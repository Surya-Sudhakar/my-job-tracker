Job Application Tracker (Frontend Only)
This is a simple job application tracker built with React. This version does not use any external database or cloud storage (like Firebase).

Important Note: All data is stored in the browser's local memory. This means your job applications will be lost if you close the browser tab, refresh the page, or navigate away. This version is primarily for local demonstration and quick use where data persistence is not required.

Features
Add New Applications: Easily add new job entries with company, title, status, date applied, and notes.

Track Status: Update the status of your applications (Applied, Interview, Offer, Rejected, Accepted, Wishlist).

Edit & Delete: Modify existing applications or remove them.

Responsive Design: Built with Tailwind CSS, ensuring a great experience on both desktop and mobile devices.

Getting Started
Follow these steps to set up and run your Job Application Tracker locally.

Prerequisites
Node.js (LTS version recommended) and npm (or Yarn) installed.

1. Create a Project Folder
Create a new empty folder on your computer, for example, my-job-tracker.

2. Navigate into the Folder
Open your terminal or command prompt, and navigate into the newly created folder:

cd my-job-tracker

3. Create Subfolders
Inside my-job-tracker, create the following subfolders:

public

src

4. Create Files and Copy Content
Now, create each file listed below in its specified location within your my-job-tracker folder, and copy the entire content from the respective code blocks into that file.

package.json (root directory)

tailwind.config.js (root directory)

public/index.html

src/App.js

src/index.js

src/index.css

.gitignore (root directory)

(Refer to the previous messages for the content of these files, specifically the updated src/App.js provided above.)

5. Install Dependencies
After creating all the files, run the following command in your terminal (while in the my-job-tracker directory) to install all necessary packages:

npm install

or if you use Yarn:

yarn install

6. Run the Application
Once the dependencies are installed, you can start the development server:

npm start

or:

yarn start

This will open the Job Tracker in your web browser, usually at http://localhost:3000.

No Deployment for this Version
Since this version does not rely on a backend or database, deploying it to services like GitHub Pages would allow others to use it, but their data would still not be persistent across sessions. This version is best suited for local testing or temporary use cases.