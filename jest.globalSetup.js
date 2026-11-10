module.exports = async () => {
  // Force a deterministic timezone for all tests to avoid host-dependent failures.
  process.env.TZ = 'Africa/Algiers';
};
