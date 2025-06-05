# Ora Droplet Deployment Guide

## 🔧 Setup Steps

1. Copy this `deploy/` folder into your Droplet:
    ```bash
    scp -r deploy/ ubuntu@170.64.176.146:~/ea_cursor_system_coupled/
    ```

2. SSH into the Droplet and make the script executable:
    ```bash
    chmod +x deploy/launch_streamlit.sh
    ```

3. Test manually first:
    ```bash
    cd deploy/
    ./launch_streamlit.sh
    ```

4. To enable as a systemd service:
    ```bash
    sudo cp ora.service /etc/systemd/system/
    sudo systemctl daemon-reexec
    sudo systemctl enable ora
    sudo systemctl start ora
    ```

5. Test loaders directly via:
    ```bash
    python3 deploy/test_loader.py
    ```

## 📂 Notes

- Ensure your `vault/` directory is populated before launch.
- You may symlink or mount `vault/` externally for persistence:
    ```bash
    ln -s /mnt/volume_nyc1_01/vault ~/ea_cursor_system_coupled/vault
    ```

- Logs will be captured in journalctl:
    ```bash
    sudo journalctl -u ora -f
    ```

- Edit port in `launch_streamlit.sh` if needed.
