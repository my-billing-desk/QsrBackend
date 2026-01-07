const app = require('./server');
const listEndpoints = require('express-list-endpoints');

console.log('Registered Routes:');
const endpoints = listEndpoints(app);
endpoints.forEach(e => {
    if (e.path.includes('financial')) {
        console.log(`${e.methods.join(',')} ${e.path}`);
    }
});
