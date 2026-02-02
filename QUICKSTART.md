# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites Check
```bash
node --version    # Should be 18+
psql --version    # Should be 15+
redis-cli --version # Should be 7+
```

### 1. Database Setup (One-time)
```bash
sudo -u postgres psql
CREATE DATABASE budget_tracker;
CREATE USER budget_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE budget_tracker TO budget_user;
\q
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env: Update DATABASE_URL and JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### 3. Frontend Setup (New Terminal)
```bash
cd frontend
npm install
npm run dev
```

### 4. Access
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- API Health: http://localhost:3001/health

### 5. First Steps
1. Open http://localhost:5173
2. Click "Sign up" to create account
3. Login and start adding transactions!

## 🐳 Docker Quick Start

```bash
# Start everything
docker-compose up -d

# Run migrations
docker-compose exec backend npm run prisma:migrate

# View logs
docker-compose logs -f
```

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://budget_user:password@localhost:5432/budget_tracker"
JWT_SECRET="your-random-secret-key"
REDIS_URL="redis://localhost:6379"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

### Frontend (.env) - Optional
```env
VITE_API_URL=http://localhost:3001/api
```

## 🔧 Common Commands

### Backend
```bash
npm run dev          # Start dev server
npm start            # Start production server
npm run prisma:studio # Open database GUI
npm run prisma:migrate # Run migrations
```

### Frontend
```bash
npm run dev    # Start dev server
npm run build  # Build for production
npm run preview # Preview production build
```

## 🐛 Troubleshooting

**Port already in use?**
```bash
lsof -i :3001  # Find process
kill -9 <PID>  # Kill it
```

**Database connection error?**
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify DATABASE_URL in .env
- Test connection: `psql -U budget_user -d budget_tracker`

**Redis connection error?**
- App continues without Redis (cache won't work)
- Check Redis: `redis-cli ping`

## 📚 More Info

- Full setup: See [SETUP.md](./SETUP.md)
- Deployment: See [README.md](./README.md)
- Project details: See [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
