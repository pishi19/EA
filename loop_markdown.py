import re
import yaml

class LoopMarkdown:
    def __init__(self, yaml_dict=None, signals=None, tasks=None, other_sections=None):
        self.yaml_dict = yaml_dict or {}
        self.signals = signals or []  # List of dicts: {subject, body}
        self.tasks = tasks or []      # List of task strings
        self.other_sections = other_sections or []  # For future extensibility

    @classmethod
    def parse(cls, content):
        # Parse YAML frontmatter
        yaml_match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
        yaml_block = yaml_match.group(1) if yaml_match else ''
        yaml_dict = yaml.safe_load(yaml_block) if yaml_block else {}
        rest = content[yaml_match.end():] if yaml_match else content
        # Parse blockquote signals
        signals = []
        for match in re.finditer(r'> \*\*Subject:\*\* (.*?)  \n> \*\*Body:\*\* (.*?)\n', rest, re.DOTALL):
            signals.append({'subject': match.group(1).strip(), 'body': match.group(2).strip()})
        # Parse tasks
        tasks_section = re.search(r'### ✅ Tasks\n([\s\S]+?)(?=\n#|\Z)', rest)
        tasks = []
        if tasks_section:
            tasks = re.findall(r'- \[ \] .+', tasks_section.group(1))
        # Other sections (future)
        return cls(yaml_dict, signals, tasks)

    def add_signal(self, subject, body):
        # Prevent duplicate signals
        for sig in self.signals:
            if sig['subject'] == subject and sig['body'] == body:
                return
        self.signals.append({'subject': subject, 'body': body})

    def add_task(self, task):
        if task and task not in self.tasks:
            self.tasks.append(task)

    def render(self):
        yaml_str = yaml.safe_dump(self.yaml_dict, sort_keys=False, allow_unicode=True).strip()
        out = f"---\n{yaml_str}\n---\n"
        for sig in self.signals:
            out += f"> **Subject:** {sig['subject']}  \n> **Body:** {sig['body']}\n"
        if self.tasks:
            out += '\n### ✅ Tasks\n'
            for t in self.tasks:
                out += f"{t}\n"
        # Add other sections if needed
        return out.strip() + '\n' 