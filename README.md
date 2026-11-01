# TIFF Memories

Deploys on Vercel with no build step.

- `/` is the public site. Photos sit side by side, each one shown whole.
- `/admin` is the private portal. It needs the `ADMIN_PASSWORD` environment variable and a Vercel Blob store (Public).

## People

- `/people` shows a grid of stars. Hover one: the full-screen background banner (photo or video) appears and the other stars hide.
- `/people/<name>` is the personal page: bio, socials, and every photo/video tagged with that name.
- Add people in `/admin` > People. Use the same name as in "Who was there".

## Live editor (owner only)

Sign in once at /admin in the same browser tab, then open /people or any /people/<name> page: a toolbar appears at the bottom (visitors never see it).
- /people: type a name > "Create and edit page".
- Person page: "Edit page" lets you click the name and bio to type, edit/add/remove social links, change or remove the banner (photo or video), then Save. "Delete person" removes them.
- If you open a page in a new tab, add `?edit` to the address and enter the password.
