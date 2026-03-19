# BhaktaNivas PHP Backend

A full RESTful PHP/MySQL backend for the BhaktaNivas lodge booking system.

## Tech Stack
- **PHP 8.0+** – OOP, strict types
- **MySQL** – via PDO (singleton Database class)
- **JWT** – `firebase/php-jwt` for stateless auth
- **Email** – `phpmailer/phpmailer` via Hostinger SMTP
- **Apache** – `.htaccess` URL rewriting

## Directory Structure
```
php-backend/
├── .env                    # Environment variables (DB, JWT, SMTP, Razorpay)
├── .htaccess               # Apache URL rewriting
├── composer.json           # Composer dependencies
├── config.php              # Loads .env, defines constants & helpers
├── cors.php                # CORS middleware
├── database.php            # Singleton PDO Database class
├── index.php               # Front controller / router
├── middleware/
│   └── auth.php            # JWT authentication middleware
├── routes/
│   ├── auth.php            # POST /api/auth/login|register|me
│   ├── lodges.php          # CRUD /api/lodges
│   ├── rooms.php           # CRUD /api/rooms
│   ├── bookings.php        # Full booking lifecycle /api/bookings
│   ├── daily_prices.php    # Price calendar /api/daily-prices
│   ├── blocked_dates.php   # Block dates /api/blocked-dates
│   ├── reviews.php         # Reviews /api/reviews
│   ├── dashboard.php       # Admin stats /api/dashboard
│   ├── users.php           # User management /api/users
│   └── payment.php         # Razorpay /api/payment
├── utils/
│   └── EmailService.php    # PHPMailer email service
├── migrate.php             # Creates all DB tables
├── seed-products.php       # Sample data (lodges + rooms + admin user)
├── test-db.php             # DB connection test
└── test-email-config.php   # SMTP email test
```

## Setup

### 1. Install Dependencies
```bash
cd php-backend
composer install
```

### 2. Configure Environment
Edit `.env`:
```env
DB_HOST=localhost
DB_NAME=bhakthanivas
DB_USER=your_db_user
DB_PASS=your_db_password
```
All other values (JWT, SMTP, Razorpay) are pre-filled from the original `.env`.

### 3. Create Database Tables
```bash
php migrate.php
```

### 4. Seed Initial Data
```bash
php seed-products.php
```
This creates 3 sample lodges and a super_admin account:
- **Email:** `info@bhakthanivas.com`
- **Password:** `admin@2026`

### 5. Test
```bash
php test-db.php           # Test DB connection
php test-email-config.php # Test SMTP email
```

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | — | Admin login → JWT |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/lodges` | — | List all lodges |
| GET | `/api/lodges/:id` | — | Single lodge + rooms |
| POST | `/api/lodges` | ✅ | Create lodge |
| GET | `/api/bookings` | ✅ | List bookings (filter: lodgeId, status, date) |
| POST | `/api/bookings` | — | Create booking (sends email) |
| PUT | `/api/bookings/:id/status` | ✅ | Update status |
| GET | `/api/dashboard/stats` | ✅ | Admin stats |
| POST | `/api/payment/create-order` | — | Create Razorpay order |
| POST | `/api/payment/verify` | — | Verify payment |

## Deployment (Hostinger)

1. Upload `php-backend/` to your hosting root (alongside the React build)
2. Run `composer install --no-dev --optimize-autoloader`
3. Edit `.env` with production MySQL credentials
4. Run `php migrate.php` once
5. Update React frontend `VITE_API_URL` to point to the PHP backend
