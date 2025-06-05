# Ora Droplet Deployment Guide

This document provides a full deployment workflow and operational checklist for hosting the Ora executive assistant system on a DigitalOcean Droplet. The system includes a modular Streamlit interface, a loader-based data backend, GPT integration, and systemd for persistent service orchestration.

---

## 🖥️ System Overview
- **Host:** DigitalOcean Droplet (Ubuntu 22.04+)
- **App:** Ora (modular assistant platform)
- **Interface:** Streamlit served on port `8501`
- **Deployment Directory:** `/root/ea_cursor_system_coupled/`
- **Persistence:** Enabled via `systemd` (`ora.service`)

---

## 🧱 Folder Structure
```
/root/ea_cursor_system_coupled/
├── src/                      # All Python source code
├── vault/                   # All markdown content files (loops, inbox, etc.)
├── deploy/                  # Deployment tools
│   ├── launch_streamlit.sh  # Launch script with env vars
│   └── ora.service          # systemd service file
```

---

## 🚀 Manual Launch
To run the app manually:
```bash
cd ~/ea_cursor_system_coupled/
PYTHONPATH=. streamlit run src/interface/ora_ui.py
```

Or using the launch script:
```bash
cd ~/ea_cursor_system_coupled/deploy/
./launch_streamlit.sh
```

Ensure the script includes:
```bash
export OPENAI_API_KEY="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"
export PYTHONPATH=/root/ea_cursor_system_coupled
```

---

## 🛠️ systemd Setup
### Step 1: Upload the service file
```bash
scp ora.service root@<>:/etc/systemd/system/
```

### Step 2: Enable and start the service
```bash
sudo systemctl daemon-reexec
sudo systemctl enable ora
sudo systemctl start ora
```

### Step 3: Monitor logs
```bash
journalctl -u ora -f
```

---

## 🔐 Environment Variables
To persist your OpenAI key:
- Inline in `launch_streamlit.sh`, or
- In `~/.bashrc`:
  ```bash
  export OPENAI_API_KEY="sk-..."
  ```

---

## 📦 Test Utilities
Run internal loader checks:
```bash
python3 deploy/test_loader.py
```
Expected output includes loop count, roadmap items, summaries, etc.

---

## 🧠 GPT Integration
Ensure `openai` is installed:
```bash
pip3 install openai
```

GPT prompts run from `src/system/gpt_ora_chat.py`, using summaries from loop memory files.

---

## 🧪 Diagnostic UI
The Ora UI includes a built-in diagnostics panel:
- 📈 Summarizes loader status
- 📦 Verifies markdown parsing
- ✅ Helps confirm live deployment status

---

## 🌐 Accessing the UI
Visit from any browser:
```
http://<your-droplet-ip>:8501
```

---

## ✅ Final Checklist
- [x] `vault/` uploaded
- [x] `src/` fully copied
- [x] `launch_streamlit.sh` updated with API key
- [x] Streamlit running successfully
- [x] Accessible at `:8501`
- [x] `ora.service` enabled and verified

Ora is now fully deployed and running persistently on your Droplet.
