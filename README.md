Digital Marketing Agency Website

A full-stack web application for a digital marketing agency with CRUD functionality and contact form.
Features

Responsive design with mobile navigation

Projects showcase with CRUD operations
Contact form with validation
MySQL database integration
RESTful API backend
Smooth scroll navigation
Loading states and error handling
Form validation

Prerequisites

Node.js (v14 or higher)
MySQL (v8 or higher)
npm or yarn

Setup Instructions
Database Setup

Install MySQL if not already installed
Create a new database:

sqlCopyCREATE DATABASE digital_marketing_db;
Backend Setup

Navigate to the backend directory:

bashCopycd backend

Install dependencies:

npm install express mysql2 cors body-parser express-validator

Update the database configuration in server.js:

javascriptCopyconst pool = mysql.createPool({
  host: 'localhost',
  
  user: 'your_username',
  
  password: 'your_password',
  
  database: 'digital_marketing_db',
  
  ...
});

Start the backend server:

node server.js

API Endpoints
Projects

GET /api/projects - Get all projects

GET /api/projects/:id - Get single project

POST /api/projects - Create new project

PUT /api/projects/:id - Update project

DELETE /api/projects/:id - Delete project

Contact

POST /api/contact - Submit contact form
