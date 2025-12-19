import adapter from '@sveltejs/adapter-auto'; // NOT adapter-static
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// adapter-auto detects Vercel automatically and enables API routes
		adapter: adapter()
	}
};

export default config;