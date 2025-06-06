import sqlite3
import pandas as pd

def summarize_volatility(workstream_id: str, db_path="runtime/db/ora.db") -> dict:
    """
    Analyzes feedback volatility for a given workstream.
    """
    try:
        conn = sqlite3.connect(db_path)
        
        # Load all loops for the given workstream
        loops_df = pd.read_sql(
            "SELECT uuid, title FROM loop_metadata WHERE workstream=?", 
            conn, 
            params=(workstream_id,)
        )
        if loops_df.empty:
            return {"error": f"No loops found for workstream '{workstream_id}'"}
        
        # Load all feedback for those loops
        loop_uuids = tuple(loops_df['uuid'].tolist())
        # The f-string needs to handle the case of a single-element tuple correctly
        if len(loop_uuids) == 1:
            feedback_df = pd.read_sql(
                f"SELECT uuid, tag FROM loop_feedback WHERE uuid = '{loop_uuids[0]}'", 
                conn
            )
        else:
            feedback_df = pd.read_sql(
                f"SELECT uuid, tag FROM loop_feedback WHERE uuid IN {loop_uuids}", 
                conn
            )
        
    except Exception as e:
        return {"error": f"Database query failed: {e}"}
    finally:
        if 'conn' in locals():
            conn.close()

    # Calculate volatility
    if not feedback_df.empty:
        feedback_counts = feedback_df.groupby('uuid')['tag'].value_counts().unstack(fill_value=0)
        feedback_counts.columns = [f"{col}_count" for col in feedback_counts.columns]
        
        loops_with_feedback = pd.merge(loops_df, feedback_counts, on='uuid', how='left').fillna(0)

        useful = loops_with_feedback.get('useful_count', 0)
        false_positive = loops_with_feedback.get('false_positive_count', 0)
        total_feedback = useful + false_positive
        
        loops_with_feedback['total_feedback'] = total_feedback
        loops_with_feedback['volatility'] = ((useful - false_positive).abs() / total_feedback).fillna(0)
    else:
        loops_with_feedback = loops_df.copy()
        loops_with_feedback['total_feedback'] = 0
        loops_with_feedback['volatility'] = 0

    # Calculate summary metrics
    volatile_loops = loops_with_feedback[loops_with_feedback['volatility'] > 0.5]
    untagged_loops = loops_with_feedback[loops_with_feedback['total_feedback'] == 0]
    avg_feedback = loops_with_feedback['total_feedback'].mean()

    return {
        "workstream_id": workstream_id,
        "total_loops": len(loops_with_feedback),
        "volatile_loop_count": len(volatile_loops),
        "untagged_loop_count": len(untagged_loops),
        "average_feedback_per_loop": round(avg_feedback, 2),
        "high_conflict_loops": volatile_loops[['uuid', 'title', 'volatility']].to_dict('records')
    } 