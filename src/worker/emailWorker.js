// src/worker/emailWorker.js
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { sendRegistrationEmail } = require('../service/emailService');
const Hospital=require("../model/relationalModels/hospital");

// Use the same connection configuration as the queue
const connection = new IORedis({ 
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
}); 

const worker = new Worker('emailing', async (job) => {
    
    if (job.name === 'registrationEmail') {
        const data = job.data;
        if (data.testDetails && data.testDetails.location) {
            const hospital = await Hospital.findByPk(data.testDetails.location);
            if (hospital) {
                // Overwrite the location ID with the human-readable name
                data.testDetails.location = hospital.hospitalname; 
            } else {
                data.testDetails.location = 'Unknown Location';
            }
        }
        console.log(`Worker processing email job for UHID: ${data.username} (Type: ${data.regType})`);

        const success = await sendRegistrationEmail(data); 
        
        if (!success) {
            // Throwing an error forces BullMQ to retry the job based on configuration
            throw new Error(`Email failed to send to ${data.to}. Retrying...`); 
        }
    }

}, { connection, concurrency: 5 }); // Set concurrency for parallel sending

console.log("Email Worker started and listening for jobs on 'emailing' queue...");
// This file needs to be run continuously, usually via PM2 or a similar process manager.