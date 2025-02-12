import path from "node:path";
import express from "express";
import { ROOT_PATH } from "./mylib/env.js";

const app = express();
const port = 3000;

app.use("/static", express.static(path.resolve(ROOT_PATH, "static")));
app.use(express.static(path.resolve(ROOT_PATH, "dist", "client")));

app.get("/", (req, res) => {
	res.sendFile(path.resolve(ROOT_PATH, "dist", "client", "index.html"));
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
