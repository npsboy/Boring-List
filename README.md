# Boring List

A simple, clean to-do list application built with vanilla HTML, CSS, and JavaScript.

![Boring List App](https://github.com/user-attachments/assets/2ed502f9-95e4-45a2-8d75-4cd5c0fc8ad0)

## Features

- ✅ Add, edit, and delete tasks
- ✅ Mark tasks as completed
- ✅ Real-time synchronization using Firebase Firestore
- ✅ Clean, responsive design
- ✅ Shareable links for collaborative lists

## Deployment

This application is automatically deployed to GitHub Pages using GitHub Actions.

### How it works

1. The GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers on every push to the `main` or `master` branch
2. The workflow deploys all static files directly to GitHub Pages
3. No build process is required since the application uses vanilla JavaScript

### Accessing the deployed app

Once deployed, the application will be available at:
`https://npsboy.github.io/Boring-List/`

## Local Development

To run the application locally:

1. Clone the repository
2. Start a local HTTP server in the project directory:
   ```bash
   python3 -m http.server 8080
   ```
3. Open `http://localhost:8080` in your browser

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: Firebase Firestore
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions

## File Structure

```
├── index.html          # Main HTML file
├── index.css           # Styles
├── list.js            # JavaScript functionality
├── delete.png         # Delete icon
├── edit_icon.png      # Edit icon
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Actions deployment workflow
```