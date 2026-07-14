# Healthcare API Documentation

## Overview
MedInternia provides a healthcare and medical learning API for patients, interns, doctors, admins, moderators, and hospital staff.

The backend currently supports:
- JWT-based authentication
- Cookie-backed sessions for browser clients
- Bearer-token authentication for API clients
- Role-based access control across multiple user types

## Base URL
```text
http://localhost:3000/api
```

## Authentication

The API accepts either of the following for protected routes:

- `Authorization: Bearer <jwt_token>`
- `token` cookie set by the login or register response

For browser clients, the frontend stores the token in localStorage and also receives an `HttpOnly` cookie from the backend. For API clients, include the JWT in the `Authorization` header.

## User Types

- `patient`: Can manage their profile, cases, and personal medical information
- `doctor`: Can create and moderate cases, review content, and manage professional profile data
- `intern`: Can participate in learning workflows, discussions, and case reviews
- `admin`: Has elevated access for moderation and user management
- `moderator`: Can moderate cases and comments
- `hospital_staff`: Can participate in selected collaboration workflows

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
```http
POST /api/auth/register
```

Creates a new user account and returns:
- `user`
- `token`
- `refreshToken`

The response also sets authentication cookies for browser sessions.

**Common required fields**
```json
{
  "firstName": "Blue",
  "lastName": "Spies",
  "email": "bluespies@gmail.com",
  "password": "Test@123",
  "userType": "patient"
}
```

**Patient-specific fields may include**
```json
{
  "phone": "9639740956",
  "dateOfBirth": "2008-01-01",
  "gender": "male",
  "address": {
    "street": "LM Thapar",
    "city": "Chandigarh",
    "state": "Chandigarh",
    "zipCode": "302019",
    "country": "India"
  },
  "emergencyContact": {
    "name": "Emergency Contact Name",
    "phone": "5268979933",
    "relationship": "Father"
  },
  "medicalHistory": ["No major illness"],
  "allergies": ["None"]
}
```

**Doctor-specific fields may include**
```json
{
  "phone": "9876543210",
  "dateOfBirth": "1985-05-15",
  "gender": "male",
  "address": {
    "street": "456 LMT",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "India"
  },
  "specialization": "Cardiology",
  "licenseNumber": "DOC12345",
  "experience": 10,
  "qualifications": ["MBBS", "MD"]
}
```

#### Login
```http
POST /api/auth/login
```

Returns the same token and cookie behavior as registration.

```json
{
  "email": "bluespies@gmail.com",
  "password": "Test@123"
}
```

#### Get Profile
```http
GET /api/auth/profile
```
Requires authentication.

#### Update Profile
```http
PUT /api/auth/profile
```
Requires authentication.

#### Change Password
```http
PUT /api/auth/change-password
```
Requires authentication.

> Note: the route is `PUT`, not `POST`.

#### Logout
```http
POST /api/auth/logout
```
Requires authentication. This invalidates the current token on the backend and clears the session cookies.

#### Validate Session
```http
GET /api/auth/validate-token
```
Requires authentication. Returns the current authenticated user.

### Additional Routes

#### Health Check
```http
GET /health
```

#### API Information
```http
GET /api
```

## Security Features

1. Passwords are hashed with bcrypt
2. JWT is used for authentication
3. CORS and Helmet are enabled
4. Route access is controlled by role-based authorization

## Environment Variables

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/healthcare_db
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

## Required Fields

### For All Users
- `firstName`: required, max 50 characters
- `lastName`: required, max 50 characters
- `email`: required, unique, valid email format
- `password`: required
- `userType`: required, one of `patient`, `doctor`, `intern`, `admin`, `hospital_staff`, `moderator`

### Optional Fields for All Users
- `phone`
- `dateOfBirth`
- `gender`
- `address`

### Additional Required Fields for Doctors
- `specialization`
- `licenseNumber`

### Additional Optional Fields for Doctors
- `experience`
- `qualifications`

### Additional Optional Fields for Patients
- `emergencyContact`
- `medicalHistory`
- `allergies`

## Getting Started

1. Install MongoDB and ensure it is running
2. Clone the repository and install dependencies
3. Set up environment variables in a `.env` file
4. Start the development server with `npm run dev`
5. The API will be available at `http://localhost:3000`

## Testing

Use Postman, curl, or any HTTP client. Register or log in first, then send the returned token in the `Authorization` header for protected routes.
