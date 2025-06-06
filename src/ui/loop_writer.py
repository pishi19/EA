import re
from datetime import datetime

import yaml
from summary_agent import generate_summary, generate_summary_with_gpt


def update_loop_summary(path, summary=None, use_gpt=False):
    with open(path, encoding='utf-8') as f:
        content = f.read()
    yaml_match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    yaml_block = yaml_match.group(1) if yaml_match else ''
    yaml_dict = yaml.safe_load(yaml_block) if yaml_block else {}
    if use_gpt:
        summary = generate_summary_with_gpt(content)
        yaml_dict['summary_source'] = 'gpt-4'
    else:
        if summary is None:
            summary = generate_summary(content)
        yaml_dict['summary_source'] = 'stub'
    yaml_dict['summary'] = summary
    yaml_dict['summary_generated_at'] = datetime.now().isoformat()
    new_yaml = yaml.safe_dump(yaml_dict, sort_keys=False, allow_unicode=True).strip()
    rest = content[yaml_match.end():] if yaml_match else content
    new_content = f"---\n{new_yaml}\n---\n{rest}"
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)

def update_summary_feedback(path, quality_rating=None, flagged_for_review=None, comment=None):
    with open(path, encoding='utf-8') as f:
        content = f.read()
    yaml_match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    yaml_block = yaml_match.group(1) if yaml_match else ''
    yaml_dict = yaml.safe_load(yaml_block) if yaml_block else {}
    feedback = yaml_dict.get('summary_feedback', {})
    if quality_rating is not None:
        feedback['quality_rating'] = quality_rating
    if flagged_for_review is not None:
        feedback['flagged_for_review'] = flagged_for_review
    if comment is not None:
        feedback['comment'] = comment
    yaml_dict['summary_feedback'] = feedback
    new_yaml = yaml.safe_dump(yaml_dict, sort_keys=False, allow_unicode=True).strip()
    rest = content[yaml_match.end():] if yaml_match else content
    new_content = f"---\n{new_yaml}\n---\n{rest}"
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
