# ProFlow Workspace

ProFlow Workspace is a sleek, modern, high-performance project management and collaboration dashboard designed for agile teams. Built with a responsive React frontend, a secure Express backend, and a MongoDB Atlas database, it offers a clean, visual-first workspace for managing tasks, tracking team progress, scheduling calendar events, and generating AI-assisted project insights.

---

## 🌟 Key Features

- **📊 Interactive Kanban Boards:** Drag-and-drop task items across custom stages (To Do, In Progress, Review, Done) with priority tags and assignee tracking.
- **👥 Team Collaboration:** Add and organize team members with custom role configurations in a fully responsive grid interface.
- **📅 Interactive Calendar:** Keep your team synced with a built-in calendar for scheduling tasks, deadlines, and milestone reviews.
- **🔔 Redesigned Alerts System:** Stay updated in real-time with responsive in-app notifications and optional email alerts.
- **🤖 AI-Powered Assistant:** Leverage an integrated Gemini AI engine to help write task descriptions, summarize project activity, and plan schedules.
- **🔒 Security-First Architecture:** Protected by JWT cookies (HTTP-Only), Helmet security headers, CORS isolation, and strict API rate limiting.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), Tailwind CSS, Framer Motion (for micro-animations), Lucide Icons
* **Backend:** Node.js, Express (configured for Serverless deployment)
* **Database:** MongoDB Atlas (via Mongoose)
* **Hosting Platform:** Optimized for **Vercel**'s Free Hobby Tier (Serverless Monolith)

---

## ⚙️ Configuration & Environment Variables

To run this application locally or in production, you must set up the following environment variables. Copy the contents of `.env.example` into a new file called `.env` in the root of your project:

```env
# MongoDB Connection
MONGO_URI="your-mongodb-atlas-connection-string"

# JWT Secret Keys
ACCESS_TOKEN_SECRET="your-jwt-access-token-secret"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_SECRET="your-jwt-refresh-token-secret"
REFRESH_TOKEN_EXPIRY="10d"

# Cloudinary Integration (Used for uploading avatars and file attachments)
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Gemini AI API Key (For AI assistance & diagnostics)
GEMINI_API_KEY="your-gemini-api-key"

# Google OAuth Configuration (Optional - for social login)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# SMTP Email Configuration (Optional - emails will fall back to terminal logs if left blank)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"

# App URL Configuration
APP_URL="http://localhost:3000"
```

---

## 🚀 Running Locally

### Prerequisites
*   Node.js (v18 or higher installed)
*   MongoDB connection (Local community edition or MongoDB Atlas)

### Step-by-Step Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd proflow-os
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   * Create a `.env` file in the root folder.
   * Add the required variables as described in the **Configuration** section.

4. **Start the local server:**
   ```bash
   npm run dev
   ```
   * The app will start locally, running the backend server and loading the Vite frontend on [http://localhost:3000](http://localhost:3000).

## ⚡ Vercel Deployment Optimization

This repository is pre-configured with a Vercel-optimized serverless routing architecture (`vercel.json` and `api/index.js`). The frontend is served instantly via global CDN, and the backend runs serverless on-demand, completely eliminating Render-style 30–60 second cold start delays on Vercel's Hobby tier.
