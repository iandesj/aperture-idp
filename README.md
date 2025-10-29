# Aperture IDP

An extensible Internal Developer Portal built with Next.js, focused on software cataloging and component discovery.

## Features

- **Software Catalog**: Manage and discover software components using Backstage-compatible YAML definitions
- **GitHub Integration**: Automatically import catalog files from GitHub repositories
- **GitLab Integration**: Automatically import catalog files from GitLab projects
- **Search & Filtering**: Find components by name, type, lifecycle, or tags
- **System Architecture**: Visualize components organized by systems
- **Dependency Visualization**: Interactive graph showing component relationships
- **Plugin System**: Extensible architecture for adding new features
- **Dashboard**: Visual overview of your software catalog with statistics and component cards
- **Dark Mode**: Automatic dark mode support

## Prerequisites

- Node.js 20.x or higher
- npm, yarn, pnpm, or bun

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 3. Add Components to the Catalog

Add new component definitions in the `catalog-data/` directory using Backstage-compatible YAML format:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-component
  description: Description of your component
  tags:
    - typescript
    - backend
  links:
    - url: https://github.com/example/repo
      title: Repository
spec:
  type: service
  lifecycle: production
  owner: team-name
```

The catalog will automatically update when you add or modify YAML files.

## GitHub Integration

Aperture can automatically import catalog definitions from GitHub repositories.

### Setup

1. **Generate a GitHub Personal Access Token**
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate a new token with `repo` scope
   - Copy the token

2. **Configure Environment Variables**

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```bash
GITHUB_ENABLED=true
GITHUB_TOKEN=your_github_personal_access_token_here
```

3. **Add Repositories to Import**

Copy `aperture.config.example.ts` to `aperture.config.ts`:

```bash
cp aperture.config.example.ts aperture.config.ts
```

Then edit `aperture.config.ts` and add repositories to the `repositories` array:

```typescript
export default {
  github: {
    enabled: process.env.GITHUB_ENABLED === 'true',
    token: process.env.GITHUB_TOKEN,
    repositories: [
      'my-org/backend-api',      // Specific repository
      'my-org/frontend-app',     // Another specific repository
      'my-org/*',                // All repositories in organization
      'username/*',              // All repositories for a user
    ],
  },
};
```

**Wildcard Support**: Use `owner/*` to automatically scan all repositories for an organization or user. This is useful for discovering all catalog files automatically across multiple repositories.

### Usage

1. Navigate to the Software Catalog page
2. Click the "Import Catalog Data" button
3. Wait for the import to complete
4. Imported components will be merged with local components
5. Components from GitHub will show a "GitHub" badge

### How It Works

- Scans configured repositories for `catalog-info.yaml` files in the root directory
- Imports valid Backstage-compatible component definitions
- Stores imported data separately from local files
- Merges local and imported components (local takes precedence for duplicates)
- Cached data persists in `.aperture/imported.json`

### Troubleshooting

**Import button is disabled or errors occur:**
- Check that `GITHUB_TOKEN` is set in `.env.local`
- Verify the token has proper permissions
- Ensure repositories are in `owner/repo` format

**Rate limiting:**
- GitHub API has rate limits (5,000 requests/hour for authenticated users)
- The import will stop if rate limit is exceeded
- Wait for the rate limit to reset (shown in error message)

**No components imported:**
- Verify repositories have `catalog-info.yaml` in the root directory
- Check that the YAML file is valid and follows Backstage schema

## GitLab Integration

Aperture can automatically import catalog definitions from GitLab projects.

### Setup

1. **Generate a GitLab Personal Access Token**
   - Go to GitLab Settings → Access Tokens: https://gitlab.com/-/user_settings/personal_access_tokens
   - Create a token with `read_api` scope
   - Copy the token

2. **Configure Environment Variables**

Edit your `.env.local` file:

```bash
GITLAB_ENABLED=true
GITLAB_TOKEN=your_gitlab_personal_access_token_here
```

3. **Add Projects to Import**

Edit `aperture.config.ts` and add projects to the `gitlab.projects` array:

```typescript
export default {
  gitlab: {
    enabled: process.env.GITLAB_ENABLED === 'true',
    token: process.env.GITLAB_TOKEN,
    projects: [
      'my-group/backend-api',              // Specific project
      'my-group/sub-group/frontend-app',   // Nested group project
      'my-group/*',                        // All projects in group (includes subgroups)
      'username/*',                        // All projects for a user
    ],
  },
};
```

**Wildcard Support**: Use `group/*` to automatically scan all projects in a GitLab group (including subgroups). Use `username/*` to scan all projects for a user.

**Nested Groups**: GitLab supports nested groups (e.g., `parent-group/sub-group/project`). The importer will discover all projects when using wildcards with `include_subgroups=true`.

### Usage

1. Navigate to the Software Catalog page
2. Click the "Import Catalog Data" button
3. Both GitHub and GitLab imports will run (if enabled)
4. Imported components will be merged with local components
5. Components from GitLab will show a "GitLab" badge

### How It Works

- Scans configured projects for `catalog-info.yaml` files in the root directory
- Supports both GitLab.com (default)
- Imports valid Backstage-compatible component definitions
- Handles nested groups automatically
- Stores imported data separately from local files and GitHub imports
- Cached data persists in `.aperture/imported.json`

### Troubleshooting

**Import button is disabled or errors occur:**
- Check that `GITLAB_TOKEN` is set in `.env.local`
- Verify the token has `read_api` scope
- Ensure projects are in `group/project` format

**Rate limiting:**
- GitLab.com API has rate limits (2,000 requests/minute for authenticated users)
- The import will stop if rate limit is exceeded
- Wait for the rate limit to reset (shown in error message)

**No components imported:**
- Verify projects have `catalog-info.yaml` in the root directory
- Check that the YAML file is valid and follows Backstage schema
- For private projects, ensure your token has access

**Wildcard not finding all projects:**
- Verify the group/username exists and is spelled correctly
- For groups, wildcards include subgroups automatically
- For private projects under a user, ensure you're using the authenticated user's username

## Available Scripts

- `npm run dev` - Start development server at http://localhost:3000
- `npm run build` - Build the application for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Testing

This project uses [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/react) for testing.

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage

The project includes comprehensive tests for:

- **Catalog Functions** (`src/lib/__tests__/catalog.test.ts`)
  - Component data fetching and parsing
  - Statistics calculations
  - Component filtering and retrieval

- **Component Tests** 
  - Dashboard page (`src/app/__tests__/page.test.tsx`)
  - Catalog page with search and filtering (`src/plugins/catalog/components/__tests__/CatalogPage.test.tsx`)
  - Component detail pages (`src/app/catalog/[componentName]/__tests__/page.test.tsx`)

### Writing Tests

Tests are colocated with the code in `__tests__` directories. Example structure:

```
src/
├── lib/
│   ├── catalog.ts
│   └── __tests__/
│       └── catalog.test.ts
├── app/
│   ├── page.tsx
│   └── __tests__/
│       └── page.test.tsx
```

When adding new features:
1. Create a `__tests__` directory next to your code
2. Name test files with `.test.ts` or `.test.tsx` extension
3. Mock external dependencies (filesystem, APIs, etc.)
4. Test both happy paths and edge cases

## Project Structure

```
aperture-idp/
├── catalog-data/       # Component YAML definitions
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # Reusable UI components
│   ├── lib/           # Utility functions and data access
│   └── plugins/       # Plugin implementations
```

## Built With

- [Next.js 16](https://nextjs.org) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [js-yaml](https://github.com/nodeca/js-yaml) - YAML parsing
- [ReactFlow](https://reactflow.dev/) - Dependency graph visualization
- [Lucide React](https://lucide.dev/) - Icon library
