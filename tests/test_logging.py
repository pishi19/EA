import unittest
import logging
import os
from logging.handlers import RotatingFileHandler
import tempfile
import shutil

class TestLoggingSystem(unittest.TestCase):
    def setUp(self):
        # Create a temporary directory for test logs
        self.test_dir = tempfile.mkdtemp()
        self.log_file = os.path.join(self.test_dir, 'test.log')
        
        # Configure test logger
        self.logger = logging.getLogger('test_logger')
        self.logger.setLevel(logging.DEBUG)
        
        # Add file handler with smaller maxBytes for testing
        self.file_handler = RotatingFileHandler(
            self.log_file,
            maxBytes=1024,  # 1KB for testing
            backupCount=3
        )
        self.file_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        self.logger.addHandler(self.file_handler)
        
        # Add stream handler
        self.stream_handler = logging.StreamHandler()
        self.stream_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        self.logger.addHandler(self.stream_handler)

    def tearDown(self):
        # Close handlers
        self.file_handler.close()
        self.stream_handler.close()
        
        # Remove handlers
        self.logger.removeHandler(self.file_handler)
        self.logger.removeHandler(self.stream_handler)
        
        # Clean up test directory
        shutil.rmtree(self.test_dir)

    def test_log_creation(self):
        """Test that logs are created correctly"""
        test_message = "Test log message"
        self.logger.info(test_message)
        
        # Check if log file exists
        self.assertTrue(os.path.exists(self.log_file))
        
        # Check if message was written
        with open(self.log_file, 'r') as f:
            log_content = f.read()
            self.assertIn(test_message, log_content)

    def test_log_rotation(self):
        """Test log rotation functionality"""
        # Write enough data to trigger rotation (1KB + 1 byte)
        for i in range(10):
            self.logger.info("x" * 100)  # Write 100 bytes per line
        
        # Force rotation by writing one more line
        self.logger.info("x" * 100)
        
        # Check if backup files were created
        backup_files = [f for f in os.listdir(self.test_dir) if f.endswith('.log.1')]
        self.assertTrue(len(backup_files) > 0, "No backup files were created")

    def test_log_levels(self):
        """Test different log levels"""
        levels = {
            'debug': logging.DEBUG,
            'info': logging.INFO,
            'warning': logging.WARNING,
            'error': logging.ERROR,
            'critical': logging.CRITICAL
        }
        
        for level_name, level in levels.items():
            self.logger.log(level, f"Test {level_name} message")
        
        # Check if all levels were written
        with open(self.log_file, 'r') as f:
            log_content = f.read()
            for level_name in levels:
                self.assertIn(f"Test {level_name} message", log_content)

    def test_error_tracking(self):
        """Test error tracking functionality"""
        try:
            raise ValueError("Test error")
        except Exception as e:
            self.logger.error("Error occurred: %s", str(e), exc_info=True)
        
        # Check if error was logged with traceback
        with open(self.log_file, 'r') as f:
            log_content = f.read()
            self.assertIn("Error occurred: Test error", log_content)
            self.assertIn("Traceback", log_content)

if __name__ == '__main__':
    unittest.main() 