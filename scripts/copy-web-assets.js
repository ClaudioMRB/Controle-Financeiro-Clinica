const fs = require('node:fs');
const path = require('node:path');

const projectDirectory = path.resolve(__dirname, '..');
const webDirectory = path.join(projectDirectory, 'www');
const webAssets = ['index.html', 'styles.css', 'app.js', 'clinic-logo.svg'];

fs.mkdirSync(webDirectory, { recursive: true });

for (const asset of webAssets) {
  fs.copyFileSync(
    path.join(projectDirectory, asset),
    path.join(webDirectory, asset)
  );
}

console.log(`Web assets copied to ${webDirectory}`);
