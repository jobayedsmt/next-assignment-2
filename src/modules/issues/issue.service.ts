import { pool } from "../../db";

type CreateIssuePayload = {
  title: string;
  description: string;
  type: string;
};

const createIssueIntoDB = async (
  payload: CreateIssuePayload,
  reporterId: number
) => {
  // Debug (optional but useful)
  console.log("SERVICE PAYLOAD:", payload);
  console.log("REPORTER ID:", reporterId);
const parsedPayload =
  typeof payload === "string"
    ? JSON.parse(payload)
    : payload;

const { title, description, type } = parsedPayload;

  console.log(title, description, type ) 
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

export const IssueService = {
  createIssueIntoDB,
};