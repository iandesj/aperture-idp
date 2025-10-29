// Aperture IDP Configuration
// Copy this file to aperture.config.ts and customize for your environment

export interface ApertureConfig {
  github: {
    enabled: boolean;
    token?: string;
    repositories: string[];
  };
  gitlab: {
    enabled: boolean;
    token?: string;
    projects: string[];
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
      'iandesj/*'
      // Add your repositories here
      // 'my-org/my-repo',
      // 'my-org/*',
    ],
  },
  gitlab: {
    // Enable GitLab integration - reads from GITLAB_ENABLED env var
    enabled: process.env.GITLAB_ENABLED === 'true',
    
    // GitLab Personal Access Token - reads from GITLAB_TOKEN env var
    // Required if enabled is true
    // Token needs 'read_api' scope
    token: process.env.GITLAB_TOKEN,
    
    // List of projects to scan for catalog-info.yaml files
    // Format:
    //   - "group/project" for a specific project
    //   - "group/*" to scan all projects in a group (includes subgroups)
    //   - "username/*" to scan all user projects
    // Supports nested groups: "parent-group/sub-group/project"
    // Examples:
    //   "my-group/backend-api"              - Single project
    //   "my-group/sub-group/frontend-app"   - Nested group project
    //   "my-group/*"                        - All projects in group (includes subgroups)
    //   "username/*"                        - All projects for a user
    projects: [
      'codenbrew/*'
      // Add your projects here
      // 'my-group/my-project',
      // 'my-group/*',
    ],
  },
};

export default config;
