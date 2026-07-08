# 🚀 AlgoFlow Multi-Vendor SaaS Platform

A production-ready, Django + React multi-vendor e-commerce platform with complete tenant isolation, super-admin controls, and company-specific dashboards.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Features](#features)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Database Setup](#database-setup)
6. [API Documentation](#api-documentation)
7. [Security & Isolation](#security--isolation)
8. [Deployment](#deployment)

---

## 🏗️ Architecture Overview

### Three-Tier System:

```
┌─────────────────────────────────────────┐
│      SUPER ADMIN LAYER (Platform)      │ ← Create companies, view all analytics
│      Role: superadmin                   │   Manage platform settings
└─────────────────────────────────────────┘
         ↓ (Tenant Isolation Barrier)
┌─────────────────────────────────────────┐
│   COMPANY ADMIN LAYER (Each Vendor)    │ ← Manage own products, orders, staff
│   Role: company_admin                   │   View tenant-specific analytics
│   - TechStore Nepal                     │   
│   - MobileHub                           │
│   - GadgetWorld                         │
└─────────────────────────────────────────┘
         ↓ (Tenant Isolation Barrier)
┌─────────────────────────────────────────┐
│    CUSTOMER LAYER (End Users)           │ ← Browse company storefront
│    Role: customer                       │   Place orders
│    - Auto-assigned to company at        │   Chat with support
│      registration                       │
└─────────────────────────────────────────┘
```

### Data Isolation Strategy:

- **Method**: ForeignKey-based scoping (NOT database-per-tenant)
- **JWT Contains**: `company_id`, `company_slug`, `role`, `user_id`
- **Every Queryset Filters**: By `request.user.company`
- **Cross-Company Access**: Returns 404 (prevents data enumeration)
- **Database Safety Net**: PostgreSQL RLS policies (setup script included)

---

## ✨ Features

### Super Admin Capabilities
✅ Create companies (auto-generates admin user + password)
✅ View all companies with stats (products, orders, revenue)
✅ Activate/Deactivate companies
✅ Monitor platform-wide analytics
✅ Manage subscription plans (Free, Starter, Pro, Enterprise)
✅ User management across all tenants

### Company Admin Capabilities
✅ Dashboard with own stats (orders, products, revenue)
✅ Product CRUD (manage own products only)
✅ Order management (view/update own orders)
✅ Customer management (customers from own store)
✅ Staff management (invite/manage team members)
✅ Chat support (reply to customer inquiries)
✅ Analytics & Reports (own company data)
✅ Company settings (logo, theme color, contact info)

### Staff Capabilities
✅ Add/edit products (within assigned permissions)
✅ View/update orders
✅ Reply to customer chats
✅ View analytics (own company only)
❌ Cannot delete products/orders
❌ Cannot manage staff or company settings

### Customer Capabilities
✅ Browse storefront products
✅ Add to cart & wishlist
✅ Place orders
✅ View order history
✅ Chat with company support
✅ Write product reviews

---

## 📦 Installation

### Backend Setup

```bash
# 1. Clone repository
git clone https://github.com/prabinKh/algoflow-e1.git
cd algoflow-e1/backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file
cp .env.example .env
# Edit .env with your settings

# 5. Run migrations
python manage.py migrate

# 6. Create superadmin user
python manage.py shell
>>> from account.models import MyUser
>>> MyUser.objects.create_superuser('admin@example.com', 'Admin User', 'admin123')
>>> exit()

# 7. Start development server
python manage.py runserver
```

### Frontend Setup

```bash
# 1. Navigate to frontend
cd ../src

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000

# 4. Start dev server
npm run dev
```

---

## 🔧 Configuration

### Backend Settings (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/algoflow
SECRET_KEY=your-super-secret-key-here

# JWT
JWT_SECRET=your-jwt-secret
ACCESS_TOKEN_LIFETIME=1800  # 30 minutes
REFRESH_TOKEN_LIFETIME=86400  # 24 hours

# Email (for verification & notifications)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=your-bucket
AWS_S3_REGION_NAME=us-east-1

# Gemini AI (for chat)
GEMINI_API_KEY=your-gemini-key

# Redis (for caching & Celery)
REDIS_URL=redis://localhost:6379/0

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Frontend Config (.env)

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=AlgoFlow
VITE_APP_DESCRIPTION=Multi-Vendor SaaS Platform
```

---

## 🗄️ Database Setup

### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE algoflow;
CREATE USER algoflow_user WITH PASSWORD 'secure_password';
ALTER ROLE algoflow_user SET client_encoding TO 'utf8';
ALTER ROLE algoflow_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE algoflow_user SET default_transaction_deferrable TO on;
ALTER ROLE algoflow_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE algoflow TO algoflow_user;

# Exit
\q
```

### Run Migrations

```bash
python manage.py migrate

# Load sample data
python manage.py seed_data
```

### Database Schema Overview

All tables include `company_id` ForeignKey for isolation:

```
User (account_myuser)
├── id (UUID)
├── email (unique)
├── company_id (FK to Company)
├── role ('superadmin', 'company_admin', 'staff', 'customer')
└── ...

Company (company_company)
├── id
├── name
├── slug (unique)
├── owner_id (FK to User)
├── plan ('free', 'starter', 'pro', 'enterprise')
├── is_active
└── ...

Product (efrontend_product)
├── id (UUID)
├── company_id (FK to Company) ← INDEXED
├── name
├── price
├── stock
└── ...

Order (efrontend_order)
├── id (UUID)
├── company_id (FK to Company) ← INDEXED
├── user_id (FK to User)
├── status
├── total_amount
└── ...

ChatSession (eadmin_chatsession)
├── id (UUID)
├── company_id (FK to Company) ← INDEXED
├── user_id (FK to User)
└── ...
```

---

## 📡 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register/                    Register new user
POST   /api/auth/verify-email/                Verify email (returns JWT)
POST   /api/auth/login/                       Login (returns JWT)
POST   /api/auth/logout/                      Logout
GET    /api/auth/check/                       Check if authenticated
POST   /api/auth/refresh-token/               Refresh JWT
POST   /api/auth/password-reset/              Request password reset
POST   /api/auth/password-reset/confirm/      Confirm password reset
PATCH  /api/auth/profile/                     Update user profile
```

### Super Admin Endpoints (requires superadmin role)

```
GET    /api/superadmin/dashboard/             Platform analytics
POST   /api/superadmin/companies/             Create company
GET    /api/superadmin/companies/             List all companies
GET    /api/superadmin/companies/{id}/        Company details
PATCH  /api/superadmin/companies/{id}/        Update company
DELETE /api/superadmin/companies/{id}/        Soft delete company
POST   /api/superadmin/companies/{id}/toggle/ Toggle is_active
GET    /api/superadmin/users/                 List all users
```

### Company Admin Endpoints (requires company_admin role + own company)

```
GET    /api/admin/dashboard/                  Company stats
GET    /api/admin/products/                   List company products
POST   /api/admin/products/                   Create product
GET    /api/admin/products/{id}/              Product details
PUT    /api/admin/products/{id}/              Update product
DELETE /api/admin/products/{id}/              Delete product
GET    /api/admin/orders/                     List company orders
GET    /api/admin/orders/{id}/                Order details
PATCH  /api/admin/orders/{id}/                Update order
GET    /api/admin/customers/                  List company customers
GET    /api/admin/staff/                      List staff members
POST   /api/admin/staff/                      Invite staff
PATCH  /api/admin/company-profile/            Update company info
GET    /api/admin/reports/                    Generate reports
```

### Public Storefront Endpoints

```
GET    /api/store/{slug}/info/                Store info (public)
GET    /api/store/{slug}/products/            List products
GET    /api/store/{slug}/products/{id}/       Product detail
GET    /api/store/{slug}/categories/          List categories
GET    /api/store/{slug}/brands/              List brands
POST   /api/store/{slug}/register/            Register (auto-assigns company)
POST   /api/store/{slug}/login/               Login
POST   /api/orders/create/                    Create order
GET    /api/orders/my/                        My orders
```

### Customer APIs

```
GET    /api/cart/                             Get cart
POST   /api/cart/                             Add to cart
PUT    /api/cart/{item_id}/                   Update cart item
DELETE /api/cart/{item_id}/                   Remove from cart
GET    /api/wishlist/                         Get wishlist
POST   /api/wishlist/                         Add to wishlist
DELETE /api/wishlist/{product_id}/            Remove from wishlist
POST   /api/chat/start/                       Start chat session
GET    /api/chat/{session_id}/history/        Chat history
POST   /api/chat/{session_id}/message/        Send message
POST   /api/reviews/                          Write review
```

---

## 🔒 Security & Isolation

### Tenant Isolation Layers

1. **JWT Token Validation**
   - Token contains: `user_id`, `company_id`, `role`, `email`
   - Backend validates token matches request

2. **Middleware Attachment**
   - `TenantMiddleware` extracts `company_id` from JWT
   - Attaches `request.company` for use in views

3. **Permission Classes**
   - `IsSuperAdmin`: Only superadmin or superuser
   - `IsCompanyAdmin`: Must be company_admin of a company
   - `IsCompanyStaff`: Must be staff/admin of a company
   - `IsAdminOrCompanyAdmin`: Super OR company admin

4. **Queryset Filtering**
   - Every view filters by `request.user.company`
   - Superadmin optional `?company=id` param
   - Returns 404 on cross-access (prevents enumeration)

5. **PostgreSQL RLS**
   - `setup_rls.sql` creates row-level security policies
   - Database enforces isolation if app layer fails

### Example: Secure Queryset Filtering

```python
from eadmin.views import get_company_filter

class AdminProductViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        # get_company_filter returns {} for superadmin (access all)
        # or {'company': user.company} for company admin
        cf = get_company_filter(self.request)
        return Product.objects.filter(**cf).select_related('category')
```

### Example: JWT Token with Company

```python
# In account/views.py login
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    # Add custom claims
    refresh['company_id'] = str(user.company.id) if user.company else None
    refresh['company_slug'] = user.company.slug if user.company else None
    refresh['role'] = user.role
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
```

### Preventing Data Enumeration

```python
# WRONG: Reveals data exists
if not User.objects.filter(email=email).exists():
    raise PermissionDenied()

# RIGHT: Hides what doesn't exist
try:
    user = User.objects.get(email=email, company=request.user.company)
except User.DoesNotExist:
    raise NotFound()  # Same error for "not found" or "wrong company"
```

---

## 🚀 Deployment

### Docker Setup

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "fixitall_backend.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### Docker Compose

```yaml
version: '3.9'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: algoflow
      POSTGRES_USER: algoflow_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  backend:
    build: ./backend
    command: gunicorn fixitall_backend.wsgi:application --bind 0.0.0.0:8000
    environment:
      DATABASE_URL: postgresql://algoflow_user:secure_password@db/algoflow
      REDIS_URL: redis://redis:6379/0
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis

  frontend:
    build: ./
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://backend:8000

volumes:
  postgres_data:
```

### Run with Docker Compose

```bash
docker-compose up -d
docker-compose exec backend python manage.py migrate
```

---

## 📚 Usage Examples

### Creating a Company via Super Admin

```bash
curl -X POST http://localhost:8000/api/superadmin/companies/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPERADMIN_JWT" \
  -d '{
    "name": "TechStore Nepal",
    "slug": "techstore-nepal",
    "email": "admin@techstore.com",
    "phone": "+977-1234567890",
    "admin_name": "Raj Poudel",
    "admin_email": "raj@techstore.com",
    "admin_password": "SecurePassword123!",
    "plan": "pro",
    "theme_color": "#FF6B6B",
    "description": "Premium electronics store"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Company \"TechStore Nepal\" created successfully.",
  "company": {...},
  "credentials": {
    "email": "raj@techstore.com",
    "password": "SecurePassword123!",
    "login_url": "/store/techstore-nepal-abc123/admin/"
  }
}
```

### Company Admin Adding Product

```bash
curl -X POST http://localhost:8000/api/admin/products/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer COMPANY_ADMIN_JWT" \
  -d '{
    "name": "Samsung Galaxy S24",
    "category": "electronics",
    "price": "79999.00",
    "stock": 50,
    "description": "Latest flagship phone",
    "image": "https://example.com/phone.jpg"
  }'
```

### Customer Registration in Store

```bash
# Visit: /store/techstore-nepal-abc123/
# Click Register → system auto-assigns customer.company
POST /api/store/techstore-nepal-abc123/register/
{
  "email": "customer@example.com",
  "name": "John Doe",
  "password": "MyPassword123"
}
# Returns JWT → customer automatically linked to TechStore Nepal
```

---

## 🛠️ Troubleshooting

### Issue: "Permission denied" on company endpoints

**Solution**: Verify JWT contains correct `company_id` and user's `role` is `company_admin`.

```python
# Check token
from rest_framework_simplejwt.tokens import AccessToken
token = AccessToken('your_jwt')
print(token.payload)  # Should show company_id, role
```

### Issue: Cross-company data visible

**Cause**: Queryset not filtering by `request.user.company`

**Solution**: Always use `get_company_filter()`:
```python
cf = get_company_filter(request)
qs = Product.objects.filter(**cf)
```

### Issue: Staff can't add products

**Cause**: Missing `IsCompanyStaff` permission

**Solution**: Use correct permission class:
```python
permission_classes = [IsCompanyStaff]
```

---

## 📞 Support

For issues, questions, or contributions:
- GitHub: https://github.com/prabinKh/algoflow-e1
- Email: support@algoflow.com

---

## 📄 License

MIT License - See LICENSE file for details

---

**Last Updated**: May 2026
**Version**: 2.0.0 (Multi-Vendor SaaS)
