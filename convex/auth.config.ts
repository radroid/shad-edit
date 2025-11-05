import type { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      // Set this in the Convex Dashboard for dev/prod per docs
      // https://docs.convex.dev/auth/clerk#configuring-dev-and-prod-instances
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;


