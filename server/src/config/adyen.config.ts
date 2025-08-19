export const adyenConfig = {
  // Adyen API Configuration
  apiKey: process.env.ADYEN_API_KEY || 'YOUR_ADYEN_API_KEY_HERE',
  merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT || 'YOUR_MERCHANT_ACCOUNT_HERE',
  
  // Environment settings
  environment: (process.env.ADYEN_ENV || 'test').toUpperCase(), // TEST or LIVE
  
  // API URLs based on environment
  baseUrl: (process.env.ADYEN_ENV || 'test').toLowerCase() === 'live'
    ? 'https://checkout-live.adyen.com/v71'
    : 'https://checkout-test.adyen.com/v71',
    
  payoutUrl: (process.env.ADYEN_ENV || 'test').toLowerCase() === 'live'
    ? 'https://payout-live.adyen.com/v68'
    : 'https://payout-test.adyen.com/v68',
    
  // Webhook configuration
  webhookUsername: process.env.ADYEN_WEBHOOK_USERNAME || 'webhook_user',
  webhookPassword: process.env.ADYEN_WEBHOOK_PASSWORD || 'webhook_password',
  
  // HMAC key for webhook verification
  hmacKey: process.env.ADYEN_HMAC_KEY || 'YOUR_HMAC_KEY_HERE',
};

export const getAdyenHeaders = () => ({
  'Content-Type': 'application/json',
  'X-API-Key': adyenConfig.apiKey,
});
