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
