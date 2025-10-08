# Azure AD OpenID Connect SSO Setup Guide

This guide will help you complete the Azure AD / Entra ID integration for your application.

## Prerequisites

You should have already:
- ✅ Registered an app in Azure Portal
- ✅ Application (client) ID
- ✅ Directory (tenant) ID
- ✅ Client secret value

## Setup Steps

### 1. Configure Azure AD App Registration

In the Azure Portal, ensure your app registration has the following settings:

**Redirect URIs:**
- Platform: Web
- Redirect URI: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`

To find your Supabase project reference:
- Go to your Supabase project dashboard
- The URL will be like: `https://app.supabase.com/project/<project-ref>`
- Or check your Supabase URL: `https://<project-ref>.supabase.co`

**API Permissions:**
- Microsoft Graph > Delegated permissions
- `openid` (Sign users in)
- `email` (View users' email address)
- `profile` (View users' basic profile)

**Authentication Settings:**
- ID tokens: ✅ Enabled
- Access tokens: ✅ Enabled

### 2. Configure Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find and click on **Azure**
4. Enable the Azure provider
5. Fill in the following fields:

   - **Application (client) ID**: `<your-application-id>`
   - **Azure Secret**: `<your-secret-value>`
   - **Azure Tenant ID**: `<your-tenant-id>` or `common` for multi-tenant

6. Save the configuration

### 3. Configure Environment Variables

Create a `.env.local` file in the root of your project:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=<your-anon-key>

# Azure AD Configuration (optional - for reference)
NEXT_PUBLIC_AZURE_TENANT_ID=<your-tenant-id>
```

**Note:** The Supabase URL and anon key can be found in your Supabase project settings under **Settings** → **API**.

### 4. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page: `http://localhost:3000/auth/login`

3. You should see two login options:
   - Email/Password login (existing)
   - "Sign in with Microsoft" button (new)

4. Test both authentication methods:

   **Email/Password:**
   - Use an existing account or create a new one
   - Should redirect to `/protected/templates` after login

   **Microsoft Azure AD:**
   - Click "Sign in with Microsoft"
   - You'll be redirected to Microsoft login page
   - Enter your Azure AD credentials
   - After successful authentication, you'll be redirected back to `/protected/templates`

## How It Works

### Authentication Flow

1. **OAuth Initiation:**
   - User clicks "Sign in with Microsoft"
   - App calls `supabase.auth.signInWithOAuth()` with provider 'azure'
   - User is redirected to Microsoft login page

2. **Microsoft Authentication:**
   - User enters credentials on Microsoft's page
   - Microsoft validates the credentials
   - Microsoft redirects back to Supabase with an authorization code

3. **Code Exchange:**
   - Supabase receives the code and redirects to your app's callback URL
   - Your app's `/api/auth/callback` route exchanges the code for a session
   - Session cookies are set
   - User is redirected to `/protected/templates`

4. **User Information:**
   - Email and name are automatically extracted from the Azure AD token
   - Stored in Supabase user metadata
   - Accessible via `user.email` and `user.user_metadata.full_name`

### User Management

- **New Azure AD Users:** Automatically created in Supabase on first login
- **Existing Email Users:** Remain separate unless emails match
- **Session Management:** Same for both authentication methods
- **Logout:** Works identically for both methods

## Troubleshooting

### Common Issues

**1. "Invalid redirect URI" error:**
- Verify the redirect URI in Azure matches exactly: `https://<project-ref>.supabase.co/auth/v1/callback`
- Check for trailing slashes or typos

**2. "User not authorized" error:**
- Ensure the user exists in your Azure AD tenant
- Check API permissions are granted and admin consent is given

**3. Session not persisting:**
- Check that cookies are enabled in the browser
- Verify the middleware is correctly configured in `middleware.ts`

**4. Email not showing in user profile:**
- Verify `email` scope is included in API permissions
- Check that the user has an email in Azure AD

**5. "Redirect URL mismatch" error:**
- Make sure your Supabase project's Azure provider is properly configured
- Verify the redirect URL in the login form matches your environment

### Debug Mode

To see detailed logs during authentication:
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for logs starting with "Azure AD user logged in:"
4. Check the Network tab for failed requests

## Security Considerations

- **Client Secrets:** Never commit secrets to version control. Store them in Supabase dashboard only.
- **Tenant ID:** Can be public (it's in the auth URLs anyway)
- **Redirect URIs:** Only add trusted URIs to Azure app registration
- **HTTPS:** Always use HTTPS in production
- **Environment Files:** Add `.env.local` to `.gitignore`

## Production Deployment

Before deploying to production:

1. Update Azure redirect URI to production URL:
   ```
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```

2. Update environment variables in your hosting platform (Vercel, etc.)

3. Test the complete flow in production environment

4. Monitor authentication logs in both Supabase and Azure Portal

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Azure AD App Registration](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [OpenID Connect Protocol](https://openid.net/connect/)

## Support

If you encounter issues:
1. Check Supabase logs in the Dashboard
2. Check Azure AD sign-in logs in Azure Portal
3. Review browser console for client-side errors
4. Verify all configuration values are correct

