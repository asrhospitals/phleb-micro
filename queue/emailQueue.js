const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Configure connection details
const connection = new IORedis({ 
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
}); 

// Create the queue instance
const emailQueue = new Queue('emailing', { connection });

module.exports = emailQueue;