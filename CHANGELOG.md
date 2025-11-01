# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Features
- **Venmo Payment Integration**: Sellers can now add their Venmo username to their profile for payment processing. Venmo information is displayed to buyers when viewing requests and seller profiles.

### Improvements
- **Profile Management**: Sellers in "buy mode" are now automatically redirected to their seller profile page when accessing the profile tab, ensuring they see the appropriate profile view.
- **Buyer Request Management**: Added filtering capabilities for buyers to sort requests by status (All, Pending, Approved, Rejected), matching functionality available to sellers.
- **Product Inventory**: Products automatically set to "out of stock" when quantity reaches 0, preventing overselling.
- **Favorite System**: Improved favorite heart icon synchronization across all pages. Favorite counts and heart states now update correctly when navigating between product detail, seller pages, and search results.
- **Product UI**: Enhanced Recent Products section with card-style layout for clearer visual separation. Improved favorite button placement on product detail pages with better visual styling.

### Bug Fixes
- Fixed redirect issues after login/signup
- Fixed seller account identification issues on page refresh
- Improved notification clearing logic for request status updates
- Fixed favorite heart icon state inconsistencies between pages

## [Previous Releases]

### Features
- **Admin Dashboard**: Added admin view with toggle functionality for managing bug reports and user suggestions
- **Feedback System**: Implemented comprehensive feedback system allowing users to submit bugs and suggestions through a unified modal interface
- **Seller/Buyer View Toggle**: Sellers can now switch between seller and buyer modes to browse and make purchase requests
- **Request Notifications**: Real-time notification badges for buyers when their purchase requests are approved or rejected by sellers
- **Product Management**: Enhanced product creation and deletion workflows with improved UX

### Improvements
- Notification system improvements for request status changes
- Enhanced authentication flow and user type handling
- Improved seller profile creation and editing experience

### Bug Fixes
- Fixed seller self-exclusion in buyer mode "Near Me" view
- Fixed notification clearing delays
- Improved request filtering and sorting functionality

