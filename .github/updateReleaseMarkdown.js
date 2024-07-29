const fs = require('fs');
const path = require('path');

const mdFilePath = path.join(__dirname, '../RELEASE_HISTORY.md');

// Build the new row to be added
const newRow = `|  v${process.env.NEW_VERSION}  | ${new Date().toISOString().split('T')[0].slice(0, 7)} | **Active** | [Release Notes](https://docs.zowe.org/stable/whats-new/release-notes/v${process.env.NEW_VERSION.replace(/\./g, '_')}) |`;

// Read, Update and Write to Markdown File
function updateReleaseHistory(newRow) {
    fs.readFile(mdFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            return;
        }

        // Find the table and insert the new row after the second row
        const lines = data.split('\n');
        let tableLineCount = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('|') && lines[i].endsWith('|')) {
                tableLineCount++;
                if (tableLineCount === 2) {
                    // Insert the new row after the second row
                    lines.splice(i + 1, 0, newRow);
                    break;
                }
            }
        }

        fs.writeFile(mdFilePath, lines.join('\n'), 'utf8', (err) => {
            if (err) {
                console.error('Error writing the file:', err);
                return;
            }
            console.log('Markdown file updated successfully.');
        });
    });
}

// Update the zoweVersion in package.json
function updatePackageJsonVersion(newVersion) {
    const packageJsonPath = path.join(__dirname, '../packages/cli/package.json');
    fs.readFile(packageJsonPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading package.json:', err);
            return;
        }

        let packageJson = JSON.parse(data);
        packageJson.zoweVersion = `v${newVersion}`;

        fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Error writing to package.json:', err);
                return;
            }
            console.log('package.json updated successfully.');
        });
    });
}

// Execute the functions
updatePackageJsonVersion(process.env.NEW_VERSION);
updateReleaseHistory(newRow);