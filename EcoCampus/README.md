# EcoCampus – Smart Waste Management for Sustainable Campuses

Full-stack hackathon prototype:
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Database: MySQL
- Authentication: JWT + bcrypt
- Role-based dashboards: Admin and Waste Collector/User

## 1. Requirements
Install:
- Node.js 18+
- MySQL 8+

## 2. Database
Create a MySQL database:

```sql
CREATE DATABASE ecocampus;
```

Then either run `backend/database/schema.sql` or let the server create the tables automatically.

## 3. Backend setup

Open a terminal in `backend`:

```powershell
cd backend
npm install
copy .env.example .env
```

Edit `.env` with your MySQL credentials.

Example:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ecocampus
JWT_SECRET=change_this_to_a_long_random_secret
```

Start:

```powershell
npm start
```

Backend:
http://localhost:5000

## 4. Frontend

The frontend is static. You can open `frontend/login.html` with a local server.

Recommended:

```powershell
cd frontend
npx serve .
```

Then open the URL shown by `serve`.

Or use VS Code Live Server.

## 5. Demo accounts

The backend automatically creates these accounts on first start:

Admin:
- Email: admin@ecocampus.com
- Password: admin123

User / Waste Collector:
- Email: user@ecocampus.com
- Password: user123

Passwords are stored as bcrypt hashes in MySQL.

## 6. Login flow

```text
login.html
   |
   | POST /api/auth/login
   v
Express backend
   |
   | query MySQL
   v
JWT + user role
   |
   v
index.html
   |
   +---- admin ---> admin.html
   |
   +---- user ----> user.html
```

## 7. Important

This is a hackathon prototype. For production deployment, use HTTPS, secure cookies instead of localStorage JWTs, rate limiting, stronger validation, audit logging, and managed database credentials.
