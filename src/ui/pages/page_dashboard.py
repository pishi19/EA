from src.ui.dashboard import render_dashboard as actual_render_dashboard

# This function is what main.py will import and call
def render_dashboard():
    actual_render_dashboard()

# Optional: for direct testing of this page file
if __name__ == "__main__":
    render_dashboard() 