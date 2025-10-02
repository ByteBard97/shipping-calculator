# Amazon Product Sync - How It Works

## What's New

You can now **sync your existing Amazon products** directly into the app! Click the "Sync from Amazon" button in the Products tab.

## How to Get Your Amazon Credentials

### Step 1: Register as Amazon Developer
1. Go to: https://developer.amazonservices.com
2. Sign in with your Seller Central account
3. Click "Register as a Developer" (it's free!)

### Step 2: Create SP-API Application
1. In Developer Portal, click "Add new app client"
2. Choose "SP-API" (NOT MWS - that's the old API)
3. App Name: "Guinea Pig Hay Manager" (or whatever you want)
4. OAuth Redirect URI: `http://localhost` (for local testing)
5. Click "Save"

### Step 3: Get Your Credentials
After creating the app, you'll see:
- **Client ID**: Looks like `amzn1.application-oa2-client.abc123...`
- **Client Secret**: A long random string (click "Show Secret")

### Step 4: Get Your Refresh Token
This is the tricky part - you need to do an OAuth flow:

1. Build this URL (replace YOUR_CLIENT_ID with your actual Client ID):
   ```
   https://sellercentral.amazon.com/apps/authorize/consent?application_id=YOUR_CLIENT_ID&version=beta
   ```

2. Open that URL in your browser
3. Sign in and click "Authorize"
4. You'll be redirected to `http://localhost?spapi_oauth_code=ABC123...`
5. Copy the `spapi_oauth_code` value from the URL

6. Exchange the code for a refresh token using curl (or Postman):
   ```bash
   curl -X POST https://api.amazon.com/auth/o2/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=authorization_code" \
     -d "code=YOUR_SPAPI_OAUTH_CODE" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET"
   ```

7. The response will include `refresh_token` - SAVE THIS!

## Create Your .credentials File

1. Copy `.credentials.example` to `.credentials` in the project folder
2. Fill in your values:

```json
{
  "clientId": "amzn1.application-oa2-client.YOUR_ACTUAL_CLIENT_ID",
  "clientSecret": "YOUR_ACTUAL_CLIENT_SECRET",
  "refreshToken": "Atzr|YOUR_ACTUAL_REFRESH_TOKEN",
  "mode": "sandbox",
  "region": "us-east-1",
  "marketplaceId": "ATVPDKIKX0DER"
}
```

### Important Settings:

- **mode**:
  - `"sandbox"` = Safe testing environment, won't affect real listings
  - `"production"` = Real Amazon, BE CAREFUL!

- **region**:
  - `"us-east-1"` for North America
  - `"eu-west-1"` for Europe
  - `"us-west-2"` for Far East

- **marketplaceId**:
  - `"ATVPDKIKX0DER"` = USA
  - `"A2EUQ1WTGCTBG2"` = Canada
  - `"A1AM78C64UM0Y8"` = Mexico

## Testing with Sandbox

**Start in sandbox mode!** This is a safe testing environment where:
- ✅ Won't affect your real Amazon listings
- ✅ Uses fake test data
- ✅ Perfect for learning the system
- ✅ Can't accidentally mess anything up

Once you're comfortable, change `"mode": "production"` to go live.

## Using the Sync Feature

1. Make sure your `.credentials` file is set up
2. Run the app (double-click `start.bat` or `start-desktop.bat`)
3. Go to the **Products** tab
4. Click **"Sync from Amazon"** button
5. Your existing products will load automatically!

### What Gets Synced:
- ✅ Product SKUs
- ✅ Titles
- ✅ Brands
- ✅ Prices
- ✅ Inventory quantities
- ✅ ASINs
- ✅ Images (if available)
- ✅ Product status (active/inactive)

### What Doesn't Get Synced (Yet):
- ❌ Competitor prices (Amazon doesn't provide this)
- ❌ Sales history (would need different API endpoint)
- ❌ Reviews/ratings (different API)

## Troubleshooting

### "No credentials found" message
- Make sure `.credentials` file exists in the project root
- Check that the filename is exactly `.credentials` (with the dot at the start)
- On Windows, make sure file extensions are shown (it's not `.credentials.txt`)

### "Token refresh failed"
- Double-check your Client ID and Client Secret
- Make sure your Refresh Token is correct
- Verify you're using the right mode (sandbox vs production)

### "API request failed: 403"
- Your app might not have the right permissions
- In Developer Portal, make sure your app has "Listings" permissions
- Try regenerating your credentials

### Products show but are all "Unknown"
- Your app might be in sandbox mode with no test data
- Amazon's sandbox sometimes has no products - this is normal
- Switch to production mode to see real products (be careful!)

## Need More Help?

The OAuth flow is complex! If you get stuck:
1. Check the Amazon SP-API documentation: https://developer-docs.amazon.com/sp-api/
2. Look for "LWA (Login with Amazon)" guides
3. There are YouTube tutorials for getting SP-API credentials
4. Or just use mock data until you get credentials - the app works either way!
