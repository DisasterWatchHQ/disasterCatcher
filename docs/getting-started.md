# Getting Started with DisasterCatcher

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js >= 18.0.0
- MongoDB >= 5.0
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone https://github.com/DisasterWatchHQ/disasterCatcher.git
cd disasterCatcher
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

4. Start the development server:

```bash
npm run dev
```

## Project Structure

```
disasterCatcher/
├── controllers/         # Route controllers
├── middlewares/        # Custom middleware
├── models/            # Database models
├── routes/            # API routes
├── services/          # Business logic
├── utils/             # Utility functions
├── tests/             # Test files
├── uploads/           # File uploads
└── logs/              # Application logs
```

## Development Workflow

1. **Code Quality**

   - Run linter: `npm run lint`
   - Fix linting issues: `npm run lint:fix`
   - Format code: `npm run format`

2. **Testing**

   - Run tests: `npm test`
   - Run tests with coverage: `npm run test:coverage`

3. **Database Setup**
   - Ensure MongoDB is running or use Atlas
   - Create necessary indexes
   - Set up initial admin user

## Common Tasks

### Creating a New User

1. Register through the API endpoint
2. Verify email (if enabled)
3. Set up user preferences

### Submitting a Disaster Report

1. Authenticate user
2. Provide location details
3. Add description and images
4. Submit for verification

### Verifying Reports

1. Access verification dashboard
2. Review report details
3. Assign severity level
4. Add verification notes
5. Complete verification

## Troubleshooting

### Common Issues

1. **Connection Issues**

   - Check MongoDB connection string
   - Verify network connectivity
   - Check firewall settings

2. **Authentication Problems**

   - Verify JWT secret
   - Check token expiration
   - Validate user credentials

3. **File Upload Issues**
   - Check file size limits
   - Verify file types
   - Check storage permissions

### Getting Help

- Check the [API Documentation](api.md)
- Review [Development Guide](development.md)
- Open an issue on GitHub
- Contact the maintainers

## Next Steps

1. Review the [API Documentation](api.md)
2. Set up your development environment
3. Create your first disaster report
4. Explore the verification workflow
5. Configure push notifications
