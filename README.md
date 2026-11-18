# TeamFlow — Smart Campus App

A fully interactive React/Vite frontend based on the TeamFlow screenshot and the supplied UI/UX requirements.

## Run locally
1. Install Node.js 20 or newer.
2. Extract this ZIP.
3. Open the extracted folder in VS Code.
4. Run:
   ```bash
   npm install
   npm run dev
   ```
5. Open the localhost URL printed by Vite (usually http://localhost:5173).

## Production build
```bash
npm run build
npm run preview
```

## Included
- TeamFlow dashboard layout from the supplied screenshot
- Cream/Brown/Baby Blue 60:30:10 palette
- Working sidebar navigation and collapse control
- Working light/dark theme toggle
- Create, assign, update, and delete tasks
- Task status filters and progress metrics
- Chat composer (local demo chat)
- Meeting, files, My Space, and Team pages
- Smooth animated input caret
- Staggered rolling text hover effect
- Flip/fade text animation
- Scroll-based sticky project card stack with Lenis smooth scrolling
- Animated glass dock navigation
- Wave grid background
- LocalStorage persistence for tasks, messages, theme, and notes

## Note
This is a frontend prototype. Data is stored in the browser's localStorage; it is not connected to a cloud database, real authentication, or multi-user realtime sync. Those require a backend such as Supabase/Firebase.
