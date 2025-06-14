# Environment Variables Setup

This document describes the environment variables needed to run the Ora System.

## Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your_openai_api_key_here

# Qdrant Vector Database Configuration  
QDRANT_URL=http://localhost:6333
QDRANT_PORT=6333
QDRANT_HOST=localhost
QDRANT_API_KEY=your_qdrant_api_key_if_needed

# Database Configuration
DB_PATH=data/tasks.db

# Paths Configuration
VAULT_PATH=vault
LOG_PATH=logs
DAILY_NOTES_PATH=vault/daily_notes

# Task Processing Configuration
TASK_CLASSIFICATION_THRESHOLD=0.7
IGNORED_SENDERS=

# Logging Configuration
LOG_LEVEL=INFO

# Monitoring Configuration  
MONITOR_INTERVAL=60
GROWTH_THRESHOLD=50.0
ERROR_THRESHOLD=10
WARNING_THRESHOLD=20
MAX_LOG_SIZE=10485760

# Email Configuration (Optional - for email functionality)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Gmail API Configuration (optional)
# If you plan to use Gmail integration, you'll need:
# GMAIL_CREDENTIALS_PATH=runtime/credentials/credentials_gmail.json
# GMAIL_TOKEN_PATH=runtime/credentials/token_gmail.pkl

# Path Overrides (Advanced Configuration)
# Override hardcoded paths if needed - these replace the /Users/air/AIR01/ paths
# BASE_VAULT_PATH=/path/to/your/vault
# SYSTEM_LOGS_PATH=/path/to/your/logs
# RETROSPECTIVES_PATH=/path/to/retrospectives
# MCP_LOOPS_PATH=/path/to/mcp/loops
```

## Setup Instructions

1. Copy the above variables to your `.env` file
2. Replace `your_openai_api_key_here` with your actual OpenAI API key
3. Configure email settings if you want email functionality:
   - For Gmail, use an App Password instead of your regular password
   - Go to Google Account Settings > Security > 2-Step Verification > App passwords
4. Adjust paths as needed for your environment
5. Make sure Qdrant is running locally on port 6333 (or update the URL)

## Gmail Integration Setup (Optional)

If you want to use Gmail features:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API
4. Create credentials (OAuth 2.0 Client ID)
5. Download the credentials JSON file
6. Place it at `runtime/credentials/credentials_gmail.json`
7. Run the authentication script to generate token

## Security Notes

- **Never commit your `.env` file to version control**
- Keep your API keys secure and rotate them regularly
- Use different keys for development and production environments
- For production, consider using a secrets management service
- Gmail App Passwords are safer than using your main password

## Troubleshooting

### Common Issues:
1. **"OPENAI_API_KEY not found"**: Make sure your `.env` file is in the project root
2. **Gmail authentication fails**: Ensure you're using an App Password, not your regular password
3. **Path not found errors**: Check that all required directories exist or update paths in `.env`
4. **Qdrant connection errors**: Make sure Qdrant is running on the specified host/port

### LLM Functionality Dependencies:
The following environment variables are **required** for LLM functionality to work:
- `OPENAI_API_KEY` - Core LLM functionality
- `QDRANT_URL` - Vector database for semantic search
- `QDRANT_HOST` and `QDRANT_PORT` - Vector database connection

All other variables are optional but may be needed for specific features. 