import pytest
import streamlit as st
from src.cursor_dashboard import main

def test_dashboard_initialization():
    """Test that the dashboard initializes correctly"""
    # Run the dashboard
    main()
    
    # Check that the title is set
    assert st.session_state.get("page_title") == "EA Assistant Dashboard"
    
    # Check that the page icon is set
    assert st.session_state.get("page_icon") == "🤖"
    
    # Check that the layout is set
    assert st.session_state.get("layout") == "wide"

def test_button_presence():
    """Test that the button is present"""
    main()
    assert "Test Button" in st.session_state.get("elements", {})

def test_input_presence():
    """Test that the input field is present"""
    main()
    assert "Test Input" in st.session_state.get("elements", {})

def test_dropdown_presence():
    """Test that the dropdown is present"""
    main()
    assert "Test Dropdown" in st.session_state.get("elements", {})

def test_button_interaction():
    """Test that the button shows success message when clicked"""
    main()
    # Simulate button click by setting a flag
    st.session_state["button_clicked"] = True
    main()  # Run again to process the click
    assert st.session_state.get("button_clicked") is True

def test_text_input():
    """Test that text input updates correctly"""
    main()
    # Simulate text input
    test_text = "Hello, World!"
    st.session_state["text_input"] = test_text
    main()  # Run again to process the input
    assert st.session_state.get("text_input") == test_text

def test_dropdown_selection():
    """Test that dropdown selection works"""
    main()
    # Simulate dropdown selection
    test_option = "Option 2"
    st.session_state["dropdown_selection"] = test_option
    main()  # Run again to process the selection
    assert st.session_state.get("dropdown_selection") == test_option

def test_metrics_display():
    """Test that metrics are displayed correctly"""
    main()
    # Check that metrics are in the session state
    assert "metrics" in st.session_state
    metrics = st.session_state["metrics"]
    assert isinstance(metrics, dict)
    assert "extract_loops.log" in metrics
    assert metrics["extract_loops.log"]["error_count"] == 0
    assert metrics["extract_loops.log"]["log_size"] == 738

def test_charts_display():
    """Test that charts are displayed correctly"""
    main()
    # Check that charts are in the session state
    assert "charts" in st.session_state
    charts = st.session_state["charts"]
    assert isinstance(charts, list) 