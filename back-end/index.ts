import express from "express";
import cors from "cors";
import multer from "multer";

const upload = multer({
    dest: "uploadsXYZ/",
});

const app = express();
app.use(express.json());

app.use(cors({ origin: "http://localhost:5173" }));

app.get("/health", (req, res) => {
    res.json({ status: "OK" });
});

app.post("/send-file", upload.single("project"), (req, res) => {
    const file = req.file;
    if (!file?.originalname.endsWith(".zip")) {
        res.status(400).json({
            message: "Please provide valid zip file",
        });
        return;
    }
    res.json({ message: "working" });
});

app.listen(3000, () => {
    console.log("Server Started");
});
