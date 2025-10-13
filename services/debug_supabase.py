#!/usr/bin/env python3
"""
Enhanced debug script to find update_application calls
"""

import os
import sys
import re

def find_all_update_calls():
    """Search through all Python files for ANY update_application calls"""
    patterns = [
        r'\.update_application\(',
        r'update_application\(',
        r'supabase_service\.update_application',
        r'db_service\.update_application',
    ]
    
    python_files = []
    
    # Find all Python files
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.py'):
                python_files.append(os.path.join(root, file))
    
    print(f"🔍 Searching {len(python_files)} Python files for update_application calls...")
    
    found_calls = []
    
    for file_path in python_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
                
                for i, line in enumerate(lines, 1):
                    line_clean = line.strip()
                    for pattern in patterns:
                        if re.search(pattern, line_clean):
                            # Get some context
                            start = max(0, i-3)
                            end = min(len(lines), i+2)
                            context = '\n'.join([f"   {j}: {lines[j-1]}" for j in range(start+1, end+1)])
                            
                            found_calls.append({
                                'file': file_path,
                                'line': i,
                                'code': line_clean,
                                'context': context
                            })
                            break
                            
        except Exception as e:
            print(f"⚠️  Could not read {file_path}: {e}")
    
    if found_calls:
        print(f"📝 Found {len(found_calls)} update_application calls:")
        for call in found_calls:
            print(f"\n❓ POTENTIAL CALL:")
            print(f"   File: {call['file']}")
            print(f"   Line {call['line']}: {call['code']}")
            print(f"   Context:\n{call['context']}")
    else:
        print("✅ No update_application calls found in code.")
    
    return found_calls

def check_method_signatures():
    """Check if update_application method signatures match"""
    print(f"\n🔍 Checking method signatures...")
    
    # Look for the update_application method definition
    pattern = r'def update_application\([^)]*\)'
    
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        matches = re.findall(pattern, content)
                        if matches:
                            print(f"📋 {file_path}:")
                            for match in matches:
                                print(f"   {match}")
                except:
                    pass

if __name__ == "__main__":
    find_all_update_calls()
    check_method_signatures()