
# 🩺 MedInternia

MedInternia is a comprehensive medical education and collaboration platform designed for doctors, interns, and patients. It provides a rich set of features for case-based learning, certifications, job opportunities, webinars, and more.

## 🚀 Features
- 🗂️ **Case System:** Create, discuss, and review medical cases with nested comments and replies.
- 🧑‍⚕️ **Peer Review:** Doctors and interns can rate and review cases and comments.
- 🏅 **Badges & Certificates:** Earn badges and certificates for achievements and participation.
- 💼 **Job Board:** Browse and apply for medical job opportunities.
- 🎥 **Webinars & AMAs:** Attend and host webinars, ask questions, and interact live.
- 👤 **User Profiles:** Manage and update your profile, including professional details.
- 🔒 **Authentication:** Register and login with email, including OTP verification (configurable).
- 🔗 **Integration:** Export data and integrate with other platforms.
- 🤖 **AI Suggestions:** Get AI-powered suggestions for cases and discussions.
- 📹 **Video Conferencing:** Secure video calls for case discussions and webinars.

## 🛠️ Tech Stack
- **Frontend:** Next.js, React, Material-UI
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Email:** Nodemailer (Gmail or Ethereal for OTP)
- **Authentication:** JWT
- **Other:** RESTful API, CORS, Helmet, Morgan

## 📁 Folder Structure
```
MedInternia/
  backend/      # Node.js/Express API, controllers, models, routes
  frontend/     # Next.js/React app, pages, components, styles
  README.md     # Project overview and instructions
```

## ⚡ Setup Instructions
1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd MedInternia
   ```
2. **Install dependencies:**
   - Backend: `cd backend && npm install`
   - Frontend: `cd frontend && npm install`
3. **Configure environment variables:**
   - Backend: Create `.env` in `backend/` (see sample in repo)
   - Frontend: Configure as needed
4. **Start servers:**
   - Backend: `npm run dev` (default port 3000)
   - Frontend: `npm run dev` (default port 3001)
5. **Access the app:**
   - Frontend: [http://localhost:3001](http://localhost:3001)
   - Backend API: [http://localhost:3000/api](http://localhost:3000/api)

## 🔑 Environment Variables
- **Backend:**
  - `PORT` - API server port
  - `MONGODB_URI` - MongoDB connection string
  - `JWT_SECRET` - JWT secret key
  - `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_HOST`, `EMAIL_PORT` - Email credentials for OTP

## 📝 Usage
- Register as a doctor, intern, or patient
- Verify email via OTP (if enabled)
- Create and discuss cases
- Rate and review comments
- Earn badges and certificates
- Apply for jobs
- Join webinars and video calls

## 🤝 Contribution
Pull requests and issues are welcome! Please follow the code style and add documentation for new features.

## 📄 License
This project is licensed under the MIT License.

## 📬 Contact
For support or questions, contact the owner: Team Blue Spies
