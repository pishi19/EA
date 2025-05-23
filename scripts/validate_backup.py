#!/usr/bin/env python3
import os
import sys
import subprocess
import time
from datetime import datetime, timedelta
import json
import logging
from pathlib import Path
import shutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BackupValidator:
    def __init__(self):
        self.backup_script = "scripts/backup.sh"
        self.test_data_dir = Path("test_data")
        self.backup_dir = Path("backups")
        self.components = ["qdrant", "redis", "app"]
        
    def setup_test_environment(self):
        """Set up test environment with realistic data"""
        logger.info("Setting up test environment...")
        
        # Create test directories
        self.test_data_dir.mkdir(exist_ok=True)
        self.backup_dir.mkdir(exist_ok=True)
        
        # Create realistic test data
        self._create_test_data()
        
        # Set environment variables
        os.environ['BACKUP_DIR'] = str(self.backup_dir)
        os.environ['DATA_DIR'] = str(self.test_data_dir)
        
    def _create_test_data(self):
        """Create realistic test data for each component"""
        # Create Qdrant test data
        qdrant_dir = self.test_data_dir / "qdrant"
        qdrant_dir.mkdir(exist_ok=True)
        
        # Create a realistic Qdrant collection
        collection_data = {
            "vectors": [
                {"id": i, "vector": [float(j) for j in range(100)]}
                for i in range(1000)
            ],
            "metadata": {
                "name": "test_collection",
                "created_at": datetime.now().isoformat()
            }
        }
        with open(qdrant_dir / "collection.json", "w") as f:
            json.dump(collection_data, f)
            
        # Create Redis test data
        redis_dir = self.test_data_dir / "redis"
        redis_dir.mkdir(exist_ok=True)
        
        # Create a realistic Redis dump
        redis_data = {
            "keys": {
                f"key_{i}": f"value_{i}"
                for i in range(100)
            },
            "metadata": {
                "last_save": datetime.now().isoformat()
            }
        }
        with open(redis_dir / "dump.rdb", "w") as f:
            json.dump(redis_data, f)
            
        # Create app test data
        app_dir = self.test_data_dir / "app"
        app_dir.mkdir(exist_ok=True)
        
        # Create realistic app configuration
        app_config = {
            "database": {
                "host": "localhost",
                "port": 5432,
                "name": "ora_db"
            },
            "api": {
                "endpoints": ["/v1/loops", "/v1/projects"],
                "rate_limit": 1000
            },
            "logging": {
                "level": "INFO",
                "rotation": "1MB"
            }
        }
        with open(app_dir / "config.json", "w") as f:
            json.dump(app_config, f)
            
    def run_backup(self):
        """Run backup and verify its creation"""
        logger.info("Running backup...")
        result = subprocess.run(
            [self.backup_script, "create"],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            logger.error(f"Backup failed: {result.stderr}")
            return False
            
        # Verify backup files
        backup_files = list(self.backup_dir.glob("ora_backup_*"))
        if not backup_files:
            logger.error("No backup files were created")
            return False
            
        logger.info(f"Backup created successfully: {len(backup_files)} files")
        return True
        
    def _get_latest_backup_prefix(self):
        # Find the latest manifest file and extract the base prefix
        manifest_files = sorted(self.backup_dir.glob("ora_backup_*_manifest.txt"), reverse=True)
        if not manifest_files:
            return None
        latest_manifest = manifest_files[0].name
        # Remove _manifest.txt to get the base
        return latest_manifest.replace('_manifest.txt', '')

    def verify_backup_integrity(self):
        logger.info("Verifying backup integrity...")
        backup_prefix = self._get_latest_backup_prefix()
        if not backup_prefix:
            logger.error("No backup files found")
            return False
        for component in self.components:
            backup_file = self.backup_dir / f"{backup_prefix}_{component}.tar.gz"
            if not backup_file.exists():
                logger.error(f"Missing backup file for {component}")
                return False
            result = subprocess.run(
                ["tar", "tzf", str(backup_file)],
                capture_output=True,
                text=True
            )
            if result.returncode != 0:
                logger.error(f"Corrupted backup file for {component}")
                return False
        logger.info("Backup integrity verified successfully")
        return True
        
    def test_rollback(self):
        logger.info("Testing rollback...")
        if not self.run_backup():
            return False
        self._modify_test_data()
        backup_prefix = self._get_latest_backup_prefix()
        if not backup_prefix:
            logger.error("No backup files found for rollback")
            return False
        result = subprocess.run(
            [self.backup_script, "rollback", backup_prefix],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            logger.error(f"Rollback failed: {result.stderr}")
            return False
        if not self._verify_restored_data():
            logger.error("Data restoration verification failed")
            return False
        logger.info("Rollback test completed successfully")
        return True
        
    def _modify_test_data(self):
        """Modify test data to simulate changes"""
        # Modify Qdrant data
        qdrant_file = self.test_data_dir / "qdrant" / "collection.json"
        with open(qdrant_file, "r") as f:
            data = json.load(f)
        data["vectors"].append({"id": 1001, "vector": [0.0] * 100})
        with open(qdrant_file, "w") as f:
            json.dump(data, f)
            
        # Modify Redis data
        redis_file = self.test_data_dir / "redis" / "dump.rdb"
        with open(redis_file, "r") as f:
            data = json.load(f)
        data["keys"]["new_key"] = "new_value"
        with open(redis_file, "w") as f:
            json.dump(data, f)
            
        # Modify app config
        app_file = self.test_data_dir / "app" / "config.json"
        with open(app_file, "r") as f:
            data = json.load(f)
        data["api"]["rate_limit"] = 2000
        with open(app_file, "w") as f:
            json.dump(data, f)
            
    def _verify_restored_data(self):
        """Verify that data was restored correctly"""
        # Verify Qdrant data
        qdrant_file = self.test_data_dir / "qdrant" / "collection.json"
        with open(qdrant_file, "r") as f:
            data = json.load(f)
        if len(data["vectors"]) != 1000:
            return False
            
        # Verify Redis data
        redis_file = self.test_data_dir / "redis" / "dump.rdb"
        with open(redis_file, "r") as f:
            data = json.load(f)
        if "new_key" in data["keys"]:
            return False
            
        # Verify app config
        app_file = self.test_data_dir / "app" / "config.json"
        with open(app_file, "r") as f:
            data = json.load(f)
        if data["api"]["rate_limit"] != 1000:
            return False
            
        return True
        
    def cleanup(self):
        """Clean up test environment"""
        logger.info("Cleaning up test environment...")
        if self.test_data_dir.exists():
            shutil.rmtree(self.test_data_dir)
        if self.backup_dir.exists():
            shutil.rmtree(self.backup_dir)
            
def main():
    validator = BackupValidator()
    
    try:
        # Set up test environment
        validator.setup_test_environment()
        
        # Run backup
        if not validator.run_backup():
            sys.exit(1)
            
        # Verify backup integrity
        if not validator.verify_backup_integrity():
            sys.exit(1)
            
        # Test rollback
        if not validator.test_rollback():
            sys.exit(1)
            
        logger.info("All backup validation tests passed successfully!")
        
    except Exception as e:
        logger.error(f"Validation failed: {str(e)}")
        sys.exit(1)
        
    finally:
        validator.cleanup()
        
if __name__ == "__main__":
    main() 