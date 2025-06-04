from src.ui.reflections import render_reflections as actual_render_reflections

# This function is what main.py will import and call
def render_reflections():
    actual_render_reflections()

# Optional: for direct testing of this page file
if __name__ == "__main__":
    render_reflections() 