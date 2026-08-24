const { inngest } = require('./client');
const { reports } = require('../store');

// Function 1: say-hello (test function)
const sayHello = inngest.createFunction(
  {
    id: 'say-hello',
    triggers: [{ event: 'test/hello' }], 
  },
  async ({ step }) => {
    await step.sleep('wait-a-bit', '5s');
    return { message: 'Hello from the background!' };
  }
);
// Function 2: make-report (background job)
const makeReport = inngest.createFunction(
  {
    id: 'make-report',
    triggers: [{ event: 'report/requested' }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { id, topic } = event.data;

    // Step 1: Simulate slow work (8 seconds)
    await step.sleep('do-the-slow-work', '8s');

    // Step 2: Build the report
    const result = await step.run('build-report', () => {
      if (topic === 'fail') {
        throw new Error('The report oven is broken!');
      }
      const reportContent = `Report on "${topic}" generated at ${new Date().toISOString()}`;
      return { result: reportContent };
    });

    // Update the report in memory
    reports[id] = {
      ...reports[id],
      status: 'done',
      result: result.result,
    };

    return { id, status: 'done', result: result.result };
  }
);
const heartbeat = inngest.createFunction(
  {
    id: 'heartbeat',
    triggers: [{ cron: '* * * * *' }],  // every minute
  },
  async ({ step }) => {
    const all = Object.values(reports);
    const pending = all.filter(r => r.status === 'pending').length;
    const done = all.filter(r => r.status === 'done').length;
    const failed = all.filter(r => r.status === 'failed').length;

    console.log(`[heartbeat] pending: ${pending}, done: ${done}, failed: ${failed}`);

    return { pending, done, failed };
  }
);
module.exports = { sayHello, makeReport, heartbeat };
