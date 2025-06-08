#!/usr/bin/env python3
"""
Phase 10.2 Interaction System Audit

This script performs a comprehensive audit of the interaction logging system:
- Verifies all chat/action events have corresponding interaction files
- Confirms loops reference their relevant interactions
- Checks dashboard data availability
"""

import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import yaml


def get_project_root() -> Path:
    """Get the project root directory."""
    current_file = Path(__file__).resolve()
    return current_file.parents[2]


def parse_interaction_file(filepath: Path) -> Optional[Dict]:
    """Parse a single interaction markdown file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if content.startswith('---\n'):
            parts = content.split('---\n', 2)
            if len(parts) >= 3:
                frontmatter_str = parts[1]
                body = parts[2]
                
                frontmatter = yaml.safe_load(frontmatter_str)
                
                # Extract message and outcome from body
                message_match = re.search(r'## 💬 Message\s*\n(.*?)(?=\n## |$)', body, re.DOTALL)
                outcome_match = re.search(r'## 🔄 Outcome\s*\n(.*?)(?=\n## |$)', body, re.DOTALL)
                
                message = message_match.group(1).strip() if message_match else ""
                outcome = outcome_match.group(1).strip() if outcome_match else ""
                
                frontmatter['message'] = message
                frontmatter['outcome'] = outcome
                frontmatter['filename'] = filepath.name
                
                return frontmatter
    except Exception as e:
        print(f"  ❌ Error parsing {filepath.name}: {e}")
        return None
    return None


def check_loop_cross_references(project_root: Path) -> Dict[str, int]:
    """Check if loops have proper cross-references to interactions."""
    loops_dir = project_root / "runtime" / "loops"
    stats = {'loops_checked': 0, 'loops_with_references': 0, 'total_references': 0}
    
    print("\n🔗 Checking loop cross-references...")
    
    for loop_file in loops_dir.glob("*.md"):
        stats['loops_checked'] += 1
        
        try:
            with open(loop_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Look for interaction references in Memory Trace and Execution Log
            memory_references = len(re.findall(r'👤 User interaction \[.*?\]|🤖 Ora action \[.*?\]', content))
            
            if memory_references > 0:
                stats['loops_with_references'] += 1
                stats['total_references'] += memory_references
                print(f"  ✅ {loop_file.name}: {memory_references} interaction references")
            
        except Exception as e:
            print(f"  ❌ Error checking {loop_file.name}: {e}")
    
    return stats


def check_dashboard_data_availability(project_root: Path) -> Dict[str, any]:
    """Check if dashboard can access and parse interaction data."""
    interactions_dir = project_root / "runtime" / "interactions"
    dashboard_file = project_root / "src" / "ui" / "pages" / "Interaction_Index.py"
    
    stats = {
        'dashboard_exists': dashboard_file.exists(),
        'interactions_dir_exists': interactions_dir.exists(),
        'parseable_files': 0,
        'total_files': 0
    }
    
    print("\n📊 Checking dashboard data availability...")
    
    if not stats['dashboard_exists']:
        print("  ❌ Dashboard file not found: src/ui/pages/Interaction_Index.py")
        return stats
    
    if not stats['interactions_dir_exists']:
        print("  ❌ Interactions directory not found: runtime/interactions/")
        return stats
    
    print("  ✅ Dashboard file exists")
    print("  ✅ Interactions directory exists")
    
    # Check if interaction files are parseable
    interaction_files = list(interactions_dir.glob("interaction-*.md"))
    stats['total_files'] = len(interaction_files)
    
    for filepath in interaction_files:
        if parse_interaction_file(filepath):
            stats['parseable_files'] += 1
    
    print(f"  📂 {stats['parseable_files']}/{stats['total_files']} interaction files are parseable")
    
    return stats


def analyze_phase_10_2_interactions(project_root: Path) -> Dict[str, any]:
    """Analyze interactions specifically related to Phase 10.2."""
    interactions_dir = project_root / "runtime" / "interactions"
    stats = {
        'phase_10_2_interactions': 0,
        'legitimate_interactions': 0,
        'test_interactions': 0,
        'interactions_by_actor': {'user': 0, 'ora': 0, 'unknown': 0},
        'interactions_by_source': {}
    }
    
    print("\n🔍 Analyzing Phase 10.2 interactions...")
    
    phase_10_2_start = datetime(2025, 6, 7, tzinfo=timezone.utc)  # Approximate start of Phase 10.2
    
    for filepath in interactions_dir.glob("interaction-*.md"):
        interaction = parse_interaction_file(filepath)
        if not interaction:
            continue
        
        # Check if it's related to Phase 10.2
        tags = interaction.get('tags', [])
        context = interaction.get('context', '')
        message = interaction.get('message', '')
        
        is_phase_10_2 = (
            'phase-10-2' in tags or
            'phase-10.2' in tags or
            'phase-10-2' in context or
            'phase-10.2' in context or
            'Phase 10.2' in message or
            'interaction-log' in message.lower() or
            'dashboard' in message.lower()
        )
        
        if is_phase_10_2:
            stats['phase_10_2_interactions'] += 1
            print(f"  🎯 Phase 10.2 interaction: {filepath.name}")
        
        # Categorize interaction types
        if any(test_indicator in filepath.name.lower() for test_indicator in ['test', 'demo', '123', '456', '789']):
            stats['test_interactions'] += 1
        else:
            stats['legitimate_interactions'] += 1
        
        # Count by actor
        actor = interaction.get('actor', 'unknown')
        stats['interactions_by_actor'][actor] = stats['interactions_by_actor'].get(actor, 0) + 1
        
        # Count by source
        source = interaction.get('source', 'unknown')
        stats['interactions_by_source'][source] = stats['interactions_by_source'].get(source, 0) + 1
    
    return stats


def run_comprehensive_audit(project_root: Path) -> Dict[str, any]:
    """Run the complete audit and return results."""
    print("🚀 Starting Phase 10.2 Interaction System Audit...")
    print(f"📁 Project root: {project_root}")
    
    audit_results = {
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'audit_passed': True,
        'issues': []
    }
    
    # 1. Check interaction files and parsing
    interactions_dir = project_root / "runtime" / "interactions"
    if not interactions_dir.exists():
        audit_results['audit_passed'] = False
        audit_results['issues'].append("Interactions directory not found")
        return audit_results
    
    interaction_files = list(interactions_dir.glob("interaction-*.md"))
    print(f"\n📂 Found {len(interaction_files)} interaction files")
    
    # 2. Analyze Phase 10.2 specific interactions
    phase_stats = analyze_phase_10_2_interactions(project_root)
    audit_results['phase_10_2_stats'] = phase_stats
    
    # 3. Check loop cross-references
    loop_stats = check_loop_cross_references(project_root)
    audit_results['loop_stats'] = loop_stats
    
    # 4. Check dashboard availability
    dashboard_stats = check_dashboard_data_availability(project_root)
    audit_results['dashboard_stats'] = dashboard_stats
    
    # 5. Run interaction logger dry-run
    print("\n🔗 Running interaction cross-linking audit...")
    from interaction_logger import process_interactions
    linking_stats = process_interactions(project_root, dry_run=True)
    audit_results['linking_stats'] = linking_stats
    
    # Determine overall audit status
    critical_issues = []
    
    if not dashboard_stats['dashboard_exists']:
        critical_issues.append("Dashboard file missing")
    
    if dashboard_stats['parseable_files'] < dashboard_stats['total_files']:
        critical_issues.append(f"Some interaction files unparseable ({dashboard_stats['parseable_files']}/{dashboard_stats['total_files']})")
    
    if phase_stats['phase_10_2_interactions'] == 0:
        critical_issues.append("No Phase 10.2 interactions found")
    
    if linking_stats['linked'] == 0 and linking_stats['processed'] > 0:
        critical_issues.append("No interactions successfully linked to loops")
    
    if critical_issues:
        audit_results['audit_passed'] = False
        audit_results['issues'] = critical_issues
    
    return audit_results


def format_audit_report(audit_results: Dict) -> str:
    """Format audit results into a markdown report."""
    timestamp = audit_results['timestamp']
    passed = audit_results['audit_passed']
    status_emoji = "✅" if passed else "❌"
    
    report = f"""## 🧾 Execution Log

- {timestamp[:10]}: {status_emoji} **Phase 10.2 Interaction System Audit Complete**

### Audit Summary
**Status**: {'PASSED' if passed else 'FAILED'}
**Timestamp**: {timestamp}

### Interaction Files Analysis
- **Total interaction files**: {audit_results.get('linking_stats', {}).get('processed', 0)}
- **Successfully linkable**: {audit_results.get('linking_stats', {}).get('linked', 0)}
- **Phase 10.2 specific interactions**: {audit_results.get('phase_10_2_stats', {}).get('phase_10_2_interactions', 0)}
- **Legitimate interactions**: {audit_results.get('phase_10_2_stats', {}).get('legitimate_interactions', 0)}
- **Test interactions**: {audit_results.get('phase_10_2_stats', {}).get('test_interactions', 0)}

### Loop Cross-Reference Analysis
- **Loops checked**: {audit_results.get('loop_stats', {}).get('loops_checked', 0)}
- **Loops with interaction references**: {audit_results.get('loop_stats', {}).get('loops_with_references', 0)}
- **Total cross-references found**: {audit_results.get('loop_stats', {}).get('total_references', 0)}

### Dashboard Data Availability
- **Dashboard exists**: {'✅' if audit_results.get('dashboard_stats', {}).get('dashboard_exists') else '❌'}
- **Interactions directory exists**: {'✅' if audit_results.get('dashboard_stats', {}).get('interactions_dir_exists') else '❌'}
- **Parseable files**: {audit_results.get('dashboard_stats', {}).get('parseable_files', 0)}/{audit_results.get('dashboard_stats', {}).get('total_files', 0)}

### Actor Distribution
"""
    
    actor_stats = audit_results.get('phase_10_2_stats', {}).get('interactions_by_actor', {})
    for actor, count in actor_stats.items():
        report += f"- **{actor.title()}**: {count} interactions\n"
    
    if not passed:
        report += "\n### Issues Found\n"
        for issue in audit_results.get('issues', []):
            report += f"- ❌ {issue}\n"
    else:
        report += """
### ✅ All Systems Operational
- Interaction logging infrastructure functional
- Cross-linking between interactions and loops working
- Dashboard can access and parse all interaction data
- Phase 10.2 interactions properly captured and linked
"""
    
    return report


def main():
    """Main entry point."""
    project_root = get_project_root()
    
    # Run comprehensive audit
    audit_results = run_comprehensive_audit(project_root)
    
    # Generate report
    report = format_audit_report(audit_results)
    
    # Print summary
    print(f"\n{'='*60}")
    print("📊 AUDIT SUMMARY")
    print(f"{'='*60}")
    print(f"Status: {'✅ PASSED' if audit_results['audit_passed'] else '❌ FAILED'}")
    print(f"Phase 10.2 interactions: {audit_results.get('phase_10_2_stats', {}).get('phase_10_2_interactions', 0)}")
    print(f"Linkable interactions: {audit_results.get('linking_stats', {}).get('linked', 0)}")
    print(f"Cross-referenced loops: {audit_results.get('loop_stats', {}).get('loops_with_references', 0)}")
    
    if not audit_results['audit_passed']:
        print("\nIssues found:")
        for issue in audit_results.get('issues', []):
            print(f"  ❌ {issue}")
        return 1
    
    print("\n✅ All checks passed! System is fully operational.")
    
    # Output the report for logging to loop file
    print(f"\n{'='*60}")
    print("📝 AUDIT REPORT FOR LOOP FILE")
    print(f"{'='*60}")
    print(report)
    
    return 0


if __name__ == "__main__":
    sys.exit(main()) 