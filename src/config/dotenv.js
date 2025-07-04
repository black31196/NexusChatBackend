const path = require('path');

// This path is correct for .env files located inside the 'src' folder.
// It goes up one directory from 'src/config/' to 'src/'.
require('dotenv').config({ path: path.resolve(__dirname, '../.env.express') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.mongodb') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.lineOA') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.postgres') });

console.log('✅ Dotenv config loaded.');