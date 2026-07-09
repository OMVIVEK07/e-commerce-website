# ShopCraft - Production-Ready Enterprise Full-Stack E-Commerce Website

ShopCraft is an enterprise-grade full-stack e-commerce platform styled with modern HSL tailwinds, glassmorphism containers, and micro-animations. It implements secure Google-only authentication, dual-gateway payments (Stripe + Razorpay), customer care support ticket dashboards, real-time Socket.io notifications, and an automated PDF invoice mailing engine.

---

## Technical Stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, Redux Toolkit, TanStack React Query, Framer Motion, Axios.
- **Backend**: Node.js, Express.js, TypeScript, Socket.io, PDFKit, Nodemailer.
- **Database**: MongoDB Atlas, Mongoose.
- **AI Engine**: Groq API (LLaMA3) integrations for chatbot diagnostics.

---

## Folder Architecture

```
exeee/
├── backend/                  # Express + TypeScript Server
│   ├── src/
│   │   ├── config/           # Database configurations
│   │   ├── models/           # Mongoose schemas (14 collections)
│   │   ├── controllers/      # MVC controllers
│   │   ├── routes/           # REST sub-routers
│   │   ├── middleware/       # Auth guards, Helmet, Rate limiters, Sanitizers
│   │   ├── services/         # Socket.io, PDFKit, Nodemailer, Groq AI
│   │   └── index.ts          # Express HTTP Entrypoint
│   └── package.json
├── frontend/                 # Next.js App Router Client
│   ├── src/
│   │   ├── app/              # Dashboard pages and route layout views
│   │   ├── components/       # Header, Footer, and UI blocks
│   │   ├── services/         # Axios client setup
│   │   └── store/            # Redux Toolkit global state slices
│   └── package.json
└── README.md                 # Setup and Operations Guide
```

---

## Setup & Installation Guide

### Prerequisites
- Node.js (v18 or higher recommended)
- Local MongoDB instance or MongoDB Atlas Connection URI
- Groq Cloud API Key (configured automatically in developer console)

### Step 1: Install Dependencies
Open powershell in the root workspace folder:
```powershell
# Install Backend Packages
cd backend
npm install

# Install Frontend Packages
cd ../frontend
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` in the `backend` folder to a new file named `.env` and fill out your details:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/ecommerce
JWT_SECRET=your_secret_key_string

# Integrations
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GROQ_API_KEY=gsk_...

# Payments
STRIPE_SECRET_KEY=your_stripe_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### Step 3: Run the Application
Start the database server locally if you are not using Atlas. Then run:
```powershell
# Start Backend Express Server (starts on localhost:5000)
cd backend
npm run dev

# Start Frontend Next.js Server (starts on localhost:3000)
cd ../frontend
npm run dev
```

---

## Operations & Testing Flow

1. **Quick-Sandbox Login**: 
   Open `http://localhost:3000/login` in the browser. Click **Login as Mock Admin** to log in immediately as the store administrator.
2. **Database Seeding**:
   After logging in as Admin, navigate to the User Profile dropdown -> select **Admin Dashboard** -> click the **Seed Database** tab -> press **Run Catalog Database Seeding**.
   This will instantly create category listings (Electronics, Fashion, Kitchen, Books) and detail products.
3. **Become a Merchant**:
   Log out and click **Sign In** -> select **Login as Mock Seller**. Go to **Seller Dashboard** to configure variants and stock inventories.
4. **Checkout Simulation**:
   Log in as Customer. Add items to your Cart, apply code `WELCOME10` or `FLAT500` for reductions, select a Saved Address, select Stripe/Razorpay, and click **Confirm Purchase**. A success confetti trigger will redirect to order histories tracking charts.
5. **Support AI Chatbot**:
   Navigate to the Help Circle in the top navigation header. Ask the chatbot questions about returns, orders, or registration. The bot connects to Groq LLaMA3 for replies.

---

## API Endpoints List

### Authentication
- `POST /api/auth/google` - Verifies credentials token, logs in or registers user
- `GET /api/auth/me` - Retreives current JWT user session

### Catalog Listings
- `GET /api/products/categories` - Returns all categories
- `GET /api/products/list` - Products listing supporting dynamic search, brand, category, rating filters and pagination
- `GET /api/products/recommendations` - Returns top-rated AI suggestions

### Carts & Wishlists
- `GET /api/cart` - Fetches user basket items
- `POST /api/cart/add` - Adds variant item to cart
- `POST /api/cart/coupon/validate` - Checks promo coupon code validity

### Orders & Checkout
- `POST /api/orders/checkout/initiate` - Standard payment provider checks
- `POST /api/orders/place` - Logs new order transaction, emails invoice attachments, deducts inventory levels
- `POST /api/orders/cancel/:orderId` - Cancels order, triggers gateway refunds, restores product stocks

### Supports
- `POST /api/support/chatbot` - Queries Groq AI chatbot
- `POST /api/support/tickets` - Customer support tickets creation
