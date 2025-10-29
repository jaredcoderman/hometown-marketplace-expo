# Firebase Setup Instructions

Follow these steps to set up Firebase for your Hometown Marketplace app:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or select an existing project
3. Follow the setup wizard:
   - Enter project name: "Hometown Marketplace"
   - Enable Google Analytics (optional)
   - Click "Create Project"

## 2. Register Your App

1. In the Firebase Console, click the Web icon (</>) to add a web app
2. Register app with nickname: "Hometown Marketplace Web"
3. Copy the configuration object
4. Open `config/firebase.ts` and replace the placeholder values with your configuration

## 3. Enable Authentication

1. In Firebase Console, go to **Authentication** → **Get Started**
2. Click on **Sign-in method** tab
3. Enable the following providers:
   - **Email/Password** - Click, toggle Enable, Save
   - **Google** (optional) - For social login

## 4. Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database** → **Create Database**
2. Choose **Start in test mode** (we'll add security rules later)
3. Select a location closest to your users
4. Click **Enable**

### Firestore Security Rules (Update Later)

Replace the default rules with these (in Firestore → Rules tab):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Sellers collection
    match /sellers/{sellerId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/sellers/$(sellerId)).data.userId == request.auth.uid;
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        get(/databases/$(database)/documents/products/$(productId)).data.sellerId == request.auth.uid;
    }
  }
}
```

## 5. Set Up Firebase Storage

1. In Firebase Console, go to **Storage** → **Get Started**
2. Choose **Start in test mode**
3. Click **Next** and **Done**

### Storage Security Rules (Update Later)

Replace the default rules with these (in Storage → Rules tab):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /users/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 6. Create Composite Indexes (for Geoqueries)

1. In Firestore Console, go to **Indexes** tab
2. Click **Create Index**
3. Create the following composite index:
   - Collection ID: `sellers`
   - Fields to index:
     - `geohash` - Ascending
     - `location.latitude` - Ascending
   - Query scope: Collection
4. Click **Create**

## 7. Test Your Setup

After completing the above steps:
1. Save your changes to `config/firebase.ts`
2. Run `npm start` and try signing up a new user
3. Check Firebase Console → Authentication to see if the user was created

## Troubleshooting

- **"Firebase: Error (auth/api-key-not-valid)"**: Check that you copied the correct API key
- **"Firebase: Error (auth/network-request-failed)"**: Check your internet connection
- **Permission denied errors**: Make sure you updated the security rules
- **Web build issues**: Run `npx expo install --fix` to ensure compatible versions

## Optional: Enable Geolocation

For the location features to work:
1. Make sure you've enabled location permissions in `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Hometown Marketplace to use your location to find nearby sellers."
        }
      ]
    ]
  }
}
```

Your Firebase setup is now complete! 🎉

