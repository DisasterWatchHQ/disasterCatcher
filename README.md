# Disaster Catcher Backend

A robust backend system for managing disaster-related resources, warnings, and user feedback.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Users](#users)
  - [Resources](#resources)
  - [Warnings](#warnings)
  - [Feedback](#feedback)
  - [Notifications](#notifications)
- [Models](#models)
- [Testing](#testing)

## Features

- User authentication and authorization
- Resource management (facilities, guides, emergency contacts)
- Real-time disaster warnings
- User feedback system
- Push notifications
- Location-based services
- Admin dashboard
- Comprehensive test coverage

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd disasterCatcher
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see Environment Variables section)

4. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

## API Documentation

### Authentication

#### POST /api/users/login
Login user and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "public|official"
  }
}
```

#### POST /api/users/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST /api/users/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token",
  "password": "new_password"
}
```

### Users

#### GET /api/users
Get all users (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

#### PATCH /api/users/preferences
Update user preferences.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "notification_preferences": {
    "email": true,
    "push": true
  },
  "language": "en"
}
```

### Resources

#### POST /api/resources
Create a new resource.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Resource Name",
  "category": "facility|guide|emergency_contact",
  "type": "hospital|disaster_guide|emergency_number",
  "contact": {
    "phone": "1234567890",
    "email": "contact@example.com"
  },
  "location": {
    "type": "point",
    "coordinates": [longitude, latitude],
    "address": {
      "formatted_address": "Full Address",
      "city": "City",
      "district": "District",
      "province": "Province",
      "details": "Additional Details"
    }
  },
  "availability_status": "open|closed|under_maintenance",
  "operating_hours": {
    "monday": { "open": "09:00", "close": "17:00", "is24Hours": false }
  },
  "metadata": {
    "capacity": 100,
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "serviceHours": "24/7"
  }
}
```

#### GET /api/resources/facilities
Get facilities with filters.

**Query Parameters:**
- type: facility type
- availability_status: current status
- city: city name
- latitude: latitude for nearby search
- longitude: longitude for nearby search
- maxDistance: maximum distance in meters

#### GET /api/resources/guides
Get guides with filters.

**Query Parameters:**
- type: guide type
- tags: comma-separated tags

#### GET /api/resources/emergency-contacts
Get emergency contacts with filters.

**Query Parameters:**
- emergency_level: high|medium|low

### Warnings

#### POST /api/warnings
Create a new warning.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Warning Title",
  "description": "Warning Description",
  "disaster_category": "fire|flood|earthquake",
  "severity": "high|medium|low",
  "location": {
    "type": "point",
    "coordinates": [longitude, latitude],
    "radius": 5000
  },
  "affected_areas": ["Area 1", "Area 2"],
  "instructions": ["Instruction 1", "Instruction 2"]
}
```

#### GET /api/warnings/active
Get active warnings.

#### GET /api/warnings
Get warnings with filters.

**Query Parameters:**
- disaster_category: category of disaster
- severity: warning severity
- status: warning status
- latitude: latitude for location-based search
- longitude: longitude for location-based search
- radius: search radius in kilometers

### Feedback

#### POST /api/feedback
Submit feedback.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "feedback_type": "bug|feature_request|improvement|other",
  "message": "Feedback message"
}
```

#### GET /api/feedback
Get all feedback.

**Query Parameters:**
- feedback_type: type of feedback
- status: feedback status

#### PUT /api/feedback/:id
Update feedback status (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "pending|in_progress|resolved|rejected",
  "admin_response": {
    "message": "Admin response message"
  }
}
```

### Notifications

#### PATCH /api/users/push-token
Update user's push notification token.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "push_token": "device_push_token"
}
```

## Models

### User Model
```javascript
{
  name: String,
  email: String,
  password: String,
  workId: String,
  associated_department: String,
  role: enum('public', 'official'),
  isVerified: Boolean,
  location: {
    latitude: Number,
    longitude: Number
  },
  preferences: {
    notification_preferences: {
      email: Boolean,
      push: Boolean
    },
    language: String
  },
  push_token: String
}
```

### Resource Model
```javascript
{
  name: String,
  category: enum('facility', 'guide', 'emergency_contact'),
  type: String,
  description: String,
  content: String,
  contact: {
    phone: String,
    email: String
  },
  location: {
    type: String,
    coordinates: [Number],
    address: {
      formatted_address: String,
      city: String,
      district: String,
      province: String,
      details: String
    }
  },
  availability_status: enum('open', 'closed', 'under_maintenance'),
  operating_hours: Object,
  emergency_level: enum('high', 'medium', 'low'),
  metadata: Object,
  added_by: ObjectId,
  status: enum('active', 'inactive'),
  tags: [String]
}
```

### Warning Model
```javascript
{
  title: String,
  description: String,
  disaster_category: enum('fire', 'flood', 'earthquake'),
  severity: enum('high', 'medium', 'low'),
  status: enum('active', 'resolved', 'cancelled'),
  location: {
    type: String,
    coordinates: [Number],
    radius: Number
  },
  affected_areas: [String],
  instructions: [String],
  created_by: ObjectId,
  updates: [{
    message: String,
    timestamp: Date,
    created_by: ObjectId
  }],
  resolved_at: Date,
  resolved_by: ObjectId
}
```

### Feedback Model
```javascript
{
  user_id: ObjectId,
  feedback_type: enum('bug', 'feature_request', 'improvement', 'other'),
  message: String,
  status: enum('pending', 'in_progress', 'resolved', 'rejected'),
  admin_response: {
    message: String,
    timestamp: Date,
    admin_id: ObjectId
  },
  created_at: Date,
  updated_at: Date
}
```

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

The test suite includes:
- Unit tests for models and controllers
- Integration tests for API endpoints
- Authentication and authorization tests
- Validation tests
- Error handling tests

## License

[Your License Here]
