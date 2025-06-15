# Anthropic API Setup Guide

## Configuration

1. **Environment Variable Setup**
   - A `.env` file has been created in the project root
   - Replace the placeholder API key with your actual Anthropic API key:
     ```
     ANTHROPIC_API_KEY=sk-ant-api03-YOUR_ACTUAL_KEY_HERE
     ```

2. **Security**
   - The `.env` file is already in `.gitignore` and will not be committed
   - Never commit your actual API key to version control

## Testing the Connection

Run the test script to verify your API key works:

```bash
node test-anthropic.js
```

### Expected Results

**With placeholder key:**
```
❌ Error: Please replace the placeholder API key with your actual Anthropic API key
   Edit the .env file and replace "sk-ant-api03-REPLACE_WITH_ACTUAL_KEY" with your real key
```

**With valid API key:**
```
✅ Success! Anthropic API connection is working.
   Model: claude-3-sonnet-20240229
   Response: API connection successful!
   Usage: X input tokens, Y output tokens
```

**With invalid API key:**
```
❌ Error connecting to Anthropic API:
   Invalid API key. Please check your ANTHROPIC_API_KEY in .env
```

## Integration with Ora

Once the API key is configured and tested:
1. The Ora chat component can be updated to use real Anthropic API calls
2. Replace the mock responses in `/api/ora/chat/route.ts` with actual Claude integration
3. Use the same environment variable (`ANTHROPIC_API_KEY`) in the Next.js app

## Required Packages

The following packages have been installed:
- `@anthropic-ai/sdk` - Anthropic's official SDK
- `dotenv` - For loading environment variables

These are installed both at the project root (for testing) and in `src/ui/react-app` (for the app). 