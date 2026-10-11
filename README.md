# PocketPilot — Expense Tracker & Budget Management System

PocketPilot is a full-stack web application that allows users to track expenses, manage monthly budgets, and monitor their spending.

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Axios
- React Router
- Recharts
- Lucide React

**Backend**
- Node.js
- Express.js
- TypeScript
- MySQL (`mysql2`)
- JWT authentication
- bcryptjs
- Zod

**Database**
- MySQL

---

## Project Structure

```text
PocketPilot/
├── client/                 # React frontend
│   ├── src/
│   ├── package.json
│   └── .env                 # Create locally
│
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts        # MySQL connection configuration
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.ts
│   ├── package.json
│   └── .env                 # Create locally
│
└── README.md
```

## Prerequisites

Install the following before running the project:

- [Node.js and npm](https://nodejs.org/)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/)
- [MySQL Workbench](https://dev.mysql.com/downloads/workbench/)
- [Visual Studio Code](https://code.visualstudio.com/)

Verify Node.js and npm:

```bash
node --version
npm --version
```

## 1. Clone the Repository

Open a terminal and run:

```bash
git clone https://github.com/akash7673/PocketPilot.git
cd PocketPilot
```

Alternatively, download the repository as a ZIP file from GitHub and extract it.

## 2. Backend Setup

### Step 1: Create the MySQL Database and Tables

1. Open MySQL Workbench and connect to your local MySQL Server.
2. Navigate to the `server` folder in the PocketPilot project.
3. Locate the SQL file containing the database schema and table creation queries.
4. Open that SQL file and copy its SQL queries.
5. Paste the queries into a new SQL query tab in MySQL Workbench.
6. Execute the queries to create the database and required tables.

Make sure all required tables are created successfully before starting the backend.

**Note:** Use the SQL file provided in the repository as the source of truth for the database schema. Do not create tables manually with different column names or data types.

### Step 2: Configure the MySQL Connection

Open:

`server/src/config/db.ts`

The database connection should read its credentials from environment variables rather than storing passwords directly in the source code.

Configure the following values in your backend environment file to match your local MySQL setup:

- MySQL host
- MySQL port
- MySQL username
- MySQL password
- Database name

For a local MySQL installation, the host is commonly `localhost` and the port is commonly `3306`.

### Step 3: Create the Backend Environment File

Inside the `server` folder, create a file named `.env`.

Add the following configuration:

```env
PORT=5000
NODE_ENV=development

CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=pocketpilot

JWT_ACCESS_SECRET=your_generated_random_secret
```

Replace the example values with your own local configuration.

- `PORT`: Port on which the backend runs.
- `CLIENT_URL`: Local frontend URL allowed by the backend's CORS configuration.
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: MySQL connection details.
- `JWT_ACCESS_SECRET`: A strong random secret used to sign access tokens.

Generate a random JWT secret using:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

If the backend code uses different environment variable names, configure the names expected by the existing code.

**Security:** Never commit your real `.env` file or database credentials to GitHub.

### Step 4: Install Backend Dependencies

Open a terminal in the project root and run:

```bash
cd server
npm install
```

### Step 5: Start the Backend

Run:

```bash
npm run dev
```

The backend should start on:

http://localhost:5000

Test the health endpoint:

http://localhost:5000/api/health

Confirm that the backend starts successfully and that its database connection works. Keep this terminal running.

---

## 3. Frontend Setup

### Step 1: Open a New Terminal

Open another terminal in Visual Studio Code.

Navigate to the frontend directory from the project root:

```bash
cd client
```

### Step 2: Install Frontend Dependencies

Run:

```bash
npm install
```

### Step 3: Create the Frontend Environment File

Inside the `client` folder, create a file named `.env`.

Add:

```env
VITE_API_URL=http://localhost:5000/api
```

This URL tells the frontend where to send API requests.

If you change the backend port, update this URL accordingly.

### Step 4: Start the Frontend

Run:

```bash
npm run dev
```

Vite will display the local development URL, usually:

http://localhost:5173

Open this URL in your browser.

Keep both the frontend and backend terminals running.

---

## 4. Test the Application

After completing the backend and frontend setup:

1. Confirm that MySQL Server is running.
2. Confirm that the backend is running on port `5000`.
3. Confirm that the frontend is running on port `5173`.
4. Open http://localhost:5173.
5. Register a new account.
6. Log in using the registered credentials.
7. Create an expense and verify that it appears in the expense list.
8. Test editing, filtering, and deleting expenses.
9. Create a monthly budget and verify that it is saved.
10. Navigate through the application and check for errors in the browser console and backend terminal.

Verify that expense and budget data are stored in MySQL and that users can access only their own records.

The dashboard currently uses default values while its API integration is being revisited.

---

## 5. Troubleshooting

### Database connection fails

- Ensure MySQL Server is running.
- Verify the credentials in `server/.env`.
- Confirm the database and tables exist.
- Check that `server/src/config/db.ts` reads the correct environment variable names.

### Frontend cannot connect to the backend

- Ensure the backend is running.
- Verify `VITE_API_URL` in `client/.env`.
- Confirm that backend CORS allows `http://localhost:5173`.
- Restart the Vite server after changing environment variables.

### Login or registration fails

- Check the backend terminal for errors.
- Confirm that the `users` table matches the backend SQL queries.
- Check that frontend requests include credentials where required for refresh-token cookies.

### Missing tables or columns

- Re-run the schema file only after checking what it contains.
- Inspect existing tables using `SHOW TABLES;`.
- Inspect columns using `DESCRIBE table_name;`.
- Compare the database schema with the queries in `server/src/routes/`.

### Port already in use

Stop the process using the port or change the relevant port configuration and update the frontend API URL and CORS settings.

---

## 6. Security Notes

- Never store plain-text passwords in the database.
- Never commit `.env` files, JWT secrets, or database credentials.
- Use a unique JWT secret for each environment.
- Do not share production credentials in public repositories.
- Use HTTPS and secure cookie settings for production deployments.

---

## Author

**Project:** PocketPilot — Expense Tracker & Budget Management System

**Repository:** https://github.com/akash7673/PocketPilot

**Technologies:** React, TypeScript, Node.js, Express.js, and MySQL
