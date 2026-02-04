# Backend Deployment Guide - Budget Tracker API

Complete step-by-step guide for deploying the Budget Tracker backend on your server.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Database Setup](#database-setup)
4. [Project Setup](#project-setup)
5. [Environment Configuration](#environment-configuration)
6. [Running the Backend](#running-the-backend)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js 18+** (LTS version recommended)
- **PostgreSQL 15+**
- **Redis 7+**
- **PM2** (Process Manager)
- **Git**

### Server Requirements
- **RAM**: Minimum 1GB (2GB+ recommended)
- **Storage**: 10GB+ free space
- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+

---

## Server Setup

### 1. Connect to Your Server

```bash
ssh your-username@your-server-ip
```

### 2. Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Install Node.js 18

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version
```

### 4. Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
```

### 5. Install Redis

```bash
# Install Redis
sudo apt install redis-server -y

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### 6. Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### 7. Install Git (if not installed)

```bash
sudo apt install git -y
```

---

## Database Setup

### 1. Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql
```

Inside PostgreSQL prompt, run:

```sql
-- Create database
CREATE DATABASE budget_tracker;

-- Create user (replace 'your_secure_password' with a strong password)
CREATE USER budget_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE budget_tracker TO budget_user;

-- Exit PostgreSQL
\q
```

### 2. Verify Database Connection

```bash
# Test connection
sudo -u postgres psql -d budget_tracker -c "SELECT version();"
```

### 3. Configure PostgreSQL (Optional - for remote access)

If you need remote database access, edit PostgreSQL config:

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/*/main/postgresql.conf
# Uncomment and set: listen_addresses = '*'

# Edit pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add line: host all all 0.0.0.0/0 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Project Setup

### 1. Clone Repository

```bash
# Navigate to your preferred directory
cd /var/www
# or
cd ~/projects

# Clone the repository
git clone https://github.com/PyaePhoneNaing/Budget_Tracker.git

# Navigate to backend directory
cd Budget_Tracker/backend
```

### 2. Install Dependencies

```bash
# Install npm packages
npm install
```

### 3. Create Logs Directory

```bash
# Create logs directory for PM2
mkdir -p logs
```

### 4. Create Uploads Directory

```bash
# Create directory for profile photo uploads
mkdir -p uploads/profiles
```

---

## Environment Configuration

### 1. Create .env File

```bash
# Create .env file
nano .env
```

### 2. Add Environment Variables

Copy and paste the following, then update with your actual values:

```env
# ============================================
# Database Configuration
# ============================================
DATABASE_URL="postgresql://budget_user:your_secure_password@localhost:5432/budget_tracker?schema=public"

# ============================================
# JWT Authentication
# ============================================
# Generate a strong random string (use: openssl rand -base64 32)
JWT_SECRET="your-super-secret-jwt-key-change-this-to-random-string"

# ============================================
# Redis Configuration
# ============================================
REDIS_URL="redis://localhost:6379"

# ============================================
# Server Configuration
# ============================================
PORT=3001
NODE_ENV=production

# ============================================
# Frontend URL (CORS)
# ============================================
# Update this with your Vercel frontend URL after deployment
FRONTEND_URL="https://your-project.vercel.app"
```

### 3. Generate JWT Secret (Recommended)

```bash
# Generate a secure random string
openssl rand -base64 32
# Copy the output and paste it as JWT_SECRET in .env
```

### 4. Save and Exit

- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

---

## Database Migration

### 1. Generate Prisma Client

```bash
npm run prisma:generate
```

### 2. Run Database Migrations

```bash
npm run prisma:migrate
```

This will:
- Create all database tables (users, categories, transactions)
- Set up indexes
- Configure relationships

### 3. Verify Database Tables

```bash
# Connect to database
sudo -u postgres psql -d budget_tracker

# List all tables
\dt

# Exit
\q
```

You should see tables: `users`, `categories`, `transactions`

---

## Running the Backend

### Option 1: Using PM2 (Recommended for Production)

#### Start the Backend

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs budget-tracker-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions it displays
```

#### PM2 Useful Commands

```bash
# View status
pm2 status

# View logs
pm2 logs budget-tracker-api

# Restart
pm2 restart budget-tracker-api

# Stop
pm2 stop budget-tracker-api

# Delete (remove from PM2)
pm2 delete budget-tracker-api

# Monitor (real-time)
pm2 monit

# View detailed info
pm2 show budget-tracker-api
```

### Option 2: Manual Start (Development/Testing)

```bash
# Start server
npm start

# Or for development with auto-reload
npm run dev
```

---

## Testing the Backend

### 1. Test Health Endpoint

```bash
# Test locally
curl http://localhost:3001/health

# Should return:
# {"status":"ok","timestamp":"2024-..."}
```

### 2. Test from External (if firewall allows)

```bash
# Replace YOUR_SERVER_IP with your actual server IP
curl http://YOUR_SERVER_IP:3001/health
```

### 3. Check Server Logs

```bash
# PM2 logs
pm2 logs budget-tracker-api

# Or if running manually, check terminal output
```

---

## Firewall Configuration

### Allow Port 3001

```bash
# If using UFW (Ubuntu)
sudo ufw allow 3001/tcp
sudo ufw reload

# If using firewalld (CentOS)
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload

# Check firewall status
sudo ufw status
# or
sudo firewall-cmd --list-ports
```

---

## Monitoring & Maintenance

### 1. Check Database Size

```bash
sudo -u postgres psql -d budget_tracker -c "
SELECT 
    pg_size_pretty(pg_database_size('budget_tracker')) as database_size;
"
```

### 2. Check Table Sizes

```bash
sudo -u postgres psql -d budget_tracker -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### 3. Check Row Counts

```bash
sudo -u postgres psql -d budget_tracker -c "
SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions;
"
```

### 4. Monitor Services

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Check Redis
sudo systemctl status redis-server
redis-cli ping  # Should return PONG

# Check PM2
pm2 status
pm2 monit
```

### 5. View Database (Prisma Studio)

```bash
# Open Prisma Studio (visual database browser)
npm run prisma:studio

# Access at: http://your-server-ip:5555
# Press Ctrl+C to stop
```

---

## Updating the Backend

### 1. Pull Latest Changes

```bash
cd /var/www/Budget_Tracker  # or your project path
git pull origin main
```

### 2. Update Backend

```bash
cd backend

# Install new dependencies (if any)
npm install

# Run new migrations (if any)
npm run prisma:migrate

# Regenerate Prisma Client
npm run prisma:generate
```

### 3. Restart Backend

```bash
# Restart with PM2
pm2 restart budget-tracker-api

# Check logs
pm2 logs budget-tracker-api
```

---

## Troubleshooting

### Problem: Database Connection Error

**Symptoms:**
```
Error: P1001: Can't reach database server
```

**Solutions:**
```bash
# 1. Check PostgreSQL is running
sudo systemctl status postgresql

# 2. Check connection string in .env
# Verify DATABASE_URL is correct

# 3. Test connection manually
sudo -u postgres psql -d budget_tracker -c "SELECT 1;"

# 4. Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Problem: Redis Connection Error

**Symptoms:**
```
Redis Client Error: ECONNREFUSED
```

**Solutions:**
```bash
# 1. Check Redis is running
sudo systemctl status redis-server

# 2. Test Redis
redis-cli ping  # Should return PONG

# 3. Start Redis if stopped
sudo systemctl start redis-server

# 4. Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

### Problem: Port Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions:**
```bash
# 1. Find process using port 3001
sudo lsof -i :3001
# or
sudo netstat -tulpn | grep 3001

# 2. Kill the process (replace PID with actual process ID)
sudo kill -9 PID

# 3. Or change PORT in .env file
```

### Problem: PM2 Process Keeps Crashing

**Solutions:**
```bash
# 1. Check logs
pm2 logs budget-tracker-api --lines 100

# 2. Check error logs
cat logs/err.log

# 3. Verify .env file exists and is correct
cat .env

# 4. Test manually
npm start
# Check for errors in terminal
```

### Problem: CORS Errors

**Symptoms:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solutions:**
```bash
# 1. Check FRONTEND_URL in .env matches your Vercel URL exactly
# Example: FRONTEND_URL="https://budget-tracker-xxx.vercel.app"

# 2. Restart backend after changing .env
pm2 restart budget-tracker-api

# 3. Check backend logs
pm2 logs budget-tracker-api
```

### Problem: Migration Errors

**Symptoms:**
```
Error: Migration failed
```

**Solutions:**
```bash
# 1. Check database connection
sudo -u postgres psql -d budget_tracker -c "\dt"

# 2. Reset database (WARNING: Deletes all data)
npm run prisma:migrate reset

# 3. Or manually fix migration
npm run prisma:migrate dev
```

---

## Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Generated strong JWT_SECRET (32+ characters)
- [ ] Set NODE_ENV=production
- [ ] Updated FRONTEND_URL with actual Vercel URL
- [ ] Firewall configured (only port 3001 open if needed)
- [ ] Database user has only necessary privileges
- [ ] .env file is not committed to git (check .gitignore)
- [ ] Regular backups configured (recommended)

---

## Backup & Recovery

### Backup Database

```bash
# Create backup
sudo -u postgres pg_dump budget_tracker > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
sudo -u postgres psql budget_tracker < backup_YYYYMMDD_HHMMSS.sql
```

### Automated Backup Script (Optional)

Create `/usr/local/bin/backup-budget-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/budget-tracker"
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump budget_tracker | gzip > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

Make it executable:
```bash
sudo chmod +x /usr/local/bin/backup-budget-db.sh
```

Add to crontab (daily backup at 2 AM):
```bash
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-budget-db.sh
```

---

## Quick Reference

### Essential Commands

```bash
# Start backend
pm2 start ecosystem.config.js

# Stop backend
pm2 stop budget-tracker-api

# Restart backend
pm2 restart budget-tracker-api

# View logs
pm2 logs budget-tracker-api

# Check status
pm2 status

# Database migration
npm run prisma:migrate

# View database
npm run prisma:studio

# Test API
curl http://localhost:3001/health
```

### Service Management

```bash
# PostgreSQL
sudo systemctl start postgresql
sudo systemctl stop postgresql
sudo systemctl restart postgresql
sudo systemctl status postgresql

# Redis
sudo systemctl start redis-server
sudo systemctl stop redis-server
sudo systemctl restart redis-server
sudo systemctl status redis-server
```

---

## Support & Resources

- **Project Repository**: https://github.com/PyaePhoneNaing/Budget_Tracker
- **Prisma Docs**: https://www.prisma.io/docs
- **PM2 Docs**: https://pm2.keymetrics.io/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## Notes

- Always test changes in a development environment first
- Keep backups before major updates
- Monitor logs regularly for errors
- Update dependencies regularly for security patches
- Document any custom configurations

---

**Last Updated**: 2024
**Version**: 1.0.0
