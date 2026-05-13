# FaceTrack Mobile

React Native Expo app for the FaceTrack attendance system — for college students, SHS students, and faculty.

## Setup

### 1. Install dependencies

```bash
cd FaceTrack_Mobile
npm install
```

### 2. Configure the backend IP

Open `src/config/api.ts` and change the IP to your backend server's local IP:

```ts
export const API_BASE_URL = 'http://192.168.1.42:3002/api';
//                                   ^^^^^^^^^^^^^ change this
```

Both your phone and the backend server must be on the **same WiFi network**.

To find your machine's IP:
- **Windows:** `ipconfig` → look for IPv4 Address
- **macOS/Linux:** `ifconfig` or `ip addr`

### 3. Start the app

```bash
npx expo start
```

Then scan the QR code with the **Expo Go** app on your phone.

---

## Project Structure

```
FaceTrack_Mobile/
├── App.tsx                          # Root — NavigationContainer + AuthProvider
├── src/
│   ├── config/
│   │   └── api.ts                   # API_BASE_URL (change IP here)
│   ├── contexts/
│   │   └── AuthContext.tsx          # Login/logout, JWT storage
│   ├── navigation/
│   │   └── AppNavigator.tsx         # Bottom tabs + root stack
│   ├── screens/
│   │   ├── LoginScreen.tsx          # Dark-themed login form
│   │   ├── DashboardScreen.tsx      # Welcome, today's attendance, stats
│   │   ├── AttendanceHistoryScreen.tsx  # Paginated history list
│   │   ├── NotificationsScreen.tsx  # Notifications with mark-as-read
│   │   └── SettingsScreen.tsx       # Profile info + change password + logout
│   ├── services/
│   │   ├── api.ts                   # Fetch wrapper with JWT header
│   │   ├── authService.ts           # Login / logout
│   │   ├── attendanceService.ts     # Stats, history, today
│   │   └── notificationService.ts  # Get, mark read, delete
│   └── theme/
│       └── colors.ts                # Brand color palette
```

## Features

- **Login** — email + password + user type selector (College / SHS / Faculty)
- **Dashboard** — greeting, today's time-in/out/duration, 6 stat cards, pull-to-refresh
- **Attendance History** — daily records grouped by date, date filter, pagination
- **Notifications** — mark individual or all as read, delete, pull-to-refresh
- **Settings** — profile display, change password, sign out

## Color Palette

| Token | Hex |
|-------|-----|
| Dark (background) | `#0A0602` |
| Gold | `#C9A84C` |
| Gold Light | `#E8C97A` |
| Cream | `#F5EDD8` |
| Brown | `#3E2008` |
| Light (screen bg) | `#f9f9f9` |

## Auth Flow

1. User logs in → backend returns `{ token, user }`
2. Token stored in `AsyncStorage` under `@facetrack_token`
3. All subsequent API calls include `Authorization: Bearer <token>`
4. On app start, token is restored from storage automatically
5. Logout clears storage and calls `POST /auth/logout` to invalidate server-side

## Notes

- The app is **read-only** for attendance — recording is done by the facial recognition camera system
- The backend enforces that regular users can only see their own attendance records
- Pull down on any list screen to refresh data
