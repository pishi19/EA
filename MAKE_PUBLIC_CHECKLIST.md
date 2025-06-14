# Making Repository Public - Security Checklist

## 🚨 CRITICAL STEPS - DO THESE FIRST

### 1. **Revoke Current API Key** 
- [ ] Go to https://platform.openai.com/api-keys
- [ ] Delete the current API key (starts with `sk-proj-SoILG0xfrR`)
- [ ] Generate a new API key
- [ ] Update your local `.env` file with the new key

### 2. **Verify .env is Not Tracked**
```bash
git status .env
# Should show: "nothing to commit, working tree clean"
```

### 3. **Check Git History for Secrets**
```bash
git log --grep="OPENAI_API_KEY" --oneline
git log -S "sk-proj-" --oneline
```

If you find commits with your API key, consider using BFG Repo-Cleaner:
```bash
# Install BFG (macOS)
brew install bfg

# Remove API key from history
bfg --replace-text patterns.txt

# patterns.txt should contain:
# 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
```

## 🔧 RECOMMENDED FIXES

### 4. **Fix Hardcoded Paths**
```bash
# Run the analysis script
python scripts/fix_hardcoded_paths.py

# This will show you all hardcoded /Users/air/ paths
# Replace them with environment variables
```

### 5. **Test LLM Functionality**
After making changes, verify core functionality still works:
```bash
# Test OpenAI connection
python -c "
import os
from openai import OpenAI
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
print('✅ OpenAI connection works')
"

# Test basic LLM call
python -c "
import os
from openai import OpenAI
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
response = client.chat.completions.create(
    model='gpt-3.5-turbo',
    messages=[{'role': 'user', 'content': 'Test'}],
    max_tokens=10
)
print('✅ LLM functionality works')
"
```

### 6. **Clean Up Runtime Directory**
```bash
# Review what's in runtime/
ls -la runtime/

# Remove any files with sensitive data
# Keep structure but remove sensitive content
```

## 📋 FINAL VERIFICATION

### 7. **Security Scan**
```bash
# Check for any remaining secrets
grep -r "sk-" src/ --exclude-dir=node_modules || echo "✅ No API keys found"
grep -r "/Users/air" src/ --exclude-dir=node_modules | head -5
```

### 8. **Environment Setup Test**
```bash
# Test that someone else can set up the project
mv .env .env.backup
cp ENV_SETUP.md test_setup.txt
# Follow the setup instructions in ENV_SETUP.md
# Verify LLM functionality works with new setup
mv .env.backup .env
```

## 🚀 GOING PUBLIC

### 9. **Final Commit**
```bash
git add -A
git commit -m "Security fixes for public release

- Fixed hardcoded paths
- Enhanced security documentation
- Verified LLM functionality preservation"
```

### 10. **Repository Settings**
- [ ] Review repository description
- [ ] Add appropriate tags/topics
- [ ] Ensure README.md explains the project well
- [ ] Add license if needed
- [ ] Make repository public

## 🔒 POST-PUBLIC MONITORING

### 11. **After Going Public**
- [ ] Monitor for any security issues
- [ ] Set up branch protection rules
- [ ] Consider adding security scanning CI/CD
- [ ] Monitor OpenAI API usage for unusual activity

## ✅ CURRENT STATUS

Based on security audit:
- [x] `.env` removed from tracking
- [x] Enhanced `.gitignore`
- [x] Created security documentation
- [x] Environment setup guide created
- [ ] **CRITICAL**: API key needs to be revoked/regenerated
- [ ] **RECOMMENDED**: Hardcoded paths need fixing
- [ ] **RECOMMENDED**: Git history cleaning

## 🆘 IF SOMETHING GOES WRONG

If you accidentally expose secrets:
1. **Immediately revoke the exposed API key**
2. **Make repository private again**
3. **Clean git history with BFG**
4. **Generate new secrets**
5. **Re-test functionality**
6. **Make public again when safe**

---

**Remember**: It's better to be overly cautious with security than to expose sensitive data! 