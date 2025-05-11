# k6-animals-ts

POC for load testing an animals API using k6, TypeScript, and HTML reporting. This project demonstrates how to automate and monitor REST endpoints with modern tooling.

## Description

This repository contains a proof of concept (POC) for load testing a mock animals API. It uses [k6](https://k6.io/) for scripting and running the tests, TypeScript for type safety, and generates HTML reports for easy analysis. The project is designed for demonstration, learning, and as a starting point for more advanced API testing and automation.

## Features

- Load testing of REST endpoints (GET, POST, PUT, DELETE)
- Written in TypeScript for better maintainability
- HTML and CLI summary reports
- Example of setup and teardown logic
- Easily customizable for other APIs

## Requirements

- Node.js (for development tooling)
- [k6](https://k6.io/docs/getting-started/installation/) (for running the tests)

## Getting Started

### 1. Install dependencies (for linting, formatting, etc.)

```sh
npm install
```

### 2. Prepare your test data

Edit or replace `animals.json` with your own animal objects. Each object should match the `Animal` interface in `animals.test.ts`.

### 3. Run the load test

```sh
k6 run animals.test.ts
```

### 4. View the HTML report

After the test, open `report/load-testing.html` in your browser to see a detailed report.

## Project Structure

- `animals.test.ts` - Main k6 test script (TypeScript)
- `animals.json` - Test data for animal objects
- `report/` - Output directory for HTML reports
- `package.json` - Project metadata and scripts
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration

## Scripts

- `npm run prepare` - Sets up Husky for git hooks (if used)

## License

Creative Commons Attribution 4.0 International (CC BY 4.0)

## Keywords

k6, typescript, load-testing, api, animals, mockapi, performance, poc, testing, automation, report, html-report
