module.exports = {
  webpack: {
    configure: (config) => {
      // Silence noisy third-party source map warnings (react-datepicker)
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { message: /Failed to parse source map/ },
      ];
      // Exclude react-datepicker from source-map-loader if present
      (config.module.rules || []).forEach((rule) => {
        if (rule.enforce === 'pre' && Array.isArray(rule.use)) {
          rule.exclude = Array.isArray(rule.exclude)
            ? [...rule.exclude, /node_modules\/react-datepicker/]
            : /node_modules\/react-datepicker/;
        }
      });
      return config;
    },
  },
};


