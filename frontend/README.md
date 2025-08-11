Transport Management System (TMS) - Frontend
A React-based frontend for managing transport operations, including request approvals, and role-based dashboards. Built with Vite, Material-UI, and React Router.

🚀 Quick Start
Install dependencies:

bash
npm install
Run the development server:

bash
npm run dev
Build for production:

bash
npm run build
Preview production build:

bash
npm run preview
🔧 Main Features
Role-based UI (Driver, Manager, Admin)

JWT Authentication (Axios + JWT-decode)

Real-time Vehicle Tracking (React Leaflet + Maps)

Multi-step Approval Workflow

Responsive Dashboard (MUI + Recharts)

Notifications & Alerts (React Toastify)

📂 Project Structure
src/  
├── assets/           
├── components/         
├── context/        
└── utilities/         
🌐 API Integration
Configure your backend API in:

js
// src/services/api.js  
axios.create({ baseURL: "https://tms-api-23gs.onrender.com/" });
🛠️ Tech Stack
Frontend: React 18 + Vite

UI Library: Material-UI (MUI) + Bootstrap

Routing: React Router DOM

HTTP Client: Axios

Maps: React Leaflet

Animation: Framer Motion + Lottie

📜 Scripts
Command	Description
npm run dev	Start dev server (Vite)
npm run build	Create optimized production build
npm run lint	Run ESLint for code quality
📌 Dependencies
See package.json for full list.
