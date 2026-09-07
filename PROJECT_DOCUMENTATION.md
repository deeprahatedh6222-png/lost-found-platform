# Project Documentation: Lost & Found Platform

## 1. Problem Statement

People regularly lose or find personal belongings, but many campuses, offices and communities do not have a simple centralized system for reporting these items and connecting them with the correct owner. Information is often scattered across notice boards, messaging groups and social media, which makes searching difficult and may expose personal contact details too early.

## 2. Proposed Solution

The Lost & Found Platform is a full-stack web application where users can create lost/found reports, browse and search existing reports, manage their own posts, submit ownership claims and exchange contact information through a controlled claim workflow.

## 3. Objectives

1. Provide a simple interface for reporting a lost or found item.
2. Make reports searchable by title, description and location.
3. Allow filtering by lost/found type, category and status.
4. Authenticate users securely.
5. Ensure only report owners can edit/delete/change their own reports.
6. Support optional item photographs.
7. Provide a claim request workflow instead of exposing reporter contact details publicly.
8. Allow claim acceptance/rejection and controlled contact exchange.
9. Store all application data persistently in MongoDB.
10. Expose frontend functionality through a clean REST API.

## 4. Functional Requirements

### Authentication
- Register using name, email and password.
- Login using email and password.
- Persist login using JWT in local storage for this student implementation.
- Access protected pages only after login.

### Item Reports
- Create Lost or Found report.
- Enter title, category, description, location and event date.
- Upload an optional image.
- Browse reports.
- Search reports.
- Filter reports.
- View item detail page.
- Edit own report.
- Change own report status.
- Delete own report.

### Claims
- Authenticated non-owner can submit one claim per item.
- Reporter can view all claims on their report.
- Reporter can accept or reject a claim.
- Accepting one claim changes item status to `claimed`.
- Other pending claims on the item are automatically rejected.
- Accepted claimant and reporter can access contact exchange.
- Claimant may withdraw an unaccepted claim.

## 5. Non-Functional Requirements

- Responsive interface for desktop/tablet/mobile.
- Passwords must never be stored as plain text.
- Authorization must be checked on server routes.
- API should return meaningful HTTP status codes and JSON error messages.
- Uploaded files must be type and size restricted.
- MongoDB indexes should support common filtering/search patterns.

## 6. System Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│ Home • Auth • Report • My Reports • Claims • Details    │
└───────────────────────┬──────────────────────────────────┘
                        │ HTTPS / REST / JSON
                        │ Multipart FormData for images
┌───────────────────────▼──────────────────────────────────┐
│                  Node.js + Express API                   │
│ Routes → Middleware → Controllers → Mongoose Models     │
│ JWT Auth • Multer Upload • Ownership/Claim Validation   │
└───────────────┬─────────────────────────────┬────────────┘
                │                             │
        ┌───────▼────────┐             ┌──────▼───────┐
        │    MongoDB     │             │ Local Upload │
        │ Users/Items/   │             │   Storage    │
        │ Claims         │             │ (dev/demo)   │
        └────────────────┘             └──────────────┘
```

## 7. Frontend Design

### Major Pages

#### Home / Browse
- Hero section explaining workflow.
- Search by title/description/location.
- Filter by type, category and status.
- Location field.
- Responsive item card grid.
- Pagination.

#### Login / Register
- Controlled forms.
- API error display.
- Authentication state stored centrally through React Context.

#### Report Item
- Lost/Found selector.
- Category selector.
- Item title and description.
- Location and date.
- Optional image upload.
- Form sent as `multipart/form-data`.

#### Item Details
- Image and complete report information.
- Claim submission form for non-owner users.
- Claim state display for the claimant.
- Contact reveal after acceptance.

#### My Reports
- Displays current user's reports.
- Edit button.
- Status control.
- Delete button.

#### Claim Inbox
- Groups claim requests by report.
- Displays claimant name and message.
- Accept/reject controls.

#### My Claims
- Shows claims submitted by current user.
- Displays status.
- Allows withdrawal before acceptance.
- Reveals contact details after acceptance.

## 8. Backend Design

### Request Pipeline

```text
Request
  ↓
Express Router
  ↓
Authentication Middleware (if private)
  ↓
Multer Middleware (if image upload)
  ↓
Controller
  ↓
Mongoose Model
  ↓
MongoDB
  ↓
JSON Response
```

### Auth Middleware

The middleware reads:

```http
Authorization: Bearer <JWT>
```

It verifies the token, finds the user and places the user object in `req.user`.

### Ownership Protection

For update/delete/status actions, the backend compares:

```text
item.user === req.user._id
```

This prevents a user from modifying another person's report even if they manually call the API.

## 9. Database Relationship

```text
User 1 ─────────────< Item
  │                    │
  │                    │
  └────────────< Claim >──────────── 1 Item
              claimant
```

More explicitly:
- One user can create many item reports.
- One user can submit many claims.
- One item can receive many claims.
- Each `(item, claimant)` pair is unique.

## 10. API Response Examples

### Register

Request:

```json
{
  "name": "Aarav Patil",
  "email": "aarav@example.com",
  "password": "secret123"
}
```

Response:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "...",
    "name": "Aarav Patil",
    "email": "aarav@example.com"
  }
}
```

### Create Item

Use `multipart/form-data` fields:

```text
itemType: lost
title: Black wallet
description: Black leather wallet with a college card inside
category: Wallet / Bag
location: Main Building
-eventDate: 2026-09-07
image: <file>
```

### Submit Claim

```json
{
  "itemId": "<item_id>",
  "message": "The wallet has a small blue mark on the inside and contains my college ID."
}
```

### Change Report Status

```json
{
  "status": "resolved"
}
```

## 11. HTTP Status Codes Used

| Code | Meaning in Project |
|---|---|
| 200 | Successful read/update/delete |
| 201 | Resource created |
| 400 | Invalid input / invalid workflow action |
| 401 | Authentication required or token invalid |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Duplicate account/claim conflict |
| 500 | Unexpected server error |

## 12. Search and Filtering

The browse API constructs a MongoDB filter dynamically. Search performs case-insensitive partial matching on:
- title
- description
- location

Additional filters:
- item type
- category
- status
- location

Pagination prevents the server from returning an unlimited number of records in one response.

## 13. Image Upload Flow

1. Frontend builds a `FormData` object.
2. Image is added using field name `image`.
3. Multer validates extension/MIME type.
4. Maximum image size is 5 MB.
5. File is stored in `backend/uploads`.
6. Item stores a relative `imageUrl` such as `/uploads/123-image.jpg`.
7. Express serves this directory statically.

For production, use cloud object storage instead of local files.

## 14. Claim Workflow

```text
OPEN REPORT
    ↓
User submits claim
    ↓
PENDING
   / \
  /   \
Accept Reject
  │      │
  ▼      ▼
ACCEPTED REJECTED
  │
  ├─ Item becomes CLAIMED
  ├─ Other pending claims become REJECTED
  └─ Contact exchange becomes available
           ↓
      Reporter can mark item RESOLVED
```

## 15. Validation Rules

### User
- Name required, 2–60 characters.
- Email required and unique.
- Password minimum 6 characters.

### Item
- Type must be `lost` or `found`.
- Title required, maximum 100 characters.
- Description required, maximum 1000 characters.
- Location required, maximum 120 characters.
- Date required.
- Status restricted to `open`, `claimed`, `resolved`.

### Claim
- Item required.
- Claimant required.
- Message required, max 500 characters.
- One claim per user per item.
- Cannot claim own report.
- Cannot claim a resolved report.

## 16. Suggested Test Cases

| Test | Expected Result |
|---|---|
| Register new valid user | 201 + token |
| Register duplicate email | 409 |
| Login with wrong password | 401 |
| Create item without token | 401 |
| Create valid lost item | 201 |
| Browse items without login | 200 |
| Search by word | Matching reports |
| User A edits User B report | 403 |
| Owner changes status | 200 |
| Non-owner deletes report | 403 |
| User claims own report | 400 |
| Submit first valid claim | 201 |
| Submit duplicate claim | 409 |
| Non-owner tries to accept claim | 403 |
| Owner accepts claim | Claim accepted + item claimed |
| Request contact before acceptance | 403 |
| Accepted claimant requests contact | 200 |
| Delete own report | Report and associated claims removed |

## 17. Future Scope

- Automatic matching suggestions using NLP/embeddings.
- Map-based location search.
- Email/SMS notifications.
- OTP/email verification.
- Forgot-password workflow.
- Admin moderation dashboard.
- Report abuse / suspicious claim handling.
- Chat system without revealing email.
- QR labels for institutional lost-and-found desks.
- Cloud image storage.
- Push notifications.
- Analytics dashboard.
- Unit/integration/end-to-end tests.

## 18. Conclusion

The application satisfies the required CRUD and authentication functionality while extending the basic problem statement with a practical claim-management process, image handling, category/location/date metadata, contact privacy, filtering, pagination and responsive frontend design. The code is separated into frontend, API, middleware, controllers and database models so that it can be maintained and expanded as a real full-stack project.
