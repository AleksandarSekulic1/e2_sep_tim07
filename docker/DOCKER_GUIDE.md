# Docker Compose Setup - Complete Guide

## Status: ✅ All Services Running Successfully

All microservices and the frontend application are now containerized and running together with a single command!

### How to Start All Services

```bash
cd docker
docker compose up -d --build
```

This command will:
1. Build all Docker images
2. Create and start all containers
3. Properly manage dependencies between services
4. Keep everything running in the background

### How to Stop All Services

```bash
docker compose down
```

To also remove data volumes:
```bash
docker compose down -v
```

## Service Endpoints

### Backend Services (Microservices)
- **Core Service**: http://localhost:8080 (Payment processing core)
- **Bank Service**: http://localhost:8081 (Bank simulator)
- **Card Service**: http://localhost:8082 (Card/QR payments)
- **PayPal Service**: http://localhost:8083 (PayPal integration)
- **API Gateway**: http://localhost:8084 (Main API entry point)

### Frontend Application
- **Web Shop**: http://localhost:4200 (Angular frontend)

### Supporting Services
- **RabbitMQ Management**: http://localhost:15672 (Username: user, Password: password)
- **PostgreSQL Databases**:
  - Core DB: localhost:5444 (psp_core_db)
  - Bank DB: localhost:5445 (bank_db)
  - Card DB: localhost:5433 (psp_card_db)
- **MongoDB**: localhost:27017 (PayPal DB - Username: admin, Password: password)

## Available Commands

### View Status
```bash
docker compose ps                    # See all containers and their status
docker compose logs -f               # View logs from all services
docker compose logs <service_name>   # View logs from specific service
```

### Manage Services
```bash
docker compose up -d          # Start in background
docker compose up             # Start in foreground (see logs)
docker compose down           # Stop all services
docker compose restart        # Restart all services
docker compose pause          # Pause all services
docker compose unpause        # Resume all services
```

### Execute Commands
```bash
docker compose exec <service> bash   # Open shell in a container
docker compose exec core-service curl http://localhost:8080  # Run command
```

### Example: Check Core Service Health
```bash
docker compose logs core-service | tail -20
```

## Key Improvements Made

### 1. **Database Health Checks**
   - All PostgreSQL databases have proper health checks
   - MongoDB has ping health check
   - RabbitMQ has diagnostic health check
   - Services only start when dependencies are healthy

### 2. **Proper Dependency Ordering**
   - Databases start first
   - Message broker (RabbitMQ) starts
   - Microservices wait for healthy databases
   - API Gateway waits for all microservices
   - Frontend waits for API Gateway

### 3. **Optimized Restart Policy**
   - Services use `unless-stopped` restart policy
   - No infinite restart loops
   - Services stay running unless manually stopped

### 4. **Built-in Logging**
   - All containers log to Docker logs
   - Access via `docker compose logs`
   - Easy debugging and monitoring

### 5. **Networking**
   - All services on same `psp-network` bridge network
   - Services communicate by hostname (e.g., `core-service:8080`)
   - Isolated from host network unless explicitly exposed

### 6. **Volumes for Persistence**
   - PostgreSQL data: `psp_core_data`, `psp_card_data`, `bank_data`
   - MongoDB data: `paypal_data`
   - Data persists across container restarts

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User Browser                           │
└────────────────────────────┬────────────────────────────────┘
                             │
                         :4200 HTTP
                             │
                    ┌────────▼────────┐
                    │   Web Shop      │
                    │  (Angular/Nginx)│
                    └────────┬────────┘
                             │
                         :8084 HTTP
                             │
                    ┌────────▼────────┐
                    │  API Gateway    │
                    │ (Spring Boot)   │
                    └────┬───┬────┬───┘
           ┌─────────────┘   │   └──────────────┐
           │                 │                  │
        :8080            :8081                :8082
           │                 │                  │
      ┌────▼─────┐ ┌────────▼────────┐ ┌──────▼──────┐
      │   Core    │ │     Bank       │ │    Card     │
      │  Service  │ │    Service     │ │   Service   │
      └────┬─────┘ └────┬───────────┘ └──────┬──────┘
           │            │                    │
        :5444         :5445               :5433
           │            │                    │
      ┌────▼─────────────▼────────────────────▼──┐
      │    PostgreSQL Databases (3 instances)    │
      └────────────────────────────────────────────┘

        ┌──────────────┐         ┌──────────┐
        │   PayPal     │         │ RabbitMQ │
        │  Service     │         │  Queue   │
        │:8083         │         │ :5672    │
        └──────┬───────┘         └─────┬────┘
               │                       │
               └──────────┬────────────┘
                          │
                      :27017
                          │
                  ┌───────▼────────┐
                  │ MongoDB        │
                  │(PayPal DB)     │
                  └────────────────┘
```

## Troubleshooting

### Services Keep Restarting
- Check logs: `docker compose logs <service>`
- Ensure all dependencies are healthy: `docker compose ps`
- Check port conflicts with: `netstat -ano | findstr :8080` (Windows)

### Can't Connect to Services
- Verify all containers are running: `docker compose ps`
- Check if ports are properly exposed: `docker compose ps`
- Try accessing from container: `docker compose exec web-shop curl http://api-gateway:8080`

### Database Connection Errors
- Wait 30 seconds for databases to fully initialize
- Check database logs: `docker compose logs psp-core-db`
- Verify database is healthy: `docker compose ps psp-core-db`

### Port Already in Use
- Change port mappings in docker-compose.yml
- Kill existing processes: `netstat -ano | findstr :8080` → `taskkill /PID <PID> /F` (Windows)
- Or use different port: Change `8080:8080` to `8085:8080`

## Development Workflow

### Testing an Individual Service
```bash
# View live logs
docker compose logs -f core-service

# Execute command in container
docker compose exec core-service bash
```

### Rebuilding After Code Changes
```bash
# Rebuild specific service
docker compose up -d --build core-service

# Rebuild all services
docker compose up -d --build
```

### Accessing Databases
```bash
# PostgreSQL
docker compose exec psp-core-db psql -U postgres -d psp_core_db

# MongoDB
docker compose exec paypal-mongo-db mongosh -u admin -p password
```

## Performance Tips

1. **First Build Takes Time**: The initial build (especially web-shop) takes 20-30 seconds
2. **Subsequent Builds**: Use `--no-cache` flag to force rebuild
3. **Resource Usage**: Monitor with `docker stats`
4. **Memory Issues**: Adjust Java heap via environment variables if needed

## Security Notes

⚠️ **Important for Development Only**:
- Default passwords are simple (super, password)
- Services are exposed on localhost
- Use strong passwords in production
- Never commit `.env` files with real credentials

For production deployment:
- Use environment-specific configurations
- Use Docker secrets or orchestration tools (Kubernetes)
- Enable SSL/TLS for all services
- Use proper authentication mechanisms
- Implement rate limiting and API keys

## Files Modified/Created

1. **docker-compose.yml** - Main orchestration file with all services
2. **Dockerfiles** - Created for each microservice:
   - core-service/Dockerfile
   - bank-service/Dockerfile
   - card-service/Dockerfile
   - paypal-service/Dockerfile
   - api-gateway/Dockerfile
   - web-shop/Dockerfile
3. **nginx.conf** - Web server configuration for Angular app
4. **.dockerignore** - Optimize build context for each service
5. **angular.json** - Updated CSS budgets for production build

## Support

For issues:
1. Check service logs: `docker compose logs <service>`
2. Verify all containers are healthy: `docker compose ps`
3. Check network connectivity: `docker compose exec <service> ping <other-service>`
4. Review docker-compose.yml for configuration issues
