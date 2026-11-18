# Upload BrewDesk without terminal commands

## 1. Extract

Extract `BrewDesk-GitHub-Ready.zip`. Open the extracted `BrewDesk` folder. The backend and frontend are already separated. Do not upload the ZIP itself.

## 2. Create one GitHub repository

Create a repository named `BrewDesk`. Leave the automatic README, gitignore and license selections empty.

## 3. Upload backend first

On the repository page, choose **uploading an existing file**, or **Add file → Upload files**. Drag the entire extracted `backend` folder into the page, keeping the folder name. Review the list, then commit with `Add backend API`.

`.env.example` is safe: it contains placeholders. No actual `.env` is included.

## 4. Upload frontend second

Return to the repository root, choose **Add file → Upload files**, and drag the entire `frontend` folder. Commit with `Add customer storefront and staff dashboard`.

## 5. Upload the root files

At the repository root, upload `README.md`, `.gitignore`, and this guide if wanted. Commit with `Add project documentation`.

Your repository root should contain the backend and frontend folders and README.md and .gitignore files. Do not put the entire project inside a second frontend or backend folder.

## 6. Verify

Open both folders. Confirm server.js and salesAnalytics.js are inside backend, and src/public/package.json are inside frontend. Confirm no `.env` or node_modules folder appears.

Website uploads do not apply `.gitignore` filtering, so always review what you select. These prepared folders have already had local secrets and dependencies removed.

## Notes

- Keep your original working project unchanged.
- On a new computer, install dependencies and create a new local `.env` from the example.
- Database orders and newly added menu records remain in MongoDB; uploading files does not upload the database.
- Uploaded product photos already in the ZIP were retained because they are useful visual assets.
- GitHub stores your source code; a live frontend/backend deployment is a separate task.
