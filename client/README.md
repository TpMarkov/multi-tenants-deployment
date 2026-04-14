# Guest PWA - QR Dining System

Mobile-first, premium Progressive Web App for hotel guests to browse menus and place room service orders.

## ✨ Features

- **QR-Aware Routing**: Automatically identifies hotel and room from URL.
- **Offline Capable**: PWA support with service workers.
- **Cart Management**: Local storage persistence via Zustand.
- **Real-time Order Validation**: Backend checks availability and price.
- **Premium UI**: Smooth animations, sticky navigation, and tactile feedback.

## 🛠️ Stack

- **Framework**: Next.js 15 (App Router)
- **State**: Zustand
- **Styling**: Tailwind CSS 4
- **API**: Axios
- **Animations**: Framer Motion

## 🚀 Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
   ```

3. **Run Dev Server**
   ```bash
   npm run dev
   ```

4. **Access via Room Link**
   Open: `http://localhost:3000/property/[PROPERTY_ID]/room/[ROOM_ID]`
   *(Replace with actual IDs from backend)*

## 📁 Architecture

- `/app`: Routing and layout.
- `/components`: UI and logic split into Menu and Cart.
- `/store`: Zustand global state.
- `/lib`: API client and utility functions.
```
