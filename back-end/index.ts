import express from "express";
import cors from "cors";
import type { Response } from "express";
import path from "path";
import deploymentRoute from "./routes/deployment";
import projectRoute from "./routes/projects";
import { DEPLOYMENTS_ROOT } from "./utils";

const app = express();
app.use(express.json());

app.use(cors({ origin: "http://localhost:5173" }));

app.get("/health", (req, res) => {
    res.json({ status: "OK" });
});

//Everything about deployments shifted to deployments route
app.use("/api/deployments", deploymentRoute);

//Everthing about the route project shifted to project route
app.use("/api/projects", projectRoute);

app.use((req, res, next) => {
    const projectId = req.hostname.split(".")[0];
    console.log("PROJECT ID ->", projectId);
    req.projectId = projectId ?? "";
    next();
});

app.use((req, res, next) => {
    const projectDir = path.join(DEPLOYMENTS_ROOT, req.projectId, "source/dist/");
    console.log("URLS \n", req.originalUrl, "\n\n");
    express.static(projectDir)(req, res, next);
});

app.get("*path", (req, res) => {
    if (!req.projectId) return res.json({ error: "Please enter a valid path" });

    const projectDir = path.join(DEPLOYMENTS_ROOT, req.projectId, "source/dist/");
    console.log("SENDING HTML ONLY");
    console.log("PROJECT DIR -> ", projectDir);
    res.sendFile(path.join(projectDir, "index.html"));
});

app.listen(3000, () => {
    console.log("Server Started");
});
