name: Lint

on:
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  eslint:
    name: ESLint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: lts/*

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Create ESLint output directory
        run: mkdir -p eslint-results

      - name: Run ESLint
        run: pnpm lint --format=json --output-file=eslint-results/eslint-results.json
        continue-on-error: true

      - name: Upload ESLint results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: eslint-results-${{ github.run_id }}
          path: eslint-results/
          retention-days: 7

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: lts/*

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run Astro Check
        run: pnpm astro check
        env:
          ENABLE_CONTENT_SYNC: false
