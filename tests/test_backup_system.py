import unittest
import os
import shutil
import tempfile
import json
from pathlib import Path
import subprocess
import time
from datetime import datetime, timedelta

class TestBackupSystem(unittest.TestCase):
    def setUp(self):
        # Create temporary directories for testing
        self.test_dir = tempfile.mkdtemp()
        self.backup_dir = Path(self.test_dir) / "backups"
        self.data_dir = Path(self.test_dir) / "data"
        self.qdrant_dir = self.data_dir / "qdrant"
        self.redis_dir = self.data_dir / "redis"
        self.app_dir = self.data_dir / "app"
        
        # Create test directories
        self.backup_dir.mkdir(exist_ok=True)
        self.qdrant_dir.mkdir(parents=True, exist_ok=True)
        self.redis_dir.mkdir(parents=True, exist_ok=True)
        self.app_dir.mkdir(parents=True, exist_ok=True)
        
        # Create test data
        self._create_test_data()
        
        # Set environment variables for testing
        os.environ['BACKUP_DIR'] = str(self.backup_dir)
        os.environ['DATA_DIR'] = str(self.data_dir)
        
    def tearDown(self):
        # Clean up test directories
        shutil.rmtree(self.test_dir)
        
    def _create_test_data(self):
        """Create test data in various components"""
        # Create Qdrant test data
        with open(self.qdrant_dir / "test_collection.json", "w") as f:
            json.dump({"vectors": [1, 2, 3]}, f)
            
        # Create Redis test data
        with open(self.redis_dir / "dump.rdb", "w") as f:
            f.write("test redis data")
            
        # Create app test data
        with open(self.app_dir / "config.json", "w") as f:
            json.dump({"test": "config"}, f)
            
    def _run_backup_script(self, args):
        env = os.environ.copy()
        env['BACKUP_DIR'] = str(self.backup_dir)
        env['DATA_DIR'] = str(self.data_dir)
        return subprocess.run([
            "bash", "scripts/backup.sh", *args
        ], capture_output=True, text=True, env=env)

    def test_backup_creation(self):
        """Test that backups are created correctly"""
        result = self._run_backup_script(["create"])
        backup_files = list(self.backup_dir.glob("ora_backup_*"))
        self.assertTrue(len(backup_files) > 0, "No backup files were created")
        manifest_files = list(self.backup_dir.glob("*_manifest.txt"))
        self.assertTrue(len(manifest_files) > 0, "No manifest file was created")

    def test_backup_components(self):
        self._run_backup_script(["create"])
        manifest_files = sorted(self.backup_dir.glob("*_manifest.txt"), reverse=True)
        latest_backup = manifest_files[0].stem.replace('_manifest', '')
        self.assertTrue(
            (self.backup_dir / f"{latest_backup}_qdrant.tar.gz").exists(),
            "Qdrant backup missing"
        )
        self.assertTrue(
            (self.backup_dir / f"{latest_backup}_redis.tar.gz").exists(),
            "Redis backup missing"
        )
        self.assertTrue(
            (self.backup_dir / f"{latest_backup}_app.tar.gz").exists(),
            "App backup missing"
        )

    def test_rollback(self):
        self._run_backup_script(["create"])
        with open(self.qdrant_dir / "test_collection.json", "w") as f:
            json.dump({"vectors": [4, 5, 6]}, f)
        manifest_files = sorted(self.backup_dir.glob("*_manifest.txt"), reverse=True)
        backup_name = manifest_files[0].stem.replace('_manifest', '')
        self._run_backup_script(["rollback", backup_name])
        with open(self.qdrant_dir / "test_collection.json", "r") as f:
            data = json.load(f)
            self.assertEqual(data["vectors"], [1, 2, 3], "Data not restored correctly")

    def test_backup_retention(self):
        for _ in range(5):
            self._run_backup_script(["create"])
            time.sleep(1)
        manifest_files = list(self.backup_dir.glob("*_manifest.txt"))
        self.assertLessEqual(len(manifest_files), 5, "Too many backups retained")

    def test_backup_verification(self):
        self._run_backup_script(["create"])
        manifest_files = sorted(self.backup_dir.glob("*_manifest.txt"), reverse=True)
        latest_backup = manifest_files[0].stem.replace('_manifest', '')
        for component in ["qdrant", "redis", "app"]:
            backup_file = self.backup_dir / f"{latest_backup}_{component}.tar.gz"
            result = subprocess.run(
                ["tar", "tzf", str(backup_file)],
                capture_output=True,
                text=True
            )
            self.assertEqual(result.returncode, 0, f"{component} backup is corrupted")

    def test_error_handling(self):
        env = os.environ.copy()
        env['DATA_DIR'] = "/nonexistent"
        env['BACKUP_DIR'] = str(self.backup_dir)
        result = subprocess.run(
            ["bash", "scripts/backup.sh", "create"],
            capture_output=True,
            text=True,
            env=env
        )
        self.assertNotEqual(result.returncode, 0, "Should fail with non-existent directory")
        result = self._run_backup_script(["rollback", "invalid_backup"])
        self.assertNotEqual(result.returncode, 0, "Should fail with invalid backup name")

if __name__ == '__main__':
    unittest.main() 