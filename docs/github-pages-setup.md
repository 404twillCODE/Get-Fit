# GitHub Pages Setup

This app is configured to deploy automatically to GitHub Pages.

## Setup Steps

1. **Enable GitHub Pages in Repository Settings**
   - Go to your repository on GitHub
   - Navigate to Settings → Pages
   - Under "Source", select "GitHub Actions"
   - Save

2. **Add Environment Variables (Secrets)**
   - Go to Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

3. **Automatic Deployment**
   - The app will automatically build and deploy when you push to the `main` branch
   - The workflow is located at `.github/workflows/deploy.yml`
   - Your site will be available at: `https://[your-username].github.io/Get-Fit`

## Manual Build (Optional)

If you want to build locally for testing:

```bash
npm run build
```

The static files will be in the `out` directory.

## Notes

- The base path is set to `/Get-Fit` in `next.config.js`
- Static export is enabled (`output: "export"`)
- Images are unoptimized for static export compatibility
