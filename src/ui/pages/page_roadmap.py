from src.ui.roadmap import render_roadmap as actual_render_roadmap

# This function is what main.py will import and call
def render_roadmap():
    actual_render_roadmap()

# Optional: for direct testing of this page file
if __name__ == "__main__":
    render_roadmap() 