export interface ApertureConfig {
  github: {
    enabled: boolean;
    token?: string;
    repositories: string[];
  };
}

const config: ApertureConfig = {
  github: {
    enabled: process.env.GITHUB_ENABLED === 'true',
    token: process.env.GITHUB_TOKEN,
    repositories: [
      'iandesj/aperture-idp-test-app',
      // Add repositories to import catalog files from
      // Format: "owner/repo" or "org/*" for future wildcard support
      // Example: "my-org/my-repo"
    ],
  },
};

export default config;
