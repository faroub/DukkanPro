module.exports = ({ config }) => {
  const origin =
    process.env.APP_URL ||
    config.extra?.router?.origin ||
    false;

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
