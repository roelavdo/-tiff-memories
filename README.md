# TIFF Memories

Deploys on Vercel with no build step.

- `/` is the public site. Photos sit side by side, each one shown whole.
- `/admin` is the private portal. It needs the `ADMIN_PASSWORD` environment variable and a Vercel Blob store (Public).

## People

- `/people` shows a grid of stars. Hover one: the full-screen background banner (photo or video) appears and the other stars hide.
- `/people/<name>` is the personal page: bio, socials, and every photo/video tagged with that name.
- Add people in `/admin` > People. Use the same name as in "Who was there".
