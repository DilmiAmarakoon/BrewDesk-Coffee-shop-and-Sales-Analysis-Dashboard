# BrewDesk Backend

Express API for staff sessions, menu management, orders, and sales analytics.

1. Copy `.env.example` to `.env` locally and enter your own credentials.
2. Allow your current network IP in MongoDB Atlas.
3. Run:

```powershell
npm install
node --env-file=.env server.js
```

Do not upload `.env` or credentials. The first startup seeds the original 17 menu products into the configured database. Existing orders and added products remain in your MongoDB database, not in this repository.

Six existing uploaded product photos are included so their database image paths remain usable. New uploads are ignored by default.

See the root [README](../README.md) for full documentation.
