/**
 * Environment Variable Validator
 * Ensures all required environment secrets exist before server startup
 */
export const validateEnv = () => {
  const requiredEnvVars = [
    'MONGODB_URI',
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
  ];

  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error('❌ CRITICAL ENVIRONMENT ERROR: Missing required environment variables:');
    missing.forEach((varName) => console.error(`   - ${varName}`));
    console.error('Please configure them in server/.env before launching server.');
    process.exit(1);
  }

  // Warn on missing non-blocking integrations
  if (!process.env.R2_SECRET_ACCESS_KEY) {
    console.warn('⚠️ WARNING: R2_SECRET_ACCESS_KEY is not set. Cloudflare R2 storage uploads may fail.');
  }

  if (!process.env.BREVO_API_KEY) {
    console.warn('⚠️ WARNING: BREVO_API_KEY is not set. Email notifications will be disabled.');
  }

  console.log('✅ Environment configuration validated successfully.');
};
