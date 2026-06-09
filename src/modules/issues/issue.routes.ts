import { Router } from "express";
import { IssueController } from "./issue.controller";
import { auth } from "../../middleware/auth";

const router = Router();

router.post( "/", auth(), IssueController.createIssue );
console.log("Erroes ache ekhane roputer e")

export const issueRoute = router;