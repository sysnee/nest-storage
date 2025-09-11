# Storage Bucket Service

A Nest.js application that provides S3-like storage bucket functionality for file upload, download, and management.

## Features

- **File Upload**: Upload files with validation (size, type)
- **File Download**: Download files by ID
- **File Metadata**: Get file information without downloading
- **File Deletion**: Delete files by ID
- **File Listing**: List all uploaded files with pagination
- **Health Check**: Service health monitoring
- **Swagger Documentation**: API documentation at `/api`

## API Endpoints

### Upload File
```
POST /storage/upload
Content-Type: multipart/form-data
Body: file (multipart file)
```

### Download File
```
GET /storage/files/{id}
```

### Get File Info
```
GET /storage/files/{id}/info
```

### Delete File
```
DELETE /storage/files/{id}
```

### List Files
```
GET /storage/files?limit=10&offset=0
```

### Health Check
```
GET /storage/health
```

## File Restrictions

- **Max Size**: 100MB
- **Allowed Types**: 
  - Images: JPEG, PNG, GIF, WebP
  - Documents: PDF, TXT, JSON
  - Archives: ZIP
  - Media: MP4, MP3

## Installation

```bash
npm install
```

## Development

```bash
npm run start:dev
```

## Production

```bash
npm run build
npm run start:prod
```

## Docker

```bash
docker-compose up -d
```

## API Documentation

Visit `http://localhost:3000/api` for Swagger documentation.
