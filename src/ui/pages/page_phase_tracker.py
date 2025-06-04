from src.ui.phase_tracker import render_phase_tracker as actual_render_phase_tracker

# This function is what main.py will import and call
def render_phase_tracker():
    actual_render_phase_tracker()

# Optional: for direct testing of this page file
if __name__ == "__main__":
    render_phase_tracker() 