# Math Kangaroo Photo Upload Deployment

This page uses a static `zeror.ca/math-kangaroo/` wrapper and a Google Apps Script Web App.

## 1. Create the Google Drive folder

Create one private Google Drive folder for the event photos. Copy the folder ID from the URL.

Example folder URL:

```text
https://drive.google.com/drive/folders/12U8kVm-TXr6y8nqQ0rog-CZRFV9jag_h
```

Folder ID:

```text
12U8kVm-TXr6y8nqQ0rog-CZRFV9jag_h
```

The folder itself can remain private. Uploaded files are set to "anyone with the link can view" so the public page can show thumbnails and download links.

## 2. Create the Apps Script Web App

Create a Google Apps Script project and add these files:

- `apps-script/Code.gs`
- `apps-script/Index.html`
- Optional manifest: `apps-script/appsscript.json`

In `Code.gs`, replace:

```text
PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE
```

with the real Google Drive folder ID.

Deploy as a Web App with these settings:

```text
Execute as: Me
Who has access: Anyone
```

Authorize the script when Google asks for Drive access. Copy the Web App URL after deployment.

## 3. Configure zeror.ca

In `math-kangaroo/index.html`, replace:

```text
https://script.google.com/macros/s/AKfycbzd0u8UVG4-8lVw1MJz4rqtNg3Fxdt7kWNvz2s8zq8hPsB8peZXKq0iN2JX4LXPsXIx/exec
```

with the Apps Script Web App URL.

## 4. Verify

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-static-site.ps1
```

Then open:

```text
https://zeror.ca/math-kangaroo/
```

Acceptance check:

- Select several photos on a phone.
- Tap Upload Photos.
- Confirm the uploading message appears.
- Confirm the success message appears.
- Confirm photos appear in the public gallery.
- Confirm Download opens each photo.
- Confirm files appear in the selected Google Drive folder.

