const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (file !== 'node_modules') {
                walk(filePath, fileList);
            }
        } else if (filePath.endsWith('.js')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const jsFiles = walk(__dirname);
let errors = 0;
for (const file of jsFiles) {
    try {
        execSync(`node --check "${file}"`, { stdio: 'pipe' });
    } catch (err) {
        console.error(`Syntax error in ${file}:`);
        console.error(err.stderr.toString());
        errors++;
    }
}
if (errors === 0) {
    console.log("No syntax errors found in backend js files.");
} else {
    console.log(`Found ${errors} files with syntax errors.`);
}
