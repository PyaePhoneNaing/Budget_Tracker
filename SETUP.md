# Setup Guide

## Quick Start

### 1. Prerequisites

Make sure you have installed:
- Node.js 18+ (`node --version`)
- PostgreSQL 15+ (`psql --version`)
- Redis 7+ (`redis-cli --version`)
- npm or yarn

### 2. Database Setup

```bash
# Start PostgreSQL (if not running)
sudo systemctl start postgresql  # Linux
brew services start postgresql    # macOS

# Create database
sudo -u postgres psql
CREATE DATABASE budget_tracker;
CREATE USER budget_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE budget_tracker TO budget_user;
\q
```

### 3. Redis Setup

```bash
# Start Redis (if not running)
sudo systemctl start redis-server  # Linux
brew services start redis          # macOS

# Test Redis connection
redis-cli ping
# Should return: PONG
```

### 4. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor

# Update these values:
# DATABASE_URL="postgresql://budget_user:your_password@localhost:5432/budget_tracker?schema=public"
# JWT_SECRET="generate-a-random-secret-key-here"
# REDIS_URL="redis://localhost:6379"

# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

Backend should now be running on `http://localhost:3001`

### 5. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# (Optional) Create .env file if API URL differs
# echo "VITE_API_URL=http://localhost:3001/api" > .env

# Start development server
npm run dev
```

Frontend should now be running on `http://localhost:5173`

### 6. Access the Application

Open your browser and navigate to:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

## Testing the Setup

### Test Backend Health

```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Test Database Connection

```bash
cd backend
npm run prisma:studio
```

This opens Prisma Studio where you can view and manage your database.

### Test Redis Connection

```bash
redis-cli
> ping
PONG
> exit
```

## Common Issues

### PostgreSQL Connection Error

**Error**: `Can't reach database server`

**Solution**:
1. Check if PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify connection string in `.env`
3. Check PostgreSQL is listening on port 5432: `sudo netstat -tulpn | grep 5432`

### Redis Connection Error

**Error**: `Redis Client Error`

**Solution**:
1. Check if Redis is running: `sudo systemctl status redis-server`
2. Test connection: `redis-cli ping`
3. The app will continue without Redis (cache won't work, but API will function)

### Prisma Migration Error

**Error**: `Migration failed`

**Solution**:
1. Make sure database exists and user has permissions
2. Check DATABASE_URL in `.env`
3. Try resetting: `npm run prisma:migrate reset` (⚠️ This deletes all data!)

### Port Already in Use

**Error**: `Port 3001 already in use`

**Solution**:
1. Find process: `lsof -i :3001` (macOS) or `netstat -tulpn | grep 3001` (Linux)
2. Kill process or change PORT in `.env`

## Production Setup

See [README.md](./README.md) for detailed production deployment instructions.

## Next Steps

1. Register a new account at http://localhost:5173/register
2. Login and start adding transactions
3. View your dashboard with charts and summaries
4. Explore the transactions page to manage your income and expenses
