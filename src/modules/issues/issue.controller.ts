import type { Request, Response } from "express";
import { IssueService } from "./issue.service";

const createIssue = async (req: Request, res: Response) => {
  try {
    console.log("BODY:", req.body);
    console.log("USER:", (req as any).user);

    const result = await IssueService.createIssueIntoDB(
      req.body,
      (req as any).user?.id
    );

    return res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Something went wrong",
      errors: null,
    });
  }
};

export const IssueController = {
  createIssue,
};