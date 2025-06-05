from pathlib import Path
import yaml

inbox_path = Path('runtime/inbox')
inbox_path.mkdir(parents=True, exist_ok=True)

sample_signal = {
    'timestamp': '2025-06-05T10:22:00',
    'source': 'mecca-followup',
    'tags': ['#useful', 'event', 'prospect'],
    'subject': 'Follow-up Needed',
    'body': 'Client has not responded to RSVP – escalate to consultant.'
}

with open(inbox_path / 'test-signal.yaml', 'w') as f:
    yaml.dump(sample_signal, f)

print('✅ Sample signal written to runtime/inbox/test-signal.yaml') 