# Quick Start Checklist - Azure AD SSO

Follow these steps in order to complete the Azure AD integration:

## ☑️ Step 1: Configure Supabase (5 minutes)

1. [ ] Go to https://app.supabase.com
2. [ ] Open your project
3. [ ] Navigate to: **Authentication** → **Providers** → **Azure**
4. [ ] Enable the toggle
5. [ ] Enter your Azure credentials:
   - [ ] Application (client) ID: `________________`
   - [ ] Azure Secret: `________________`
   - [ ] Azure Tenant ID: `________________`
6. [ ] Click **Save**

## ☑️ Step 2: Create Environment File (2 minutes)

1. [ ] Create `.env.local` in project root
2. [ ] Add the following (get from Supabase → Settings → API):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://____________.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=____________
   NEXT_PUBLIC_AZURE_TENANT_ID=____________
   ```
3. [ ] Save the file

## ☑️ Step 3: Verify Azure Redirect URI (1 minute)

1. [ ] Go to Azure Portal
2. [ ] Open your app registration
3. [ ] Go to **Authentication**
4. [ ] Verify redirect URI is:
   ```
   https://<your-supabase-ref>.supabase.co/auth/v1/callback
   ```
5. [ ] If missing, add it and save

## ☑️ Step 4: Test Email/Password Login (2 minutes)

1. [ ] Run `npm run dev`
2. [ ] Go to http://localhost:3000/auth/login
3. [ ] Try logging in with existing email/password
4. [ ] Verify redirect to `/protected/templates`
5. [ ] If it works, existing auth is not broken ✅

## ☑️ Step 5: Test Microsoft SSO (3 minutes)

1. [ ] On login page, click "Sign in with Microsoft"
2. [ ] Should redirect to Microsoft login page
3. [ ] Enter Azure AD credentials
4. [ ] Grant consent if prompted
5. [ ] Should redirect back to app
6. [ ] Verify redirect to `/protected/templates`
7. [ ] Verify you're logged in
8. [ ] Check browser console for logs

## ☑️ Step 6: Verify User Data (1 minute)

1. [ ] After Microsoft login, check Supabase Dashboard
2. [ ] Go to **Authentication** → **Users**
3. [ ] Find your Microsoft-logged-in user
4. [ ] Verify email is populated
5. [ ] Check user metadata has name/full_name

## 🎯 Success Criteria

- ✅ Email/password login still works
- ✅ Microsoft SSO redirects to Microsoft
- ✅ After Microsoft auth, user is logged in
- ✅ User email and name are captured
- ✅ Session persists on page refresh
- ✅ Logout works for both methods

## ⚠️ Common Issues

### "Invalid redirect URI"
→ Check Azure app registration redirect URI matches Supabase exactly

### "User not found" or "Access denied"
→ Ensure user exists in your Azure AD tenant

### Button does nothing
→ Check browser console for errors, verify Supabase config

### Can't find Supabase anon key
→ Supabase Dashboard → Settings → API → Project API keys → anon/public

### Microsoft login works but session not persisting
→ Check that middleware.ts is present and configured

## 📝 Notes

- **Don't commit** `.env.local` to git
- **Test both methods** to ensure nothing is broken
- **Check console logs** for debugging info
- **Monitor Supabase logs** in the dashboard

## 🆘 Help

If something doesn't work:
1. Check `AZURE_AD_SETUP.md` for detailed troubleshooting
2. Check browser console for errors
3. Check Supabase logs in dashboard
4. Check Azure AD sign-in logs in Azure Portal

## 🚀 Next: Production

After testing locally:
1. [ ] Update Azure redirect URI for production domain
2. [ ] Set environment variables in hosting platform (Vercel, etc.)
3. [ ] Deploy and test in production
4. [ ] Monitor authentication logs

---

**Estimated total time**: 15-20 minutes

