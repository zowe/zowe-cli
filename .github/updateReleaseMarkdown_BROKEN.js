const fs = require('fs');
const path = require('path');
const https = require('https');

// This script is attempting to add whatever list of the CLI team is shown in the TSC repo https://raw.githubusercontent.com/zowe/community/master/COMMITTERS.md.
// Despite efforts, this is not working. Adam will always be cut off (possibly just whoever is first in the table).
// Leaving this code present and hoping that the problem with this file can be solved in the future.

// URL of the raw markdown file to be appended to RELEASE_HISTORY.md
const url = 'https://raw.githubusercontent.com/zowe/community/master/COMMITTERS.md';

// Build the new row to be added
const newVersion = process.env.NEW_VERSION;
const newRow = `|  v${newVersion}  | ${new Date().toISOString().split('T')[0].slice(0, 7)} | **Active** | [Release Notes](https://docs.zowe.org/stable/whats-new/release-notes/v${newVersion.replace(/\./g, '_')}) |`;

const mdFilePath = path.join(__dirname, '../RELEASE_HISTORY.md');

// Function to fetch CLI team from a URL
function fetchCliTeam(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            // A chunk of data has been received
            res.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received
            res.on('end', () => {
                // Extract only the CLI contributors section
                const cliSectionMatch = data.match(/### Zowe CLI Squad[\s\S]*?(?=###|$)/);
                const cliSection = cliSectionMatch ? cliSectionMatch[0] : '';
                resolve(cliSection);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Function to remove existing CLI team section and append new one
function updateCliTeamInMd(cliTeam) {
    // Read the current content of the markdown file
    fs.readFile(mdFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            return;
        }

        // Remove the old CLI squad section and replace it with the new one
        const updatedData = data.replace(/### Zowe CLI Squad[\s\S]*?(?=###|$)/, cliTeam + '\n');

        // Write the updated data back to the file
        fs.writeFile(mdFilePath, updatedData, 'utf8', (err) => {
            if (err) {
                console.error('Error writing the file:', err);
                return;
            }
            console.log('CLI team has been updated in RELEASE_HISTORY.md successfully.');
        });
    });
}

// Main function to fetch CLI team and update RELEASE_HISTORY
async function appendCliTeam() {
    try {
        const cliTeam = await fetchCliTeam(url);
        updateCliTeamInMd(cliTeam);
    } catch (error) {
        console.error('Error fetching CLI team:', error);
    }
}

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

// Execute the two main functions
(async () => {
    await appendCliTeam();
    updateReleaseHistory(newRow);
})();