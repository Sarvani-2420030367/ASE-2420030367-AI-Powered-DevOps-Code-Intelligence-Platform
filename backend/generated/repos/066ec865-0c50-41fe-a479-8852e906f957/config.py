# Configuration Settings for E-Commerce API
import os

APP_ENV = "production"
PORT = 8000
HOST = "0.0.0.0"

# Service Connection Details
REDIS_HOST = "redis.internal.net"
REDIS_PORT = 6379

# Storage Configuration
S3_BUCKET_NAME = "ecommerce-production-assets"
S3_REGION = "us-east-1"

# Line 18 Finding:
# Hardcoded configuration detected
DB_PASSWORD = "super_insecure_hardcoded_db_password_xyz987"
DB_USER = "admin"
DB_HOST = "db-prod.internal.net"
