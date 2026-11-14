const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Expo Config Plugin to add Android 11+ <queries> intent declarations to AndroidManifest.xml
 * Enables Linking.canOpenURL / Linking.openURL for sms: and whatsapp (wa.me).
 */
module.exports = function withAndroidQueries(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    if (!androidManifest.manifest.queries) {
      androidManifest.manifest.queries = [];
    }

    const queries = androidManifest.manifest.queries;

    const intentsToQuery = [
      {
        action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
        data: [{ $: { "android:scheme": "sms" } }],
      },
      {
        action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
        data: [{ $: { "android:scheme": "whatsapp" } }],
      },
      {
        action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
        data: [{ $: { "android:scheme": "https", "android:host": "wa.me" } }],
      },
    ];

    intentsToQuery.forEach((intent) => {
      queries.push({ intent });
    });

    return config;
  });
};
