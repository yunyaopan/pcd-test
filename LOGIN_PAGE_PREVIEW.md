# Updated Login Page Preview

## Visual Layout

The login page now has two authentication methods:

```
┌──────────────────────────────────────────────┐
│              Login                           │
│  Enter your email below to login to your    │
│  account                                     │
│                                              │
│  Email                                       │
│  ┌────────────────────────────────────────┐ │
│  │ m@example.com                          │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Password              Forgot your password? │
│  ┌────────────────────────────────────────┐ │
│  │ ••••••••••                             │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │           Login                      │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ─────────── Or continue with ───────────   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ [🔲] Sign in with Microsoft          │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Don't have an account? Sign up              │
└──────────────────────────────────────────────┘
```

## User Experience Flow

### Option 1: Email/Password Login (Existing)
1. User enters email and password
2. Clicks "Login" button
3. Credentials validated by Supabase
4. Redirected to `/protected/templates`

### Option 2: Microsoft Azure AD Login (New)
1. User clicks "Sign in with Microsoft" button
2. Redirected to Microsoft login page
3. User enters Microsoft/Azure AD credentials
4. Microsoft validates credentials
5. User grants consent (first time only)
6. Redirected back to app
7. Session created automatically
8. Redirected to `/protected/templates`

## Button States

### Email/Password Login Button
- **Default**: "Login"
- **Loading**: "Logging in..." (disabled, shows loading state)
- **Error**: Red error message appears below button

### Microsoft Login Button
- **Default**: "Sign in with Microsoft" with Microsoft logo
- **Loading**: "Redirecting..." (disabled, shows loading state)
- **Error**: Red error message appears above buttons

## Styling

- Microsoft button has outline variant (border, no fill)
- Microsoft logo uses authentic colors:
  - Red: #f25022
  - Blue: #00a4ef
  - Green: #7fba00
  - Yellow: #ffb900
- Divider text: "Or continue with" (subtle, uppercase, small text)
- Both buttons are full width
- Consistent spacing and alignment

## Error Handling

### Email/Password Errors
- Invalid credentials
- Network errors
- Missing fields
- Account not verified

### Microsoft SSO Errors
- Redirect URI mismatch
- User not in Azure AD tenant
- Insufficient permissions
- Consent declined
- Network errors

All errors display as red text below the password field.

## Mobile Responsive

- Full width buttons stack vertically
- Maintains proper spacing on small screens
- Touch-friendly button sizes
- Scrollable if needed

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Focus states on all interactive elements
- Screen reader friendly
- High contrast text

## Browser Compatibility

- Works on all modern browsers
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires cookies enabled
- Requires JavaScript enabled

