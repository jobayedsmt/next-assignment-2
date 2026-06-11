
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  jwt_secret: process.env.JWT_SECRET
};
var config_default = config;

// src/db/index.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'contributor',

            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
);
            `);
    await pool.query(`
  CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    reporter_id INTEGER NOT NULL,
    status VARCHAR(10) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  
`);
  } catch (error) {
    console.log(error);
  }
};
var db_default = initDB;

// src/modules/auth/auth.service.ts
import jwt from "jsonwebtoken";
var checkUser = async (email) => {
  const existingUser = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return existingUser;
};
var signupUserIntoDB = async (payLoad) => {
  const { name, email, password, role } = payLoad;
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role) 
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, password, role || "contributor"]
  );
  return result.rows[0];
};
var loginUser = async (payload) => {
  const { email, password } = payload;
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  const user = result.rows[0];
  if (!user) {
    throw new Error("Invalid email or password");
  }
  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password
  );
  if (!isPasswordMatched) {
    throw new Error("Invalid email or password");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const token = jwt.sign(
    jwtPayload,
    config_default.jwt_secret,
    {
      expiresIn: "7d"
    }
  );
  const {
    password: _,
    ...userWithoutPassword
  } = user;
  return {
    token,
    user: userWithoutPassword
  };
};
var userService = {
  checkUser,
  signupUserIntoDB,
  loginUser
};

// src/modules/auth/auth.controller.ts
import bcrypt2 from "bcryptjs";
var signupUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required"
      });
    }
    const existingUser = await userService.checkUser(email);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }
    const hashedPassword = await bcrypt2.hash(password, 10);
    const result = await userService.signupUserIntoDB({
      name,
      email,
      password: hashedPassword,
      role
      // 🔥 FIXED: pass role
    });
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};
var loginUser2 = async (req, res) => {
  try {
    const result = await userService.loginUser(
      req.body
    );
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : "Login failed",
      errors: null
    });
  }
};
var userController = {
  signupUser,
  loginUser: loginUser2
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", userController.signupUser);
router.post("/login", userController.loginUser);
var authRoute = router;

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = () => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }
      const decoded = jwt2.verify(
        token,
        process.env.JWT_SECRET
      );
      const userData = await pool.query(
        `
        SELECT * FROM users WHERE email = $1
      `,
        [decoded.email]
      );
      if (userData.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "User not found!"
        });
      }
      req.user = decoded;
    } catch (err) {
    }
    next();
  };
};

// src/modules/issues/issue.routes.ts
import { Router as Router2 } from "express";

// src/modules/issues/issue.service.ts
var createIssueIntoDB = async (payload, reporterId) => {
  const parsedPayload = typeof payload === "string" ? JSON.parse(payload) : payload;
  const { title, description, type, status } = parsedPayload;
  if (!title || !description || !type) {
    throw new Error("Missing required fields: title, description, type");
  }
  if (!reporterId) {
    throw new Error("Reporter ID is missing (auth issue)");
  }
  const result = await pool.query(
    `
  INSERT INTO issues (
    title,
    description,
    type,
    reporter_id
  )
  VALUES ($1, $2, $3, $4)
  RETURNING *
  `,
    [title, description, type, reporterId]
  );
  return result.rows[0];
};
var getAllIssuesFromDB = async (query) => {
  const { sort = "newest", type, status } = query;
  let sql = `SELECT * FROM issues`;
  const conditions = [];
  const values = [];
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += sort === "oldest" ? ` ORDER BY created_at ASC` : ` ORDER BY created_at DESC`;
  const issueResult = await pool.query(sql, values);
  const issues = issueResult.rows;
  if (issues.length === 0) {
    return [];
  }
  const reporterIds = [
    ...new Set(issues.map((issue) => issue.reporter_id))
  ];
  const userResult = await pool.query(
    `
      SELECT id, name, role
      FROM users
      WHERE id = ANY($1)
    `,
    [reporterIds]
  );
  const users = userResult.rows;
  const issuesWithReporter = issues.map((issue) => {
    const reporter = users.find(
      (user) => user.id === issue.reporter_id
    );
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter,
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
  });
  return issuesWithReporter;
};
var deleteIssueFromDB = async (id) => {
  if (!id) {
    throw new Error("Issue ID is required");
  }
  const result = await pool.query(
    `
    DELETE FROM issues
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );
  if (result.rows.length === 0) {
    throw new Error("Issue not found");
  }
  return result.rows[0];
};
var getSingleIssueFromDB = async (id) => {
  const result = await pool.query(
    `
    SELECT 
      i.id,
      i.title,
      i.description,
      i.type,
      i.status,
      i.created_at,
      i.updated_at,

      u.id AS reporter_id,
      u.name AS reporter_name,
      u.role AS reporter_role

    FROM issues i
    JOIN users u ON i.reporter_id = u.id
    WHERE i.id = $1
    `,
    [id]
  );
  if (result.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const row = result.rows[0];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    reporter: {
      id: row.reporter_id,
      name: row.reporter_name,
      role: row.reporter_role
    },
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};
var updateIssueIntoDB = async (issueId, payload, user) => {
  const issueResult = await pool.query(
    `
    SELECT * FROM issues
    WHERE id = $1
    `,
    [issueId]
  );
  const issue = issueResult.rows[0];
  if (!issue) {
    throw new Error("Issue not found");
  }
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error(
        "You can only update your own issues"
      );
    }
    if (issue.status !== "open") {
      throw new Error(
        "Only open issues can be updated"
      );
    }
  }
  const {
    title = issue.title,
    description = issue.description,
    type = issue.type
  } = payload;
  const result = await pool.query(
    `
    UPDATE issues
    SET
      title = $1,
      description = $2,
      type = $3,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *
    `,
    [title, description, type, issueId]
  );
  return result.rows[0];
};
var IssueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};

// src/modules/issues/issue.controller.ts
var createIssue = async (req, res) => {
  try {
    const result = await IssueService.createIssueIntoDB(
      req.body,
      req.user?.id
    );
    return res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
      errors: null
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const result = await IssueService.getAllIssuesFromDB(
      req.query
    );
    res.status(200).json({
      success: true,
      message: "Issues retrieved successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
      errors: null
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const result = await IssueService.updateIssueIntoDB(
      Number(req.params.id),
      req.body,
      req.user
    );
    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
      errors: null
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await IssueService.deleteIssueFromDB(id);
    return res.status(200).json({
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
      errors: null
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await IssueService.getSingleIssueFromDB(id);
    return res.status(200).json({
      success: true,
      message: "Issue retrieved successfully",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
      data: null
    });
  }
};
var IssueController = {
  createIssue,
  getAllIssues,
  updateIssue,
  deleteIssue,
  getSingleIssue
};

// src/middleware/role.ts
var roleMiddleware = (role) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (user.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

// src/modules/issues/issue.routes.ts
var router2 = Router2();
router2.post("/", auth(), IssueController.createIssue);
router2.get("/", auth(), IssueController.getAllIssues);
router2.get("/:id", IssueController.getSingleIssue);
router2.patch(
  "/:id",
  auth(),
  IssueController.updateIssue
);
router2.delete(
  "/:id",
  auth(),
  roleMiddleware("maintainer"),
  IssueController.deleteIssue
);
var issueRoute = router2;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.get("/", async (req, res) => {
  res.status(200).json({
    message: "Express Server",
    success: "Server run successfully."
  });
});
app.get("/api/users/", auth(), async (req, res) => {
  const userData = await pool.query(
    `
          SELECT * FROM users
        `
  );
  res.status(200).json({
    message: "Express Server",
    data: userData.rows
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);
var app_default = app;

// src/server.ts
var main = () => {
  db_default();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map