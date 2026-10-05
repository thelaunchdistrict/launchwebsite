import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

// Every page is prerendered at build time from data/projects.json, so a read-only cache served
// from the static assets is enough — no R2 bucket or KV namespace to create.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
