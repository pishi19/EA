import sys
import os
import json

# Adjust path to import from src
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from tasks.similarity import find_similar_tasks

def match_task(verb: str):
    """
    Assistant command to find semantically similar tasks.
    """
    if not os.getenv("OPENAI_API_KEY"):
        return {"error": "OPENAI_API_KEY is not set."}
        
    return find_similar_tasks(verb)

if __name__ == '__main__':
    # This allows for direct testing of the command.
    # Example: python src/agent/commands/match_task.py "email a client"
    if len(sys.argv) > 1:
        input_verb = sys.argv[1]
        results = match_task(input_verb)
        print(json.dumps(results, indent=2))
    else:
        print("Usage: python src/agent/commands/match_task.py \"<verb_to_match>\"") 