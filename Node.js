import express from "express";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());

app.post("/compile", (req, res) => {
  const code = req.body.code;
  const tempDir = "./temp";
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const texFile = path.join(tempDir, "document.tex");
  const pdfFile = path.join(tempDir, "document.pdf");

  fs.writeFileSync(texFile, code);

  // Compile with pdflatex
  exec(`pdflatex -interaction=nonstopmode -output-directory=${tempDir} ${texFile}`, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr);
      res.status(500).send("Compilation error");
      return;
    }

    res.download(pdfFile, "output.pdf", (err) => {
      // Optional cleanup
      fs.unlinkSync(texFile);
      fs.unlinkSync(pdfFile);
      fs.unlinkSync(path.join(tempDir, "document.log"));
      fs.unlinkSync(path.join(tempDir, "document.aux"));
    });
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));
