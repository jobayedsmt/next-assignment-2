import { pool } from "../../db";

type CreateIssuePayload = {
  title: string;
  description: string;
  type: string;
  status: string;
};

const createIssueIntoDB = async (
  payload: CreateIssuePayload,
  reporterId: number
) => {
  // Debug (optional but useful)
  // console.log("SERVICE PAYLOAD:", payload);
  // console.log("REPORTER ID:", reporterId);
  const parsedPayload =
    typeof payload === "string"
      ? JSON.parse(payload)
      : payload;

  const { title, description, type, status } = parsedPayload;

  console.log(title, description, type)
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


const getAllIssuesFromDB = async (query: any) => {
  const { sort = "newest", type, status } = query;

  let sql = `SELECT * FROM issues`;
  const conditions: string[] = [];
  const values: any[] = [];

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

  sql +=
    sort === "oldest"
      ? ` ORDER BY created_at ASC`
      : ` ORDER BY created_at DESC`;

  const issueResult = await pool.query(sql, values);

  const issues = issueResult.rows;

  if (issues.length === 0) {
    return [];
  }

  // collect reporter ids
  const reporterIds = [
    ...new Set(issues.map((issue) => issue.reporter_id)),
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
      updated_at: issue.updated_at,
    };
  });

  return issuesWithReporter;
};



const deleteIssueFromDB = async (id: number) => {
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



const getSingleIssueFromDB = async (id: number) => {
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

  // 🔥 transform into required shape
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    
    reporter: {
      id: row.reporter_id,
      name: row.reporter_name,
      role: row.reporter_role,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};



const updateIssueIntoDB = async (
  issueId: number,
  payload: {
    title?: string;
    description?: string;
    type?: string;
  },
  user: {
    id: number;
    role: string;
  }
) => {
  console.log("1");
  const issueResult = await pool.query(
    `
    SELECT * FROM issues
    WHERE id = $1
    `,
    [issueId]
  );

  console.log("2");
  const issue = issueResult.rows[0];

  if (!issue) {
    throw new Error("Issue not found");
  }

  // Contributor Rules
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
    type = issue.type,
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






export const IssueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB,
};