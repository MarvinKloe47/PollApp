# PollApp

PollApp is a small survey and voting application built with Angular and Supabase.  
Users can browse active and past polls, create new polls with multiple answer options, and vote on existing polls. The detail page also reacts to live vote updates, so results can refresh without reloading the page.

## Project Overview

The app is centered around three main user flows:

1. Home page: browse polls, switch between active and past polls, and filter by category.
2. Create poll: create a new poll with a title, description, deadline, category, and answer options.
3. Poll detail: view results, submit a vote, and receive realtime vote updates.

The frontend is implemented as a standalone Angular application. Data is stored in Supabase and loaded through dedicated Angular services.

## Features

- Create polls with custom answer options
- Browse active and expired polls
- Filter polls by category
- Vote once per user on a poll
- Store a local voter identifier in `localStorage`
- Realtime vote updates via Supabase channels
- Clean separation between pages, shared components, models, and services

## Tech Stack

- Angular 17
- TypeScript
- SCSS
- Supabase
- RxJS

## Getting Started

### Prerequisites

- Node.js
- npm

### Install dependencies

```bash
npm install
```

### Create your local environment file

This project requires a local Supabase configuration file for the database connection.  
The file is ignored by Git, so you need to create it yourself before starting the app.

Create `src/environments/environment.ts` with your own Supabase project values:

```ts
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

Without this file, the app cannot connect to the database and poll loading, creation, and voting will not work.

### Start the development server

```bash
npm start
```

The app will be available at `http://localhost:4200/`.

## Available Scripts

- `npm start` starts the Angular development server
- `npm run build` creates a production build in `dist/`
- `npm run watch` rebuilds the app in development mode on file changes
- `npm test` runs the unit tests with Karma

## Project Structure

```text
src/
  app/
    core/
      models/       Data interfaces such as polls, options, and votes
      services/     Supabase access and poll-related business logic
    pages/
      home/         Poll overview and filtering
      create-poll/  Poll creation flow
      poll-detail/  Voting and result display
    shared/
      components/   Reusable UI building blocks such as the poll card
```

## Routing

The application currently uses three top-level routes:

- `/` for the home page
- `/create` for poll creation
- `/poll/:id` for the poll detail page

## Data Flow

The main application logic is handled in two services:

- `SupabaseService` creates and provides the shared Supabase client
- `PollService` loads polls, creates polls, stores votes, and subscribes to vote updates

Poll creation inserts a poll first and then its answer options.  
Voting stores the user vote and triggers a Supabase database function to increment the option counter.

## Realtime Behavior

The poll detail page subscribes to updates for the selected poll.  
When an option's vote count changes, the page reloads the latest poll data and updates the visible results.

## Notes

- The Supabase environment file must be created locally and is intentionally not committed to the repository.
- A client-side voter ID is generated with `crypto.randomUUID()` and stored in `localStorage`.
- Some user-facing texts in the app are still mixed between English and German.

## Build

To create a production build:

```bash
npm run build
```

The output is written to `dist/poll-app`.

## Testing

To run the existing unit tests:

```bash
npm test
```

## Future Ideas

- Add authentication or admin ownership for created polls
- Prevent duplicate votes more robustly on the backend
- Support multiple questions per poll end-to-end
- Improve validation and error feedback
- Add more meaningful unit and integration tests
