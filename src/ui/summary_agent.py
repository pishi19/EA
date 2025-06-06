import os
import re
from datetime import datetime


def generate_summary(loop_markdown: str) -> str:
    # Parse all subject lines from signals
    subjects = re.findall(r'> \*\*Subject:\*\* (.*?)  ', loop_markdown)
    # Parse top 2-3 tasks
    tasks_section = re.search(r'### ✅ Tasks\n([\s\S]+?)(?=\n#|\Z)', loop_markdown)
    tasks = []
    if tasks_section:
        tasks = re.findall(r'- \[ \] (.+)', tasks_section.group(1))[:3]
    # Build summary
    summary = ""
    if subjects:
        summary += "This loop covers: " + ", ".join(subjects) + ". "
    if tasks:
        summary += "Tasks: " + "; ".join(tasks) + "."
    if not summary:
        summary = "No summary available."
    return summary

# --- GPT-4 summary agent ---
def generate_summary_with_gpt(markdown: str) -> str:
    import openai
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return "[ERROR: OPENAI_API_KEY not set]"
    # Extract signals and tasks
    signals = re.findall(r'> \*\*Subject:\*\* (.*?)  \n> \*\*Body:\*\* (.*?)\n', markdown, re.DOTALL)
    tasks_section = re.search(r'### ✅ Tasks\n([\s\S]+?)(?=\n#|\Z)', markdown)
    tasks = []
    if tasks_section:
        tasks = re.findall(r'- \[ \] (.+)', tasks_section.group(1))
    # Build prompt
    prompt = "You are summarizing a project loop. Summarize the signals and tasks in one paragraph.\n\n"
    if signals:
        prompt += "Signals:\n"
        for subj, body in signals:
            prompt += f"- Subject: {subj}\n  Body: {body}\n"
    if tasks:
        prompt += "Tasks:\n"
        for t in tasks:
            prompt += f"- {t}\n"
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            api_key=api_key,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=120,
            temperature=0.4
        )
        summary = response.choices[0].message['content'].strip()
        return summary
    except Exception as e:
        return f"[GPT-4 ERROR: {e}]"

# --- Retrain summaries based on feedback ---
def retrain_summaries_based_on_feedback(vault_path: str):
    import glob

    import yaml
    retrained = []
    for path in glob.glob(os.path.join(vault_path, '**', 'loop-*.md'), recursive=True):
        with open(path, encoding='utf-8') as f:
            content = f.read()
        yaml_match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
        yaml_block = yaml_match.group(1) if yaml_match else ''
        yaml_dict = yaml.safe_load(yaml_block) if yaml_block else {}
        feedback = yaml_dict.get('summary_feedback', {})
        needs_retrain = (
            feedback.get('quality_rating', 5) <= 3 or feedback.get('flagged_for_review', False)
        )
        if needs_retrain:
            new_summary = generate_summary_with_gpt(content)
            yaml_dict['summary'] = new_summary
            yaml_dict['summary_generated_at'] = datetime.now().isoformat()
            yaml_dict['summary_source'] = 'gpt-4'
            yaml_dict['summary_retrained_at'] = datetime.now().isoformat()
            yaml_dict['retrained_by'] = 'ora'
            new_yaml = yaml.safe_dump(yaml_dict, sort_keys=False, allow_unicode=True).strip()
            rest = content[yaml_match.end():] if yaml_match else content
            new_content = f"---\n{new_yaml}\n---\n{rest}"
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            retrained.append({'path': path, 'feedback': feedback, 'new_summary': new_summary})
    # Optionally log retrained files
    if retrained:
        date_str = datetime.now().strftime('%Y-%m-%d')
        out_dir = os.path.join(vault_path, '0001 HQ')
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, f'summary_retraining_log-{date_str}.md')
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(f"# 🧠 Summary Retraining Log\n\n- **Date:** {date_str}\n- **Total retrained:** {len(retrained)}\n\n")
            for r in retrained:
                f.write(f"## {os.path.relpath(r['path'], start=vault_path)}\n- Feedback: {r['feedback']}\n- New summary: {r['new_summary']}\n\n")
    return retrained
