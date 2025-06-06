import sqlite3
from pathlib import Path

import streamlit as st
from qdrant_client import QdrantClient, models

# --- Configuration ---
QDRANT_HOST = "localhost"
QDRANT_PORT = 6333
QDRANT_COLLECTION = "workstream_items"
DB_PATH = "/Users/air/AIR01/System/data/loops.db"  # Path from promote_loops.py
LOOP_DIR_PATH = Path("runtime/loops/")

# --- Qdrant Client Initialization ---
@st.cache_resource
def get_qdrant_client():
    try:
        client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        # Check if collection exists
        try:
            client.get_collection(collection_name=QDRANT_COLLECTION)
        except Exception as e:
            st.error(f"Qdrant collection '{QDRANT_COLLECTION}' not found or Qdrant not accessible: {e}")
            st.info("Please ensure Qdrant is running and the collection has been created by the embedding script.")
            return None
        return client
    except Exception as e:
        st.error(f"Failed to connect to Qdrant at {QDRANT_HOST}:{QDRANT_PORT}: {e}")
        return None

# --- Database Helper ---
def get_loop_feedback_scores(loop_id: str) -> dict:
    """Fetches feedback scores for a given loop_id from the SQLite database."""
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT useful_count, false_positive_count, mention_count
                FROM loop_metrics WHERE loop_id = ?
            """,
                (loop_id,),
            )
            row = cursor.fetchone()
            if row:
                return {"useful": row[0], "false_positive": row[1], "mentions": row[2]}
    except sqlite3.Error as e:
        st.sidebar.error(f"DB error for {loop_id}: {e}") # Show error subtly
    return {"useful": 0, "false_positive": 0, "mentions": 0}


# --- Feature Implementations ---

def render_related_loops_view(client: QdrantClient):
    st.subheader("🔍 Related Loops View")
    search_term = st.text_input("Enter Loop ID (e.g., loop-xyz) or search query for content:", key="related_loops_input")
    top_n = st.slider("Number of similar loops to retrieve:", 1, 20, 5, key="related_loops_top_n")

    if search_term:
        try:
            target_vector = None
            if Path(search_term).exists() and Path(search_term).is_file() and search_term.endswith('.md'):
                loop_id_from_path = Path(search_term).stem
                st.write(f"Searching based on Loop ID derived from path: '{loop_id_from_path}'")
                points_response = client.get_points(
                    collection_name=QDRANT_COLLECTION,
                    ids=[loop_id_from_path],
                    with_vectors=True
                )
                if points_response.points and points_response.points[0].vector:
                     target_vector = points_response.points[0].vector
                else:
                    st.warning(f"Could not find vector for loop ID '{loop_id_from_path}' in Qdrant. Please ensure it has been embedded.")
                    return
            elif search_term.startswith("loop-"): # Assume it's a loop ID
                 points_response = client.get_points(
                    collection_name=QDRANT_COLLECTION,
                    ids=[search_term],
                    with_vectors=True
                )
                 if points_response.points and points_response.points[0].vector:
                     target_vector = points_response.points[0].vector
                 else:
                    st.warning(f"Could not find vector for loop ID '{search_term}' in Qdrant.")
                    return
            else:
                st.info("Text query search is not yet fully implemented here. Please use a Loop ID.")
                st.warning("For now, please use Loop ID for related search.")
                return

            if target_vector:
                hits = client.search(
                    collection_name=QDRANT_COLLECTION,
                    query_vector=target_vector,
                    limit=top_n,
                    with_payload=True
                )
                if hits:
                    st.write(f"Found {len(hits)} similar loops:")
                    for hit in hits:
                        payload = hit.payload if hit.payload else {}
                        loop_id = hit.id
                        title = payload.get("title", loop_id)
                        tags = payload.get("tags", [])
                        path_str = payload.get("path", "N/A") # Renamed to avoid conflict
                        score = hit.score

                        feedback = get_loop_feedback_scores(loop_id)

                        with st.expander(f"{title} (Score: {score:.4f}) - Path: {path_str}"):
                            st.markdown(f"**ID:** `{loop_id}`")
                            st.markdown(f"**Tags:** `{', '.join(tags) if tags else 'N/A'}`")
                            st.markdown(f"**Feedback:** 👍 {feedback.get('useful',0)} | 👎 {feedback.get('false_positive',0)} | 💬 {feedback.get('mentions',0)}")
                            resolved_path = Path(path_str).resolve()
                            if Path(path_str).exists(): # Check original path string for existence
                                 st.link_button("View Full Loop (Local)", f"file://{resolved_path}")
                            else:
                                 st.caption(f"Loop file path not directly accessible: {path_str}")
                else:
                    st.write("No similar loops found.")
        except Exception as e:
            st.error(f"Error during Qdrant search: {e}")

def render_feedback_tag_clusters(client: QdrantClient):
    st.subheader("📊 Feedback Tag Clusters")
    all_tags = set()
    try:
        points_response, _ = client.scroll(collection_name=QDRANT_COLLECTION, limit=1000, with_payload=True)
        for point in points_response:
            if point.payload and "tags" in point.payload:
                all_tags.update(point.payload["tags"])
    except Exception as e:
        st.warning(f"Could not fetch all tags for filter: {e}")

    if not all_tags:
        st.info("No tags found in Qdrant payloads to create clusters.")
        return

    selected_tag = st.selectbox("Select a tag to see related loops:", sorted(list(all_tags)), key="tag_cluster_select")
    top_n_cluster = st.slider("Number of similar loops per cluster:", 1, 10, 3, key="tag_cluster_top_n")

    if selected_tag:
        st.write(f"Loops tagged with `#{selected_tag}` and their semantic neighbors:")
        try:
            tagged_hits_response = client.scroll(
                collection_name=QDRANT_COLLECTION,
                scroll_filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="tags",
                            match=models.MatchValue(value=selected_tag)
                        )
                    ]
                ),
                limit=50,
                with_payload=True,
                with_vectors=True
            )

            if tagged_hits_response and tagged_hits_response[0]:
                seed_loops = tagged_hits_response[0]
                st.write(f"Found {len(seed_loops)} primary loops with tag `#{selected_tag}`.")

                for seed_loop in seed_loops:
                    payload = seed_loop.payload if seed_loop.payload else {}
                    loop_id = seed_loop.id
                    title = payload.get("title", loop_id)
                    path_str = payload.get("path", "N/A")
                    feedback = get_loop_feedback_scores(loop_id)

                    st.markdown(f"--- \n**Seed Loop:** {title} (`{loop_id}`)")
                    st.markdown(f"**Feedback:** 👍 {feedback.get('useful',0)} | 👎 {feedback.get('false_positive',0)} | 💬 {feedback.get('mentions',0)}")

                    if seed_loop.vector:
                        neighbor_hits = client.search(
                            collection_name=QDRANT_COLLECTION,
                            query_vector=seed_loop.vector,
                            limit=top_n_cluster + 1,
                            with_payload=True
                        )
                        st.write(f"Semantic neighbors for '{title}':")
                        for neighbor in neighbor_hits:
                            if neighbor.id == loop_id:
                                continue
                            neighbor_payload = neighbor.payload if neighbor.payload else {}
                            neighbor_title = neighbor_payload.get("title", neighbor.id)
                            neighbor_tags = neighbor_payload.get("tags", [])
                            neighbor_path_str = neighbor_payload.get("path", "N/A")
                            neighbor_score = neighbor.score
                            neighbor_feedback = get_loop_feedback_scores(neighbor.id)

                            with st.container(border=True):
                                st.markdown(f"**{neighbor_title}** (Similarity: {neighbor_score:.4f})")
                                st.caption(f"ID: `{neighbor.id}` | Path: {neighbor_path_str}")
                                st.caption(f"Tags: `{', '.join(neighbor_tags) if neighbor_tags else 'N/A'}`")
                                st.caption(f"Feedback: 👍 {neighbor_feedback.get('useful',0)} | 👎 {neighbor_feedback.get('false_positive',0)} | 💬 {neighbor_feedback.get('mentions',0)}")
                    else:
                        st.caption(f"Seed loop '{title}' has no vector, cannot find neighbors.")
            else:
                st.info(f"No loops found with the tag `#{selected_tag}`.")
        except Exception as e:
            st.error(f"Error during tag cluster generation: {e}")

def render_loop_promotion_candidates(client: QdrantClient):
    st.subheader("🚀 Loop Promotion Candidates")
    # st.info("Feature under construction.")
    # st.write("This section will show loops with high #useful ratios and strong similarity to roadmap topics.")
    try:
        all_loop_points, _ = client.scroll(collection_name=QDRANT_COLLECTION, limit=200, with_payload=True)

        candidates = []
        for point in all_loop_points:
            loop_id = point.id
            payload = point.payload or {}
            feedback = get_loop_feedback_scores(loop_id)

            useful_score = feedback.get('useful', 0)
            fp_score = feedback.get('false_positive', 0)

            if useful_score > 0 and useful_score >= (fp_score * 2):
                candidates.append({
                    "id": loop_id,
                    "title": payload.get("title", loop_id),
                    "path": payload.get("path", "N/A"),
                    "useful": useful_score,
                    "fp": fp_score,
                    "score": useful_score - fp_score
                })

        if candidates:
            sorted_candidates = sorted(candidates, key=lambda x: x["score"], reverse=True)
            st.write(f"Found {len(sorted_candidates)} potential candidates (based on useful > 2*FP ratio):")
            for cand in sorted_candidates[:10]:
                 with st.expander(f"{cand['title']} (Score: {cand['score']}) - ID: {cand['id']}"):
                    st.markdown(f"**Path:** {cand['path']}")
                    st.markdown(f"**Feedback:** 👍 {cand['useful']} | 👎 {cand['fp']}")
        else:
            st.info("No strong promotion candidates found based on current simple criteria.")

    except Exception as e:
        st.error(f"Error fetching promotion candidates: {e}")

def render_embedding_quality_check(client: QdrantClient):
    st.subheader("✔️ Embedding Quality Check")
    st.markdown("**Loops in Filesystem vs. Qdrant:**")
    md_files = list(LOOP_DIR_PATH.glob("*.md"))
    md_file_ids = {f.stem for f in md_files}

    qdrant_ids = set()
    try:
        offset = None
        while True:
            points_batch, next_offset = client.scroll(
                collection_name=QDRANT_COLLECTION,
                limit=250,
                offset=offset,
                with_payload=False,
                with_vectors=False
            )
            for point in points_batch:
                qdrant_ids.add(point.id)
            if not next_offset:
                break
            offset = next_offset

        missing_in_qdrant = md_file_ids - qdrant_ids
        if missing_in_qdrant:
            st.warning(f"{len(missing_in_qdrant)} loops found in `{LOOP_DIR_PATH}` but not in Qdrant:")
            for loop_id in list(missing_in_qdrant)[:10]:
                st.write(f"- `{loop_id}.md`")
            if len(missing_in_qdrant) > 10:
                st.write(f"...and {len(missing_in_qdrant) - 10} more.")
        else:
            st.success("All loops in filesystem appear to be in Qdrant (based on ID check).")

        missing_in_fs = qdrant_ids - md_file_ids
        if missing_in_fs:
            st.info(f"{len(missing_in_fs)} loop IDs found in Qdrant but not in `{LOOP_DIR_PATH}` (potential stale entries):")
            for loop_id in list(missing_in_fs)[:10]:
                 st.write(f"- `{loop_id}` (in Qdrant)")
            if len(missing_in_fs) > 10:
                st.write(f"...and {len(missing_in_fs) - 10} more.")
    except Exception as e:
        st.error(f"Error performing Qdrant ID sync check: {e}")

    st.markdown("**Potential Embedding Failures:**")
    st.info("The check above (loops in filesystem but not Qdrant) can indicate embedding failures or delays.")

    st.markdown("**Duplicate Content Check (based on content_hash):**")
    try:
        hashes = {}
        duplicates_found = False
        offset = None
        while True:
            points_batch, next_offset = client.scroll(
                collection_name=QDRANT_COLLECTION,
                limit=250,
                offset=offset,
                with_payload=True,
                with_vectors=False
            )
            for point in points_batch:
                if point.payload and "content_hash" in point.payload:
                    chash = point.payload["content_hash"]
                    if chash in hashes:
                        hashes[chash].append(point.id)
                        duplicates_found = True
                    else:
                        hashes[chash] = [point.id]
            if not next_offset:
                break
            offset = next_offset

        if duplicates_found:
            st.warning("Found potential duplicate content (loops with identical content_hash):")
            for chash, ids in hashes.items():
                if len(ids) > 1:
                    st.write(f"- Hash `{chash[:10]}...`: IDs `{', '.join(ids)}`")
        else:
            st.success("No duplicate content detected based on `content_hash`.")
    except Exception as e:
        st.error(f"Error during duplicate content check: {e}")

# --- Main Dashboard Rendering ---
def render_semantic_dashboard():
    st.title("🧠 Semantic Dashboard")
    st.caption(f"Exploring loops from Qdrant collection: `{QDRANT_COLLECTION}` on `{QDRANT_HOST}:{QDRANT_PORT}`")
    st.caption(f"Monitoring loop files from: `{LOOP_DIR_PATH.resolve()}`")

    client = get_qdrant_client()
    if client is None:
        st.error("Qdrant client could not be initialized. Dashboard features will be unavailable.")
        return

    tabs_titles = [
        "Related Loops",
        "Tag Clusters",
        "Promotion Candidates",
        "Embedding Quality"
    ]
    tab1, tab2, tab3, tab4 = st.tabs(tabs_titles)

    with tab1:
        render_related_loops_view(client)
    with tab2:
        render_feedback_tag_clusters(client)
    with tab3:
        render_loop_promotion_candidates(client)
    with tab4:
        render_embedding_quality_check(client)

if __name__ == "__main__":
    st.set_page_config(layout="wide")
    render_semantic_dashboard()
