import express from "express";
import cors from "cors";
import userRouter from "./controllers/users/controller";
import fileRouter from "./routes/fileRoutes";

import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: "us-east-1" })

const app = express();

app.use(
	cors({
		allowedHeaders: ['Authorization', 'Content-Type'],
	})
);

app.use(express.json());

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
	console.error('Error details:', err);
	res.status(500).json({ error: 'Internal Server Error', details: err.message });
});


// User Routes
app.use("/api", userRouter);

// file Routes
app.use("/api/files", fileRouter);

export default app;