const fs = require('fs');
const path = require('path');

const results = JSON.parse(fs.readFileSync('lint_results.json', 'utf8'));
let count = 0;

results.forEach(file => {
    if (file.messages && file.messages.length > 0) {
        const errors = file.messages.filter(m => m.severity === 2);
        if (errors.length > 0) {
            console.log(file.filePath);
            errors.forEach(e => {
                console.log(`  Line ${e.line}: ${e.message} (${e.ruleId})`);
                count++;
            });
        }
    }
});

console.log(`\nTotal errors: ${count}`);
