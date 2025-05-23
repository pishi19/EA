#!/usr/bin/env python3
import unittest
import sys
import os
import subprocess
from pathlib import Path

def run_tests():
    """Run the logging system tests"""
    # Add the tests directory to the Python path
    tests_dir = Path(__file__).parent.parent / 'tests'
    sys.path.append(str(tests_dir))
    
    # Discover and run tests
    loader = unittest.TestLoader()
    start_dir = str(tests_dir)
    suite = loader.discover(start_dir, pattern='test_logging.py')
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()

def start_monitoring():
    """Start the log monitoring process"""
    monitor_script = Path(__file__).parent.parent / 'src' / 'monitoring' / 'log_monitor.py'
    
    # Start the monitor in a separate process
    process = subprocess.Popen(
        [sys.executable, str(monitor_script)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    return process

def main():
    """Main function to run tests and start monitoring"""
    print("Running logging system tests...")
    tests_successful = run_tests()
    
    if not tests_successful:
        print("Tests failed. Please fix the issues before starting monitoring.")
        sys.exit(1)
    
    print("Tests passed. Starting log monitoring...")
    monitor_process = start_monitoring()
    
    try:
        # Keep the script running and monitor the process
        while True:
            if monitor_process.poll() is not None:
                print("Monitor process terminated unexpectedly.")
                break
            
            # Check for any output
            stdout = monitor_process.stdout.readline()
            if stdout:
                print(f"Monitor: {stdout.decode().strip()}")
            
            stderr = monitor_process.stderr.readline()
            if stderr:
                print(f"Monitor Error: {stderr.decode().strip()}")
    
    except KeyboardInterrupt:
        print("\nStopping monitoring...")
        monitor_process.terminate()
        monitor_process.wait()
        print("Monitoring stopped.")

if __name__ == '__main__':
    main() 