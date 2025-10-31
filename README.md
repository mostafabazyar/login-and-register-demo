# Node.js + Prisma JWT Auth (minimal)

Instructions:

1. Install dependencies:
   ```
   npm install
   ```

2. Generate Prisma client and run migration (creates SQLite file `dev.db`):
   ```
   npx prisma generate
   npx prisma migrate dev --name init
   ```

3. Start server:
   ```
   npm run start
   ```

API endpoints:
- POST /auth/register
  body: { name, family, username, password, confirmPassword, phone, email }

- POST /auth/login
  body: { usernameOrEmail, password }

- GET /auth/me
  headers: Authorization: Bearer <token>

- POST /auth/game
  headers: Authorization: Bearer <token>
  body: { score, level }

- GET /auth/games
  headers: Authorization: Bearer <token>

Notes:
- Uses SQLite by default (`.env` DATABASE_URL). Change to PostgreSQL by editing `prisma/schema.prisma` and DATABASE_URL.
- Replace `JWT_SECRET` in `.env` with a strong secret before using in production.

Example:
---
### 🧪 3. Example `curl` commands

#### 📝 Register a new user

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ali",
    "family": "Rezayi",
    "username": "alirezayi",
    "password": "123456",
    "confirmPassword": "123456",
    "phone": "09120000000",
    "email": "ali@example.com"
  }'
```

---

#### 🔑 Login (use email or username)

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail": "alirezayi", "password": "123456"}'
```

You’ll get a JSON response with a `token`.

---

#### 👤 Get user profile

```bash
curl -X GET http://localhost:4000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

#### 🎮 Create a game record

```bash
curl -X POST http://localhost:4000/auth/game \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"score": 500, "level": 3}'
```

---

#### 🧾 List user’s games

```bash
curl -X GET http://localhost:4000/auth/games \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 🧾 Update user profile

```bash
curl -X PUT http://localhost:4000/update/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ali","family":"Rezayi","phone":"09120000000","email":"ali@update.com"}'
```

#### 🎮 Update game score and level

```bash
curl -X PUT http://localhost:4000/update/game \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"gameId":1,"score":2500,"level":7}'
```

---



Would you like me to update your **project ZIP** to use MySQL and include this `.env` already configured for XAMPP (so you can download and just run it)?
