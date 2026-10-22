# NexaBull – Local Development Replica

A fully functional local replica of nexabull.live for testing and development.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Install Dependencies
```bash
cd d:\nexabull_site
npm install
```

### 2. Configure Environment
```bash
# The .env file is already created. Edit it to set your MongoDB URI:
notepad backend\.env
```

Default `.env` values:
- `PORT=5000`
- `MONGO_URI=mongodb://127.0.0.1:27017/nexabull`
- `JWT_SECRET=your_super_secret_jwt_key_change_me_in_production`

### 3. Start MongoDB
```bash
# If using local MongoDB:
mongod
```

### 4. Start the Server
```bash
# Development (with auto-restart):
npm run dev

# Production:
npm start
```

### 5. Open in Browser
```
http://localhost:5000
```

---

## 📁 Project Structure

```
nexabull_site/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── models/
│   │   └── User.js            # User Mongoose schema
│   ├── routes/
│   │   ├── auth.js            # Login, register, captcha
│   │   └── user.js            # Profile, dashboard, admin
│   ├── .env                   # Environment variables (not committed)
│   ├── .env.example           # Template
│   └── server.js              # Express app entry point
│
├── frontend/
│   ├── assets/
│   │   ├── logo.png           # NexaBull logo
│   │   └── hero-bull.png      # Hero section bull graphic
│   ├── css/
│   │   ├── style.css          # Global styles
│   │   └── dashboard.css      # Dashboard-specific styles
│   ├── js/
│   │   ├── main.js            # Homepage interactions
│   │   ├── auth.js            # Login/register logic
│   │   └── dashboard.js       # Dashboard logic
│   ├── index.html             # Landing page
│   ├── signin.html            # Login page
│   ├── signup.html            # Registration page
│   └── dashboard.html         # User dashboard
│
├── package.json
└── README.md
```

---

## 🔌 API Endpoints

### Auth (no token required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/auth/captcha` | Generate SVG captcha image |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/auth/logout` | Logout |

### User (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/user/profile` | Get full profile |
| GET  | `/api/user/dashboard` | Get dashboard stats |
| PATCH | `/api/user/profile` | Update name/mobile |

### Admin (admin role required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/user/all` | List all users (paginated) |
| PATCH | `/api/user/:id/status` | Update user status |

---

## 🗄️ Database Schema

### User Model
```
userId          String   (auto-generated, e.g., "NB3F2A9C")
sponsorId       String   (ID of referring user)
sponsorName     String
name            String   (required)
email           String   (required, unique)
mobile          String   (required)
password        String   (bcrypt hashed, not returned)
role            Enum     [user, admin]
status          Enum     [active, inactive, suspended]
wallet.balance          Number
wallet.totalEarned      Number
wallet.totalWithdrawn   Number
referrals       [ObjectId → User]
lastLogin       Date
createdAt       Date
updatedAt       Date
```

---

## 🌐 Pages

| Page | URL | Description |
|------|-----|-------------|
| Landing | `/` or `/index.html` | Full marketing homepage |
| Sign In | `/signin.html` | Login with captcha |
| Register | `/signup.html` | Registration with sponsor validation |
| Dashboard | `/dashboard.html` | Protected user dashboard |

---

## ⚙️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (no framework)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Security**: Helmet, CORS, express-rate-limit

---

## 🔒 Security Features
- Password hashing with bcrypt (12 rounds)
- JWT authentication with expiry
- SVG captcha (server-generated, session-based)
- Rate limiting (100 req/15min global, 20 req/15min auth)
- Helmet security headers
- Input validation and sanitization
- Role-based access control (user/admin)
