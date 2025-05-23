from utils.classify_utils import classify_task_semantically

if __name__ == "__main__":
    task = "follow up on pricing strategy with finance team"
    results = classify_task_semantically(task)
    print("\nTop Matches:")
    for match in results:
        print(f"- {match['type']} → {match['file']} (score: {match['similarity']})")
