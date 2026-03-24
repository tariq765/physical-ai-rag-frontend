# AI Native Book

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Prerequisites

- Node.js >= 20.0
- npm or yarn

## Installation

```bash
npm install
# or
yarn
```

## Local Development

```bash
npm start
# or
yarn start
```

This command starts a local development server and opens up a browser window at `http://localhost:3000`. Most changes are reflected live without having to restart the server.

**Note:** If you encounter module errors, try deleting `node_modules` and `package-lock.json`, then run `npm install` again.

## Build

```bash
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Using SSH:

```bash
USE_SSH=true yarn deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
