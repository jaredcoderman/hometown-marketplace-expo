# 🏡 Hometown Marketplace

A local farmers market, reimagined for the digital age. Connect with makers, artisans, and small businesses in your community through a mobile-first marketplace platform.

## 📖 The Story

Hometown Marketplace was inspired by my mom, who handcrafts natural soaps and sells them at local farmers markets every weekend. Watching her connect with customers, share her craft, and become part of the community made me realize something: farmers markets aren't just about buying and selling—they're about building relationships, supporting local artisans, and strengthening our communities.

But farmers markets only happen once a week. What if there was a way to bring that same sense of community, discovery, and local connection to every day?

That's how Hometown Marketplace was born—a virtual farmers market that's always open, connecting buyers with local sellers in their community.

## ✨ Key Features

- **📍 Location-Based Discovery**: Find sellers and products near you using geolocation
- **🛍️ Dual Mode**: Sellers can seamlessly switch between selling and buying modes
- **💌 Request System**: Buyers can make custom purchase requests, sellers approve or decline
- **📧 Email Notifications**: Real-time email updates for request status changes
- **❤️ Favorites**: Save products you love for easy access later
- **📊 Analytics Dashboard**: Sellers can track their business performance
- **⭐ Ratings & Reviews**: Build trust through community feedback

## 🛠️ Built With

### Frontend
- **React Native** with **Expo Router** for cross-platform mobile development
- **TypeScript** for type-safe development
- **TailwindCSS** for modern, responsive styling
- **React Context API** for state management

### Backend & Infrastructure
- **Firebase Authentication** for secure user management
- **Cloud Firestore** for real-time database operations
- **Firebase Cloud Storage** for product image hosting
- **Firebase Cloud Functions** (2nd Gen) for server-side email processing
- **Resend** for transactional email delivery

### Key Libraries
- `react-native-maps` for location-based features
- `expo-image-picker` for product image management
- `geofire-common` for geospatial queries
- `firebase/functions` for callable cloud functions

## 🚀 Live Demo

Visit the web app: **[hometown-marketplace.com](https://hometown-marketplace.com)**

*Note: While optimized for mobile, the app is fully responsive and works beautifully on desktop too.*

## 🏗️ Architecture

Hometown Marketplace follows a mobile-first architecture:

- **Client-Side**: React Native app that works on iOS, Android, and Web
- **Real-Time Database**: Firestore handles all data with real-time sync
- **Serverless Functions**: Firebase Cloud Functions handle email delivery and other server-side operations
- **Storage**: Firebase Cloud Storage for image assets
- **Authentication**: Firebase Auth with email/password

The app uses a declarative, component-based architecture that makes it easy to add new features while maintaining code quality and user experience.

## 📱 User Experience

### For Buyers
- Discover local artisans and their products
- Browse curated product collections
- Make purchase requests with custom messages
- Track request status in real-time
- Save favorite products and sellers
- Navigate to seller locations

### For Sellers
- Create a beautiful business profile
- Manage product inventory in real-time
- Review and approve/reject purchase requests
- Track business metrics and analytics
- Toggle between seller and buyer modes
- Upload product images with ease

## 🌍 The Impact

Hometown Marketplace isn't just an app—it's a mission to:
- **Support local economies** by making it easier for small businesses to reach customers
- **Reduce environmental impact** through local shopping and reduced shipping
- **Build communities** by connecting neighbors with makers in their area
- **Empower artisans** with digital tools that amplify their reach

## 🎯 What's Next

- Seller verification badges for trusted artisans
- In-app messaging between buyers and sellers
- Payment processing integration
- Advanced search and filtering
- Push notifications for mobile apps
- Multi-language support

## 👨‍💻 About the Developer

Built with ❤️ as a passion project to support local artisans and makers. 

Inspired by my mom and the community that gathers every weekend at the farmers market.

---

**Questions? Feedback?** I'd love to hear from you!

Visit the live app: [hometown-marketplace.com](https://hometown-marketplace.com)

