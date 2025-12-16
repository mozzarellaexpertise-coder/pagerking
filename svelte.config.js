import adapterVercel from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapterVercel(),
    // optional: prerender false (default)
    prerender: {
      default: false
    }
  }
};

export default config;