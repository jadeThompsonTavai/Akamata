# Akamata

Free bite-sized guides for new hires. Guests can learn straight away, accounts are optional,
and admins write and publish guides from an in-app content manager.

Stack: Vite, React, Supabase (auth, database, image storage), vite-plugin-pwa.

## Setup

1. Create a project at supabase.com.
2. Open the SQL editor and run `supabase/schema.sql`. It creates tables, security rules,
   an image bucket and one starter guide.
3. Copy `.env.example` to `.env` and fill in the project URL and anon key
   (Project settings, API).
4. `npm install` then `npm run dev`.
5. Sign up in the app, then make yourself admin by running this in the SQL editor:
   `update profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');`
   A "Manage content" link appears in the header.

## Deploy

Push to GitHub and import the repo into Vercel or Netlify. Add the two env vars, and add a
rewrite so every path serves `index.html` (Netlify: `/* /index.html 200`).
The PWA only installs over HTTPS, which both hosts provide.

## Notes

- Guests' progress is kept in localStorage and uploaded when they sign in.
- Admin rights are enforced by database security rules, not by the front end.
- For the best install prompt on all devices, add 192px and 512px PNG icons to `public/`
  and list them in the manifest in `vite.config.js`.
- Each step can hold a video, article text, or both. Videos upload to the `media` bucket.
  The limit is 50 MB per file on Supabase's free plan. If you already ran the old schema, run:
  `update storage.buckets set file_size_limit = 52428800, allowed_mime_types = array['image/*','video/mp4','video/webm','video/quicktime'] where id = 'media';`
- Uploaded files are cleaned up: deleting a guide removes its images and videos, and saving a guide removes files it no longer uses. Leaving the editor without saving discards that session's uploads. Files are tracked by the URLs in each guide, so don't paste one guide's media URL into another.
- Guide text is Markdown, so images, bold text and lists work in the editor.
