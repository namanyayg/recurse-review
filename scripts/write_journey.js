import { fileURLToPath } from 'url';
import path from 'path';
import { randomUUID } from 'crypto';
import { loadJourneyData } from './generate_journey.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const USER_NAME = 'namanyay';

/**
 * Write journey data to D1 database
 */
async function writeJourneyToDatabase() {
    try {
        console.log('Loading journey data...');
        const journeyData = await loadJourneyData();
        
        // Convert journey data to base64
        const journeyJson = JSON.stringify(journeyData);
        const journeyBase64 = Buffer.from(journeyJson).toString('base64');
        const userId = randomUUID();
        
        // Create SQL command with base64 encoded journey data
        const sqlCommand = `
            INSERT OR REPLACE INTO recursers (id, name, journey) 
            VALUES ('${userId}', '${USER_NAME}', '${journeyBase64}');
        `;
        
        console.log('Executing D1 command...');
        
        const process = await import('node:child_process');
        const wranglerCmd = `echo "${sqlCommand}" | npx wrangler d1 execute recurse-review-db-new --command -`;
        
        const { stdout, stderr } = await new Promise((resolve, reject) => {
            process.exec(wranglerCmd, (error, stdout, stderr) => {
                if (error) {
                    console.error('Error executing D1 command:', error);
                    reject(error);
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });

        if (stderr) {
            console.error('Error output:', stderr);
        }

        console.log('Journey data updated in database successfully');
        if (stdout) {
            console.log('Command output:', stdout);
        }
        
        return { success: true, userId };
    } catch (error) {
        console.error('Error writing journey to database:', error);
        throw error;
    }
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    writeJourneyToDatabase().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

export { writeJourneyToDatabase }; 