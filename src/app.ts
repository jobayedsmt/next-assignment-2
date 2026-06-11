import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { authRoute } from "./modules/auth/auth.route";
import { auth } from "./middleware/auth";
import { pool } from "./db";
import { issueRoute } from "./modules/issues/issue.routes";

const app: Application = express();

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.get("/",  async (req: Request, res: Response) => {
  
  res.status(200).json({
    message: "Express Server",
    success: "Server run successfully."
  });
});

app.get("/api/users/", auth(), async (req: Request, res: Response) => {
  //res.send("Hello World!");
  const userData = await pool.query(
        `
          SELECT * FROM users
        `,
           
      )
  res.status(200).json({
    message: "Express Server",
    data: userData.rows
  });
});

app.use("/api/auth", authRoute);
app.use("/api/issues",  issueRoute);



export default app;

