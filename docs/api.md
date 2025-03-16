# API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register User

```http
POST /auth/register
```

**Request Body:**

```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "workId": "string",
  "associated_department": "string"
}
```

**Response:**

```json
{
  "success": true,
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  }
}
```

#### Login

```http
POST /auth/login
```

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "success": true,
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  }
}
```

### Reports

#### Create Report

```http
POST /reports
```

**Request Body:**

```json
{
  "title": "string",
  "disaster_category": "string",
  "description": "string",
  "location": {
    "type": "Point",
    "coordinates": [number, number],
    "address": {
      "city": "string",
      "district": "string",
      "province": "string"
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "report": {
    "id": "string",
    "title": "string",
    "disaster_category": "string",
    "description": "string",
    "location": {
      "type": "Point",
      "coordinates": [number, number],
      "address": {
        "city": "string",
        "district": "string",
        "province": "string"
      }
    },
    "verification_status": "pending",
    "created_at": "string"
  }
}
```

#### Get Reports

```http
GET /reports
```

**Query Parameters:**

- `disaster_category`: Filter by category
- `city`: Filter by city
- `district`: Filter by district
- `province`: Filter by province
- `verification_status`: Filter by status
- `severity`: Filter by severity
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**

```json
{
  "success": true,
  "reports": [...],
  "pagination": {
    "currentPage": number,
    "totalPages": number,
    "totalReports": number
  }
}
```

### Resources

#### Create Resource

```http
POST /resources
```

**Request Body:**

```json
{
  "name": "string",
  "category": "facility|guide|emergency_contact",
  "type": "string",
  "description": "string",
  "location": {
    "type": "Point",
    "coordinates": [number, number],
    "address": {
      "city": "string",
      "district": "string",
      "province": "string"
    }
  },
  "contact": {
    "phone": "string",
    "email": "string"
  }
}
```

**Response:**

```json
{
  "success": true,
  "resource": {
    "id": "string",
    "name": "string",
    "category": "string",
    "type": "string",
    "description": "string",
    "location": {...},
    "contact": {...},
    "created_at": "string"
  }
}
```

### Feed

#### Get Public Feed

```http
GET /feed
```

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `disaster_category`: Filter by category
- `district`: Filter by district

**Response:**

```json
{
  "success": true,
  "reports": [...],
  "pagination": {
    "currentPage": number,
    "totalPages": number,
    "total": number
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "success": false,
  "error": "string"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": "Forbidden"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Rate Limiting

API requests are limited to:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Versioning

The API is versioned through the URL path:

```
/api/...
```

Current version: v1
