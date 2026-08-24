// A single shared in-memory store for reports.
// Both server.js and inngest/functions.js import from here so they're
const reports = {};

module.exports = { reports };
