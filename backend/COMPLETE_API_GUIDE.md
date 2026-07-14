# Healthcare Backend API - Complete Guide

## Server Information
**Base URL**: `http://localhost:3000`

**Status**: Active development

**Database**: MongoDB connected

## Available Request URLs

### General Endpoints
```text
GET  http://localhost:3000/health
GET  http://localhost:3000/api
GET  http://localhost:3000/api/test
```

### Authentication Endpoints
```text
POST http://localhost:3000/api/auth/register
POST http://localhost:3000/api/auth/login
GET  http://localhost:3000/api/auth/profile
PUT  http://localhost:3000/api/auth/profile
PUT  http://localhost:3000/api/auth/change-password
POST http://localhost:3000/api/auth/logout
GET  http://localhost:3000/api/auth/validate-token
```

### User Management Endpoints
```text
GET  http://localhost:3000/api/patients
GET  http://localhost:3000/api/patients/:id
GET  http://localhost:3000/api/doctors
GET  http://localhost:3000/api/doctors/:id
```

### Medical Case Endpoints
```text
GET    http://localhost:3000/api/cases
POST   http://localhost:3000/api/cases
GET    http://localhost:3000/api/cases/:id
PUT    http://localhost:3000/api/cases/:id
DELETE http://localhost:3000/api/cases/:id

GET  http://localhost:3000/api/cases/my/cases
POST http://localhost:3000/api/cases/:id/comments
POST http://localhost:3000/api/cases/:id/like
```

## Registration Requirements

### Patient Registration
Required:
- `firstName`
- `lastName`
- `email`
- `password`
- `userType: "patient"`

Optional:
- `phone`
- `dateOfBirth`
- `gender`
- `address`
- `emergencyContact`
- `medicalHistory`
- `allergies`

### Doctor Registration
Required:
- `firstName`
- `lastName`
- `email`
- `password`
- `userType: "doctor"`
- `specialization`
- `licenseNumber`

Optional:
- `phone`
- `dateOfBirth`
- `gender`
- `address`
- `experience`
- `qualifications`

## Login Requirements

Required:
- `email`
- `password`

Successful login returns:
- `user`
- `token`
- `refreshToken`

The backend also sets auth cookies for browser sessions.

## Protected Routes

Include the JWT in the request header:

```text
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

Protected auth routes currently include:
- `GET /api/auth/profile`
- `PUT /api/auth/profile`
- `PUT /api/auth/change-password`
- `POST /api/auth/logout`
- `GET /api/auth/validate-token`

## Response Formats

### Success
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Error description"
}
```

## Testing Your API

1. Send a registration or login request.
2. Copy the returned token.
3. Use the token in `Authorization: Bearer ...` for protected endpoints.

## Notes

- The backend supports more than just patient and doctor roles.
- Some parts of the codebase are still under active development, so avoid describing this guide as production-ready.
