# DevPulse API

## Live URL

https://no-de-js-project.vercel.app


## Github URL

https://github.com/jobayedsmt/next-assignment-2

---

## Project Overview

DevPulse is a collaborative issue tracking platform designed for software development teams. It allows contributors to report bugs and submit feature requests while maintainers manage issue workflows and project progress.

The application includes authentication, role-based authorization, issue management, filtering, sorting, and status tracking.

---

## Features

### Authentication & Authorization

* User Registration
* User Login with JWT Authentication
* Password Hashing using bcrypt
* Role-Based Access Control
* Protected Routes

### Issue Management

* Create Issues
* Retrieve All Issues
* Retrieve Single Issue
* Update Issues
* Delete Issues (Maintainer Only)

### Filtering & Sorting

* Filter by Issue Type
* Filter by Issue Status
* Sort by Newest
* Sort by Oldest

### Security

* JWT Authentication
* Password Encryption
* Input Validation
* Protected Endpoints

---

## Tech Stack

### Backend

* Node.js
* Express.js
* TypeScript

### Database

* PostgreSQL
* pg (Node PostgreSQL Driver)

### Authentication

* JSON Web Token (JWT)
* bcrypt

### Development Tools

* Nodemon
* dotenv

---

## Project Structure

```text
src
│
├── config
├── db
├── middleware
├── modules
│   ├── auth
│   └── issues
├── utils
├── app.ts
└── server.ts
```

---

## Installation & Setup

### Clone Repository

```bash
git clone https://github.com/jobayedsmt/next-assignment-2
cd devpulse
```

### Install Dependencies

```bash
npm install
```

### Create Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000

DATABASE_URL=your_postgresql_connection_string

JWT_SECRET=your_secret_key
```

### Run Project

Development Mode:

```bash
npm run dev
```

Production Build:

```bash
npm run build
npm start
```

---

## API Endpoints

### Authentication

#### Register User

```http
POST /api/auth/signup
```

#### Login User

```http
POST /api/auth/login
```

---

### Issues

#### Create Issue

```http
POST /api/issues
```

Protected Route

#### Get All Issues

```http
GET /api/issues
```

Optional Query Parameters:

```http
GET /api/issues?sort=newest
GET /api/issues?sort=oldest

GET /api/issues?type=bug

GET /api/issues?status=open
```

#### Get Single Issue

```http
GET /api/issues/:id
```

#### Update Issue

```http
PATCH /api/issues/:id
```

Protected Route

#### Delete Issue

```http
DELETE /api/issues/:id
```

Maintainer Only

---

## Database Schema Summary

### Users Table

| Field      | Type               |
| ---------- | ------------------ |
| id         | SERIAL PRIMARY KEY |
| name       | VARCHAR            |
| email      | VARCHAR UNIQUE     |
| password   | VARCHAR            |
| role       | VARCHAR            |
| created_at | TIMESTAMP          |
| updated_at | TIMESTAMP          |

### Issues Table

| Field       | Type               |
| ----------- | ------------------ |
| id          | SERIAL PRIMARY KEY |
| title       | VARCHAR(150)       |
| description | TEXT               |
| type        | VARCHAR            |
| status      | VARCHAR            |
| reporter_id | INTEGER            |
| created_at  | TIMESTAMP          |
| updated_at  | TIMESTAMP          |

---

## Business Rules

### Roles

#### Contributor

* Create Issues
* View Issues
* Update Own Issues
* Can Update Only When Status Is Open

#### Maintainer

* Create Issues
* View Issues
* Update Any Issue
* Delete Any Issue

---

## Validation Rules

### User

* Email Must Be Unique
* Password Is Required
* Role Must Be Contributor Or Maintainer

### Issue

* Title Maximum 150 Characters
* Description Minimum 20 Characters
* Type Must Be:

  * bug
  * feature_request
* Status Must Be:

  * open
  * in_progress
  * resolved

---

## Author

Developed as part of the DevPulse Backend API Assignment using Node.js, Express.js, TypeScript, PostgreSQL, JWT Authentication, and Raw SQL.
