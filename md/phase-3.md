# Phase 3 — Backend API Scaffold & Waitlist Endpoint

> **Goal:** A working Express + Mongoose backend with a `POST /api/waitlist` endpoint connected to your Atlas cluster.

---

## Project Structure

```
sponza-tip-it-now/
├── src/                    # Vite frontend (existing)
├── server/                 # NEW — backend API
│   ├── index.js            # Express entry point
│   ├── db.js               # Mongoose connection
│   ├── models/
│   │   └── Waitlist.js     # Waitlist schema
│   ├── routes/
│   │   └── waitlist.js     # Waitlist API routes
│   ├── middleware/
│   │   └── validate.js     # Zod validation middleware
│   └── .env.local          # Local env vars (gitignored)
├── package.json
└── ...
```

> You can also create a separate repo (`sponsa-api`). Same steps apply — just a different folder.

---

## Step 1 — Initialize the Server

```bash
# From project root
mkdir -p server/models server/routes server/middleware

# Install backend dependencies
cd server
npm init -y
npm install express mongoose dotenv cors zod
npm install -D nodemon
```

### Add scripts to `server/package.json`

```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon index.js",
    "start": "node index.js"
  }
}
```

---

## Step 2 — Database Connection Module

```js
// server/db.js
import mongoose from "mongoose";

export async function connectDb() {
  if (mongoose.connection.readyState === 1) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || "sponsa",
    });
    console.log("✅ Connected to MongoDB Atlas");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
}
```

### Connection best practices

| Rule | Why |
|------|-----|
| Single connection, reused | Mongoose maintains a pool (default 5 connections) |
| `dbName` in connect options | Keeps URI clean, easy to switch dev/prod |
| `readyState` check | Prevents duplicate connections on hot-reload |
| Exit on failure | Don't serve requests without a DB |

---

## Step 3 — Waitlist Model

```js
// server/models/Waitlist.js
import mongoose from "mongoose";

const waitlistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: 100,
  },
  youtubeUrl: {
    type: String,
    required: [true, "YouTube URL is required"],
    trim: true,
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500,
    default: null,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  approvedAt: { type: Date, default: null },
  approvedBy: { type: String, default: null },
  clerkInvitationId: { type: String, default: null },
  clerkUserId: { type: String, default: null },
}, {
  timestamps: true,
});

export const Waitlist = mongoose.model("Waitlist", waitlistSchema);
```

---

## Step 4 — Validation Middleware (Zod)

```js
// server/middleware/validate.js
import { z } from "zod";

export const waitlistBody = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name required").max(100),
  youtubeUrl: z.string().url("Invalid YouTube URL"),
  message: z.string().max(500).optional(),
});

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        issues: result.error.issues.map(i => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
    }
    req.validated = result.data;
    next();
  };
}
```

---

## Step 5 — Waitlist Routes

```js
// server/routes/waitlist.js
import { Router } from "express";
import { Waitlist } from "../models/Waitlist.js";
import { validate, waitlistBody } from "../middleware/validate.js";

const router = Router();

// POST /api/waitlist — new signup
router.post("/", validate(waitlistBody), async (req, res) => {
  try {
    const entry = await Waitlist.create(req.validated);
    return res.status(201).json({
      message: "You're on the waitlist!",
      id: entry._id,
    });
  } catch (error) {
    // Duplicate email
    if (error.code === 11000) {
      return res.status(409).json({
        error: "This email is already on the waitlist.",
      });
    }
    console.error("Waitlist error:", error);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

// GET /api/waitlist/check?email=x — check if email exists
router.get("/check", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email required" });

  const entry = await Waitlist.findOne({ email: email.toLowerCase() });
  return res.json({
    exists: !!entry,
    status: entry?.status || null,
  });
});

export default router;
```

---

## Step 6 — Express Server Entry Point

```js
// server/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDb } from "./db.js";
import waitlistRoutes from "./routes/waitlist.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "10kb" }));

// Routes
app.use("/api/waitlist", waitlistRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", db: !!require("mongoose").connection.readyState });
});

// Start
async function start() {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`🚀 Sponsa API running on port ${PORT}`);
  });
}

start();
```

---

## Step 7 — Environment File

```env
# server/.env.local
MONGODB_URI=mongodb+srv://sponsa_api:YOUR_PASSWORD@sponsa-prod.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=sponsa_dev
PORT=3001
FRONTEND_URL=http://localhost:5173
```

> ⚠️ Add `.env.local` to your `.gitignore` if not already there.

---

## Step 8 — Update .gitignore

Add to the project root `.gitignore`:

```
# Server env
server/.env*
!server/.env.example
```

Create `server/.env.example` for team reference:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=sponsa_dev
PORT=3001
FRONTEND_URL=http://localhost:5173
```

---

## Step 9 — Test the Endpoint

```bash
# Terminal 1: Start server
cd server && npm run dev

# Terminal 2: Test waitlist signup
curl -X POST http://localhost:3001/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test Creator",
    "youtubeUrl": "https://youtube.com/@test",
    "message": "Excited to try Sponsa!"
  }'

# Expected: 201 { "message": "You're on the waitlist!", "id": "..." }

# Test duplicate
curl -X POST http://localhost:3001/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com", "name": "Test", "youtubeUrl": "https://youtube.com/@test" }'

# Expected: 409 { "error": "This email is already on the waitlist." }
```

---

## Step 10 — Verify in Atlas

1. Go to Atlas → **Browse Collections**
2. Database: `sponsa_dev` → Collection: `waitlists`
3. You should see your test document
4. Check **Indexes** tab — confirm `email_1` unique index exists

---

## Connecting Frontend (Vite) to Backend

In your Vite app, call the API:

```js
// src/api/waitlist.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function joinWaitlist({ email, name, youtubeUrl, message }) {
  const res = await fetch(`${API_URL}/api/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, youtubeUrl, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to join waitlist");
  return data;
}
```

Add to Vite's `.env`:

```env
VITE_API_URL=http://localhost:3001
```

> `VITE_*` vars are safe — this is just the API URL, not secrets.

---

## Verification Checklist

- [ ] `npm run dev` starts server on port 3001
- [ ] `POST /api/waitlist` returns 201 with valid data
- [ ] Duplicate email returns 409
- [ ] Invalid data (missing name) returns 400 with Zod errors
- [ ] Document visible in Atlas Data Explorer
- [ ] `.env.local` is gitignored
- [ ] Frontend can call the API without CORS errors

---

→ **[Phase 4](./phase-4.md)** — Clerk authentication, creator onboarding, and the admin approval flow.
