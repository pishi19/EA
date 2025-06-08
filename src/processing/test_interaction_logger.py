#!/usr/bin/env python3
"""
Tests for the interaction logger cross-linking functionality.
"""

import os
import tempfile
import unittest
from pathlib import Path
from datetime import datetime

import yaml

# Import the functions we want to test
from interaction_logger import (
    parse_interaction_file,
    get_loop_context,
    determine_section_type,
    create_summary_line,
    find_loop_file,
    add_to_loop_section,
    process_interactions
)


class TestInteractionLogger(unittest.TestCase):
    """Test cases for interaction logger functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.test_dir = Path(tempfile.mkdtemp())
        self.interactions_dir = self.test_dir / "runtime" / "interactions"
        self.loops_dir = self.test_dir / "runtime" / "loops"
        
        # Create directories
        self.interactions_dir.mkdir(parents=True)
        self.loops_dir.mkdir(parents=True)
    
    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.test_dir)
    
    def create_test_interaction_file(self, filename: str, frontmatter: dict, message: str, outcome: str) -> Path:
        """Create a test interaction file."""
        filepath = self.interactions_dir / filename
        
        content = "---\n"
        content += yaml.dump(frontmatter, default_flow_style=False)
        content += "---\n\n"
        content += "## 💬 Message\n\n"
        content += message + "\n\n"
        content += "## 🔄 Outcome\n\n"
        content += outcome + "\n"
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return filepath
    
    def create_test_loop_file(self, filename: str, content: str) -> Path:
        """Create a test loop file."""
        filepath = self.loops_dir / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return filepath
    
    def test_parse_interaction_file(self):
        """Test parsing interaction files."""
        # Create test interaction file
        frontmatter = {
            'uuid': 'test-uuid-123',
            'timestamp': '2025-06-08T01:26:32.552Z',
            'actor': 'user',
            'source': 'chat',
            'context': 'loop-2025-06-02-test-loop',
            'tags': ['interaction', 'loop', 'chat-message']
        }
        
        message = "Test chat message"
        outcome = "Message successfully posted"
        
        filepath = self.create_test_interaction_file(
            "interaction-test.md", frontmatter, message, outcome
        )
        
        # Parse the file
        result = parse_interaction_file(filepath)
        
        # Verify parsing
        self.assertIsNotNone(result)
        self.assertEqual(result['uuid'], 'test-uuid-123')
        self.assertEqual(result['actor'], 'user')
        self.assertEqual(result['message'], message)
        self.assertEqual(result['outcome'], outcome)
        self.assertEqual(result['filename'], 'interaction-test.md')
    
    def test_get_loop_context(self):
        """Test extracting loop context from interactions."""
        # Test direct context
        interaction1 = {'context': 'loop-2025-06-02-test-loop'}
        self.assertEqual(get_loop_context(interaction1), 'loop-2025-06-02-test-loop')
        
        # Test from tags
        interaction2 = {
            'context': 'some-other-context',
            'tags': ['interaction', 'loop-2025-06-02-test-loop', 'chat']
        }
        self.assertEqual(get_loop_context(interaction2), 'loop-2025-06-02-test-loop')
        
        # Test from message content
        interaction3 = {
            'context': 'general',
            'message': 'Chat message in loop-2025-06-02-test-loop: "hello"'
        }
        self.assertEqual(get_loop_context(interaction3), 'loop-2025-06-02-test-loop')
        
        # Test no loop context
        interaction4 = {'context': 'general', 'message': 'No loop here'}
        self.assertIsNone(get_loop_context(interaction4))
    
    def test_determine_section_type(self):
        """Test determining whether interaction goes to Memory Trace or Execution Log."""
        # User chat interactions -> Memory Trace
        user_chat = {'actor': 'user', 'source': 'chat'}
        self.assertEqual(determine_section_type(user_chat), 'memory')
        
        # Ora system actions -> Execution Log
        ora_action = {'actor': 'ora', 'source': 'api'}
        self.assertEqual(determine_section_type(ora_action), 'execution')
        
        # System actions -> Execution Log
        system_action = {'actor': 'system', 'source': 'system'}
        self.assertEqual(determine_section_type(system_action), 'execution')
        
        # Default case -> Memory Trace
        default_case = {'actor': 'unknown', 'source': 'ui'}
        self.assertEqual(determine_section_type(default_case), 'memory')
    
    def test_create_summary_line(self):
        """Test creating summary lines for loop files."""
        interaction = {
            'uuid': 'test-uuid-123456789',
            'timestamp': '2025-06-08T01:26:32.552Z',
            'actor': 'user',
            'message': 'This is a test chat message that is quite long and should be truncated'
        }
        
        summary = create_summary_line(interaction)
        
        # Verify format
        self.assertIn('2025-06-08', summary)
        self.assertIn('👤 User interaction', summary)
        self.assertIn('[test-uui]', summary)  # First 8 chars of UUID
        self.assertIn('This is a test chat message', summary)
        
        # Test Ora action
        ora_interaction = {
            'uuid': 'ora-uuid-123456789',
            'timestamp': '2025-06-08T02:30:00.000Z',
            'actor': 'ora',
            'message': 'System executed task'
        }
        
        ora_summary = create_summary_line(ora_interaction)
        self.assertIn('🤖 Ora action', ora_summary)
        self.assertIn('[ora-uuid]', ora_summary)
    
    def test_find_loop_file(self):
        """Test finding loop files by ID."""
        # Create test loop file
        loop_content = """---
uuid: loop-2025-06-02-test-loop
title: Test Loop
---

## Test Content

This is a test loop file.
"""
        
        loop_file = self.create_test_loop_file("loop-2025-06-02-test-loop.md", loop_content)
        
        # Test exact match
        found = find_loop_file("loop-2025-06-02-test-loop", self.loops_dir)
        self.assertEqual(found, loop_file)
        
        # Test partial match
        found_partial = find_loop_file("loop-2025-06-02", self.loops_dir)
        self.assertEqual(found_partial, loop_file)
        
        # Test not found
        not_found = find_loop_file("nonexistent-loop", self.loops_dir)
        self.assertIsNone(not_found)
    
    def test_add_to_loop_section_memory_trace(self):
        """Test adding summary to Memory Trace section."""
        # Create loop file with existing Memory Trace section
        loop_content = """---
uuid: loop-test
title: Test Loop
---

## Purpose

Test loop for cross-linking.

## 🧠 Memory Trace

- 2025-06-07: Initial memory entry

## 🧾 Execution Log

- 2025-06-07: Loop initiated
"""
        
        loop_file = self.create_test_loop_file("loop-test.md", loop_content)
        summary_line = "- 2025-06-08: 👤 User interaction [test-123]: Test message"
        
        # Add to memory trace
        success = add_to_loop_section(loop_file, 'memory', summary_line)
        self.assertTrue(success)
        
        # Verify content was added
        with open(loop_file, 'r', encoding='utf-8') as f:
            updated_content = f.read()
        
        self.assertIn(summary_line, updated_content)
        # Should be in Memory Trace section, not Execution Log
        memory_section = updated_content.split('## 🧠 Memory Trace')[1].split('## 🧾 Execution Log')[0]
        self.assertIn(summary_line, memory_section)
    
    def test_add_to_loop_section_execution_log(self):
        """Test adding summary to Execution Log section."""
        # Create loop file with existing sections
        loop_content = """---
uuid: loop-test
title: Test Loop
---

## Purpose

Test loop for cross-linking.

## 🧠 Memory Trace

- 2025-06-07: Initial memory entry

## 🧾 Execution Log

- 2025-06-07: Loop initiated
"""
        
        loop_file = self.create_test_loop_file("loop-test.md", loop_content)
        summary_line = "- 2025-06-08: 🤖 Ora action [sys-123]: System update"
        
        # Add to execution log
        success = add_to_loop_section(loop_file, 'execution', summary_line)
        self.assertTrue(success)
        
        # Verify content was added
        with open(loop_file, 'r', encoding='utf-8') as f:
            updated_content = f.read()
        
        self.assertIn(summary_line, updated_content)
        # Should be in Execution Log section
        execution_section = updated_content.split('## 🧾 Execution Log')[1]
        self.assertIn(summary_line, execution_section)
    
    def test_add_to_loop_section_create_section(self):
        """Test creating section if it doesn't exist."""
        # Create loop file without Memory Trace section
        loop_content = """---
uuid: loop-test
title: Test Loop
---

## Purpose

Test loop for cross-linking.

## 🧾 Execution Log

- 2025-06-07: Loop initiated
"""
        
        loop_file = self.create_test_loop_file("loop-test.md", loop_content)
        summary_line = "- 2025-06-08: 👤 User interaction [test-123]: Test message"
        
        # Add to memory trace (section doesn't exist)
        success = add_to_loop_section(loop_file, 'memory', summary_line)
        self.assertTrue(success)
        
        # Verify section was created
        with open(loop_file, 'r', encoding='utf-8') as f:
            updated_content = f.read()
        
        self.assertIn('## 🧠 Memory Trace', updated_content)
        self.assertIn(summary_line, updated_content)
    
    def test_full_integration(self):
        """Test full integration process."""
        # Create interaction file
        frontmatter = {
            'uuid': 'integration-test-123',
            'timestamp': '2025-06-08T10:30:00.000Z',
            'actor': 'user',
            'source': 'chat',
            'context': 'loop-integration-test',
            'tags': ['interaction', 'chat-message']
        }
        
        self.create_test_interaction_file(
            "interaction-integration-test.md",
            frontmatter,
            "Integration test message",
            "Test completed successfully"
        )
        
        # Create corresponding loop file
        loop_content = """---
uuid: loop-integration-test
title: Integration Test Loop
---

## Purpose

Test full integration.

## 🧠 Memory Trace

- 2025-06-07: Initial setup

## 🧾 Execution Log

- 2025-06-07: Loop initiated
"""
        
        self.create_test_loop_file("loop-integration-test.md", loop_content)
        
        # Process interactions
        stats = process_interactions(self.test_dir, dry_run=False)
        
        # Verify statistics
        self.assertEqual(stats['processed'], 1)
        self.assertEqual(stats['linked'], 1)
        self.assertEqual(stats['errors'], 0)
        
        # Verify content was added to loop file
        loop_file = self.loops_dir / "loop-integration-test.md"
        with open(loop_file, 'r', encoding='utf-8') as f:
            updated_content = f.read()
        
        self.assertIn('👤 User interaction [integrat]', updated_content)
        self.assertIn('Integration test message', updated_content)
        
        # Should be in Memory Trace section (user chat)
        memory_section = updated_content.split('## 🧠 Memory Trace')[1].split('## 🧾 Execution Log')[0]
        self.assertIn('👤 User interaction', memory_section)


if __name__ == '__main__':
    # Run tests
    unittest.main() 