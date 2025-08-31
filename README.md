# 📸 PoseKit

**Professional Pose Reference Library** - A comprehensive database of photography poses with skeleton overlays, AI prompts, and instant download capabilities.

## 🚀 Features

- **📋 Extensive Pose Library**: Curated collection of professional photography poses
- **🔍 Smart Search**: Fuse.js powered search with synonyms and multi-language support  
- **🖼️ Instant Copy/Download**: PNG/JSON/Prompt copying with one click
- **🔄 Pose Variants**: Mirror, angle, and lens variations for each pose
- **⚠️ Safety Guidelines**: Built-in safety alerts for newborn and sensitive poses
- **💾 Favorites System**: Local storage favorites with batch export (ZIP)
- **📱 PWA Ready**: Offline-capable progressive web app
- **🎨 Admin Dashboard**: Full CRUD management with image processing
- **🔐 Role-Based Access**: JWT authentication with granular permissions
- **📊 SEO Optimized**: Static generation with incremental rebuilds

## 🏗️ Architecture

```
posekit/
├── apps/
│   ├── web/          # Next.js frontend (posekit.com)
│   ├── admin/        # React Admin dashboard
│   └── api/          # Node.js/Express REST API
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── ui/           # Shared UI components  
│   └── utils/        # Shared utilities
├── docker/           # Docker configuration
└── scripts/          # Build and deployment scripts
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with SSG
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **Fuse.js** - Fuzzy search
- **React Admin** - Admin dashboard

### Backend  
- **Node.js + Express** - REST API server
- **PostgreSQL** - Primary database
- **Redis** - Caching layer
- **Sharp** - Image processing (768px WebP)
- **Drizzle ORM** - Type-safe database queries

### Infrastructure
- **Docker** - Containerization
- **Dokploy** - Deployment platform
- **AWS S3/Cloudflare R2** - CDN storage
- **GitHub Actions** - CI/CD pipeline

## 🚦 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-org/posekit.git
cd posekit
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start database services**
```bash
docker-compose up -d postgres redis
```

5. **Run database migrations**
```bash
npm run db:migrate
npm run db:seed
```

6. **Start development servers**
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Admin: http://localhost:3002  
- API: http://localhost:3001

## 📦 Deployment

### Using Dokploy

1. **Prepare production environment**
```bash
cp .env.example .env.production
# Configure production values
```

2. **Build and deploy**
```bash
npm run build
docker-compose -f docker/docker-compose.prod.yml up -d
```

3. **Setup domains and SSL**
- Configure Traefik routing in Dokploy
- Enable automatic SSL certificates

### Manual Deployment

1. **Build applications**
```bash
npm run build
```

2. **Start with Docker Compose**
```bash
docker-compose up -d
```

3. **Configure reverse proxy (Nginx)**
```bash
# Copy nginx configuration
cp docker/nginx/posekit.conf /etc/nginx/sites-available/
ln -s /etc/nginx/sites-available/posekit.conf /etc/nginx/sites-enabled/
systemctl reload nginx
```

## 🗄️ Database Schema

Key entities:
- **poses** - Main pose data with metadata
- **pose_variants** - Mirror/angle/lens variations  
- **assets** - Image files with CDN URLs
- **themes** - Categories (Wedding, Family, etc.)
- **tags** - Searchable labels
- **users** - Admin users with roles
- **audit_logs** - Change tracking

## 🔧 Configuration

### Environment Variables

**Core Settings:**
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/posekit
REDIS_URL=redis://:pass@host:6379
JWT_SECRET=your-secret-key
```

**Storage Configuration:**
```bash
CDN_URL=https://cdn.posekit.com
AWS_S3_BUCKET=posekit-assets
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

**Feature Flags:**
```bash
ENABLE_OFFLINE_MODE=true
ENABLE_BULK_OPERATIONS=true  
ENABLE_ANALYTICS=true
```

See `.env.example` for complete configuration options.

## 🔍 API Documentation

### Authentication
```bash
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

### Poses
```bash
GET    /poses              # List poses with filters
GET    /poses/:id          # Get pose details
POST   /poses              # Create pose (admin)
PUT    /poses/:id          # Update pose (admin)
DELETE /poses/:id          # Delete pose (admin)
GET    /poses/search       # Search poses
```

### Assets
```bash
GET    /assets             # List assets
POST   /assets/upload      # Upload images
POST   /assets/bulk-upload # Batch upload
GET    /assets/:id         # Asset details
```

## 📊 Performance

### Image Processing
- **Single Size**: 768px WebP (≤150KB)
- **Processing**: Sharp + automatic optimization
- **CDN**: Global content delivery
- **Caching**: Redis + browser caching

### Frontend Performance
- **SSG**: Static site generation for SEO
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Lazy loading + responsive images
- **PWA**: Service worker caching

### Database Optimization
- **Indexing**: Full-text search on poses
- **Connection Pooling**: PostgreSQL connection management
- **Query Optimization**: Drizzle ORM with prepared statements

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific app tests
cd apps/api && npm test
cd apps/web && npm test
```

## 🔄 CI/CD Pipeline

GitHub Actions workflow:
1. **Test**: Run unit and integration tests
2. **Build**: Build Docker images
3. **Deploy**: Push to GHCR and deploy via Dokploy
4. **Static Export**: Generate static pages and update CDN
5. **Cache Invalidation**: Clear CDN cache for updated content

## 📈 Monitoring

### Health Checks
- API: `/health` endpoint
- Database: Connection testing
- Redis: Ping checks
- Storage: S3 connectivity

### Error Tracking
- **Sentry**: Error monitoring and alerting
- **Winston**: Structured logging
- **Audit Logs**: Admin action tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use conventional commits
- Add tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.posekit.com](https://docs.posekit.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/posekit/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/posekit/discussions)
- **Email**: support@posekit.com

---

Made with ❤️ for photographers worldwide.