from pathlib import Path
from typing import Optional

import openai
import pandas as pd
import streamlit as st
from gpt_supervised.config import OPENAI_API_KEY

from src.system.path_config import EMAIL_LOG_PATH

openai.api_key = OPENAI_API_KEY


class CursorDashboard:
    """Dashboard for Cursor-related analytics and metrics."""

    def __init__(self):
        """Initialize the dashboard."""
        self.sessions_dir = Path(__file__).parent.parent / "sessions"
        self.metrics_path = self.sessions_dir / "2025-05-23" / "metrics" / "metrics.json"
        self.roadmap_path = self.sessions_dir.parent / "System" / "Reference" / "ea_roadmap.md"
        self.email_log_path = EMAIL_LOG_PATH

    def load_metrics(self) -> pd.DataFrame:
        """Aggregate session metadata from markdown files in the sessions directory."""
        import json
        import re
        import textwrap

        import yaml

        session_rows = []
        list_fields = {"accomplishments", "files_modified"}
        expected_fields = {
            "topic",
            "complexity",
            "success",
            "accomplishments",
            "files_modified",
            "priority",
            "impact",
            "effort",
            "duration",
        }
        # Walk through session directories
        for date_dir in self.sessions_dir.glob("*"):
            if not date_dir.is_dir():
                continue
            cursor_dir = date_dir / "cursor"
            if not cursor_dir.exists():
                continue
            for md_file in cursor_dir.glob("*.md"):
                try:
                    content = md_file.read_text()
                    # Extract YAML frontmatter
                    match = re.match(r"---\n(.*?)---", content, re.DOTALL)
                    if not match:
                        continue  # skip if no YAML frontmatter
                    frontmatter = textwrap.dedent(match.group(1)).strip()
                    meta = None
                    # Try parsing as YAML first
                    try:
                        meta = yaml.safe_load(frontmatter)
                    except Exception:
                        pass
                    # If YAML returns a string, try parsing as JSON
                    if isinstance(meta, str):
                        try:
                            meta = json.loads(meta.strip())
                        except Exception:
                            continue  # skip if not valid JSON
                    # If YAML fails, try JSON directly
                    if meta is None:
                        try:
                            meta = json.loads(frontmatter)
                        except Exception:
                            continue  # skip if not valid JSON
                    # Only add if meta is a dict, all keys are strings, and all values are scalars or allowed lists
                    # AND at least one expected field is present
                    if (
                        isinstance(meta, dict)
                        and any(f in meta for f in expected_fields)
                        and all(isinstance(k, str) for k in meta.keys())
                        and all(
                            (
                                isinstance(v, (str, int, float, bool, type(None)))
                                or (k in list_fields and isinstance(v, list))
                                or isinstance(v, dict)  # allow dicts for extra fields
                            )
                            for k, v in meta.items()
                        )
                    ):
                        session_rows.append(meta)
                    else:
                        continue  # skip if not a dict with string keys and valid values or missing expected fields
                except Exception:
                    continue
        # Build DataFrame
        if session_rows:
            df = pd.DataFrame(session_rows)
        else:
            # Empty DataFrame with expected columns
            df = pd.DataFrame(
                columns=[
                    "topic",
                    "complexity",
                    "success",
                    "accomplishments",
                    "files_modified",
                    "priority",
                    "impact",
                    "effort",
                    "duration",
                ]
            )
        # Fill required fields with defaults if missing
        defaults = {
            "priority": "medium",
            "impact": "medium",
            "effort": "medium",
            "complexity": "medium",
            "success": True,
            "accomplishments": [],
            "files_modified": [],
            "duration": "",
        }
        for col, val in defaults.items():
            if col not in df.columns:
                df[col] = [val] * len(df)
            else:
                if col in ["accomplishments", "files_modified"]:
                    df[col] = df[col].apply(
                        lambda x: val if (x is None or not isinstance(x, list)) else x
                    )
                else:
                    df[col] = df[col].apply(lambda x: val if pd.isna(x) else x)
        return df

    def display_analytics(self) -> None:
        """Display analytics for the current session."""
        metrics = self.load_metrics()
        if metrics.empty:
            st.warning("No metrics available.")
            return

        row = metrics.iloc[0]

        # Handle accomplishments
        accomplishments = row.get("accomplishments", [])
        if not isinstance(accomplishments, list):
            if pd.isna(accomplishments) or accomplishments is None:
                accomplishments = []
            else:
                accomplishments = [accomplishments]

        st.subheader("Accomplishments")
        if accomplishments:
            for acc in accomplishments:
                st.write(f"- {acc}")
        else:
            st.write("No accomplishments recorded.")

        # Handle files_modified
        files_modified = row.get("files_modified", [])
        if not isinstance(files_modified, list):
            if pd.isna(files_modified) or files_modified is None:
                files_modified = []
            else:
                files_modified = [files_modified]

        st.subheader("Files Modified")
        if files_modified:
            for file in files_modified:
                st.write(f"- {file}")
        else:
            st.write("No files modified.")

        # Display other metrics
        st.subheader("Other Metrics")
        for column in metrics.columns:
            if column not in ["accomplishments", "files_modified"]:
                st.write(f"{column}: {row[column]}")

        # Handle invalid metadata
        try:
            st.dataframe(metrics)
        except Exception as e:
            st.error(f"Error displaying metrics: {e}")

    def _display_overall_metrics(self, df: pd.DataFrame) -> None:
        """Display overall system metrics."""
        st.subheader("System Overview")
        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric("Total Log Files", len(df))
            st.metric("Total Errors", df["error_count"].sum())
            st.metric("Error Rate", f"{df['error_rate'].mean():.2%}")

        with col2:
            st.metric("Total Warnings", df["warning_count"].sum())
            st.metric("Total Info Messages", df["info_count"].sum())
            st.metric("Warning Rate", f"{df['warning_rate'].mean():.2%}")

        with col3:
            st.metric("Total Debug Messages", df["debug_count"].sum())
            st.metric("Total Log Size (MB)", f"{df['file_size'].sum() / (1024*1024):.2f}")
            st.metric("Avg Growth Rate", f"{df['growth_rate'].mean():.2%}")

    def _display_component_metrics(self, df: pd.DataFrame, components: list) -> None:
        """Display metrics for each component."""
        st.subheader("Component Metrics")
        for component in components:
            st.write(f"### {component.title()}")
            component_df = df[df["component"] == component]

            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Files", len(component_df))
                st.metric("Errors", component_df["error_count"].sum())
            with col2:
                st.metric("Warnings", component_df["warning_count"].sum())
                st.metric("Info Messages", component_df["info_count"].sum())
            with col3:
                st.metric(
                    "Total Size (MB)",
                    f"{component_df['file_size'].sum() / (1024*1024):.2f}",
                )
                st.metric("Growth Rate", f"{component_df['growth_rate'].mean():.2%}")

            col1, col2 = st.columns(2)
            with col1:
                st.bar_chart(component_df["file_size"] / (1024 * 1024), use_container_width=True)
                st.caption("File Sizes (MB)")
            with col2:
                st.line_chart(
                    component_df[["error_count", "warning_count", "info_count"]],
                    use_container_width=True,
                )
                st.caption("Message Counts")

    def _display_log_details(self, df: pd.DataFrame) -> None:
        """Display detailed log data."""
        st.subheader("Log File Details")
        st.dataframe(
            df[
                [
                    "error_count",
                    "warning_count",
                    "info_count",
                    "debug_count",
                    "file_size",
                    "error_rate",
                    "warning_rate",
                    "growth_rate",
                    "component",
                    "last_modified",
                ]
            ]
        )

    def display_roadmap(self) -> None:
        """Display the roadmap."""
        st.header("Roadmap")
        if self.roadmap_path.exists():
            content = self.roadmap_path.read_text()
            st.markdown(content)
        else:
            st.error("Roadmap file not found!")

    def display_inbox(self) -> None:
        """Display the email inbox."""
        st.title("📧 Email Inbox & Flow")
        emails = self._load_emails()
        self._display_recent_emails(emails)
        self._display_email_volume(emails)

    def _load_emails(self) -> list[dict[str, str]]:
        """Load emails from the log file."""
        emails: list[dict[str, str]] = []
        if not Path(self.email_log_path).exists():
            st.warning("No email log found.")
            return emails

        with open(self.email_log_path) as f:
            lines = f.readlines()

        subject: Optional[str] = None
        sender: Optional[str] = None
        date: Optional[str] = None
        link: Optional[str] = None

        for line in lines:
            if line.startswith("### 🔹 "):
                if subject and sender and date and link:
                    emails.append(
                        {
                            "subject": subject,
                            "sender": sender,
                            "date": date,
                            "link": link,
                        }
                    )
                try:
                    subject_part = line.split("[")[1].split("]")[0]
                    link_part = line.split("(")[1].split(")")[0]
                    subject = subject_part
                    link = link_part
                except Exception:
                    subject, link = None, None
                sender, date = None, None
            elif line.strip().startswith("- **From**:"):
                sender = line.split(":", 1)[1].strip()
            elif line.strip().startswith("- **Date**:"):
                date = line.split(":", 1)[1].strip()

        if subject and sender and date and link:
            emails.append({"subject": subject, "sender": sender, "date": date, "link": link})

        return emails

    def _display_recent_emails(self, emails: list[dict[str, str]]) -> None:
        """Display recent emails in a table."""
        st.subheader("Recent Emails")
        if not emails:
            st.info("No emails to display.")
            return

        df_emails = pd.DataFrame(emails)
        df_emails["date_parsed"] = pd.to_datetime(df_emails["date"], errors="coerce")
        df_emails = df_emails.sort_values("date_parsed", ascending=False)
        show_df = df_emails.head(20)[["date_parsed", "subject", "sender", "link"]]
        show_df = show_df.rename(
            columns={
                "date_parsed": "Date",
                "subject": "Subject",
                "sender": "Sender",
                "link": "Gmail Link",
            }
        )

        def make_link(url: str) -> str:
            return f"[View]({url})"

        show_df["Gmail Link"] = show_df["Gmail Link"].apply(make_link)
        st.write(show_df.to_markdown(index=False), unsafe_allow_html=True)

    def _display_email_volume(self, emails: list[dict[str, str]]) -> None:
        """Display email volume chart."""
        st.subheader("Email Volume (per hour, last 48h)")
        if not emails:
            return

        df_emails = pd.DataFrame(emails)
        df_emails["date_parsed"] = pd.to_datetime(df_emails["date"], errors="coerce")
        now = pd.Timestamp.now()
        last_48h = now - pd.Timedelta(hours=48)
        mask = (df_emails["date_parsed"] >= last_48h) & (df_emails["date_parsed"] <= now)
        df_48h = df_emails[mask]
        if not df_48h.empty:
            df_48h["hour"] = df_48h["date_parsed"].dt.floor("h")
            hourly_counts = df_48h.groupby("hour").size().reset_index(name="Emails")
            hourly_counts = hourly_counts.set_index("hour")
            st.line_chart(hourly_counts)


def main():
    """Main function to run the dashboard."""
    st.set_page_config(page_title="EA Assistant Dashboard", layout="wide")
    st.title("EA Assistant Dashboard")
    st.session_state["page_title"] = "EA Assistant Dashboard"
    st.session_state["page_icon"] = "🤖"
    st.session_state["layout"] = "wide"

    # Initialize session state elements
    if "elements" not in st.session_state:
        st.session_state["elements"] = {}

    # Add test elements
    st.session_state["elements"]["Test Button"] = st.button("Test Button")
    st.session_state["elements"]["Test Input"] = st.text_input("Test Input")
    st.session_state["elements"]["Test Dropdown"] = st.selectbox(
        "Test Dropdown", ["Option 1", "Option 2", "Option 3"]
    )

    # Initialize metrics with test data
    if "metrics" not in st.session_state:
        st.session_state["metrics"] = {"extract_loops.log": {"error_count": 0, "log_size": 738}}

    # Initialize charts as a list
    if "charts" not in st.session_state:
        st.session_state["charts"] = []

    dashboard = CursorDashboard()

    # Navigation
    page = st.sidebar.selectbox("Navigation", ["Analytics", "Roadmap", "Inbox"])

    if page == "Analytics":
        dashboard.display_analytics()
    elif page == "Roadmap":
        dashboard.display_roadmap()
    elif page == "Inbox":
        dashboard.display_inbox()


if __name__ == "__main__":
    main()
