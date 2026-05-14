# OPTIROSTER

## Overview

OPTIROSTER is a full-stack roster management application built with Go, PostgreSQL, HTML, CSS, and vanilla JavaScript. It manages workers, locations, days off, worker constraints, permanent restrictions, occupancies, and saved rosters.

The goal is to reduce scheduling mistakes by automatically generating rosters that respect worker availability, requested days off, permanent restrictions, existing occupancies, and worker constraints.

## Technologies

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Go with Gin
- Database: PostgreSQL
- Migrations: golang-migrate
- Authentication/session storage: Gin sessions

## Project Structure

```text
backend/
  main.go
  migrations/
  models/
frontend/
  css/
  html/
  views/
.vscode/
  settings.json
```

## Requirements

- Go 1.24 or newer
- PostgreSQL
- Optional: Node.js/npm if you want to use the frontend `npm run dev` helper
- Optional: VS Code SQLTools with the PostgreSQL driver extension

## Database Setup

Create a PostgreSQL database and user that match your local `.env` file. Example:

```sql
CREATE USER appuser WITH PASSWORD 'your_password_here';
CREATE DATABASE roster OWNER appuser;
```

The app runs migrations automatically on startup from `backend/migrations`.

## Environment Variables

Create `backend/.env` in the same folder as `backend/main.go`:

```env
DB_USER=appuser
DB_PASSWORD=your_password_here
DB_NAME=roster
DB_HOST=127.0.0.1
DB_PORT=5432
DB_SSLMODE=disable
PORT=8080
COOKIE_SECURE=false
```

Use `DB_SSLMODE=require` only when connecting to a hosted PostgreSQL database that requires SSL. Do not commit your real `.env` file.

## Running Locally

From the backend folder:

```bash
cd backend
go mod tidy
go run .
```

Or from the frontend folder, using the helper script:

```bash
cd frontend
npm install
npm run dev
```

The app runs at:

```text
http://localhost:8080
```

## VS Code Database Settings

`.vscode/settings.json` is configured for SQLTools using PostgreSQL:

- Host: `localhost`
- Port: `5432`
- Database: `roster`
- Username: `appuser`
- Password: prompted by SQLTools

Update those values if your local PostgreSQL user, database, host, or port are different.

## Key Features

- Create, update, search, and delete workers
- Create, update, search, and delete locations
- Assign workers to locations
- Define worker constraints so certain workers are not scheduled together
- Add temporary days off
- Add permanent weekly or time-based restrictions
- Track occupancies so workers are not double-booked
- Generate rosters while checking staffing availability
- Save rosters and export roster PDFs

## Scheduling Rules

Roster generation and availability checks consider:

- Worker availability and shift hours
- Temporary days off
- Permanent restrictions
- Existing occupancies
- Worker constraints
- Minimum staffing requirements before days off or restrictions are accepted

## Useful Commands

Run backend tests:

```bash
cd backend
go test ./...
```

Check frontend JavaScript syntax:

```bash
node --check frontend/views/days-off/helper-functions.js
```

## Main Pages

- Home: entry point after login
- Workers: manage worker records and assigned locations
- Locations: manage location records
- Constraints: manage workers who should not be scheduled together
- Days Off: manage temporary days off and permanent restrictions
- Create Roster: generate rosters for selected locations/months
- Find Rosters: view saved rosters
- Account: manage account details
