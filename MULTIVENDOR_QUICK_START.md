# 🚀 Quick Start Guide - AlgoFlow Multi-Vendor SaaS

Get up and running in **5 minutes**!

## ⚡ Super Fast Setup

### 1. Backend Setup (5 min)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy .env
cp .env.example .env

# Migrations
python manage.py migrate

# Create super admin
python manage.py shell
>>> from account.models import MyUser
>>> MyUser.objects.create_superuser('admin@algoflow.com', 'Admin', 'admin123')
>>> exit()

# Run server
python manage.py runserver
```

### 2. Frontend Setup (3 min)

```bash
# From project root
npm install
npm run dev
```

### 3. Access

- **Super Admin Dashboard**: `http://localhost:3000/super-admin/`
  - Email: `admin@algoflow.com`
  - Password: `admin123`

---

## 🎯 Create Your First Company

### Via Super Admin Dashboard

1. Go to `/super-admin/`
2. Click "Create Company"
3. Fill form:
   - Company Name: "My Store"
   - Admin Email: "vendor@example.com"
   - Admin Name: "Vendor Name"
   - (Password auto-generated)
4. Copy credentials → Send to vendor

### Via API (cURL)

```bash
curl -X POST http://localhost:8000/api/superadmin/companies/ \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TechStore",
    "email": "admin@techstore.com",
    "admin_name": "Admin User",
    "admin_email": "admin@techstore.com",
    "plan": "pro"
  }'
```

---

## 👤 Login as Company Admin

1. Visit: `http://localhost:3000/store/techstore-abc/admin/`
2. Use credentials from company creation
3. Manage products, orders, staff, analytics

---

## 📦 Key Folders

```
backend/
├── account/          ← Users & auth
├── company/          ← Company/tenant models
├── superadmin/       ← Super admin views
├── eadmin/           ← Admin dashboards (company-scoped)
├── efrontend/        ← Products, orders, storefront
└── chatapp/          ← Customer support chat

src/
├── pages/
│   ├── SuperAdmin/   ← Platform dashboard
│   └── Admin/        ← Company admin dashboard
├── contexts/         ← Auth, tenant context
└── api/              ← API service layer
```

---

## 🔑 Important Files to Modify

### Before Going Live

1. **backend/.env** - Set real database, email, API keys
2. **backend/fixitall_backend/settings.py** - Update ALLOWED_HOSTS, DEBUG=False
3. **Database** - Use PostgreSQL (not SQLite)
4. **Email Service** - Configure SMTP
5. **File Storage** - Setup S3 or MinIO

---

## 🧪 Test Scenario

```
1. Create company as super admin
   - Company: "ElectroShop"
   - Admin: vendor@electro.com

2. Login as vendor
   - Add 5 products
   - Create order for customer

3. Login as customer
   - Browse products from ElectroShop
   - Cannot see other companies' products

4. Verify isolation
   - Create another company
   - Both admins can't access each other's data
```

---

## 📊 API Quick Reference

### Super Admin
```
POST   /api/superadmin/companies/          Create company
GET    /api/superadmin/companies/          List companies
GET    /api/superadmin/dashboard/          Platform stats
```

### Company Admin (auto-scoped to own company)
```
GET    /api/admin/dashboard/               Stats
CRUD   /api/admin/products/                Products
CRUD   /api/admin/orders/                  Orders
GET    /api/admin/customers/               Customers
```

### Customer
```
GET    /api/store/{slug}/products/         Browse store
POST   /api/orders/create/                 Place order
GET    /api/orders/my/                     My orders
```

---

## ⚠️ Common Issues

### Issue: "Permission Denied" on `/super-admin/`
- **Fix**: Make sure user is superuser (role='superadmin')
```python
python manage.py shell
>>> u = MyUser.objects.get(email='admin@algoflow.com')
>>> u.role = 'superadmin'
>>> u.is_superuser = True
>>> u.save()
```

### Issue: Company admin can see all products
- **Fix**: Check `get_company_filter()` in views
- Ensure `cf = get_company_filter(request)` is used in queryset

### Issue: Frontend shows "401 Unauthorized"
- **Fix**: JWT token expired
- Login again to get fresh token

---

## 🚀 Next Steps

1. **Read** `MULTIVENDOR_SETUP.md` for full documentation
2. **Setup PostgreSQL** instead of SQLite
3. **Configure AWS S3** for image uploads
4. **Deploy** with Docker Compose
5. **Add payment gateway** (Stripe/Khalti)

---

## 📞 Help

- GitHub Issues: https://github.com/prabinKh/algoflow-e1/issues
- Full Docs: `MULTIVENDOR_SETUP.md`
- Architecture Diagram: `complete_multi_vendor_architecture.png`

**Happy Building! 🎉**
