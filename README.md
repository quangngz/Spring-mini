# Spring-mini

A Learning Management System (LMS) built with Spring Boot and React.
**demo available here:** http://ec2-16-51-3-160.ap-southeast-4.compute.amazonaws.com/

## Tech Stack

- **Backend**: Spring Boot 4.0, Java 17, PostgreSQL, Redis
- **Frontend**: React + TypeScript + Vite, Tailwind CSS
- **Infrastructure**: Docker, Nginx

---

## 🚀 Deploy to AWS EC2

### Prerequisites

- AWS EC2 instance (Ubuntu 22.04+ recommended)
- Docker Hub account
- Domain name (optional, for HTTPS)

### Step 1: Build and Push Images to Docker Hub

On your **local machine**, run the deploy script:

```bash
# Login to Docker Hub and push images
./deploy.sh <your-dockerhub-username> <tag>

# Example:
./deploy.sh quangngz latest
./deploy.sh quangngz v1.0.0
```

This will:
1. Build the backend and frontend Docker images
2. Push them to Docker Hub as:
   - `<username>/spring-mini-backend:<tag>`
   - `<username>/spring-mini-frontend:<tag>`

### Step 2: Set Up EC2 Instance

SSH into your EC2 instance and install Docker:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Log out and back in for group changes to take effect
exit
```

### Step 3: Configure Security Groups

In AWS Console, configure your EC2 Security Group inbound rules:

| Port | Protocol | Source | Description |
|------|----------|--------|-------------|
| 22   | TCP      | Your IP | SSH |
| 80   | TCP      | 0.0.0.0/0 | HTTP (Frontend) |
| 443  | TCP      | 0.0.0.0/0 | HTTPS (optional) |
| 8080 | TCP      | 0.0.0.0/0 | Backend API |
| 8081 | TCP      | Your IP | Actuator (monitoring) |

### Step 4: Deploy on EC2

1. **Copy files to EC2:**

```bash
# From your local machine
scp docker-compose.prod.yml ubuntu@<EC2_PUBLIC_IP>:~/
scp .env ubuntu@<EC2_PUBLIC_IP>:~/.env
```

2. **SSH into EC2 and configure environment:**

```bash
ssh ubuntu@<EC2_PUBLIC_IP>

# Edit .env with production values
nano .env
```

3. **Update `.env` for production:**

```env
# Docker Hub
DOCKER_USERNAME=your-dockerhub-username
TAG=latest

# Web security
JWT_KEY=<generate-a-strong-secret-key>
JWT_EXPIRY_MS=3600000

# AWS S3
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name
S3_REGION=ap-southeast-1

# PostgreSQL
POSTGRES_DB_NAME=mini
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=<strong-password>

# App URLs - Replace with your EC2 public IP or domain
CORS_ALLOWED_ORIGINS=http://<EC2_PUBLIC_IP>,http://your-domain.com
VITE_API_URL=http://<EC2_PUBLIC_IP>:8080
```

4. **Start the application:**

```bash
# Pull and start all containers
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

5. **Access your application:**
   - Frontend: `http://<EC2_PUBLIC_IP>`
   - Backend API: `http://<EC2_PUBLIC_IP>:8080`
   - Actuator: `http://<EC2_PUBLIC_IP>:8081/actuator`

### Step 5: Update Deployment

When you make changes:

```bash
# On local machine: rebuild and push
./deploy.sh quangngz v1.0.1

# On EC2: pull new images and restart
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## 🔧 Useful EC2 Commands

```bash
# View all container logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f backend

# Restart a specific service
docker compose -f docker-compose.prod.yml restart backend

# Stop all services
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (WARNING: deletes database!)
docker compose -f docker-compose.prod.yml down -v

# Check disk space
df -h

# Check container resource usage
docker stats
```

---

## 🛠️ Local Development

### Option 1: Full Docker (Recommended)

Run everything in Docker containers:

```bash
./dev.sh up        # Start all services
./dev.sh down      # Stop all services
./dev.sh build     # Rebuild and start
./dev.sh logs      # View logs
./dev.sh status    # Check container status
./dev.sh clean     # Remove containers and volumes
```

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8080

### Option 2: Hybrid Development

Run infrastructure in Docker, application locally:

```bash
# Start only PostgreSQL and Redis
docker compose up -d postgres redis

# Run backend locally (in backend/ directory)
cd backend
./mvnw spring-boot:run

# Run frontend locally (in frontend/ directory)
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
Spring-mini/
├── backend/                 # Spring Boot API
│   ├── src/
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                # React + Vite app
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml       # Development compose
├── docker-compose.prod.yml  # Production compose (uses Docker Hub images)
├── deploy.sh                # Build & push to Docker Hub
├── dev.sh                   # Development helper script
└── .env                     # Environment variables
```

---

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DOCKER_USERNAME` | Docker Hub username | `quangngz` |
| `TAG` | Image tag | `latest`, `v1.0.0` |
| `JWT_KEY` | JWT signing secret (min 32 chars) | `mySecretKey...` |
| `JWT_EXPIRY_MS` | JWT expiration in ms | `3600000` (1 hour) |
| `POSTGRES_DB_NAME` | Database name | `mini` |
| `POSTGRES_USERNAME` | DB username | `postgres` |
| `POSTGRES_PASSWORD` | DB password | `strongpassword` |
| `S3_ACCESS_KEY` | AWS S3 access key | `AKIA...` |
| `S3_SECRET_KEY` | AWS S3 secret key | `...` |
| `S3_BUCKET_NAME` | S3 bucket name | `my-lms-bucket` |
| `S3_REGION` | AWS region | `ap-southeast-1` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `VITE_API_URL` | Backend API URL for frontend | `http://localhost:8080` |

---

## 🔒 Security Notes

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Use strong passwords** for production PostgreSQL
3. **Generate a new JWT_KEY** for production (min 256 bits)
4. **Restrict Security Group** access for ports 8081 (actuator) and 5432 (postgres)
5. **Consider using AWS Secrets Manager** for sensitive values in production

---

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs for errors
docker compose -f docker-compose.prod.yml logs backend

# Check if ports are in use
sudo lsof -i :8080
```

### Database connection issues
```bash
# Verify postgres is running
docker compose -f docker-compose.prod.yml ps postgres

# Check postgres logs
docker compose -f docker-compose.prod.yml logs postgres
```

### Frontend can't reach backend
- Verify `CORS_ALLOWED_ORIGINS` includes your frontend URL
- Check EC2 Security Group allows port 8080
- Verify `VITE_API_URL` was set correctly during frontend build

---

## 📋 Todo / Future Features

- [ ] User profile images (JPA entity update)
- [ ] Course banner images
- [ ] Admin monitoring dashboard (API usage stats)
- [ ] Course content uploads (lectures, videos)
- [ ] OAuth integration (Google, Facebook)
- [ ] Quiz/multiple choice questions
- [ ] Discussion boards
