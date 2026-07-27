import mongoose from 'mongoose';
import Agenda from 'agenda';
import config from './config/config';

(async () => {
  try {
    await mongoose.connect(config.mongoose.url);
    const agenda = new Agenda({ mongo: mongoose.connection.db as any });

    // Example job data (customize as needed)
    const jobData = {
      name: 'Sample HTTP Scheduler Job',
      type: 'http',
      company: new mongoose.Types.ObjectId(), // Replace with real company ID
      schedule: '*/5 * * * *', // Every 5 minutes
      targetApp: new mongoose.Types.ObjectId(), // Replace with real app ID
      targetController: 'sampleController',
      endpoint: 'https://httpbin.org/post',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { foo: 'bar' },
      status: 'active',
      createdBy: new mongoose.Types.ObjectId(), // Replace with real user ID
      lastModifiedBy: new mongoose.Types.ObjectId(), // Replace with real user ID
      isDisabled: false,
    };

    const job = agenda.create('http-scheduler-job', jobData);
    job.repeatEvery(jobData.schedule);
    await job.save();
    await agenda.stop();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
})();
