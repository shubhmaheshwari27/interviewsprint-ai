# InterviewSprint browser extension

Save the job you are viewing to your InterviewSprint account with one click, and see how well it matches your skills.

Works on LinkedIn, Naukri, Instahyre, Wellfound, Indeed, Cutshort, and any company careers page that publishes
schema.org `JobPosting` data (Greenhouse, Lever, Ashby, Workable and most others). On other pages it falls back to the
page title and the largest text block; selecting the description on the page before clicking always works.

## Install (free, no store needed)

1. Download `interviewsprint-extension.zip` from **Settings → Browser extension** in the app (or use this folder).
2. Unzip it, open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick the folder.
3. In the app, **Settings → Browser extension → Create token**, copy the token.
4. Click the extension icon, paste the token, **Connect**.

## Use

Open a job posting and click the icon. Check the details, then **Save for later** (status *Saved*) or **Save as applied**.
Tick **Generate AI interview prep** to run the AI prep straight away with your own AI key (or the offline analysis).
Saving the same posting again updates it instead of creating a duplicate.

## Privacy and permissions

- `activeTab` + `scripting`: the extractor runs only on the tab you clicked the icon on, only when you click.
- `storage`: keeps your token and the app address.
- Host permission for the app only. Nothing else is read or sent. See `/privacy` in the app.

## Development

- `extractor.js` – page reading (tested in `tests/extractor.test.ts` with sample pages).
- `popup.*` – the UI. Point it at `http://localhost:3000` in the extension settings for local development.
- Rebuild the zip after changes: zip the contents of this folder into `public/interviewsprint-extension.zip`.
