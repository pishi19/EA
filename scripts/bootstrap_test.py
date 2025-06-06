# bootstrap_test.py
from src.system import status_writer, vault_index


def main():
    print("✅ Modules loaded.")
    print("📄 Vault index output:", vault_index.generate_vault_index())
    status_writer.write_status("bootstrap", action="check")

if __name__ == "__main__":
    main()
