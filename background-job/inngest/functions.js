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
  },
  async ({ event, step }) => {
    const { id, topic } = event.data;

    // Step 1: Simulate slow work (8 seconds)
    await step.sleep('do-the-slow-work', '8s');

    // Step 2: Build the report
    const result = await step.run('build-report', () => {
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

module.exports = { sayHello, makeReport };
