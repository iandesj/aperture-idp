# Aperture IDP

An extensible Internal Developer Portal built with Next.js, focused on software cataloging and component discovery.

## Features

- **Software Catalog**: Manage and discover software components using Backstage-compatible YAML definitions
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
