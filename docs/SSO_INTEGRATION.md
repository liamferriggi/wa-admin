# Single sign-on: WhatsApp Admin

**Status:** DONE (2026-10-06)
**Requested by:** Liam, via the CEO Dashboard session, 2026-10-06
**Plan:** https://claude.ai/artifact/8nZDCEXFuDXA5uz4Ncd88P
**Batch 4a. The app already reads `ift_token`. Add the access check, the no-access page and the sign-out link. About 30 minutes.**

## Goal

A worker signs in once at the CEO Dashboard, taps the **WhatsApp Admin** tile and lands in this app already signed in. A worker who wasn't given this app sees a clear "no access" page, never a login form. Liam's decisions:

- Access is granted per app in Dashboard → Admin. New users start with no apps.
- On a first SSO visit the app creates the worker's local profile automatically, because granting the app in Admin is enough.
- Mythos sessions last 12 hours.
- Sign out from any app signs the user out of every app on that domain (option A).

## This app

| | |
|---|---|
| Tile id(s) | `wa-admin` |
| Also accept (legacy ids users already hold) | none |
| Shared cookie | `ift_token` on `.infinite-fusion.com` |
| Sign-out link | `https://auth.infinite-fusion.com/api/auth/sso/logout` |
| Start link (signs in through the dashboard) | `https://auth.infinite-fusion.com/api/auth/sso/start?app=wa-admin` |
| Where login lives today | src/context/AuthContext.tsx, src/api.ts |

## What's already live centrally (don't rebuild it)

- Dashboard tiles open `https://auth.infinite-fusion.com/api/auth/sso/start?app=wa-admin`. The auth service checks the user's access (aliases included) before sending them on.
- Infinite Fusion apps already receive `ift_token` on `.infinite-fusion.com`, because the dashboard login sets it.
- Mythos apps receive `ift_token` on `.mythos.com.mt` through a one-time 60-second relay at `auth.mythos.com.mt`. It's a fresh 12-hour token, re-checked against the database.
- The token is a standard HS256 JWT signed with the platform `JWT_SECRET`. It holds `userId, tenantId, role, apps[], email, name, exp`.
- There are no new server-to-server calls, so no platform bus routes are needed. If you ever do call the auth service from your server, go through `bus.infinite-fusion.com` as the platform rule requires.

## What this app must do

1. **Accept the shared token.** On every request to a protected page or API, read the `ift_token` cookie and verify it with HS256 and the platform `JWT_SECRET`. First check that this app's `JWT_SECRET` is the same value as `/opt/platform/auth-service.env`. Compare hashes; never paste the secret anywhere. If the token is valid, skip the app's login page.
2. **Check access.** Let the user in only if `apps` contains `"all"` or one of: `wa-admin`. Otherwise show the no-access page below with status 403, never a login form.
3. **Create the local profile automatically** on the first visit. Find or create it by `userId`, falling back to `email`, and take the role from the token's `role`.
4. **No token, or an expired one:** keep the app's current login page. Optionally add a **Sign in with Infinite Fusion** button linking to the start link above. Never redirect to the start link automatically, because a secret mismatch would cause a redirect loop.
5. **Sign out:** clear any app-local session cookie, then send the browser to `https://auth.infinite-fusion.com/api/auth/sso/logout`. Signs the user out of every Infinite Fusion app, including the CEO Dashboard, then shows the dashboard login.
6. **Keep public pages public**, such as customer menus, public booking and display screens. Only staff and admin areas are checked.
7. **Ship:** deploy with this app's own deploy flow, add or extend `~/.claude/smoke-tests/<service>.json`, and run the test list below.

No-access page text: **"You don't have access to WhatsApp Admin."** Below it: "Ask your manager to give you access to this app." Add a button linking to `https://ceo.infinite-fusion.com/`.

## Code examples

Next.js middleware (`jose`):
```ts
import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const SECRET  = new TextEncoder().encode(process.env.JWT_SECRET!)
const APP_IDS = ["wa-admin"]

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("ift_token")?.value
  if (!token) return NextResponse.redirect(new URL("/login", req.url))   // existing login page
  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: ["HS256"] })
    const apps = (payload.apps as string[]) ?? []
    if (!apps.includes("all") && !APP_IDS.some(id => apps.includes(id)))
      return NextResponse.rewrite(new URL("/no-access", req.url), { status: 403 })
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL("/login", req.url))
  }
}
```

Express (`jsonwebtoken`, `cookie-parser`):
```js
const jwt = require("jsonwebtoken")
const APP_IDS = ["wa-admin"]

function requireSso(req, res, next) {
  const token = req.cookies?.ift_token
  if (!token) return res.redirect("/login")
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] })
    const apps = user.apps || []
    if (!apps.includes("all") && !APP_IDS.some(id => apps.includes(id))) return res.status(403).send(noAccessHtml)
    req.user = user
    next()
  } catch { return res.redirect("/login") }
}
app.get("/logout", (req, res) => { res.clearCookie("<app-local-cookie>"); res.redirect("https://auth.infinite-fusion.com/api/auth/sso/logout") })
```

FastAPI (`PyJWT`):
```python
import jwt
APP_IDS = {"wa-admin"}

def current_user(ift_token: str | None = Cookie(default=None)):
    if not ift_token:
        raise HTTPException(401)
    try:
        claims = jwt.decode(ift_token, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401)
    apps = set(claims.get("apps", []))
    if "all" not in apps and not (APP_IDS & apps):
        raise HTTPException(403, "You don't have access to WhatsApp Admin.")
    return claims
```

## Tests (use a test worker and delete it afterwards)

| Scenario | Expected |
|---|---|
| Worker granted `wa-admin`, taps the tile | Lands signed in. No login form. |
| Worker without this app opens the app address directly | "You don't have access to WhatsApp Admin" (403) |
| No session at all | The app's normal login page |
| Sign out inside the app | Every app on `.infinite-fusion.com` asks for login again |
| Archived user | Refused at the dashboard. Any cookie they still hold stops working at its expiry (12 hours on Mythos). |
| Public pages, if any | Still open without login |

## Rollback

Revert this app's commit and redeploy. The central SSO keeps working for every other app, and the tile still opens this app.

## When done

Change **Status** at the top to `DONE (yyyy-mm-dd)` and commit. Add one line to this project's MEMORY.md.
