# Expo Go connection

## ⛔ Do not use (always fails)

```bash
npx expo start --tunnel   # broken — ngrok 2.3.41 inside Expo
```

You will see: `ngrok tunnel took too long to connect` — that is expected. **Stop using this command.**

### Use instead

```bash
npm run start:tunnel
```

Windows shortcut: double-click **`tunnel.cmd`** in the project folder.

## Same Wi‑Fi (easiest)

```bash
npm start
```

Scan the QR code in Expo Go, or enter `exp://YOUR_PC_IP:8081` manually.

---

## Tunnel (phone on another network)

Uses the **npm `ngrok` package (v3.39+)** — no `winget` install needed.

### 1. Token in `.env`

```env
NGROK_AUTHTOKEN=your_token_from_ngrok_dashboard
```

Get a token: https://dashboard.ngrok.com/get-started/your-authtoken

### 2. Test tunnel

```bash
npm run check:tunnel
```

### 3. Start Expo + tunnel

```bash
npm run start:tunnel
```

Wait for `ngrok tunnel ready:` then use Expo Go when Metro shows the QR code.

---

## If tunnel still fails

1. Close other terminals running ngrok or Expo.
2. Run `npm run check:tunnel` again.
3. Disable VPN; allow Node.js in Windows Firewall (Private).
4. Fall back to `npm start` on the same Wi‑Fi.
