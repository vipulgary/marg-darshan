// Production builds use webpack (`next build --webpack`): Turbopack spawns a
// Node worker for CSS loaders, which Hostinger's shared hosting kills.
// Turbopack (dev) already runs Tailwind via the loader in next.config.ts,
// so only apply the PostCSS plugin when webpack is building.
const config = {
  plugins: process.env.TURBOPACK ? {} : { "@tailwindcss/postcss": {} },
};

export default config;
