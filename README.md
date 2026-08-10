# TeeMate

A platform for caddies and players to find each other for tournaments across the PGA Tour, Korn Ferry Tour, and PGA Tour Americas.

Built with **React (Vite)**, **Supabase** (auth, database, realtime messaging), and **React Router**.

## What's here

- Sign up / log in, with separate caddie and player profiles
- A feed of open posts ("looking for a player" / "looking for a caddie"), filterable by tour and post type
- Post creation tied to a specific tournament
- Direct messaging between users, live via Supabase Realtime
- A tour schedule browser (PGA / Korn Ferry / Americas)

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In your project, go to **SQL Editor > New query**, paste in the contents of `supabase/schema.sql`, and run it. This creates the `profiles`, `tournaments`, `posts`, and `messages` tables with the right permissions.
3. Go to **Settings > API** and copy your **Project URL** and **anon public key**.
4. In this project folder, copy the env template and fill in those two values:
   ```
   cp .env.example .env
   ```

### Adding tournament data

There's currently no public schedule API for these tours, so tournaments are loaded from the `tournaments` table directly. For now, add rows manually in the Supabase Table Editor (**Table Editor > tournaments > Insert row**) — `name`, `tour` (`PGA`, `Korn Ferry`, or `Americas`), `location`, `start_date`, `end_date`. Down the line this could be automated with a scheduled scraper or a paid sports-data API.

## 2. Run it locally

```
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`).

## 3. Push this to GitHub

```
git init
git add .
git commit -m "Initial TeeMate scaffold"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/teemate.git
git push -u origin main
```

Create the empty `teemate` repo on GitHub first (no README/gitignore, since this project already has them), then run the above from this folder.

## Project structure

```
src/
  components/     Navbar, PostCard, ProtectedRoute
  contexts/       AuthContext — tracks the logged-in user + their profile
  lib/            Supabase client + shared TypeScript types
  pages/          One file per route (Login, Feed, NewPost, TourSchedule, Messages, ...)
supabase/
  schema.sql      Run this once in the Supabase SQL editor to set up your database
```

## Where to go next

- **Search**: the feed currently filters by tour and post type; a text/keyword search over posts and profiles is a natural next step.
- **Notifications**: push or email notifications when someone messages you or posts a match for your preferences.
- **Tournament data automation**: replace manual entry with a scraper or a sports-data API integration.
- **Native mobile**: this React web app's logic and Supabase backend can be reused almost entirely if you later wrap the UI in React Native (Expo).
