import { spawn } from "child_process";
import { WriteStream } from "fs";
export const runCommand = async (
    command: string,
    args: string[],
    cwd: string,
    logStream: WriteStream,
    commandType: string,
) => {
    return new Promise<void>((resolve, reject) => {
        process.stdout.write(`Starting ${commandType}...`);
        const child = spawn(command, args, {
            cwd,
            shell: true,
        });

        child.stdout.on("data", (data) => {
            const text = data.toString();
            process.stdout.write(text);
            logStream.write(text);
        });

        child.stderr.on("data", (data) => {
            const text = data.toString();
            process.stdout.write(text);
            logStream.write(text);
        });

        child.on("close", (code) => {
            if (code == 0) {
                console.log("--- Successfully completed ---");
                resolve();
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        });
    });
};
