// Backend for the LaTeX compiler
// Requires: npm install express body-parser tmp fs child_process

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const tmp = require('tmp');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '1mb' }));
app.use(express.static('.')); // For serving index.html

app.post('/compile', (req, res) => {
  const latex = req.body.latex;
  if (!latex) {
    return res.status(400).send('No LaTeX code provided.');
  }

  tmp.dir({ unsafeCleanup: true }, (err, tmpDir, cleanupCallback) => {
    if (err) return res.status(500).send('Temporary directory error.');

    const texPath = path.join(tmpDir, 'input.tex');
    const pdfPath = path.join(tmpDir, 'input.pdf');
    fs.writeFileSync(texPath, latex);

    exec(`pdflatex -interaction=nonstopmode -halt-on-error input.tex`, { cwd: tmpDir }, (err, stdout, stderr) => {
      if (err || !fs.existsSync(pdfPath)) {
        let errorMsg = stdout + '\n' + stderr;
        cleanupCallback();
        return res.status(400).send('LaTeX Error:\n' + errorMsg);
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
      fs.createReadStream(pdfPath)
        .on('end', cleanupCallback)
        .pipe(res);
    });
  });
});

app.listen(PORT, () => {
  console.log(`LaTeX compiler server running at http://localhost:${PORT}`);
});