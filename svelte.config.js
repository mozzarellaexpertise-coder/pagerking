import adapter from '@sveltejs/adapter-auto'; // or '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		// This is the important part:
		adapter: adapter({
			runtime: 'nodejs22.x' 
		})
	}
};

export default config;