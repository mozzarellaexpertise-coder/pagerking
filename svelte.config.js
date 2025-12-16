import adapterVercel from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapterVercel()
    // no prerender block needed for SSR
  }
};

export default config;