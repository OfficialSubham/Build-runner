import { spawn } from "child_process";
import { WriteStream } from "fs";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import unzipper from "unzipper";
import { clients } from "../routes/deployment";

export const DEPLOYMENTS_ROOT =
    process.env.DEPLOYMENTS_ROOT ?? "/home/codersubham/deployments";

export const runCommand = async (
    command: string,
    args: string[],
    cwd: string,
    logStream: WriteStream,
    commandType: string,
    deploymentId: string,
) => {
    return new Promise<void>((resolve, reject) => {
        process.stdout.write(`Starting ${commandType}...`);
        logStream.write(`Starting ${commandType}...`);
        const child = spawn(command, args, {
            cwd,
            shell: true,
        });

        child.stdout.on("data", (data) => {
            const text = data.toString();
            process.stdout.write(text);
            logStream.write(text);

            //This need in vercel clone
            // clients[deploymentId]?.forEach((client) => {
            //     client.write(`Data : ${text}\n`);
            // });
        });

        child.stderr.on("data", (data) => {
            const text = data.toString();
            process.stdout.write(text);
            logStream.write(text);

            //This need in vercel clone
            // clients[deploymentId]?.forEach((client) => {
            //     client.write(`Data : ${text}\n`);
            // });
        });

        child.on("close", (code) => {
            if (code == 0) {
                console.log("--- Successfully completed ---");
                clients[deploymentId]?.forEach((client) => {
                    client.write(`Data : Successfully Completed\n`);
                });
                resolve();
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        });
    });
};

export const createFile = async (filePath: string) => {
    await fsPromises.mkdir(filePath, {
        recursive: true,
    });
};

export const saveZip = async (deploymentId: string, zipFile: Express.Multer.File) => {
    const zipPath = path.join(DEPLOYMENTS_ROOT, deploymentId, "project.zip");
    console.log("Zip Path :", zipPath);
    await fsPromises.writeFile(zipPath, zipFile.buffer);
};

export const updateStatusJson = async (
    deploymentStatusJsonPath: string,
    status: "BUILDING" | "FAILED" | "QUEUED" | "SUCCESS",
) => {
    console.log("\n\n Updating Status to :", status, "\n\n");
    await fsPromises.writeFile(deploymentStatusJsonPath, JSON.stringify({ status }));
};

export const getDeploymentsPath = (deploymentId: string) => {
    const deploymentsDir = path.join(DEPLOYMENTS_ROOT, deploymentId);

    return {
        rootDir: deploymentsDir,
        zipPath: path.join(deploymentsDir, "project.zip"),
        sourceDir: path.join(deploymentsDir, "source"),
        logsPath: path.join(deploymentsDir, "logs.txt"),
        statusPath: path.join(deploymentsDir, "status.json"),
    };
};

export const extractFile = async (deploymentId: string) => {
    const { zipPath, sourceDir } = getDeploymentsPath(deploymentId);
    await fs
        .createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: sourceDir }))
        .promise();
};

export const dockerBuild = async (sourceDir: string, logStream: WriteStream) => {
    return new Promise<void>((resolve, reject) => {
        const child = spawn("docker", [
            "run",
            "--rm",
            "--memory=512m",
            "--cpus=1",
            "-v",
            `${sourceDir}:/app`,
            "-w",
            "/app",
            "node:22",
            "sh",
            "-c",
            "npm install && npm run build",
        ]);

        const timeOut = setTimeout(
            () => {
                logStream.write("\nBuild timed out after 5 minutes\n");
                child.kill("SIGKILL");
            },
            5 * 60 * 1000,
        );

        child.stdout.on("data", (data) => {
            const text = data.toString();
            console.log("FROM DOCKER : ", text);
            logStream.write(text);
        });

        child.stderr.on("data", (data) => {
            const text = data.toString();
            console.log("FROM DOCKER : ", text);
            logStream.write(text);
        });

        child.on("error", (err) => {
            clearTimeout(timeOut);
            reject(err);
        });

        child.on("close", (code) => {
            clearTimeout(timeOut);
            if (code == 0) {
                console.log("--- Successfully Build ---");
                resolve();
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        });
    });
};

export const createDockerFile = async (rootDir: string) => {
    const dockerFile = `
    FROM node:22

    RUN npm install -g bun

    WORKDIR /app

    COPY ./source .

    RUN npm install
    RUN npm run build

    ENV PORT=3000

    CMD ["node", "dist/index.js"]
    `;

    fs.writeFileSync(path.join(rootDir, "Dockerfile"), dockerFile);
};

export const startLongRunningBuild = async (
    deploymentId: string,
    logStream: WriteStream,
) => {
    const { rootDir, statusPath } = getDeploymentsPath(deploymentId);
    try {
        //Created  the docker file inside the user's project
        await createDockerFile(rootDir);

        //Now building the project
        /*
            Now Below the container will build by running the
            docker image and the image name would be deployment-projectID

         */
        await runCommand(
            "docker",
            ["build", "-t", `deployment-${deploymentId}`, "."],
            rootDir,
            logStream,
            "Building Docker Image",
            deploymentId,
        );

        await runCommand(
            "docker",
            ["run", "-d", "-p", "5000:3000", `deployment-${deploymentId}`],
            rootDir,
            logStream,
            "Building Docker Image",
            deploymentId,
        );

        updateStatusJson(statusPath, "SUCCESS");
    } catch (error) {
        console.error("Error Occured : ", error);
        updateStatusJson(statusPath, "FAILED");
        return;
    }
};

export const startBuilding = async (
    deploymentId: string,
    buildType: "static" | "long-running",
) => {
    const paths = getDeploymentsPath(deploymentId);
    let logStream: WriteStream | undefined;
    try {
        updateStatusJson(paths.statusPath, "BUILDING");
        await createFile(paths.sourceDir);
        await extractFile(deploymentId);
        //Checking for the existance of package.json file in the root folder
        const packageExists = fs.existsSync(paths.sourceDir + "/package.json");

        if (!packageExists) {
            throw new Error("package.json does not exists in your project root folder");
        }

        logStream = fs.createWriteStream(paths.logsPath, {
            flags: "a",
        });

        //Checking for the type of the project
        const packageJson = JSON.parse(
            fs.readFileSync(`${paths.sourceDir}/package.json`, "utf8"),
        );

        if (packageJson.dependencies.next) {
            const text = "--- Next Project ---\n\n";
            process.stdout.write(text);
            logStream.write(text);
        } else if (packageJson.dependencies.react) {
            const text = "--- React Project ---\n\n";
            process.stdout.write(text);
            logStream.write(text);
        } else {
            const text = "---  Project not identified ---\n\n";
            process.stdout.write(text);
            logStream.write(text);
        }

        if (buildType == "static") await dockerBuild(paths.sourceDir, logStream);
        else if (buildType == "long-running") {
            await startLongRunningBuild(deploymentId, logStream);
            return;
        }

        logStream.write("--- Successfully Completed ---");
        updateStatusJson(paths.statusPath, "SUCCESS");
    } catch (error) {
        console.log("Failed To Build \n\n Error ->", error);
        updateStatusJson(paths.statusPath, "FAILED");
    } finally {
        logStream?.end();
    }
};
