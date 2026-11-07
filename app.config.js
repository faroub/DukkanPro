module.exports = ({ config }) => {
  // router.origin is set ONLY from an explicit APP_URL environment variable.
  // There is no baked-in default, so plain and release builds never carry a
  // development origin.
  const origin = process.env.APP_URL || false;

  return {
    ...config,
    extra: {
      ...config.extra,
      router: {
        ...config.extra?.router,
        origin,
      },
    },
  };
};
