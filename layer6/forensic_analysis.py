# layer6/forensic_analysis.py
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import pandas as pd
import matplotlib.pyplot as plt

class ForensicAnalyzer:
    """
    Layer 6: Forensic Analysis & Reporting
    - Black Box Recorder: Logs every transaction in JSONL format
    - Daily PDF Reports: Metrics like ISR, Sanitization Efficiency, etc.
    """
    def __init__(self, log_dir: str = "logs", report_dir: str = "reports"):
        self.log_dir = log_dir
        self.report_dir = report_dir
        self.log_file = os.path.join(self.log_dir, "forensic_logs.jsonl")
        
        # Create directories
        os.makedirs(self.log_dir, exist_ok=True)
        os.makedirs(self.report_dir, exist_ok=True)

    def record_transaction(self, transaction: Dict[str, Any]) -> None:
        """
        Append a full transaction log (one JSON line)
        """
        transaction.setdefault('timestamp', datetime.utcnow().isoformat())
        transaction.setdefault('user_id', 'anonymous')
        
        with open(self.log_file, 'a', encoding='utf-8') as f:
            json.dump(transaction, f)
            f.write('\n')

    def _load_logs(self) -> List[Dict[str, Any]]:
        """Load all logs from JSONL"""
        if not os.path.exists(self.log_file):
            return []
        
        logs = []
        with open(self.log_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        logs.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue  # Skip corrupted lines
        return logs

    def generate_daily_report(self, date: Optional[datetime] = None) -> str:
        """
        Generate a daily PDF report for the given date (default: yesterday)
        Returns path to the PDF
        """
        if date is None:
            date = datetime.utcnow().date() - timedelta(days=1)
        else:
            date = date.date()

        start_time = datetime.combine(date, datetime.min.time())
        end_time = start_time + timedelta(days=1)

        logs = self._load_logs()
        daily_logs = [
            log for log in logs
            if start_time <= datetime.fromisoformat(log.get('timestamp', '').replace('Z', '+00:00')).replace(tzinfo=None) < end_time
        ]

        if not daily_logs:
            raise ValueError(f"No logs found for {date.strftime('%Y-%m-%d')}")

        df = pd.DataFrame(daily_logs)

        # Metrics
        total_requests = len(df)
        detected_attacks = len(df[df.get('layer2_is_suspicious', False) == True])
        successful_attacks = len(df[(df.get('layer2_is_suspicious', False) == True) & (df.get('was_blocked', True) == False)])
        sanitizations = len(df[df['layer1_flags'].apply(lambda x: len(x or []) > 0)])
        pii_prevented = len(df[df['layer4_issues'].apply(lambda x: len(x or []) > 0)])

        isr = (successful_attacks / detected_attacks * 100) if detected_attacks > 0 else 0.0
        sanitization_efficiency = (sanitizations / total_requests * 100) if total_requests > 0 else 0.0

        # Generate PDF
        fig, ax = plt.subplots(figsize=(10, 7))
        ax.axis('off')
        ax.text(0.5, 0.95, f"PromptGuard Daily Forensic Report\n{date.strftime('%Y-%m-%d')}",
                ha='center', va='center', fontsize=18, fontweight='bold')

        metrics = {
            'Metric': [
                'Total Requests',
                'Detected Attacks',
                'Successful Attacks',
                'Injection Success Rate (ISR)',
                'Sanitizations Applied',
                'Sanitization Efficiency',
                'PII/Leaks Prevented'
            ],
            'Value': [
                total_requests,
                detected_attacks,
                successful_attacks,
                f"{isr:.2f}%",
                sanitizations,
                f"{sanitization_efficiency:.2f}%",
                pii_prevented
            ]
        }
        metrics_df = pd.DataFrame(metrics)
        table = ax.table(cellText=metrics_df.values,
                         colLabels=metrics_df.columns,
                         loc='center',
                         cellLoc='center')
        table.auto_set_font_size(False)
        table.set_fontsize(12)
        table.scale(1.3, 2.5)

        pdf_path = os.path.join(self.report_dir, f"daily_report_{date.strftime('%Y-%m-%d')}.pdf")
        plt.savefig(pdf_path, bbox_inches='tight', dpi=200)
        plt.close(fig)

        return pdf_path

# Global instance
analyzer = ForensicAnalyzer()

# Convenience functions
def record_transaction(transaction: Dict[str, Any]):
    analyzer.record_transaction(transaction)

def generate_daily_report(date: Optional[datetime] = None) -> str:
    return analyzer.generate_daily_report(date)