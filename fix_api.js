const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend/src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(directoryPath);

files.forEach(file => {
  if (file.endsWith('.js') || file.endsWith('.jsx')) {
    let content = fs.readFileSync(file, 'utf8');
    let hasChanges = false;

    // Pattern to replace
    const exactPattern = "import.meta.env.VITE_API_URL || 'http://localhost:4000/api'";
    const replacement = "import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://inventory-management-xbb6.onrender.com/api' : 'http://localhost:5000/api')";

    if (content.includes(exactPattern)) {
      content = content.split(exactPattern).join(replacement);
      hasChanges = true;
    }

    if (hasChanges) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated API URL in ${file}`);
    }
  }
});

console.log("Done updating API URLs.");
