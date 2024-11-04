// server.js
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const { body, validationResult } = require("express-validator");

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL Connection Pool
const pool = mysql
  .createPool({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "digital_marketing_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise();

// Validation middleware
const validateContact = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 255 })
    .withMessage("Name is too long"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ max: 1000 })
    .withMessage("Message is too long"),
];

const validateProject = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 255 })
    .withMessage("Title is too long"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required"),
  body("image_url")
    .optional()
    .isURL()
    .withMessage("Invalid image URL"),
];

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
       
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create contacts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample projects if none exist
    const [existingProjects] = await pool.query(
      "SELECT COUNT(*) as count FROM projects"
    );
    if (existingProjects[0].count === 0) {
      const sampleProjects = [
        {
          title: "Search Engine Optimization",
          description:
            "We help brands stand out through aweful, elegant visual design. Our design mainly philosophy.",

          image_url: "https://i.ibb.co.com/Fm7Jft5/john-schnobrich-Fl-Pc9-Voc-J4-unsplash.jpg",
        },
        {
          title: "Email Marketing",
          description:
            "We help brands stand out through aweful, elegant visual design. Our design mainly philosophy.",

          image_url: "https://i.ibb.co.com/fY9ttMn/tim-van-der-kuip-CPs2-X8-JYm-S8-unsplash.jpg",
        },
        {
          title: "Content Marketing",
          description:
            "We help brands stand out through aweful, elegant visual design. Our design mainly philosophy.",

          image_url: "https://i.ibb.co.com/7tg45JK/charlesdeluvio-Lks7vei-e-Ag-unsplash.jpg" ,
        },
        {
          title: "Social Marketing",
          description:
            "We help brands stand out through aweful, elegant visual design. Our design mainly philosophy.",

          image_url: "https://i.ibb.co.com/KV3VXfg/redd-f-5-U-28ojjgms-unsplash.jpg",
        },
      ];

      for (const project of sampleProjects) {
        await pool.query(
          "INSERT INTO projects (title, description, image_url) VALUES (?, ?, ?)",
          [project.title, project.description, project.image_url]
        );
      }
    }

    console.log("Database tables initialized successfully");
  } catch (err) {
    console.error("Error initializing database:", err);
    process.exit(1);
  }
}

// Initialize database on startup
initializeDatabase();

// API Routes

// Get all projects
app.get("/api/projects", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM projects ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single project
app.get("/api/projects/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM projects WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new project
app.post(
  "/api/projects",
  validateProject,
  handleValidationErrors,
  async (req, res) => {
    const { title, description, image_url } = req.body;

    try {
      const [
        result,
      ] = await pool.query(
        "INSERT INTO projects (title, description, image_url) VALUES (?, ?, ?)",
        [title, description, image_url]
      );

      const [
        newProject,
      ] = await pool.query("SELECT * FROM projects WHERE id = ?", [
        result.insertId,
      ]);

      res.status(201).json(newProject[0]);
    } catch (err) {
      console.error("Error creating project:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update project
app.put(
  "/api/projects/:id",
  validateProject,
  handleValidationErrors,
  async (req, res) => {
    const { id } = req.params;
    const { title, description, image_url } = req.body;

    try {
      const [
        result,
      ] = await pool.query(
        "UPDATE projects SET title = ?, description = ?, image_url = ? WHERE id = ?",
        [title, description, image_url, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      const [
        updatedProject,
      ] = await pool.query("SELECT * FROM projects WHERE id = ?", [id]);

      res.json(updatedProject[0]);
    } catch (err) {
      console.error("Error updating project:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete project
app.delete("/api/projects/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM projects WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Submit contact form
app.post(
  "/api/contact",
  validateContact,
  handleValidationErrors,
  async (req, res) => {
    const { name, email, message } = req.body;

    try {
      const [
        result,
      ] = await pool.query(
        "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)",
        [name, email, message]
      );

      // You might want to add email notification logic here

      res.status(201).json({
        id: result.insertId,
        message: "Contact form submitted successfully",
      });
    } catch (err) {
      console.error("Error submitting contact form:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get all contacts (admin route)
app.get("/api/contacts", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM contacts ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Error handling for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
