import express from "express";
import cors from "cors";
import multer from "multer";
import { randomUUID } from "crypto";
import fsPromises from "fs/promises";
import fs from "fs";
import unzipper from "unzipper";
import { exec, spawn } from "child_process";
import util from "util";

const DEPLOYMENTS_DIR = process.env.DEPLOYMENTS_DIR ?? "/home/codersubham/deployments";

const upload = multer({
    storage: multer.memoryStorage(),
});
const execPromise = util.promisify(exec);

const app = express();
app.use(express.json());

app.use(cors({ origin: "http://localhost:5173" }));

app.get("/health", (req, res) => {
    res.json({ status: "OK" });
});

app.post("/send-file", upload.single("project"), async (req, res) => {
    const file = req.file;
    if (!file || !file.originalname.endsWith(".zip")) {
        res.status(400).json({
            message: "Please provide valid zip file",
        });
        return;
    }

    try {
        const deploymentId = randomUUID();
        const deploymentPath = DEPLOYMENTS_DIR + `/${deploymentId}`;
        const zipPath = `${deploymentPath}/${file.originalname ?? "project.zip"}`;
        const sourcePath = `${deploymentPath}/source`;

        //Creating the folder to put the zip file
        await fsPromises.mkdir(deploymentPath, {
            recursive: true,
        });
        //Zip file added
        await fsPromises.writeFile(zipPath, file.buffer!);
        await fsPromises.mkdir(sourcePath);

        await fs
            .createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: sourcePath }))
            .promise();
        //Checking for the existance of package.json file in the root folder
        const packageExists = fs.existsSync(sourcePath + "/package.json");

        if (!packageExists) {
            return res.status(400).json({
                error: "Package.json doesnot exist",
            });
        }

        await execPromise("npm install", { cwd: sourcePath });

        const child = spawn("npm", ["run", "dev"], {
            cwd: sourcePath,
        });

        child.stdout.on("data", (data) => {
            console.log(`[${deploymentId}]`, data.toString());
        });

        child.stderr.on("data", (data) => {
            console.log(`[${deploymentId}]`, data.toString());
        });

        res.status(201).json({ message: "Successfully created the file" });
    } catch (error) {
        console.log("Error ->", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.listen(3000, () => {
    console.log("Server Started");
});
