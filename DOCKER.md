# Docker Deployment Guide

## Using Docker Compose (Recommended)

Docker Compose will set up both the API and MongoDB in containers.

### 1. Prerequisites
- Docker installed
- Docker Compose installed

### 2. Configuration

Update the `.env.docker` file with your configuration:

```bash
# Edit the file
nano .env.docker

# Or copy from example
cp .env.docker .env
```

### 3. Start the Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

### 4. Access the API

The API will be available at: `http://localhost:3000/api/v1`

MongoDB will be available at: `mongodb://admin:admin123@localhost:27017`

### 5. Useful Commands

```bash
# Rebuild the API after code changes
docker-compose up -d --build api

# View API logs
docker-compose logs -f api

# View MongoDB logs
docker-compose logs -f mongodb

# Execute command in API container
docker-compose exec api sh

# Execute command in MongoDB container
docker-compose exec mongodb mongosh

# Stop all services
docker-compose stop

# Start stopped services
docker-compose start

# Remove all containers and volumes
docker-compose down -v
```

## Using Docker Only (Without Compose)

### 1. Build the Image

```bash
docker build -t pm-tool-api .
```

### 2. Run MongoDB

```bash
docker run -d \
  --name pm-tool-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
  mongo:6
```

### 3. Run the API

```bash
docker run -d \
  --name pm-tool-api \
  -p 3000:3000 \
  --link pm-tool-mongodb:mongodb \
  -e MONGODB_URI=mongodb://admin:admin123@mongodb:27017/pm-tool?authSource=admin \
  -e JWT_SECRET=your-secret \
  -e JWT_REFRESH_SECRET=your-refresh-secret \
  -e SMTP_HOST=smtp.gmail.com \
  -e SMTP_PORT=587 \
  -e SMTP_USER=your-email@gmail.com \
  -e SMTP_PASSWORD=your-password \
  -e EMAIL_FROM=noreply@pm-tool.com \
  -e FRONTEND_URL=http://localhost:3001 \
  pm-tool-api
```

## Production Deployment

### Environment Variables

For production, ensure you set secure values for:
- `JWT_SECRET` - Use a strong random string
- `JWT_REFRESH_SECRET` - Use a different strong random string
- SMTP credentials
- MongoDB credentials

### Health Checks

Add health check endpoint to your API:

```typescript
// In app.controller.ts or main.ts
@Get('health')
getHealth() {
  return { status: 'ok', timestamp: new Date() };
}
```

### Monitoring

View container stats:
```bash
docker stats
```

### Backup MongoDB Data

```bash
# Backup
docker-compose exec mongodb mongodump --out=/backup

# Restore
docker-compose exec mongodb mongorestore /backup
```

## Troubleshooting

### Port Already in Use
```bash
# Change ports in docker-compose.yml
# For API: "3001:3000"
# For MongoDB: "27018:27017"
```

### Container Won't Start
```bash
# Check logs
docker-compose logs api

# Rebuild
docker-compose up -d --build
```

### Database Connection Issues
```bash
# Verify MongoDB is running
docker-compose ps

# Check MongoDB logs
docker-compose logs mongodb

# Test connection
docker-compose exec api ping mongodb
```

### Clear Everything and Start Fresh
```bash
# Stop and remove everything
docker-compose down -v

# Remove all PM Tool images
docker rmi $(docker images | grep pm-tool | awk '{print $3}')

# Start fresh
docker-compose up -d --build
```

## Scaling

To run multiple API instances:

```bash
docker-compose up -d --scale api=3
```

Then use a load balancer (nginx, traefik) in front of the API containers.
