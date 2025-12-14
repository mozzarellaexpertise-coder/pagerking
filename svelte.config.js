import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

export default {
  preprocess: preprocess(),
  kit: {
    adapter: adapter({
      fallback: 'index.html', // SPA fallback for dynamic routes
    }),
    // remove `prerender.default`
    prerender: {
      entries: [] // leave empty or list pages you want prerendered
    }
  }
};