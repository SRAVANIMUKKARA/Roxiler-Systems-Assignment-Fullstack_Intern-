High-Level Architecture
Tech Stack (recommended):

Backend: NestJS (clean architecture + TypeScript)

Database: PostgreSQL

Frontend: ReactJS (with hooks and functional components)

User Roles:

System Administrator

Normal User

Store Owner

Authentication:

Single login system (JWT-based authentication)

Role-based access control (guards/interceptors)

🟡 2️⃣ Database Schema Design
Below is a PostgreSQL schema that satisfies all requirements:

🗄️ Tables
users
Field	Type	Constraints
id	UUID	PK, default: uuid_generate_v4()
name	VARCHAR(60)	NOT NULL, min 20 chars
email	VARCHAR(255)	UNIQUE, NOT NULL
password_hash	VARCHAR(255)	NOT NULL
address	VARCHAR(400)	NOT NULL
role	ENUM	('admin','user','owner')
created_at	TIMESTAMP	default: now()
updated_at	TIMESTAMP	default: now()

stores
Field	Type	Constraints
id	UUID	PK, default: uuid_generate_v4()
name	VARCHAR(255)	NOT NULL
email	VARCHAR(255)	NOT NULL
address	VARCHAR(400)	NOT NULL
owner_id	UUID	FK -> users(id)
created_at	TIMESTAMP	default: now()
updated_at	TIMESTAMP	default: now()

ratings
Field	Type	Constraints
id	UUID	PK, default: uuid_generate_v4()
user_id	UUID	FK -> users(id)
store_id	UUID	FK -> stores(id)
rating	INT	CHECK (rating BETWEEN 1 AND 5)
created_at	TIMESTAMP	default: now()
updated_at	TIMESTAMP	default: now()

🔍 Indexes and Constraints

UNIQUE(user_id, store_id) on ratings table to ensure 1 rating per user per store

Email UNIQUE in users and stores

Foreign keys with cascade delete if desired

🟢 3️⃣ Backend API Design
Here’s a sample set of REST endpoints:

Auth Routes
pgsql
Copy
Edit
POST   /auth/signup        // Normal user registration
POST   /auth/login         // Login (all roles)
POST   /auth/update-password
Admin Routes
(Protected with role: admin)

pgsql
Copy
Edit
POST   /admin/users                 // Create users (admin or normal)
GET    /admin/users                 // List users with filters/sorting
GET    /admin/users/:id             // User details
POST   /admin/stores                // Create store
GET    /admin/stores                // List stores with filters/sorting
GET    /admin/dashboard             // Stats (users, stores, ratings)
User Routes
(Protected with role: user)

bash
Copy
Edit
GET    /stores                      // List all stores
GET    /stores/:id                  // Store details
POST   /stores/:id/ratings          // Submit rating
PUT    /stores/:id/ratings          // Update rating
Store Owner Routes
(Protected with role: owner)

swift
Copy
Edit
GET    /owner/dashboard             // See list of ratings, avg rating
Security Best Practices:

Use bcrypt for password hashing

Use JWT for sessions (token expiration + refresh if needed)

Apply role guards in NestJS

Input validation DTOs in NestJS (class-validator)

🟡 4️⃣ Frontend Features in React
Common Features
Login page

Role-based routing/dashboard

Logout

Admin Panel
Dashboard stats cards (total users, stores, ratings)

Create user form (name, email, password, address, role)

Create store form (store info + assign owner)

Tables with:

Filters (Name, Email, Address, Role)

Sorting (ascending/descending)

Pagination

Store list (name, email, address, average rating)

Normal User
Signup form

Stores list with:

Store Name

Address

Overall rating

User’s rating

Submit/update rating button

Search bar by Name/Address

Password update page

Store Owner
Dashboard:

List of users who rated the store

Average store rating

Password update page

🟢 5️⃣ Form Validations
Implement in both frontend and backend DTOs:

Field	Validation
Name	Min 20 chars, Max 60 chars
Address	Max 400 chars
Password	8–16 chars, at least 1 uppercase, 1 special char
Email	Standard email format validation

React: use react-hook-form or Formik + Yup schema validation.

🟡 6️⃣ Suggested Folder Structure
NestJS
css
Copy
Edit
src/
  modules/
    auth/
    users/
    stores/
    ratings/
  common/
  main.ts
React
cpp
Copy
Edit
src/
  components/
  pages/
  services/   // Axios API calls
  utils/
  App.js
  index.js
🟢 7️⃣ Additional Notes and Best Practices
✅ Use environment variables (.env) for secrets and DB credentials
✅ Sanitize and validate all inputs
✅ Use TypeORM or Prisma for DB migrations and schema management
✅ Consistent error handling (e.g., NestJS Exception Filters)
✅ Modular, clean code separation
✅ Responsive UI styling (Tailwind or Material UI)
✅ Accessibility and ARIA attributes for forms
