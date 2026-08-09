/**
 * Public runtime endpoints.
 * Cloudflare Pages may not receive local .env.production files, so the
 * production endpoint remains available as a tracked, overridable default.
 */
const DEFAULT_AGENT_RUNTIME_URL = 'https://agent.5051001.xyz/api/copilotkit';

export const AGENT_RUNTIME_URL =
  import.meta.env.VITE_AGENT_RUNTIME_URL || DEFAULT_AGENT_RUNTIME_URL;
