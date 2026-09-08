module.exports = ({ config }) => {
  const origin =
    process.env.APP_URL ||
    config.extra?.router?.origin ||
    'https://ais-dev-l6dcg7hgjdnlnowz6d47xt-674307555306.europe-west2.run.app';

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
