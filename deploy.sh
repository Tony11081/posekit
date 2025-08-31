#!/bin/bash

# PoseKit Deployment Script for Dokploy
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"your-registry.com"}
IMAGE_TAG=${IMAGE_TAG:-$(git rev-parse --short HEAD)}

echo "🚀 Deploying PoseKit to $ENVIRONMENT environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required files exist
check_requirements() {
    log_info "Checking deployment requirements..."
    
    if [ ! -f "docker-compose.yml" ]; then
        log_error "docker-compose.yml not found!"
        exit 1
    fi
    
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            log_warning ".env file not found. Please copy env.example to .env and configure it."
            log_info "Run: cp env.example .env"
            exit 1
        else
            log_error "No environment configuration found!"
            exit 1
        fi
    fi
    
    log_success "Requirements check passed"
}

# Validate environment variables
validate_env() {
    log_info "Validating environment variables..."
    
    source .env
    
    required_vars=(
        "POSTGRES_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "NEXT_PUBLIC_API_URL"
        "NEXT_PUBLIC_CDN_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable $var is not set!"
            exit 1
        fi
    done
    
    log_success "Environment validation passed"
}

# Build and tag Docker images
build_images() {
    log_info "Building Docker images..."
    
    # Build API
    log_info "Building API image..."
    docker build -t posekit-api:$IMAGE_TAG -f apps/api/Dockerfile .
    
    # Build Web
    log_info "Building Web image..."
    docker build -t posekit-web:$IMAGE_TAG -f apps/web/Dockerfile \
        --build-arg NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
        --build-arg NEXT_PUBLIC_CDN_URL=$NEXT_PUBLIC_CDN_URL .
    
    log_success "Docker images built successfully"
}

# Push images to registry (if configured)
push_images() {
    if [ -n "$DOCKER_REGISTRY" ] && [ "$DOCKER_REGISTRY" != "your-registry.com" ]; then
        log_info "Pushing images to registry..."
        
        docker tag posekit-api:$IMAGE_TAG $DOCKER_REGISTRY/posekit-api:$IMAGE_TAG
        docker tag posekit-web:$IMAGE_TAG $DOCKER_REGISTRY/posekit-web:$IMAGE_TAG
        
        docker push $DOCKER_REGISTRY/posekit-api:$IMAGE_TAG
        docker push $DOCKER_REGISTRY/posekit-web:$IMAGE_TAG
        
        log_success "Images pushed to registry"
    else
        log_info "Skipping registry push (no registry configured)"
    fi
}

# Deploy with Docker Compose
deploy_compose() {
    log_info "Deploying with Docker Compose..."
    
    # Stop existing containers
    docker-compose down --remove-orphans
    
    # Pull latest images (if using registry)
    if [ -n "$DOCKER_REGISTRY" ] && [ "$DOCKER_REGISTRY" != "your-registry.com" ]; then
        docker-compose pull
    fi
    
    # Start services
    docker-compose up -d --build
    
    log_success "Services started successfully"
}

# Wait for services to be healthy
wait_for_health() {
    log_info "Waiting for services to be healthy..."
    
    services=("postgres" "redis" "api" "web")
    
    for service in "${services[@]}"; do
        log_info "Checking $service health..."
        
        retry_count=0
        max_retries=30
        
        while [ $retry_count -lt $max_retries ]; do
            if docker-compose ps $service | grep -q "healthy\|Up"; then
                log_success "$service is healthy"
                break
            fi
            
            retry_count=$((retry_count + 1))
            if [ $retry_count -eq $max_retries ]; then
                log_error "$service failed to become healthy"
                docker-compose logs $service
                exit 1
            fi
            
            sleep 10
        done
    done
    
    log_success "All services are healthy"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Wait a bit more for DB to be ready
    sleep 10
    
    # Run migrations using the API container
    docker-compose exec -T api npm run db:migrate || {
        log_warning "Migration command failed, database might already be initialized"
    }
    
    log_success "Database migrations completed"
}

# Create admin user
create_admin() {
    log_info "Creating admin user..."
    
    if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
        docker-compose exec -T api npm run create-admin \
            --email="$ADMIN_EMAIL" \
            --password="$ADMIN_PASSWORD" || {
            log_warning "Admin user creation failed, user might already exist"
        }
        log_success "Admin user setup completed"
    else
        log_warning "ADMIN_EMAIL and ADMIN_PASSWORD not set, skipping admin creation"
    fi
}

# Show deployment status
show_status() {
    log_info "Deployment Status:"
    echo ""
    docker-compose ps
    echo ""
    
    log_info "Service URLs:"
    echo "🌐 Web Application: http://localhost:${WEB_PORT:-3000}"
    echo "🔌 API Server: http://localhost:${API_PORT:-3001}"
    echo "📊 Database: postgresql://localhost:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-posekit}"
    echo ""
    
    log_info "Logs:"
    echo "View logs: docker-compose logs -f [service]"
    echo "Services: web, api, postgres, redis, nginx"
}

# Cleanup function
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Deployment failed! Cleaning up..."
        docker-compose logs
        docker-compose down
    fi
}

# Main deployment process
main() {
    trap cleanup EXIT
    
    log_info "Starting PoseKit deployment process..."
    
    check_requirements
    validate_env
    build_images
    push_images
    deploy_compose
    wait_for_health
    run_migrations
    create_admin
    show_status
    
    log_success "🎉 PoseKit deployed successfully!"
    log_info "Your application should be available shortly at the configured domain."
}

# Handle different commands
case "${1:-deploy}" in
    "deploy"|"")
        main
        ;;
    "build")
        check_requirements
        build_images
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "stop")
        docker-compose down
        ;;
    "restart")
        docker-compose restart
        ;;
    "status")
        show_status
        ;;
    "clean")
        docker-compose down -v --remove-orphans
        docker system prune -f
        ;;
    *)
        echo "Usage: $0 {deploy|build|logs|stop|restart|status|clean}"
        exit 1
        ;;
esac