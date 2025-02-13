import "dotenv/config";
import path from "node:path";
import express from "express";
import { calcUnjApiToken } from "./mylib/anti-debug.js";
import { ROOT_PATH } from "./mylib/env.js";

const app = express();
const port = 3000;

app.use(express.json());

app.use("/static", express.static(path.resolve(ROOT_PATH, "static")));
app.use(express.static(path.resolve(ROOT_PATH, "dist", "client")));

app.get("/", (req, res) => {
	res.sendFile(path.resolve(ROOT_PATH, "dist", "client", "index.html"));
});

app.post("/api/hash", (req, res) => {
	const token = req.body.token;
	const token2 = calcUnjApiToken();
	res.json({ token, token2, message: token === token2 ? "OK" : "NG" });
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
