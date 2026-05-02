# 🚀 MockVault

> **Build APIs before they exist.**  
> A premium, production-grade SaaS platform for API Contract Testing, Mocking, and Team Sync.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express.js-404D59?style=flat-square)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## ✨ Overview

MockVault solves the fragmentation in API development by providing a unified platform where frontend and backend teams can collaborate on API contracts. Design your schemas, generate instant live mocks, and ensure your code never drifts from the contract.

### 🌟 Key Features

- **🎨 Schema Designer**: Full Monaco-powered OpenAPI editor with instant validation.
- **⚡ Live Mock Server**: Instant HTTP endpoints generated directly from your OpenAPI specs.
- **📉 Chaos Engineering**: Per-endpoint latency and error-rate sliders to simulate real-world failures.
- **📜 Version Control**: Automatic snapshots of your API contracts with one-click rollbacks.
- **👥 Team Collaboration**: Multi-tenant workspaces with role-based access control (Owner, Editor, Viewer).
- **🔒 Enterprise Security**: JWT authentication, Email OTP verification via SendGrid, and Rate Limiting.
- **📊 Real-time Traffic**: Live request monitoring via WebSockets (Socket.io).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **UI Library**: [Mantine V7](https://mantine.dev/)
- **State/Routing**: [React Router V7](https://reactrouter.com/)
- **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose](https://mongoosejs.com/)
- **Validation**: [AJV](https://ajv.js.org/) (JSON Schema)
- **Mocks**: [Faker.js](https://fakerjs.dev/) for realistic data generation
- **Messaging**: [SendGrid](https://sendgrid.com/) for Transactional Email (OTP)
- **Real-time**: [Socket.io](https://socket.io/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB instance)
- SendGrid API Key (for email verification)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/MockVault.git
   cd MockVault
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   # Create .env based on .env.example
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

---

## ⚙️ Environment Variables

### Backend (`server/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Port for the Express server | `5000` |
| `MONGO_URI` | MongoDB Connection String | `REQUIRED` |
| `JWT_SECRET` | Secret for signing JWTs | `development-secret` |
| `SENDGRID_API_KEY` | SendGrid API Key | `REQUIRED` |
| `SENDGRID_FROM_EMAIL` | Verified SendGrid Sender | `REQUIRED` |
| `CLIENT_ORIGIN` | URL of the frontend app | `http://localhost:5173` |

### Frontend (`client/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL for the backend API | `http://localhost:5000/api` |

---

## 📁 Project Structure

```text
MockVault/
├── client/                # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # API clients and utilities
│   │   └── pages/         # Page components (Dashboard, Mock Server, etc.)
├── server/                # Express Backend
│   ├── src/
│   │   ├── config/        # Database and service configs
│   │   ├── middleware/    # Auth, Error, and Validation middlewares
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API route definitions
│   │   ├── services/      # Business logic and external integrations
│   │   └── utils/         # Helper functions
└── README.md
```

---

## 🛡️ Security & Quality

- **Centralized Error Handling**: Unified error response format via custom middleware.
- **Async Wrapper**: Robust promise handling across all routes to prevent hanging requests.
- **Helmet**: Secure HTTP headers to prevent common web vulnerabilities.
- **Mongo Sanitize**: Protection against NoSQL injection attacks.
- **Rate Limiting**: Brute-force protection for Auth and API routes.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---


