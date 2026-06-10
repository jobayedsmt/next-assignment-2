import { Router } from "express";
import { IssueController } from "./issue.controller";
import { auth } from "../../middleware/auth";
import { roleMiddleware } from "../../middleware/role";

const router = Router();

router.post( "/", auth(), IssueController.createIssue );
router.get( "/", auth(), IssueController.getAllIssues );
router.get("/:id", IssueController.getSingleIssue);
router.patch(
  "/:id",
  auth(),
  IssueController.updateIssue
);
router.delete(
  "/:id", auth(), roleMiddleware("maintainer"), IssueController.deleteIssue
);

// console.log("Erroes ache ekhane roputer e")

export const issueRoute = router;