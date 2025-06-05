
# Semantic Dashboard – Phase 3.1 Notes and Considerations

This document outlines the next steps, considerations, and current design boundaries for Ora's semantic dashboard.

---

## ✅ Current Capabilities

- Related Loops View via Qdrant vector search
- Feedback tag clustering and visualization
- Promotion candidate suggestions (stubbed)
- Embedding health checks (missing vectors, duplicates)
- Streamlit sidebar integration

---

## 🔄 Next Steps & Considerations

### 1. Run the Streamlit App
- Ensure your Qdrant server is running and the embedding collection (`workstream_items`) is populated.
- Access the dashboard at http://170.64.176.146:8508

### 2. OpenAI API Key for UI Embedding (Optional)
- To support arbitrary text queries (e.g., "Show me all loops about partner onboarding"), `semantic_dashboard.py` needs access to the OpenAI client and `OPENAI_API_KEY`.
- This is currently stubbed out.

### 3. Roadmap Topics for Promotion Candidates
- The current view expects roadmap topics and embeddings.
- Future solutions:
  - Add a static YAML or JSON of roadmap topics and embed them on startup
  - Store roadmap topics in a second Qdrant collection

### 4. Performance Considerations
- Large-scale queries (e.g., "all tags", "all loop IDs") may slow down with volume.
- Consider paginating results or optimizing Qdrant queries.

### 5. Error Handling & User Feedback
- Improve UI messages when:
  - Embedding fails
  - No results found
  - Query format is invalid

### 6. Local File Links
- The dashboard uses `st.link_button()` with `file://` URLs to reference local loop files.
- This only works if:
  - Streamlit is accessed from the same machine where the file resides
  - The browser allows local file access

---

## 🔚 Summary

This dashboard is now functionally live and semantically aware — enabling vector-powered navigation through loop memory.

While some components (e.g., roadmap embeddings) are stubbed, the foundation is solid and future-facing.

