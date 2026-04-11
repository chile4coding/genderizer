# Genderize API

A REST API that classifies names by gender using the Genderize.io service.

## Prerequisites

- Node.js >= 18.0.0
- npm

## Installation

```bash
npm install
```

## Development

Run the server with hot reload:

```bash
npm run dev
```

Server runs at `http://localhost:3000`

## Build

Compile TypeScript:

```bash
npm run build
```

## Production

```bash
npm start
```

## API Endpoints

### GET /api/classify

Classifies a name by gender.

**Query Parameters**

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| name      | string | Yes      | Name to classify |

**Example Request**

```
GET /api/classify?name=John
```

**Success Response (200)**

```json
{
  "status": "success",
  "data": {
    "name": "John",
    "gender": "male",
    "probability": 0.99,
    "sample_size": 1000,
    "is_confident": true,
    "processed_at": "2026-04-10T21:00:00.000Z"
  }
}
```

**Error Responses**

- `400` - Missing or empty name parameter
- `422` - Name is not a string
- `502` - Upstream API error

## Project Structure

```
├── src/
│   ├── server.ts       # Express server & routes
│   ├── types.ts        # TypeScript interfaces
│   ├── dist/           # Compiled JavaScript output
│   └── tsconfig.json   # TypeScript configuration
├── package.json
└── README.md
```

## Deployment

This project uses GitHub Actions to deploy to a remote server via SSH.

### Workflow: `.github/workflows/deploy.yml`

The workflow triggers on every push to the `main` branch. It performs the following steps:

1. **Checkout code** - Pulls the latest code from the repository
2. **Setup Node.js** - Installs Node.js 20
3. **Install dependencies** - Runs `npm ci` to install exact versions
4. **Build** - Compiles TypeScript with `npm run build`
5. **Create target directory** - Creates the deployment directory on the server
6. **Copy files** - Transfers built files (`src/dist/`, `package.json`, `package-lock.json`) to the server
7. **Restart app** - Installs production dependencies and starts the app with PM2

### Required GitHub Secrets

Configure these secrets in your GitHub repository (`Settings` → `Secrets and variables` → `Actions`):

| Secret | Description |
| ------ |-------------|
| `SERVER_IP` | IP address of your server |
| `SERVER_PORT` | SSH port (usually 22) |
| `SERVER_USER` | SSH username |
| `SERVER_PASSWORD` | SSH password |
| `SERVER_PATH` | Absolute path where the app will be deployed (e.g., `/home/user/my-app`) |

### Server Requirements

- Node.js >= 18.0.0
- PM2 installed: `npm install -g pm2`
- SSH access configured

### Manual PM2 Commands

If you need to manage the app manually on the server:

```bash
# View logs
pm2 logs my-app

# Restart app
pm2 restart my-app

# Stop app
pm2 stop my-app

# Delete app
pm2 delete my-app
```
