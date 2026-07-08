# AI Agent Master Blueprint: FixItAll Django Transition

This document provides the definitive specification for the FixItAll project. Future agents MUST use this as the source of truth for implementing the Django backend and refactoring the React frontend.

## 1. Core Backend Apps & API Endpoints

### `account` App (Authentication & Profiles)
- **POST `/api/account/register/`**: User registration (email, password, name).
- **POST `/api/account/login/`**: JWT/Session login.
- **POST `/api/account/logout/`**: Invalidate session.
- **GET/PATCH `/api/account/profile/`**: Manage user profile data.
- **GET `/api/account/check-admin/`**: Verify if the logged-in user has admin privileges.
- **GET/POST `/api/account/roles/`**: Manage staff roles and permissions.
- **GET/POST/PUT/DELETE `/api/account/users/`**: Full user management for admins.

### `efrontend` App (Public Store)
- **GET `/api/store/products/`**: List products with filtering (category, brand, price, search).
- **GET `/api/store/products/<slug>/`**: Detailed product info.
- **GET `/api/store/categories/`**: List all categories and their metadata.
- **GET `/api/store/hero-settings/`**: Fetch homepage banner and promotional data.
- **POST `/api/store/orders/create/`**: Submit a new order from checkout.
- **GET `/api/store/orders/track/<order_id>/`**: Public order tracking.
- **GET `/api/store/orders/my-orders/`**: Authenticated user's order history.
- **GET/POST/DELETE `/api/store/wishlist/`**: User's personal wishlist.
- **GET/POST `/api/store/products/<id>/reviews/`**: Product reviews and ratings.
- **GET `/api/store/locations/`**: Physical store locations and hours.
- **POST `/api/store/ai-recommend/`**: Gemini-powered recommendation engine (backend proxy or frontend direct).

### `eadmin` App (Management & Analytics)
- **GET `/api/admin/dashboard/stats/`**: Summary data (total sales, orders, customers).
- **GET/POST/PUT/DELETE `/api/admin/products/`**: Full CRUD for inventory.
- **GET/PATCH `/api/admin/orders/`**: Manage orders (Pending, Shipped, Delivered).
- **GET `/api/admin/customers/`**: List and view customer history.
- **GET/POST `/api/admin/activity/`**: Retrieve and log user activity (replaces `userActivityService`).
- **GET `/api/admin/reports/`**: Specialized endpoints for Sales, Stock, and Brand reports.
- **GET/POST `/api/admin/pos/`**: Point of Sale transaction management.
- **GET/PATCH `/api/admin/service-tickets/`**: Manage customer support tickets.
- **GET/PATCH `/api/admin/messages/`**: View and manage contact form inquiries.
- **GET/POST/DELETE `/api/admin/category-features/`**: Manage category-specific feature highlights.
- **GET/POST/PUT/DELETE `/api/admin/hero-settings/`**: Manage homepage banners.
- **GET/POST/PUT/DELETE `/api/admin/chat-sessions/`**: Manage customer support chat sessions.
- **GET/POST/PUT/DELETE `/api/admin/chat-messages/`**: Manage chat messages within a session.

### 1.1 Background Tasks (Celery + Redis)
- **AI Responses**: User messages trigger a Celery task (`generate_ai_response`) that calls the Gemini API asynchronously.
- **Infrastructure**: Redis is used as the message broker and result backend.
- **Configuration**: Settings are managed in `fixitall_backend/celery.py` and `settings.py`.

## 2. Frontend Page Specifications

### Public Storefront
1.  **Index (Home)**:
    -   *Functions*: Fetch Hero banners, New Arrivals, Deals of the Week, and Popular products.
    -   *Logic*: Use `useProducts` hook (refactor to poll Django).
2.  **Product Detail**:
    -   *Functions*: Fetch product by slug, handle "Add to Cart", "Add to Wishlist", and "Compare".
    -   *Logic*: Track view activity via `useTracking`.
3.  **Category Page**:
    -   *Functions*: Dynamic filtering by brand, price, and type.
    -   *Logic*: Sync URL params with API queries.
4.  **AI Requirement Finder**:
    -   *Functions*: User input -> Gemini API -> Product matching.
    -   *Logic*: Display reasoning and direct links to recommended products.
5.  **Checkout & Order Success**:
    -   *Functions*: Validate cart, process "payment", create order in Django.
6.  **Search Page**:
    -   *Functions*: Global search across name, brand, and specs.

### Admin Panel (Protected)
1.  **Dashboard**:
    -   *Functions*: Real-time charts (Recharts) for sales and visitor trends.
2.  **Product Management (Add/Edit)**:
    -   *Functions*: Form validation (Zod), image upload handling, spec management.
3.  **User Activity**:
    -   *Functions*: Detailed timeline of user paths, product views, and search queries.
    -   *Logic*: Expandable "Quick View" for product details within the log.
4.  **POS (Point of Sale)**:
    -   *Functions*: Barcode/Search selection, instant billing, invoice printing.
5.  **Reports**:
    -   *Functions*: Exportable data for Sales (by Category/Brand) and Stock levels.

## 3. Critical Functions & Hooks

-   **`useTracking()`**: MUST be refactored to send `navigator.userAgent`, `screenResolution`, `path`, and `metadata` to the Django `eadmin` activity endpoint.
-   **`useProducts()`**: MUST fetch from `/api/store/products/` instead of static files or Firestore.
-   **`cartStore` / `wishlistStore`**: Maintain client-side state but sync with Django for logged-in users.
-   **`handleFirestoreError`**: Replace with a global `handleApiError` utility for Axios/Fetch.

## 4. Implementation Rules for AI Agents
1.  **No Mocking**: Do not use `setTimeout` to simulate loading if an API can be built.
2.  **Type Integrity**: Always update `src/types.ts` to match Django Serializer outputs.
3.  **Security**: All `/admin` routes must check the `is_admin` flag from the `account` app.
4.  **Styling**: Maintain the "FixItAll" Neo-brutalist/Modern aesthetic using Tailwind CSS.
