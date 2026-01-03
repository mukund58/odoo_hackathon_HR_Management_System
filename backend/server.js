// Run the server
const app = require('./src/app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
    console.log(`Other devices can access at http://<your-laptop-ip>:${PORT}`);
});