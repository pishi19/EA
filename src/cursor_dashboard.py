import json
from pathlib import Path
from typing import Optional

import openai
import pandas as pd
import streamlit as st
from gpt_supervised.config import OPENAI_API_KEY

openai.api_key = OPENAI_API_KEY


def main() -> None:
    st.set_page_config(page_title="Cursor Dashboard", layout="wide")

    # Store page config in session state for testing
    st.session_state["page_title"] = "Cursor Dashboard"
    st.session_state["page_icon"] = "🤖"
    st.session_state["layout"] = "wide"

    # Sidebar navigation
    st.sidebar.title("Navigation")
    page = st.sidebar.radio("Go to", ["Roadmap", "Ora Chat", "Analytics", "Inbox"])

    if page == "Analytics":
        st.header("Analytics Dashboard")

        # Load metrics from file
        metrics_path = Path(__file__).parent.parent / "sessions/2025-05-23/metrics/metrics.json"
        if metrics_path.exists():
            with open(metrics_path) as f:
                log_data = json.load(f)
        else:
            st.error("Metrics file not found!")
            return

        # Convert to DataFrame
        df = pd.DataFrame.from_dict(log_data, orient="index")

        # Ensure component column is string type
        df["component"] = df["component"].astype(str)

        # Group by component
        components = df["component"].unique()

        # Overall metrics
        st.subheader("System Overview")
        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric("Total Log Files", len(log_data))
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

        # Component-specific metrics
        st.subheader("Component Metrics")
        for component in components:
            st.write(f"### {component.title()}")
            component_df = df[df["component"] == component]

            # Component metrics
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Files", len(component_df))
                st.metric("Errors", component_df["error_count"].sum())
            with col2:
                st.metric("Warnings", component_df["warning_count"].sum())
                st.metric("Info Messages", component_df["info_count"].sum())
            with col3:
                st.metric("Total Size (MB)", f"{component_df['file_size'].sum() / (1024*1024):.2f}")
                st.metric("Growth Rate", f"{component_df['growth_rate'].mean():.2%}")

            # Component charts
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

        # Detailed log data
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

    elif page == "Roadmap":
        st.header("Roadmap")
        roadmap_path = Path(__file__).parent.parent / "System/Reference/ea_roadmap.md"
        if roadmap_path.exists():
            content = roadmap_path.read_text()
            st.markdown(content)
        else:
            st.error("Roadmap file not found!")

    elif page == "Inbox":
        st.title("📧 Email Inbox & Flow")

        # Read and parse the email log
        log_path = "/Users/air/AIR01/System/Inbox/EmailLog.md"
        emails: list[dict[str, str]] = []
        if Path(log_path).exists():
            with open(log_path) as f:
                lines = f.readlines()
            subject: Optional[str] = None
            sender: Optional[str] = None
            date: Optional[str] = None
            link: Optional[str] = None
            for line in lines:
                if line.startswith("### 🔹 "):
                    # New email entry
                    if subject and sender and date and link:
                        emails.append(
                            {"subject": subject, "sender": sender, "date": date, "link": link}
                        )
                    # Parse subject and link
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
            # Add last email
            if subject and sender and date and link:
                emails.append({"subject": subject, "sender": sender, "date": date, "link": link})
        else:
            st.warning("No email log found.")
            emails = []

        # Show recent emails table
        st.subheader("Recent Emails")
        if emails:
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

            # Render as table with clickable links
            def make_link(url: str) -> str:
                return f"[View]({url})"

            show_df["Gmail Link"] = show_df["Gmail Link"].apply(make_link)
            st.write(show_df.to_markdown(index=False), unsafe_allow_html=True)
        else:
            st.info("No emails to display.")

        # Show email volume chart
        st.subheader("Email Volume (per hour, last 48h)")
        if emails:
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
            else:
                st.info("No emails in the last 48 hours.")
        else:
            st.info("No email data for chart.")

    elif page == "Ora Chat":
        st.header("Ora Chat")
        # Simple Ora Chat UI
        if "messages" not in st.session_state:
            st.session_state.messages = []
            st.session_state.messages.append(
                {"role": "system", "content": "You are Ora, a structured executive assistant."}
            )

        user_input = st.chat_input("Ask Ora anything...")

        if user_input:
            st.session_state.messages.append({"role": "user", "content": user_input})
            with st.spinner("Ora is thinking..."):
                try:
                    response = openai.ChatCompletion.create(
                        model="gpt-4", messages=st.session_state.messages
                    )
                    assistant_message = response["choices"][0]["message"]["content"]
                    st.session_state.messages.append(
                        {"role": "assistant", "content": assistant_message}
                    )
                except Exception as e:
                    st.error(f"Error: {e!s}")
                    st.session_state.messages.append(
                        {
                            "role": "assistant",
                            "content": "I apologize, but I encountered an error. Please try again.",
                        }
                    )

        for message in st.session_state.messages:
            if message["role"] == "user":
                st.chat_message("user").write(message["content"])
            elif message["role"] == "assistant":
                st.chat_message("assistant").write(message["content"])


if __name__ == "__main__":
    main()
