// svelte.config.js

// 1. IMPORT THE CORRECT ADAPTER
import adapter from '@sveltejs/adapter-vercel'; 
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // We can keep the preprocess block
    preprocess: preprocess(),

    kit: {
        // 2. USE THE CORRECT ADAPTER
        adapter: adapter(),
        
        // We no longer need the 'prerender' block since Vercel handles dynamic rendering
    }
};

export default config;