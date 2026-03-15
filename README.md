# 💬 ChatApp — Real-Time Chat Application

A production-level real-time chat application built with the MERN stack + Socket.IO.

![ChatApp Demo](https://img.shields.io/badge/Status-Live-brightgreen)
![Node](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

## ✨ Unique Features

| Feature | Description |
|---|---|
| 💣 **Vanish Messages** | Timer starts ONLY after recipient reads — not before |
| 🤖 **Smart Reply** | AI suggests 3 contextual replies based on last message |
| 🔥 **Mood Indicator** | Detects conversation mood in real-time (Vibing, Warm, Sad, etc.) |
| 📊 **Chat Analytics** | Message counts, word stats, peak hours, longest message |
| ⏰ **Schedule Messages** | Send messages at a future date and time |
| 🎯 **Word Game** | Play Wordle inside the chat, share results |
| 🎤 **Voice Messages** | Record and send audio clips |
| 🔍 **Search Messages** | Search with highlighting + jump to message |
| ↩️ **Reply to Message** | Quote any message and reply inline |
| 📅 **Date Separators** | Messages grouped by Today / Yesterday / date |

## 🛠 Tech Stack

**Frontend:** React 18, Tailwind CSS, Socket.IO Client, Axios, React Router, Zustand, date-fns

**Backend:** Node.js, Express.js, Socket.IO, Mongoose, JWT, bcryptjs, Multer

**Database:** MongoDB Atlas

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/chatapp.git
cd chatapp
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — register two accounts in different tabs and start chatting!

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/chatapp
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 📁 Project Structure

```
chatapp/
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth + error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── sockets/         # Socket.IO event handlers
│   └── utils/           # JWT, file upload helpers
│
└── frontend/
    └── src/
        ├── components/
        │   ├── chat/    # All chat UI components
        │   ├── layout/  # Protected route
        │   └── ui/      # Reusable components
        ├── context/     # AuthContext, ChatContext
        ├── hooks/       # useTheme, useDebounce
        ├── pages/       # Login, Register, Chat
        ├── services/    # API + Socket setup
        └── utils/       # Helper functions
```

## 🌐 Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

## 📱 Responsive Design

Fully responsive — works on mobile (320px), tablet, and desktop.

## 📄 License

MIT — free to use and modify.