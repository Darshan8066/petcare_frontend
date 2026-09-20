# PetCare+ Frontend Application

Modern, responsive client-side web application for the **PetCare+** all-in-one pet care platform. Built with **React 19**, **Vite**, **Tailwind CSS**, and **Motion**.

---

## 🐾 Overview

The PetCare+ frontend provides an intuitive, high-performance interface for pet owners, veterinary clinics, service providers, and administrators.

### Core Modules & Features

1. **Owner Dashboard (`/`)**
   - Quick pet health overview and vaccination alerts.
   - Quick action shortcuts (Schedule Vet, Book Grooming, Order Food, Emergency SOS).
   - Upcoming appointment schedules and activity feed.

2. **Pet Profile & Medical Records (`/pets`)**
   - Detailed pet cards (name, breed, age, weight, allergies, chips).
   - Medical history log with diagnosis, prescriptions, and vet notes.
   - Vaccination timelines and reminder schedules.
   - Add new pet modal with full medical and diet profiling.

3. **Service Bookings (`/book` or `/booking`)**
   - Multi-service booking: Veterinary Clinics, Pet Grooming, and Certified Pet Sitters.
   - Verified provider directory with ratings, bios, prices, and locations.
   - Date, time slot, and pet selector with live appointment confirmation.

4. **Pet Supplies Store & Checkout (`/store`)**
   - Catalog browsing across categories: Food, Pharmacy, Toys, Beds, Accessories, and Grooming.
   - Search by keyword and filter by category.
   - Interactive slide-over cart drawer with quantity adjustments.
   - Promo coupon code verification (e.g. `WELCOME10`).
   - Frictionless checkout modal with shipping details and order tracking.

5. **Adoption & Pet Marketplace (`/marketplace`)**
   - Browse puppies, kittens, birds, and rescues looking for loving homes.
   - Detailed pet bios, vaccination badges, personality traits, and adoption fees.
   - Direct caregiver inquiry and reservation hold system.

6. **AI Veterinary Advisor (`/ai-assistant`)**
   - Interactive veterinary triage chat powered by Google Gemini AI.
   - Context-aware answers based on selected pet's breed, age, and allergies.
   - Smart triage categorization (Routine Care vs. Urgent Clinical Emergency).
   - Suggested query quick-prompts (nutrition, behavior, vaccines).

7. **Pet Health Calendar (`/calendar`)**
   - Interactive calendar with task checklists for medication, booster shots, and grooming.
   - Filter by event type and mark tasks completed.
   - Modal for scheduling custom reminders.

8. **24/7 Emergency SOS (`/emergency`)**
   - Real-time emergency veterinary clinic finder with distance calculations.
   - One-tap phone calling, emergency hotline numbers, and poison control info.
   - Triage protocol guide (choking, poisoning, heatstroke, trauma).

9. **Admin Portal (`/admin`)**
   - Operational KPIs (gross revenue, total orders, active bookings, registered pets).
   - Live appointments table with status updates (confirmed, completed, cancelled).
   - Order management and provider activity monitors.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Motion](https://motion.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── Navbar.jsx       # Header navigation, notifications, search
│   │       ├── Footer.jsx       # Platform footer and quick links
│   │       └── CartDrawer.jsx   # Slide-over shopping cart & checkout
│   ├── context/
│   │   ├── AuthContext.jsx      # User authentication state & mock login
│   │   ├── PetContext.jsx       # Selected pet state & profile management
│   │   ├── CartContext.jsx      # Shopping cart, items, coupon & totals
│   │   └── ToastContext.jsx     # Global toast notifications
│   ├── pages/
│   │   ├── DashboardPage.jsx    # Main owner dashboard
│   │   ├── PetsPage.jsx         # Pet profiles & medical histories
│   │   ├── BookingPage.jsx      # Vet, grooming, and sitter bookings
│   │   ├── StorePage.jsx        # Pet supply e-commerce store
│   │   ├── MarketplacePage.jsx  # Pet adoption & rehoming listings
│   │   ├── AIAssistantPage.jsx  # Gemini AI health advisor
│   │   ├── CalendarPage.jsx     # Vaccination & medicine calendar
│   │   ├── EmergencyPage.jsx    # Emergency clinic finder & hotline
│   │   └── AdminPage.jsx        # Business metrics & booking control
│   ├── services/
│   │   └── api.js               # Axios client & centralized endpoint calls
│   ├── App.jsx                  # Route definitions & layout shell
│   ├── main.jsx                 # React root DOM mounting & providers
│   └── index.css                # Tailwind utility directives
├── .env.example                 # Frontend environment variables template
├── .gitignore                   # Ignored files for version control
├── index.html                   # HTML entry point
├── package.json                 # Dependencies & scripts
└── vite.config.js               # Vite bundler configuration
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure any custom endpoints in `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME="PetCare+"
VITE_ENV=development
```

### 3. Start Development Server

```bash
npm run dev
```

The Vite dev server will start at `http://localhost:5173` (or port configured in your environment).

### 4. Build for Production

```bash
npm run build
```

The compiled static assets will be output to `frontend/dist/`.

### 5. Preview Production Build

```bash
npm run preview
```
"# petcare-frontend" 
"# petcare_frontend" 
