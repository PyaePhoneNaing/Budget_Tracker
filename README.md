# Daily Budget & Expense Tracker Web App

A full-stack web application for tracking daily income and expenses with beautiful visualizations and comprehensive budget management.

## 🚀 Features

- **User Authentication**: Secure JWT-based login and registration
- **Transaction Management**: Add, edit, and delete income and expenses
- **Category Management**: Organize transactions by categories
- **Dashboard**: View total income, expenses, and remaining balance
- **Charts & Visualizations**:
  - Spending by category (Pie chart)
  - Daily spending trend (Bar chart)
- **Date Filtering**: Filter transactions and dashboard by date range
- **Redis Caching**: Fast dashboard loading with cached summaries
- **Rate Limiting**: API protection against abuse

## 🛠️ Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- Recharts for data visualization
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express.js
- Prisma ORM with PostgreSQL
- JWT authentication
- Bcrypt for password hashing
- Redis for caching and rate limiting
- Morgan for logging

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+
- (Optional) Docker and Docker Compose

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd budget_web
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your configuration
# DATABASE_URL="postgresql://user:password@localhost:5432/budget_tracker?schema=public"
# JWT_SECRET="your-super-secret-jwt-key"
# REDIS_URL="redis://localhost:6379"

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file (if needed)
cp .env.example .env

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🐳 Docker Setup (Optional)

### Using Docker Compose

```bash
# From project root
docker-compose up -d

# Run migrations
docker-compose exec backend npm run prisma:migrate
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 3001

## 📁 Project Structure

```
budget_web/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and Redis configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth and rate limiting
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions (cache)
│   │   └── server.js        # Express server
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts (Auth)
│   │   ├── pages/           # Page components
│   │   ├── utils/           # API utilities
│   │   └── App.jsx          # Main app component
│   └── package.json
└── docker-compose.yml
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Transactions
- `GET /api/transactions` - Get all transactions (protected)
- `POST /api/transactions` - Create transaction (protected)
- `GET /api/transactions/:id` - Get transaction (protected)
- `PUT /api/transactions/:id` - Update transaction (protected)
- `DELETE /api/transactions/:id` - Delete transaction (protected)

### Dashboard
- `GET /api/dashboard` - Get dashboard summary (protected)

### Categories
- `GET /api/categories` - Get all categories (protected)
- `POST /api/categories` - Create category (protected)
- `DELETE /api/categories/:id` - Delete category (protected)

## 🚢 Deployment to Contabo VPS

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 globally
sudo npm install -g pm2
```

### 2. Database Setup

```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE budget_tracker;
CREATE USER budget_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE budget_tracker TO budget_user;
\q
```

### 3. Deploy Backend

```bash
# Clone repository
cd /var/www
git clone <your-repo-url> budget-tracker
cd budget-tracker/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
nano .env  # Edit with production values

# Run migrations
npm run prisma:migrate

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

### 4. Deploy Frontend

```bash
cd /var/www/budget-tracker/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Copy build to nginx directory
sudo cp -r dist/* /var/www/budget-tracker-frontend/
```

### 5. Configure Nginx

```bash
# Copy nginx config
sudo cp /var/www/budget-tracker/nginx.conf.example /etc/nginx/sites-available/budget-tracker

# Edit the config file
sudo nano /etc/nginx/sites-available/budget-tracker
# Update server_name and SSL certificate paths

# Enable site
sudo ln -s /etc/nginx/sites-available/budget-tracker /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 6. SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is set up automatically
```

### 7. Firewall Configuration

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 🔒 Security Notes

1. **Environment Variables**: Never commit `.env` files. Use strong secrets in production.
2. **JWT Secret**: Generate a strong random string for `JWT_SECRET`
3. **Database Password**: Use a strong password for PostgreSQL
4. **HTTPS**: Always use HTTPS in production (Let's Encrypt)
5. **Rate Limiting**: Already configured to prevent API abuse
6. **CORS**: Configured to allow requests only from your frontend domain

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/budget_tracker?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
NODE_ENV=production
REDIS_URL="redis://localhost:6379"
FRONTEND_URL="https://yourdomain.com"
```

### Frontend (.env)
```env
VITE_API_URL=https://api.yourdomain.com/api
```

## 🧪 Testing

```bash
# Backend health check
curl http://localhost:3001/health

# Test API (after login)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/dashboard
```

## 📈 Future Improvements

- [ ] Budget limits per category
- [ ] Monthly budget goals
- [ ] Email reports
- [ ] Mobile app
- [ ] Export data to CSV
- [ ] Recurring transactions
- [ ] Multi-currency support

## 📄 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
