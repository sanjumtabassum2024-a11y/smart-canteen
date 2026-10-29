# SmartBite — Smart Canteen Pre-Order & Management

A premium emerald-and-white multi-page site using HTML, CSS, vanilla JavaScript, Express and MongoDB. jQuery/Bootstrap are not required by this redesign, but your existing stack and database are retained (Express/Mongoose/MongoDB); pages are plain HTML/CSS/JS for a lighter frontend.

## Pages
- `/` — Home
- `/menu.html` — Menu with category filters and search
- `/cart.html` — Cart and quantity editing
- `/checkout.html` — Checkout and order creation
- `/order-success.html` — Confirmation and order ID
- `/track-order.html` — Order status tracking
- `/admin/login.html` — Admin login
- `/admin/dashboard.html` — Admin stats and recent orders
- `/admin/foods.html` — Add, hide/show and delete food
- `/admin/orders.html` — View orders and update status

## Run on Windows
1. Back up your current `smart-canteen` folder before replacing anything.
2. Extract this ZIP. Copy the files and folders inside it into your existing project folder, merging the `public` folder. The new `server.js` uses the same MongoDB database name, `smart_canteen`, and retains existing food records.
3. In VS Code Terminal, stop the old server with `Ctrl+C`.
4. In the project folder, run:
   ```powershell
   npm install
   ```
5. Copy `.env.example` to `.env`. In VS Code, create `.env` in the project root and fill it with your own values. Change `SESSION_SECRET` to a long random value and set a private admin password.
6. Start the server:
   ```powershell
   npm start
   ```
7. Open `http://localhost:3000`.

## Admin account
Set `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` in `.env` before first startup. The server creates the initial admin account if it doesn't exist. If an admin already exists, changing `.env` does not reset that account's password. To create/update an admin account, run:
```powershell
npm run create-admin
```
If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in `.env`, the script uses them; otherwise it asks interactively. Keep credentials private.

## Food images
The sample seed has image URLs and the frontend uses `/assets/placeholder.svg` when a remote image fails. Existing food documents are preserved rather than overwritten; if their image field is empty, use Admin → Food menu to add a reliable HTTPS image URL. Images are fetched from Unsplash URLs, so an internet connection is needed for those photos.

## Security and demo notes
- Admin APIs require a server-side session, password hashes are stored using bcrypt, and login attempts are rate-limited.
- Use a long random `SESSION_SECRET`; do not deploy the example secret.
- Set `NODE_ENV=production` and use HTTPS in production so secure session cookies are enabled.
- The UPI option is a demo label only; this project does not process real payments.
- This starter uses Express's session middleware with MongoDB-backed sessions. If you change session dependencies, install `connect-mongo` as listed below.
- Before public deployment, add CSRF protection, stronger validation, HTTPS, backups, and a production-grade session configuration.

## Dependencies
The session store uses `connect-mongo`. It is included separately in the install command:
```powershell
npm install express mongoose bcryptjs dotenv express-session connect-mongo express-rate-limit
```
