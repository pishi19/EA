import json
import logging
import time
from datetime import datetime, timedelta
from pathlib import Path


class MonitoringScheduler:
    def __init__(self, log_dir: str = "logs", metrics_file: str = "logs/metrics.json"):
        self.log_dir = Path(log_dir)
        self.metrics_file = Path(metrics_file)
        self.logger = logging.getLogger("monitoring_scheduler")

        # Configure logger
        self.logger.setLevel(logging.INFO)
        fh = logging.FileHandler("logs/scheduler.log")
        fh.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
        self.logger.addHandler(fh)

        # Schedule configuration
        self.schedules = {
            "metrics_collection": {"interval": 10, "last_run": None},  # minutes
            "log_rotation": {"interval": 60, "last_run": None},  # minutes
            "cleanup": {"interval": 1440, "last_run": None},  # 24 hours
            "report_generation": {"interval": 60, "last_run": None},  # minutes
        }

        # Load last run times if available
        self._load_schedule_state()

    def _load_schedule_state(self):
        """Load schedule state from file"""
        state_file = self.log_dir / "scheduler_state.json"
        if state_file.exists():
            try:
                with open(state_file) as f:
                    state = json.load(f)
                    for task, data in state.items():
                        if task in self.schedules:
                            self.schedules[task]["last_run"] = datetime.fromisoformat(
                                data["last_run"]
                            )
            except Exception as e:
                self.logger.error(f"Error loading schedule state: {e!s}")

    def _save_schedule_state(self):
        """Save schedule state to file"""
        state_file = self.log_dir / "scheduler_state.json"
        try:
            state = {
                task: {"last_run": (data["last_run"].isoformat() if data["last_run"] else None)}
                for task, data in self.schedules.items()
            }
            with open(state_file, "w") as f:
                json.dump(state, f, indent=2)
        except Exception as e:
            self.logger.error(f"Error saving schedule state: {e!s}")

    def _should_run(self, task: str) -> bool:
        """Check if a task should run based on its schedule"""
        schedule_data = self.schedules[task]
        if not schedule_data["last_run"]:
            return True

        next_run = schedule_data["last_run"] + timedelta(minutes=schedule_data["interval"])
        return datetime.now() >= next_run

    def _update_last_run(self, task: str):
        """Update the last run time for a task"""
        self.schedules[task]["last_run"] = datetime.now()
        self._save_schedule_state()

    def run_metrics_collection(self):
        """Run metrics collection if scheduled"""
        if self._should_run("metrics_collection"):
            try:
                from log_monitor import LogMonitor

                monitor = LogMonitor()
                monitor.collect_metrics()
                self._update_last_run("metrics_collection")
                self.logger.info("Metrics collection completed")
            except Exception as e:
                self.logger.error(f"Error in metrics collection: {e!s}")

    def run_log_rotation(self):
        """Run log rotation if scheduled"""
        if self._should_run("log_rotation"):
            try:
                from log_monitor import LogMonitor

                monitor = LogMonitor()
                monitor._rotate_large_logs()
                self._update_last_run("log_rotation")
                self.logger.info("Log rotation completed")
            except Exception as e:
                self.logger.error(f"Error in log rotation: {e!s}")

    def run_cleanup(self):
        """Run cleanup tasks if scheduled"""
        if self._should_run("cleanup"):
            try:
                from log_monitor import LogMonitor

                monitor = LogMonitor()
                monitor._cleanup_old_logs()
                self._update_last_run("cleanup")
                self.logger.info("Cleanup completed")
            except Exception as e:
                self.logger.error(f"Error in cleanup: {e!s}")

    def run_report_generation(self):
        """Run report generation if scheduled"""
        if self._should_run("report_generation"):
            try:
                from log_monitor import LogMonitor

                monitor = LogMonitor()

                # Initialize metrics if needed
                if not monitor.metrics:
                    self.logger.info("No metrics available yet, skipping report generation")
                    return

                report = monitor._generate_alert_report()
                if report:
                    report_file = self.log_dir / "alert_report.txt"
                    with open(report_file, "w") as f:
                        f.write(report)
                    self._update_last_run("report_generation")
                    self.logger.info("Report generation completed")
                else:
                    self.logger.warning("No report generated - no alerts to report")

            except Exception as e:
                self.logger.error(f"Error in report generation: {e!s}")
                self.logger.exception(e)  # Log the full traceback
                # Don't update last_run on error to allow retry

    def run(self):
        """Run the scheduler continuously"""
        self.logger.info("Starting monitoring scheduler")

        while True:
            try:
                self.run_metrics_collection()
                self.run_log_rotation()
                self.run_cleanup()
                self.run_report_generation()

                # Sleep for 1 minute before next check
                time.sleep(60)

            except KeyboardInterrupt:
                self.logger.info("Scheduler stopped by user")
                break
            except Exception as e:
                self.logger.error(f"Unexpected error in scheduler: {e!s}")
                time.sleep(60)  # Sleep before retrying


if __name__ == "__main__":
    scheduler = MonitoringScheduler()
    scheduler.run()
