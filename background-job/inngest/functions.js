const { inngest } = require('./client');

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

module.exports = { sayHello };
