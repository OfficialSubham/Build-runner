import express, { Router } from "express";
import { DEPLOYMENTS_ROOT } from "../helpers/utils";

const projectRoute = Router();

projectRoute.use("/deployed/:deploymentId", (req, res, next) => {
    console.log("HERE ________");
    const deploymentId = req.params.deploymentId;
    const distPath = `${DEPLOYMENTS_ROOT}/${deploymentId}/source/dist/`;
    express.static(distPath)(req, res, next);
});

projectRoute.get("/deployed/:deploymentId/*path", (req, res) => {
    console.log("Fallback Hit : ", req.originalUrl);
    const deploymentId = req.params.deploymentId;
    const distPath = `${DEPLOYMENTS_ROOT}/${deploymentId}/source/dist/index.html`;

    res.sendFile(distPath);
});

export default projectRoute;
