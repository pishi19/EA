# Project Setup and Commands

## Dependency Management with UV

### Install UV
Run the following command in your terminal to install UV:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```
Then, source the environment to make `uv` available in your current shell session:
```bash
source $HOME/.local/bin/env
```

### Install Project Dependencies
Once UV is installed, you can install the project dependencies using:
```bash
uv pip install -r requirements.txt
```
