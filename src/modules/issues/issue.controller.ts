import type { Request, Response } from "express";
import { IssueService } from "./issue.service";

const createIssue = async (req: Request, res: Response) => {
  try {
    // console.log("BODY:", req.body);
    // console.log("USER:", (req as any).user);

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

const getAllIssues = async (
  req: Request,
  res: Response
) => {
  try {
    const result =
      await IssueService.getAllIssuesFromDB(
        req.query
      );

    res.status(200).json({
      success: true,
      message: "Issues retrieved successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
      errors: null,
    });
  }
};




const updateIssue = async (
  req: Request,
  res: Response
) => {
  try {
    const result =
      await IssueService.updateIssueIntoDB(
        Number(req.params.id),
        req.body,
        (req as any).user
      );

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
      errors: null,
    });
  }
};





const deleteIssue = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const result = await IssueService.deleteIssueFromDB(id);

    // console.log("Find issue: here")
    return res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
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


const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const result = await IssueService.getSingleIssueFromDB(id);

    return res.status(200).json({
      success: true,
      message: "Issue retrieved successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Something went wrong",
      data: null,
    });
  }
};




export const IssueController = {
  createIssue,
  getAllIssues,
  updateIssue,
  deleteIssue,
  getSingleIssue,
};