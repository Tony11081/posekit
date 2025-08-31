-- PoseKit Database Schema
-- PostgreSQL 15+ compatible with UUID, JSONB, and full-text search

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE safety_level AS ENUM ('normal', 'caution', 'restricted');
CREATE TYPE variant_type AS ENUM ('mirror', 'angle', 'lens');
CREATE TYPE pose_status AS ENUM ('draft', 'review', 'published', 'archived');
CREATE TYPE user_role AS ENUM ('super_admin', 'editor', 'viewer');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE asset_type AS ENUM ('image', 'skeleton', 'json', 'document');
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Themes table (Wedding, Family, Newborn, etc.)
CREATE TABLE themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    icon VARCHAR(50), -- Icon identifier
    pose_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags table (Standing, Eye Contact, 85mm, etc.)
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50), -- pose-type, lens, lighting, etc.
    pose_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table with role-based access
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    status user_status NOT NULL DEFAULT 'active',
    
    -- Profile information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar VARCHAR(500), -- URL to avatar image
    bio TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(5) DEFAULT 'en',
    
    -- User preferences (JSONB for flexibility)
    preferences JSONB DEFAULT '{}',
    custom_permissions TEXT[], -- Additional permissions beyond role
    
    -- Authentication tracking
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Assets table for images and files
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type asset_type NOT NULL DEFAULT 'image',
    title VARCHAR(255),
    description TEXT,
    
    -- File metadata
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL, -- Size in bytes
    
    -- Image-specific metadata (null for non-images)
    width INTEGER,
    height INTEGER,
    aspect_ratio VARCHAR(10), -- e.g., "4:5", "16:9"
    color_space VARCHAR(20),
    has_alpha BOOLEAN DEFAULT false,
    exif_data JSONB,
    
    -- Storage information
    storage_key VARCHAR(500) NOT NULL, -- S3 key or file path
    url VARCHAR(1000) NOT NULL, -- Primary access URL (768px WebP)
    cdn_url VARCHAR(1000), -- CDN URL if different
    thumbnail_url VARCHAR(1000), -- Small preview URL
    
    -- Processing status
    processing_status processing_status DEFAULT 'pending',
    processing_error TEXT,
    variants JSONB DEFAULT '[]', -- Array of variant objects
    
    -- Categorization
    tags TEXT[] DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id)
);

-- Main poses table
CREATE TABLE poses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(200) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    aliases TEXT[] DEFAULT '{}', -- Alternative names for search
    
    -- Categorization
    theme_id UUID NOT NULL REFERENCES themes(id),
    tag_ids UUID[] DEFAULT '{}', -- Array of tag IDs for performance
    
    -- Pose structure
    skeleton VARCHAR(100), -- SVG skeleton identifier
    keypoints JSONB NOT NULL, -- OpenPose/Mediapipe keypoints
    preview_asset_id UUID REFERENCES assets(id),
    variant_ids UUID[] DEFAULT '{}', -- Array of variant IDs
    
    -- AI prompts
    prompts JSONB DEFAULT '{}', -- {sdxl: "...", flux: "...", etc}
    
    -- Safety information
    safety_level safety_level DEFAULT 'normal',
    safety_notes TEXT,
    
    -- SEO metadata
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT[],
    og_title VARCHAR(255),
    og_description TEXT,
    og_image VARCHAR(500),
    canonical_url VARCHAR(500),
    
    -- Status and workflow
    status pose_status DEFAULT 'draft',
    featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    
    -- Search vector for full-text search
    search_vector tsvector,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id)
);

-- Pose variants table (mirror, angle, lens variations)
CREATE TABLE pose_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pose_id UUID NOT NULL REFERENCES poses(id) ON DELETE CASCADE,
    type variant_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Variant-specific data
    asset_id UUID NOT NULL REFERENCES assets(id),
    keypoints JSONB, -- Override keypoints if different
    prompts JSONB DEFAULT '{}', -- Variant-specific prompts
    
    -- Metadata
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections table (curated pose groups)
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(200) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    pose_ids UUID[] DEFAULT '{}', -- Array of pose IDs
    featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id)
);

-- Pose versions table (for version control and rollback)
CREATE TABLE pose_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pose_id UUID NOT NULL REFERENCES poses(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    
    -- Snapshot of pose data at this version
    data JSONB NOT NULL,
    change_summary TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    
    UNIQUE(pose_id, version_number)
);

-- Audit logs table (track all changes)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- create, update, delete, login, etc.
    resource_type VARCHAR(50), -- pose, asset, user, etc.
    resource_id UUID,
    
    -- Change details
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}', -- Additional context
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions table (JWT token management)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    refresh_token_hash VARCHAR(255) UNIQUE,
    
    -- Session metadata
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT true
);

-- User invitations table (for team collaboration)
CREATE TABLE user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    custom_permissions TEXT[],
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    
    -- Status tracking
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by UUID NOT NULL REFERENCES users(id)
);

-- Search synonyms table (for improved search)
CREATE TABLE search_synonyms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term VARCHAR(100) NOT NULL,
    synonyms TEXT[] NOT NULL,
    category VARCHAR(50), -- pose-type, equipment, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id)
);

-- URL redirects table (SEO-friendly redirects)
CREATE TABLE url_redirects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    old_path VARCHAR(500) NOT NULL UNIQUE,
    new_path VARCHAR(500) NOT NULL,
    status_code INTEGER DEFAULT 301,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id)
);

-- System settings table (configurable settings)
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID NOT NULL REFERENCES users(id)
);

-- Create indexes for performance
-- Full-text search indexes
CREATE INDEX idx_poses_search_vector ON poses USING gin(search_vector);
CREATE INDEX idx_poses_title_trgm ON poses USING gin(title gin_trgm_ops);
CREATE INDEX idx_poses_aliases_trgm ON poses USING gin(aliases gin_trgm_ops);

-- Foreign key indexes
CREATE INDEX idx_poses_theme_id ON poses(theme_id);
CREATE INDEX idx_poses_preview_asset_id ON poses(preview_asset_id);
CREATE INDEX idx_pose_variants_pose_id ON pose_variants(pose_id);
CREATE INDEX idx_pose_variants_asset_id ON pose_variants(asset_id);
CREATE INDEX idx_pose_versions_pose_id ON pose_versions(pose_id);
CREATE INDEX idx_assets_created_by ON assets(created_by);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);

-- Query optimization indexes
CREATE INDEX idx_poses_status_featured ON poses(status, featured) WHERE status = 'published';
CREATE INDEX idx_poses_theme_status ON poses(theme_id, status) WHERE status = 'published';
CREATE INDEX idx_poses_created_at ON poses(created_at DESC);
CREATE INDEX idx_poses_view_count ON poses(view_count DESC) WHERE status = 'published';
CREATE INDEX idx_themes_featured_sort ON themes(featured DESC, sort_order ASC);
CREATE INDEX idx_tags_pose_count ON tags(pose_count DESC);
CREATE INDEX idx_assets_type_status ON assets(type, processing_status);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Array indexes for better performance with tag queries
CREATE INDEX idx_poses_tag_ids ON poses USING gin(tag_ids);
CREATE INDEX idx_poses_variant_ids ON poses USING gin(variant_ids);
CREATE INDEX idx_collections_pose_ids ON collections USING gin(pose_ids);

-- Functions and triggers

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_pose_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', array_to_string(NEW.aliases, ' ')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.seo_keywords::text, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector
CREATE TRIGGER trigger_update_pose_search_vector
    BEFORE INSERT OR UPDATE OF title, description, aliases, seo_keywords
    ON poses
    FOR EACH ROW
    EXECUTE FUNCTION update_pose_search_vector();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER trigger_themes_updated_at BEFORE UPDATE ON themes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_tags_updated_at BEFORE UPDATE ON tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_poses_updated_at BEFORE UPDATE ON poses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_pose_variants_updated_at BEFORE UPDATE ON pose_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_search_synonyms_updated_at BEFORE UPDATE ON search_synonyms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update theme/tag pose counts
CREATE OR REPLACE FUNCTION update_theme_pose_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update old theme count if theme changed
    IF TG_OP = 'UPDATE' AND OLD.theme_id != NEW.theme_id THEN
        UPDATE themes SET pose_count = (
            SELECT COUNT(*) FROM poses WHERE theme_id = OLD.theme_id AND status = 'published'
        ) WHERE id = OLD.theme_id;
    END IF;
    
    -- Update current theme count
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE themes SET pose_count = (
            SELECT COUNT(*) FROM poses WHERE theme_id = NEW.theme_id AND status = 'published'
        ) WHERE id = NEW.theme_id;
    END IF;
    
    -- Update old theme count on delete
    IF TG_OP = 'DELETE' THEN
        UPDATE themes SET pose_count = (
            SELECT COUNT(*) FROM poses WHERE theme_id = OLD.theme_id AND status = 'published'
        ) WHERE id = OLD.theme_id;
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain theme pose counts
CREATE TRIGGER trigger_update_theme_pose_count
    AFTER INSERT OR UPDATE OF theme_id, status OR DELETE
    ON poses
    FOR EACH ROW
    EXECUTE FUNCTION update_theme_pose_count();

-- Function to create pose version on update
CREATE OR REPLACE FUNCTION create_pose_version()
RETURNS TRIGGER AS $$
DECLARE
    version_num INTEGER;
BEGIN
    -- Only create versions for published poses
    IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status != 'published') THEN
        -- Get next version number
        SELECT COALESCE(MAX(version_number), 0) + 1 
        INTO version_num 
        FROM pose_versions 
        WHERE pose_id = NEW.id;
        
        -- Insert version record
        INSERT INTO pose_versions (pose_id, version_number, data, created_by)
        VALUES (NEW.id, version_num, row_to_json(NEW), NEW.updated_by);
        
        -- Keep only last 10 versions
        DELETE FROM pose_versions 
        WHERE pose_id = NEW.id 
        AND version_number <= version_num - 10;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create pose versions
CREATE TRIGGER trigger_create_pose_version
    AFTER INSERT OR UPDATE
    ON poses
    FOR EACH ROW
    EXECUTE FUNCTION create_pose_version();

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
BEGIN
    -- Convert row data to JSON
    IF TG_OP = 'DELETE' THEN
        old_data := row_to_json(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := row_to_json(OLD);
        new_data := row_to_json(NEW);
    ELSIF TG_OP = 'INSERT' THEN
        old_data := NULL;
        new_data := row_to_json(NEW);
    END IF;
    
    -- Insert audit log entry
    INSERT INTO audit_logs (
        action, 
        resource_type, 
        resource_id, 
        old_values, 
        new_values,
        user_id
    ) VALUES (
        lower(TG_OP),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        old_data,
        new_data,
        COALESCE(NEW.updated_by, OLD.updated_by, NEW.created_by, OLD.created_by)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit logging to key tables (optional - can be resource intensive)
-- CREATE TRIGGER trigger_poses_audit AFTER INSERT OR UPDATE OR DELETE ON poses FOR EACH ROW EXECUTE FUNCTION log_audit_event();
-- CREATE TRIGGER trigger_users_audit AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION log_audit_event();
-- CREATE TRIGGER trigger_assets_audit AFTER INSERT OR UPDATE OR DELETE ON assets FOR EACH ROW EXECUTE FUNCTION log_audit_event();