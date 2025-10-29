// Aperture IDP Configuration
// Copy this file to aperture.config.ts and customize for your environment

export interface ApertureConfig {
  github: {
    enabled: boolean;
    token?: string;
    repositories: string[];
  };
}

const config: ApertureConfig = {
  github: {
    // Enable GitHub integration - reads from GITHUB_ENABLED env var
    enabled: process.env.GITHUB_ENABLED === 'true',
    
    // GitHub Personal Access Token - reads from GITHUB_TOKEN env var
    // Required if enabled is true
    token: process.env.GITHUB_TOKEN,
    
    // List of repositories to scan for catalog-info.yaml files
    // Format: 
    //   - "owner/repo" for a specific repository
    //   - "owner/*" to scan all repositories (works for orgs and users)
    // Examples:
    //   "my-org/backend-api"        - Single repository
    //   "my-org/frontend-app"       - Single repository  
    //   "my-org/*"                  - All repos in organization
    //   "username/*"                - All repos for a user
    //   "username/personal-project" - Single user repository
    repositories: [
      // Add your repositories here
      // 'my-org/my-repo',
      // 'my-org/*',
    ],
  },
};

export default config;
