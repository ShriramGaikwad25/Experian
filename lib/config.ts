import appConfig from "@/config.json";

/**
 * Optional fallback tenant for Assurance Events calls made before a tenant is active.
 * Sign-in URLs: /ACMECOM, /KFPRODOCI (tenant in path, not config); config.json may omit it.
 */
export const tenantId = (appConfig as { tenantId?: string }).tenantId ?? "";

// Application configuration
export const config = {
  tenantId,
  api: {
    endpoints: {
      jobs: tenantId
        ? `https://preview.keyforge.ai/kfscheduler/api/v1/${tenantId}/jobs`
        : "",
    },
  },
};
