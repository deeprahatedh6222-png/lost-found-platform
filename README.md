# Lost & Found Platform — Full-Stack Web Application

A complete Lost & Found project built with React, Express.js, and **Supabase** (PostgreSQL + Storage). Users can register/login, report lost or found belongings, browse/search/filter reports, update report status, edit/delete their own reports, upload an image, submit ownership claims, review claim requests, and exchange contact information only after a claim is accepted.

## 1. Tech Stack

### Frontend
- React 18
- Vite
- React Router
- Axios
- Responsive CSS

### Backend
- Node.js
- Express.js
- JWT authentication
- bcrypt password hashing
- Multer image uploads (memory storage → Supabase Storage)
- Morgan request logging

### Database & Storage
- **Supabase** (PostgreSQL)
- Supabase Storage (image uploads)

### API Style
- REST API
- JSON for normal requests/responses
- `multipart/form-data` for item forms containing an image

## 2. Core Requirements Covered

| Requirement | Implementation |
|---|---|
| Create | Authenticated users report a lost/found item |
| Read | Public browse, search and filtering |
| Update | Owner edits report and changes status |
| Delete | Owner removes report |
| Auth | Register, login, JWT-protected routes |

## 3. Optional Additions Included

- Image upload (Supabase Storage)
- Category tagging
- Location and lost/found date
- Claim request workflow
- Accept/reject claims
- Automatic rejection of competing pending claims after one is accepted
- Contact information exchange after claim acceptance
- Pagination
- Search and filters
- Responsive dashboard UI

## 4. Project Structure

```text
lost-found-platform/
├── backend/
│   ├── config/
│   │   ├── supabase.js       # Supabase client
│   │   └── schema.sql        # Database schema (run in Supabase SQL Editor)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── itemController.js
│   │   └── claimController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── itemRoutes.js
│   │   └── claimRoutes.js
│   ├── .env.example
│   ├── seed.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/axios.js
│   │   ├── components/
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── PROJECT_DOCUMENTATION.md
├── LostFound.postman_collection.json
├── package.json
└── .gitignore
```

## 5. Database Tables (Supabase / PostgreSQL)

### users
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| name | TEXT | 2–60 characters |
| email | TEXT | Unique |
| password | TEXT | bcrypt hash |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto (trigger) |

### items
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| user_id | UUID (FK → users) | Reporter |
| item_type | TEXT | 'lost' or 'found' |
| title | TEXT | Max 100 chars |
| description | TEXT | Max 1000 chars |
| category | TEXT | Enum: Electronics, Documents, etc. |
| location | TEXT | Max 120 chars |
| event_date | DATE | When item was lost/found |
| status | TEXT | 'open', 'claimed', 'resolved' |
| image_url | TEXT | Supabase Storage public URL |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto (trigger) |

### claims
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| item_id | UUID (FK → items) | |
| claimant_id | UUID (FK → users) | |
| message | TEXT | Max 500 chars |
| status | TEXT | 'pending', 'accepted', 'rejected' |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto (trigger) |

A unique constraint on `(item_id, claimant_id)` prevents duplicate claims.

## 6. REST API

Base URL: `http://localhost:5001/api`

### Authentication
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account |
| POST | `/auth/login` | Public | Login and receive JWT |
| GET | `/auth/me` | Private | Get current user |

### Items
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/items` | Public | Browse/search/filter reports |
| GET | `/items/:id` | Public | Read one report |
| GET | `/items/mine` | Private | Current user's reports |
| POST | `/items` | Private | Create report with optional image |
| PUT | `/items/:id` | Private/Owner | Edit report |
| PATCH | `/items/:id/status` | Private/Owner | Change report status |
| DELETE | `/items/:id` | Private/Owner | Delete report |

Supported browse query parameters:

```text
search=phone
itemType=lost
category=Electronics
status=open
location=Library
page=1
limit=12
```

### Claims
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/claims` | Private | Submit claim |
| GET | `/claims/mine` | Private | Claims submitted by current user |
| GET | `/claims/item/:itemId` | Private/Item Owner | Claims received for report |
| PATCH | `/claims/:id/status` | Private/Item Owner | Accept or reject claim |
| DELETE | `/claims/:id` | Private/Claimant | Withdraw pending/rejected claim |
| GET | `/claims/:id/contact` | Private/Participants | Contact exchange after acceptance |

## 7. Setup Instructions

### Prerequisites

- Node.js 18+
- npm
- A **Supabase** project ([create one here](https://supabase.com))

### A. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `backend/config/schema.sql`
3. Go to **Storage** → Create a new bucket named `item-images` → Set it to **Public**
4. Copy your **Project URL** and **Service Role Key** from **Settings → API**

### B. Configure backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=5001
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
JWT_SECRET=use_a_long_random_secret_here
CLIENT_URL=http://localhost:5173
```

Install packages:

```bash
npm install
```

Optional demo data:

```bash
npm run seed
```

Demo login after seeding:
- `alice@example.com` / `password123`
- `bob@example.com` / `password123`

Start backend:

```bash
npm run dev
```

Backend runs at `http://localhost:5001`.

### C. Configure frontend

Open another terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

### D. Run both with one command (optional)

From the project root:

```bash
npm install
npm run install:all
npm run dev
```

## 8. Main User Flow

1. User registers or logs in.
2. User chooses **Report Item**.
3. User selects Lost/Found, category, title, description, location, date and optional image.
4. Report is stored in Supabase and appears in public browsing.
5. Another user searches or filters reports.
6. They open the report and submit a claim with identifying information.
7. Reporter opens **Claim Inbox** and accepts/rejects the claim.
8. If accepted, report automatically becomes `claimed` and other pending claims are rejected.
9. The accepted claimant can reveal the reporter's contact email.
10. Reporter can finally mark the item as `resolved`.

## 9. Authentication & Security

- Passwords are hashed with bcrypt.
- JWT tokens expire after 7 days.
- Protected API routes require:

```http
Authorization: Bearer <token>
```

- Ownership checks happen on the backend, not only the UI.
- Reporter email is not exposed publicly.
- Contact exchange is locked until a claim is accepted.
- Image uploads are restricted to JPG/JPEG/PNG/WEBP and 5 MB.
- Images are stored in Supabase Storage (public bucket).

## 10. API Testing

Import `LostFound.postman_collection.json` into Postman. The collection contains auth, item and claim request examples. Save the login token into the collection variable `token` before testing protected routes.

> **Note:** Update the base URL in Postman to `http://localhost:5001/api`.

## 11. Production Improvements

For a real deployment: add email verification and password reset, use HTTP-only cookies for authentication, add rate limiting and Helmet, add moderation/admin controls, add automated tests, and deploy frontend/backend separately.
