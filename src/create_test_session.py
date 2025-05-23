#!/usr/bin/env python3
from datetime import datetime, timedelta
import time
from cursor_chat import CursorChat

def create_test_sessions():
    """Create test chat sessions for the dashboard"""
    # Create a chat session
    chat = CursorChat()
    
    # Session 1: Code Review
    chat.add_message("user", "Can you review this code? I'm concerned about the error handling.")
    chat.track_file_modification("src/session_manager.py")
    time.sleep(2)  # Simulate response time
    chat.add_message("assistant", "I'll review the code. Here are my suggestions for improving error handling...")
    chat.track_file_modification("src/cursor_chat.py")
    time.sleep(1)
    chat.add_message("user", "Thanks for the review! I'll implement those changes.")
    chat.save_session({
        "topic": "Code Review",
        "plan_area": "Code Quality & Review",
        "complexity": "medium",
        "success": True,
        "files_modified": ["session_manager.py", "cursor_chat.py"],
        "focus_areas": ["error handling", "code quality"],
        "outcome": "successful review with actionable feedback",
        "accomplishments": [
            "Reviewed error handling in session_manager.py",
            "Provided actionable feedback for code improvements",
            "Updated code review process for better reliability"
        ]
    })
    
    # Session 2: Bug Fix
    chat.clear()
    chat.add_message("user", "I'm getting an error in the dashboard: 'No session data found'")
    chat.track_file_modification("src/cursor_dashboard.py")
    time.sleep(3)  # Simulate longer response time
    chat.add_message("assistant", "Let me help you debug that. Can you share the error message and stack trace?")
    time.sleep(1)
    chat.add_message("user", "Here's the error: KeyError: 'topic' in the dashboard")
    time.sleep(2)
    chat.add_message("assistant", "I see the issue. We need to create some test data first and fix the metadata parsing.")
    chat.save_session({
        "topic": "Bug Fix",
        "plan_area": "Dashboard Surfacing",
        "complexity": "high",
        "success": True,
        "files_modified": ["cursor_dashboard.py"],
        "error_type": "KeyError",
        "resolution": "fixed metadata parsing",
        "accomplishments": [
            "Identified and fixed KeyError in dashboard session parsing",
            "Created test data to populate dashboard",
            "Improved error handling in dashboard code"
        ]
    })
    
    # Session 3: Feature Request
    chat.clear()
    chat.add_message("user", "Can we add filtering to the dashboard?")
    time.sleep(1)
    chat.add_message("assistant", "Yes, we can add filtering options. What kind of filters would you like?")
    time.sleep(2)
    chat.add_message("user", "Maybe by date range and topic?")
    time.sleep(1)
    chat.add_message("assistant", "I'll add those filters to the dashboard.")
    chat.track_file_modification("src/cursor_dashboard.py")
    chat.save_session({
        "topic": "Feature Request",
        "plan_area": "Dashboard Surfacing",
        "complexity": "low",
        "success": True,
        "files_modified": ["cursor_dashboard.py"],
        "feature_type": "UI enhancement",
        "priority": "medium",
        "accomplishments": [
            "Added filtering options to dashboard (date range, topic)",
            "Enhanced dashboard usability for end users"
        ]
    })

    # Session 4: Performance Optimization
    chat.clear()
    chat.add_message("user", "The dashboard is loading slowly, especially with large datasets")
    time.sleep(2)
    chat.add_message("assistant", "Let's analyze the performance bottlenecks. Can you share the current load times?")
    chat.track_file_modification("src/cursor_dashboard.py")
    time.sleep(3)
    chat.add_message("user", "It takes about 5 seconds to load 1000 sessions")
    time.sleep(1)
    chat.add_message("assistant", "We can optimize the data loading and caching. I'll implement pagination and lazy loading.")
    chat.track_file_modification("src/cursor_dashboard.py")
    chat.save_session({
        "topic": "Performance",
        "plan_area": "Dashboard Surfacing",
        "complexity": "high",
        "success": True,
        "files_modified": ["cursor_dashboard.py"],
        "performance_metrics": {
            "initial_load_time": "5s",
            "target_load_time": "1s"
        },
        "optimization_areas": ["data loading", "caching", "pagination"],
        "accomplishments": [
            "Analyzed dashboard performance bottlenecks",
            "Implemented pagination and lazy loading for large datasets",
            "Reduced dashboard load time from 5s to 1s"
        ]
    })

    # Session 5: Documentation
    chat.clear()
    chat.add_message("user", "Can you help document the API? We need clear examples for each endpoint")
    time.sleep(1)
    chat.add_message("assistant", "I'll create comprehensive API documentation with examples for each endpoint.")
    chat.track_file_modification("docs/api.md")
    time.sleep(2)
    chat.add_message("user", "Great, include authentication details and rate limits too")
    time.sleep(1)
    chat.add_message("assistant", "I'll add sections for authentication, rate limits, and error handling.")
    chat.track_file_modification("docs/api.md")
    chat.save_session({
        "topic": "Documentation",
        "plan_area": "Documentation",
        "complexity": "medium",
        "success": True,
        "files_modified": ["api.md"],
        "doc_sections": ["API endpoints", "Authentication", "Rate limits", "Error handling"],
        "audience": "developers",
        "accomplishments": [
            "Created comprehensive API documentation",
            "Added authentication, rate limits, and error handling sections",
            "Improved developer onboarding materials"
        ]
    })

    # Session 6: Failed Session
    chat.clear()
    chat.add_message("user", "Can you implement a new feature for real-time collaboration?")
    time.sleep(2)
    chat.add_message("assistant", "I'll need more details about the requirements. What kind of collaboration features do you need?")
    time.sleep(1)
    chat.add_message("user", "I don't have the requirements yet")
    time.sleep(1)
    chat.add_message("assistant", "Let's wait for the requirements before proceeding. We'll need to know about user roles, permissions, and real-time update requirements.")
    chat.save_session({
        "topic": "Feature Request",
        "plan_area": "Collaboration Features",
        "complexity": "unknown",
        "success": False,
        "files_modified": [],
        "blockers": ["missing requirements", "undefined scope"],
        "next_steps": "wait for detailed requirements",
        "accomplishments": [
            "Identified missing requirements for real-time collaboration feature",
            "Blocked feature implementation pending further details"
        ]
    })

if __name__ == "__main__":
    create_test_sessions() 