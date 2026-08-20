// Konfigurasi dinamis — memastikan APK untuk profile rilis (github-release / preview)
// hanya memuat native library arsitektur arm64-v8a agar ukuran APK jauh lebih kecil.
// Profile lain (development, production) tetap memuat semua ABI.
export default ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE ?? "";
  const slim = profile === "github-release" || profile === "preview";

  const plugins = [...(config.plugins ?? [])];

  // Hapus entri polos bila ada agar tidak dobel dengan entri berkonfigurasi di bawah.
  const filtered = plugins.filter((plugin) => {
    if (typeof plugin === "string") return plugin !== "expo-build-properties";
    return !(Array.isArray(plugin) && plugin[0] === "expo-build-properties");
  });

  return {
    ...config,
    plugins: [
      ...filtered,
      [
        "expo-build-properties",
        {
          android: {
            ...(slim ? { buildArchs: ["arm64-v8a"] } : {}),
            enableBundleCompression: slim,
            enableMinifyInReleaseBuilds: slim, // syarat agar shrinkResources valid
            enableShrinkResourcesInReleaseBuilds: slim,
          },
        },
      ],
    ],
  };
};