/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The libSQL/SQLite driver uses native code: load it from node_modules instead of bundling it.
  serverExternalPackages: ["@libsql/client", "libsql"],
  experimental: {
    // allow larger form posts from the admin (local uploads go through /api/admin/upload)
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
