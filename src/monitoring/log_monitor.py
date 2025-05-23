import os
import time
import logging
from logging import handlers
from datetime import datetime, timedelta
from collections import defaultdict
import json
from pathlib import Path
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import shutil
from typing import Dict, List, Any, Optional
from enum import Enum
import atexit
import sys

# Set matplotlib to use Agg backend to avoid memory issues
plt.switch_backend('Agg')

class AlertSeverity(Enum):
    INFO = 1
    WARNING = 2
    ERROR = 3
    CRITICAL = 4

class LogMonitor:
    def __init__(self, log_dir='logs', metrics_file='logs/metrics.json'):
        self.log_dir = Path(log_dir)
        self.metrics_file = Path(metrics_file)
        self.log_dir.mkdir(exist_ok=True)
        
        # Component-specific thresholds
        self.thresholds = {
            'default': {
                'error_rate': 0.1,  # 10%
                'warning_rate': 0.2,  # 20%
                'max_size_mb': 10,  # 10MB
                'growth_rate': 0.5,  # 50%
                'max_age_days': 7,  # 7 days
                'rotation_size_mb': 5,  # Rotate at 5MB
                'backup_count': 5,  # Keep 5 backup files
                'trend_window': 24,  # Hours to analyze trends
                'alert_cooldown': 3600,  # Seconds between repeated alerts
            },
            'monitor': {
                'error_rate': 0.2,
                'warning_rate': 0.3,
                'max_size_mb': 10,
                'growth_rate': 0.2,  # Reduced from 0.3
                'max_age_days': 5,
                'rotation_size_mb': 1,  # Reduced from 5MB
                'backup_count': 3,   # Reduced from 5
                'trend_window': 24,
                'alert_cooldown': 3600,
            },
            'launchd': {
                'error_rate': 0.15,
                'warning_rate': 0.25,
                'max_size_mb': 20,
                'growth_rate': 0.7,
                'max_age_days': 14,
                'rotation_size_mb': 10,
                'backup_count': 10,
                'trend_window': 24,
                'alert_cooldown': 3600,
            },
            'extract_loops': {
                'error_rate': 0.05,
                'warning_rate': 0.1,
                'max_size_mb': 5,
                'growth_rate': 0.3,
                'max_age_days': 5,
                'rotation_size_mb': 2,
                'backup_count': 3,
                'trend_window': 24,
                'alert_cooldown': 3600,
            },
            'loop_dashboard': {
                'error_rate': 0.08,
                'warning_rate': 0.15,
                'max_size_mb': 8,
                'growth_rate': 0.4,
                'max_age_days': 7,
                'rotation_size_mb': 4,
                'backup_count': 5,
                'trend_window': 24,
                'alert_cooldown': 3600,
            },
            'feedback': {
                'error_rate': 0.07,
                'warning_rate': 0.12,
                'max_size_mb': 7,
                'growth_rate': 0.35,
                'max_age_days': 7,
                'rotation_size_mb': 3,
                'backup_count': 5,
                'trend_window': 24,
                'alert_cooldown': 3600,
            },
            'assistant': {
                'error_rate': 0.06,
                'warning_rate': 0.1,
                'max_size_mb': 6,
                'growth_rate': 0.3,
                'max_age_days': 7,
                'rotation_size_mb': 3,
                'backup_count': 5,
                'trend_window': 24,
                'alert_cooldown': 3600,
            }
        }
        
        # Time-based metrics storage
        self.historical_metrics = defaultdict(list)
        self.metrics_retention_days = 30
        self.alert_history = defaultdict(list)
        self.last_alert_time = defaultdict(float)
        
        # Configure monitor logger
        self.logger = logging.getLogger('log_monitor')
        self.logger.setLevel(logging.WARNING)
        
        # Add file handler with more aggressive rotation
        fh = handlers.RotatingFileHandler(
            'logs/monitor.log',
            maxBytes=1*1024*1024,  # 1MB
            backupCount=3
        )
        fh.setFormatter(logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'  # Simplified format
        ))
        fh.setLevel(logging.WARNING)  # Only log warnings and above to file
        self.logger.addHandler(fh)
        
        # Add stream handler with higher threshold
        sh = logging.StreamHandler()
        sh.setLevel(logging.ERROR)  # Only show errors in console
        sh.setFormatter(logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'  # Simplified format
        ))
        self.logger.addHandler(sh)
        
        # Remove any existing handlers to prevent duplicate logging
        self.logger.handlers = []
        self.logger.addHandler(fh)
        self.logger.addHandler(sh)
        
        self.logger.warning("Starting log monitoring with optimized settings")
        
        # Initialize metrics storage
        self.metrics = defaultdict(lambda: {
            'error_count': 0,
            'warning_count': 0,
            'info_count': 0,
            'debug_count': 0,
            'total_lines': 0,
            'file_size': 0,
            'last_modified': None,
            'rotation_count': 0,
            'error_rate': 0.0,
            'warning_rate': 0.0,
            'growth_rate': 0.0,
            'last_size': 0,
            'component': 'default',
            'last_cleanup': None,
            'alert_history': [],
            'growth_history': [],
            'last_rotation': None,
            'avg_growth_rate': 0.0,
            'peak_growth_rate': 0.0,
            'trend_analysis': {
                'growth_trend': 0.0,
                'error_trend': 0.0,
                'warning_trend': 0.0,
                'size_trend': 0.0
            }
        })
        
        # Load existing metrics if available
        if self.metrics_file.exists():
            try:
                with open(self.metrics_file, 'r') as f:
                    existing_metrics = json.load(f)
                    for filename, metrics in existing_metrics.items():
                        if 'alert_history' not in metrics:
                            metrics['alert_history'] = []
                        self.metrics[filename].update(metrics)
            except Exception as e:
                self.logger.error(f"Error loading existing metrics: {str(e)}")
                self.logger.exception(e)  # Log the full traceback

    def _get_component_type(self, filename):
        """Determine component type from filename"""
        if 'monitor' in filename:
            return 'monitor'
        elif 'launchd' in filename:
            return 'launchd'
        elif 'extract_loops' in filename:
            return 'extract_loops'
        elif 'loop_dashboard' in filename:
            return 'loop_dashboard'
        elif 'feedback' in filename:
            return 'feedback'
        elif 'assistant' in filename:
            return 'assistant'
        return 'default'

    def _get_thresholds(self, component):
        """Get thresholds for a specific component"""
        return self.thresholds.get(component, self.thresholds['default'])

    def _update_growth_metrics(self, filename: str, current_size: int, metrics: Dict):
        """Update growth-related metrics for a log file"""
        if metrics['last_size'] > 0:
            growth_rate = (current_size - metrics['last_size']) / metrics['last_size']
            metrics['growth_rate'] = growth_rate
            
            # Update growth history
            metrics['growth_history'].append({
                'timestamp': datetime.now().isoformat(),
                'rate': growth_rate,
                'size': current_size
            })
            
            # Keep only last 100 growth records
            metrics['growth_history'] = metrics['growth_history'][-100:]
            
            # Calculate average and peak growth rates
            if metrics['growth_history']:
                rates = [h['rate'] for h in metrics['growth_history']]
                metrics['avg_growth_rate'] = sum(rates) / len(rates)
                metrics['peak_growth_rate'] = max(rates)
        
        metrics['last_size'] = current_size

    def collect_metrics(self):
        """Collect metrics from all log files"""
        current_time = datetime.now()
        
        for log_file in self.log_dir.glob('*.log*'):
            try:
                # Basic file stats
                stats = log_file.stat()
                current_size = stats.st_size
                last_modified = datetime.fromtimestamp(stats.st_mtime)
                
                # Initialize or update metrics
                metrics = self.metrics[log_file.name]
                metrics['file_size'] = current_size
                metrics['last_modified'] = last_modified.isoformat()
                metrics['component'] = self._get_component_type(log_file.name)
                
                # Update growth metrics
                self._update_growth_metrics(log_file.name, current_size, metrics)
                
                # Count log levels and total lines
                with open(log_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    metrics['error_count'] = content.count('ERROR')
                    metrics['warning_count'] = content.count('WARNING')
                    metrics['info_count'] = content.count('INFO')
                    metrics['debug_count'] = content.count('DEBUG')
                    metrics['total_lines'] = len(content.splitlines())
                
                # Calculate rates
                if metrics['total_lines'] > 0:
                    metrics['error_rate'] = metrics['error_count'] / metrics['total_lines']
                    metrics['warning_rate'] = metrics['warning_count'] / metrics['total_lines']
                
                # Store historical data
                self.historical_metrics[log_file.name].append({
                    'timestamp': current_time.isoformat(),
                    'error_rate': metrics['error_rate'],
                    'warning_rate': metrics['warning_rate'],
                    'file_size': current_size,
                    'total_lines': metrics['total_lines'],
                    'growth_rate': metrics['growth_rate']
                })
                
                # Clean up old historical data
                cutoff_date = current_time - timedelta(days=self.metrics_retention_days)
                self.historical_metrics[log_file.name] = [
                    m for m in self.historical_metrics[log_file.name]
                    if datetime.fromisoformat(m['timestamp']) > cutoff_date
                ]
                
                # Only log significant changes
                if metrics['error_count'] > 0:
                    self.logger.warning(f"Errors in {log_file.name}: {metrics['error_count']}")
                elif metrics['warning_count'] > 0 and metrics['warning_rate'] > 0.1:  # Only log if warning rate > 10%
                    self.logger.warning(f"Warnings in {log_file.name}: {metrics['warning_count']}")
                elif metrics['growth_rate'] > self.thresholds[metrics['component']]['growth_rate']:
                    self.logger.warning(f"Rapid growth in {log_file.name} ({metrics['component']}): {metrics['growth_rate']:.2%} > {self.thresholds[metrics['component']]['growth_rate']:.2%}")
                
            except Exception as e:
                self.logger.error(f"Error collecting metrics for {log_file}: {str(e)}")
                self.logger.exception(e)  # Log the full traceback
        
        self._save_metrics()
        self._generate_visualizations()

    def _save_metrics(self):
        """Save metrics to JSON file"""
        try:
            # Convert metrics to serializable format
            serializable_metrics = {}
            for filename, metrics in self.metrics.items():
                serializable_metrics[filename] = {
                    'error_count': metrics['error_count'],
                    'warning_count': metrics['warning_count'],
                    'info_count': metrics['info_count'],
                    'debug_count': metrics['debug_count'],
                    'total_lines': metrics['total_lines'],
                    'file_size': metrics['file_size'],
                    'last_modified': metrics['last_modified'],
                    'rotation_count': metrics['rotation_count'],
                    'error_rate': metrics['error_rate'],
                    'warning_rate': metrics['warning_rate'],
                    'growth_rate': metrics['growth_rate'],
                    'last_size': metrics['last_size'],
                    'component': metrics['component'],
                    'last_cleanup': metrics['last_cleanup'],
                    'alert_history': metrics['alert_history'],
                    'growth_history': metrics['growth_history'],
                    'last_rotation': metrics['last_rotation'],
                    'avg_growth_rate': metrics['avg_growth_rate'],
                    'peak_growth_rate': metrics['peak_growth_rate'],
                    'trend_analysis': metrics['trend_analysis']
                }
            
            with open(self.metrics_file, 'w') as f:
                json.dump(serializable_metrics, f, indent=2)
        except Exception as e:
            self.logger.error(f"Error saving metrics: {str(e)}")
            self.logger.exception(e)  # Log the full traceback

    def _analyze_trends(self, filename: str, metrics: Dict):
        """Analyze trends in log metrics"""
        if not self.historical_metrics[filename]:
            return
            
        # Convert to DataFrame for analysis
        df = pd.DataFrame(self.historical_metrics[filename])
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df.set_index('timestamp', inplace=True)
        
        # Get component-specific trend window
        component = metrics['component']
        trend_window = self.thresholds[component]['trend_window']
        window_start = datetime.now() - timedelta(hours=trend_window)
        
        # Filter data for trend window
        recent_data = df[df.index >= window_start]
        
        if len(recent_data) < 2:
            return
            
        # Calculate trends using linear regression
        for metric in ['growth_rate', 'error_rate', 'warning_rate', 'file_size']:
            if metric in recent_data.columns:
                x = np.arange(len(recent_data))
                y = recent_data[metric].values
                slope = np.polyfit(x, y, 1)[0]
                metrics['trend_analysis'][f'{metric}_trend'] = slope

    def _check_alerts(self) -> List[Dict]:
        """Check for alert conditions and return list of alert messages with severity"""
        alerts = []
        current_time = datetime.now()
        
        for filename, metrics in self.metrics.items():
            component = metrics['component']
            thresholds = self._get_thresholds(component)
            
            # Check if we're in cooldown period
            if current_time.timestamp() - self.last_alert_time[filename] < thresholds['alert_cooldown']:
                continue
            
            # Analyze trends
            self._analyze_trends(filename, metrics)
            
            # Check error rate
            if metrics['error_rate'] > thresholds['error_rate']:
                severity = AlertSeverity.ERROR if metrics['error_rate'] > thresholds['error_rate'] * 2 else AlertSeverity.WARNING
                alerts.append({
                    'severity': severity,
                    'message': f"High error rate in {filename} ({component}): {metrics['error_rate']:.2%} > {thresholds['error_rate']:.2%}",
                    'component': component,
                    'metric': 'error_rate',
                    'value': metrics['error_rate'],
                    'threshold': thresholds['error_rate']
                })
            
            # Check warning rate
            if metrics['warning_rate'] > thresholds['warning_rate']:
                severity = AlertSeverity.WARNING
                alerts.append({
                    'severity': severity,
                    'message': f"High warning rate in {filename} ({component}): {metrics['warning_rate']:.2%} > {thresholds['warning_rate']:.2%}",
                    'component': component,
                    'metric': 'warning_rate',
                    'value': metrics['warning_rate'],
                    'threshold': thresholds['warning_rate']
                })
            
            # Check file size
            max_size_mb = thresholds['max_size_mb']
            if metrics['file_size'] > max_size_mb * 1024 * 1024:
                severity = AlertSeverity.WARNING
                alerts.append({
                    'severity': severity,
                    'message': f"Large file size in {filename} ({component}): {metrics['file_size'] / (1024*1024):.1f}MB > {max_size_mb}MB",
                    'component': component,
                    'metric': 'file_size',
                    'value': metrics['file_size'],
                    'threshold': max_size_mb * 1024 * 1024
                })
            
            # Check growth rate
            if metrics['growth_rate'] > thresholds['growth_rate']:
                severity = AlertSeverity.WARNING
                alerts.append({
                    'severity': severity,
                    'message': f"Rapid growth in {filename} ({component}): {metrics['growth_rate']:.2%} > {thresholds['growth_rate']:.2%}",
                    'component': component,
                    'metric': 'growth_rate',
                    'value': metrics['growth_rate'],
                    'threshold': thresholds['growth_rate']
                })
            
            # Update alert history
            if alerts:
                self.last_alert_time[filename] = current_time.timestamp()
                # Initialize alert_history if it doesn't exist
                if 'alert_history' not in metrics:
                    metrics['alert_history'] = []
                metrics['alert_history'].append({
                    'timestamp': current_time.isoformat(),
                    'alerts': alerts.copy()
                })
                # Keep only last 100 alerts
                metrics['alert_history'] = metrics['alert_history'][-100:]
        
        return alerts

    def _generate_visualizations(self):
        """Generate enhanced visualizations for metrics"""
        try:
            viz_dir = Path('logs/visualizations')
            viz_dir.mkdir(exist_ok=True)
            
            # Convert metrics to DataFrame
            df = pd.DataFrame.from_dict(self.metrics, orient='index')
            
            # Generate component-specific dashboards
            for component in set(df['component']):
                component_files = df[df['component'] == component].index
                
                # Create component dashboard
                fig, axes = plt.subplots(2, 2, figsize=(15, 10))
                fig.suptitle(f'Component Dashboard: {component}')
                
                # Error rates
                axes[0, 0].bar(component_files, df.loc[component_files, 'error_rate'])
                axes[0, 0].set_title('Error Rates')
                axes[0, 0].tick_params(axis='x', rotation=45)
                
                # File sizes
                axes[0, 1].bar(component_files, df.loc[component_files, 'file_size'] / (1024*1024))
                axes[0, 1].set_title('File Sizes (MB)')
                axes[0, 1].tick_params(axis='x', rotation=45)
                
                # Growth rates
                axes[1, 0].bar(component_files, df.loc[component_files, 'growth_rate'])
                axes[1, 0].set_title('Growth Rates')
                axes[1, 0].tick_params(axis='x', rotation=45)
                
                # Trend analysis
                trend_data = []
                for file in component_files:
                    if 'trend_analysis' in df.loc[file]:
                        trend_data.append(df.loc[file, 'trend_analysis'])
                
                if trend_data:
                    trend_df = pd.DataFrame(trend_data)
                    axes[1, 1].plot(trend_df.index, trend_df['growth_trend'], label='Growth')
                    axes[1, 1].plot(trend_df.index, trend_df['error_trend'], label='Error')
                    axes[1, 1].set_title('Trend Analysis')
                    axes[1, 1].legend()
                
                plt.tight_layout()
                plt.savefig(viz_dir / f'dashboard_{component}.png')
                plt.close(fig)  # Explicitly close the figure
            
            # Generate alert summary
            alert_counts = defaultdict(int)
            for filename, metrics in self.metrics.items():
                for alert in metrics.get('alert_history', []):
                    for a in alert.get('alerts', []):
                        alert_counts[a['severity'].name] += 1
            
            if alert_counts:
                fig = plt.figure(figsize=(10, 6))
                plt.bar(alert_counts.keys(), alert_counts.values())
                plt.title('Alert Distribution by Severity')
                plt.xticks(rotation=45)
                plt.tight_layout()
                plt.savefig(viz_dir / 'alert_distribution.png')
                plt.close(fig)  # Explicitly close the figure
            
        except Exception as e:
            self.logger.error(f"Error generating visualizations: {str(e)}")
            self.logger.exception(e)  # Log the full traceback

    def _generate_alert_report(self):
        """Generate a detailed report of recent alerts."""
        try:
            report = []
            report.append("=== Alert Report ===\n")
            report.append(f"Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            
            # Get alerts from all components
            all_alerts = []
            for filename, metrics in self.metrics.items():
                try:
                    if not isinstance(metrics, dict):
                        self.logger.warning(f"Invalid metrics format for {filename}")
                        continue
                    
                    alert_history = metrics.get('alert_history', [])
                    if not alert_history:
                        continue
                    
                    for alert_entry in alert_history:
                        try:
                            if not isinstance(alert_entry, dict):
                                continue
                            
                            alerts = alert_entry.get('alerts', [])
                            if not alerts:
                                continue
                            
                            timestamp = alert_entry.get('timestamp', 'unknown')
                            for alert in alerts:
                                if not isinstance(alert, dict):
                                    continue
                                
                                all_alerts.append({
                                    'timestamp': timestamp,
                                    'component': alert.get('component', 'unknown'),
                                    'severity': alert.get('severity', 'unknown'),
                                    'message': alert.get('message', 'unknown')
                                })
                        except Exception as e:
                            self.logger.warning(f"Error processing alert entry: {str(e)}")
                            continue
                        
                except Exception as e:
                    self.logger.warning(f"Error processing metrics for {filename}: {str(e)}")
                    continue
            
            # Sort alerts by timestamp
            try:
                all_alerts.sort(key=lambda x: x['timestamp'], reverse=True)
            except Exception as e:
                self.logger.warning(f"Error sorting alerts: {str(e)}")
            
            # Get last 5 alerts (or fewer if not enough)
            recent_alerts = all_alerts[:5] if all_alerts else []
            
            if recent_alerts:
                report.append("\nRecent Alerts:")
                for alert in recent_alerts:
                    report.append(f"\n[{alert['timestamp']}] {alert['severity']} - {alert['component']}")
                    report.append(f"Message: {alert['message']}")
            else:
                report.append("\nNo recent alerts to report.")
            
            # Add summary statistics
            report.append("\nAlert Statistics:")
            severity_counts = defaultdict(int)
            component_counts = defaultdict(int)
            
            for alert in all_alerts:
                try:
                    severity_counts[alert['severity']] += 1
                    component_counts[alert['component']] += 1
                except Exception as e:
                    self.logger.warning(f"Error counting alert statistics: {str(e)}")
                    continue
            
            report.append("\nBy Severity:")
            for severity, count in severity_counts.items():
                report.append(f"- {severity}: {count}")
            
            report.append("\nBy Component:")
            for component, count in component_counts.items():
                report.append(f"- {component}: {count}")
            
            return "\n".join(report)
            
        except Exception as e:
            error_msg = f"Error generating alert report: {str(e)}"
            self.logger.error(error_msg)
            self.logger.exception(e)  # Log the full traceback
            return f"Error generating alert report: {error_msg}"

    def _standardize_session(self):
        """Standardize the current session's folder structure."""
        try:
            from scripts.standardize_session import create_structure, move_logs, move_metrics
            create_structure()
            move_logs()
            move_metrics()
            self.logger.info("Session structure standardized")
        except Exception as e:
            self.logger.error(f"Error standardizing session: {str(e)}")

    def _cleanup_old_logs(self):
        """Clean up old log files based on component-specific retention policies"""
        current_time = datetime.now()
        
        for log_file in self.log_dir.glob('*.log*'):
            try:
                component = self._get_component_type(log_file.name)
                max_age = timedelta(days=self.thresholds[component]['max_age_days'])
                
                # Skip if file is too new
                if datetime.fromtimestamp(log_file.stat().st_mtime) > current_time - max_age:
                    continue
                
                # Archive old logs instead of deleting
                archive_dir = self.log_dir / 'archive'
                archive_dir.mkdir(exist_ok=True)
                
                # Create dated archive subdirectory
                date_str = current_time.strftime('%Y%m%d')
                date_dir = archive_dir / date_str
                date_dir.mkdir(exist_ok=True)
                
                # Move file to archive
                shutil.move(str(log_file), str(date_dir / log_file.name))
                self.logger.info(f"Archived old log file: {log_file.name}")
                
            except Exception as e:
                self.logger.error(f"Error cleaning up {log_file}: {str(e)}")

    def _rotate_large_logs(self):
        """Rotate log files that exceed size thresholds"""
        for log_file in self.log_dir.glob('*.log'):
            try:
                component = self._get_component_type(log_file.name)
                thresholds = self._get_thresholds(component)
                max_size = thresholds['rotation_size_mb'] * 1024 * 1024
                
                if log_file.stat().st_size > max_size:
                    # Create backup with timestamp
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    backup_name = f"{log_file.stem}_{timestamp}{log_file.suffix}"
                    backup_path = log_file.parent / backup_name
                    
                    # Move current file to backup
                    shutil.move(str(log_file), str(backup_path))
                    
                    # Create new empty log file
                    log_file.touch()
                    
                    # Update metrics
                    metrics = self.metrics[log_file.name]
                    metrics['rotation_count'] += 1
                    metrics['last_rotation'] = datetime.now().isoformat()
                    
                    self.logger.info(f"Rotated large log file: {log_file.name}")
                    
                    # Clean up old backups
                    self._cleanup_old_backups(log_file, thresholds['backup_count'])
                    
            except Exception as e:
                self.logger.error(f"Error rotating {log_file}: {str(e)}")

    def _cleanup_old_backups(self, log_file: Path, max_backups: int):
        """Clean up old backup files keeping only the specified number"""
        try:
            # Get all backup files for this log
            backup_pattern = f"{log_file.stem}_*{log_file.suffix}"
            backups = sorted(
                log_file.parent.glob(backup_pattern),
                key=lambda x: x.stat().st_mtime,
                reverse=True
            )
            
            # Remove excess backups
            for old_backup in backups[max_backups:]:
                old_backup.unlink()
                self.logger.info(f"Removed old backup: {old_backup.name}")
                
        except Exception as e:
            self.logger.error(f"Error cleaning up backups for {log_file}: {str(e)}")

    def run(self, interval=600):  # 10 minutes default
        """Run the log monitor continuously"""
        try:
            # Register standardization on exit
            atexit.register(self._standardize_session)
            
            while True:
                try:
                    self._cleanup_old_logs()
                    self._rotate_large_logs()
                    self.collect_metrics()
                    
                    alerts = self._check_alerts()
                    if alerts:
                        self.logger.warning("Alerts detected:\n" + "\n".join([a['message'] for a in alerts]))
                        # Generate and save detailed report
                        report = self._generate_alert_report()
                        if report:
                            report_file = self.log_dir / 'alert_report.txt'
                            with open(report_file, 'w') as f:
                                f.write(report)
                    
                    time.sleep(interval)
                    
                except Exception as e:
                    self.logger.error(f"Error in monitoring cycle: {str(e)}")
                    self.logger.exception(e)
                    time.sleep(interval)  # Sleep before retrying
                
        except KeyboardInterrupt:
            self.logger.info("Log monitoring stopped by user")
        except Exception as e:
            self.logger.error(f"Unexpected error in log monitor: {str(e)}")
            self._standardize_session()  # Ensure standardization even on error
            raise

if __name__ == '__main__':
    try:
        monitor = LogMonitor()
        monitor.run()
    except KeyboardInterrupt:
        print("\nLog monitor stopped by user")
    except Exception as e:
        print(f"Fatal error: {str(e)}")
        sys.exit(1) 