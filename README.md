# Boring List

A simple, no-frills to-do list web application with cloud synchronization and optional password protection.

## 🎯 Features

- **Simple & Clean Interface**: Minimalist design focused on productivity
- **Cloud Synchronization**: Uses Firebase Firestore for real-time data persistence
- **Password Protection**: Optional password protection for your lists
- **Shareable Lists**: Share your lists with others via unique URLs
- **Real-time Updates**: Changes sync instantly across all devices
- **Task Management**: Add, edit, delete, and check off tasks
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Demo

![Boring List Interface](https://github.com/user-attachments/assets/57be2be5-1f14-47f3-ac1a-6e9a2fc08bb3)

*Clean, minimalist interface with a fun doodle background*

Visit the live application at: [Insert your deployment URL here]

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase Firestore (NoSQL database)
- **Authentication**: Custom password hashing with SHA-256
- **Icons**: PNG icons for UI elements

## 📋 Getting Started

### Prerequisites

- A modern web browser with JavaScript enabled
- Internet connection (for Firebase functionality)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/npsboy/Boring-List.git
   cd Boring-List
   ```

2. **Serve the files using a web server**
   
   Since this application uses ES6 modules, you need to serve the files through a web server (not just open the HTML file directly).

   **Option 1: Using Python (if you have Python installed)**
   ```bash
   python3 -m http.server 8000
   ```
   
   **Option 2: Using Node.js (if you have Node.js installed)**
   ```bash
   npx serve .
   ```
   
   **Option 3: Using any other local web server**
   - Live Server (VS Code extension)
   - Apache/Nginx
   - Any static file server

3. **Open in browser**
   
   Navigate to `http://localhost:8000` (or your server's URL) in your web browser.

## 📱 How to Use

### Creating a New List

1. When you first visit the application, you'll see a setup dialog
2. Enter a name for your list
3. Optionally set a password for privacy (this cannot be changed later)
4. Click "Save" to create your list

### Managing Tasks

- **Add Task**: Click the "Add Task" button to create a new task
- **Edit Task**: Click on any task text to edit it
- **Complete Task**: Check the checkbox next to a task to mark it as completed
- **Delete Task**: Click the delete icon (🗑️) to remove a task

### Sharing Your List

- Your list URL contains a unique ID that allows others to access the same list
- Share the URL with others to collaborate on the same list
- If password-protected, others will need the password to access the list

### Password-Protected Lists

- If you set a password when creating your list, you and others will need to enter it to access the list
- Passwords are securely hashed using SHA-256 with salt
- **Important**: Passwords cannot be changed or recovered once set

## 📁 Project Structure

```
Boring-List/
├── index.html          # Main HTML file with app structure
├── index.css           # Stylesheet for the application
├── list.js             # Main JavaScript file with Firebase integration
├── background.png      # Background image for the app
├── delete.png          # Delete button icon
├── edit_icon.png       # Edit button icon (unused in current version)
└── README.md           # This file
```

## 🔧 Configuration

The Firebase configuration is included in `list.js`. If you want to use your own Firebase project:

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Replace the `firebaseConfig` object in `list.js` with your project's configuration
4. Update the Firestore security rules as needed

## 🤝 Contributing

Contributions are welcome! Here are some ways you can help:

1. **Report Issues**: Found a bug or have a suggestion? [Open an issue](https://github.com/npsboy/Boring-List/issues)
2. **Submit Pull Requests**: 
   - Fork the repository
   - Create a feature branch (`git checkout -b feature/amazing-feature`)
   - Commit your changes (`git commit -m 'Add amazing feature'`)
   - Push to the branch (`git push origin feature/amazing-feature`)
   - Open a Pull Request

### Development Guidelines

- Keep the design simple and minimal (it's supposed to be "boring"!)
- Ensure changes work across different browsers
- Test with and without internet connection
- Maintain the existing code style

## 🔒 Security & Privacy

- **Password Security**: Passwords are hashed using SHA-256 with randomly generated salts
- **Data Storage**: All data is stored in Firebase Firestore with your own Firebase project
- **Client-Side**: All password hashing and validation happens on the client-side
- **No Analytics**: The application doesn't include any tracking or analytics

## 🐛 Known Issues & Important Notes

- The application requires an internet connection to function (due to Firebase dependency)
- ES6 modules require the app to be served over HTTP/HTTPS (not file://)
- In some environments, Firebase may be blocked by ad blockers or network restrictions, which will prevent cloud synchronization but the interface will still load
- Password recovery is not possible - if you forget your password, you cannot access password-protected lists

## 📄 License

This project is open source. Feel free to use, modify, and distribute as needed.

## ✨ Acknowledgments

- Firebase for providing the backend infrastructure
- The simplicity movement for inspiring the "boring" design philosophy

---

**Made with ☕ and minimalism**