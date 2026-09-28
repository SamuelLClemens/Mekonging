#!/usr/bin/env python3
"""Guard for js/data/firstaid.js: every `srcs` number in FIRSTAID_TOPICS must resolve to a
real entry in FIRSTAID_SOURCES, every source must be numbered exactly once and in sequence,
and every source must actually be cited by at least one topic (an unused source is dead
weight, and a source only found by number could be one nobody re-checked).

Usage: python3 scripts/check-firstaid.py
"""
import json
import re
import sys

PATH = 'js/data/firstaid.js'


def extract_array(text, name):
    m = re.search(rf'export const {name} = (\[.*?\n\]);', text, re.S)
    if not m:
        sys.exit(f'FAIL: could not find {name} in {PATH}')
    return m.group(1)


def main():
    text = open(PATH, encoding='utf-8').read()

    # Sources: pull every `n: N` at the start of an object.
    src_block = extract_array(text, 'FIRSTAID_SOURCES')
    src_nums = [int(n) for n in re.findall(r'\{\s*n:\s*(\d+)', src_block)]
    dupes = {n for n in src_nums if src_nums.count(n) > 1}
    if dupes:
        sys.exit(f'FAIL: duplicate source numbers: {sorted(dupes)}')
    expected = list(range(1, len(src_nums) + 1))
    if sorted(src_nums) != expected:
        missing = sorted(set(expected) - set(src_nums))
        extra = sorted(set(src_nums) - set(expected))
        sys.exit(f'FAIL: source numbering has gaps or is out of sequence. missing={missing} unexpected={extra}')
    print(f'PASS: {len(src_nums)} sources, numbered 1..{len(src_nums)} with no gaps or duplicates.')

    # Every source needs both org and url, and url must look like a real http(s) link.
    src_objs = re.findall(r'\{\s*n:\s*\d+,\s*org:\s*(".*?"|\'.*?\'),\s*url:\s*(".*?"|\'.*?\')\s*\}', src_block)
    if len(src_objs) != len(src_nums):
        sys.exit(f'FAIL: {len(src_nums)} numbered sources but only {len(src_objs)} matched the full org+url pattern — check for a malformed entry.')
    bad_urls = [u for _, u in src_objs if not re.match(r'^["\']https?://', u)]
    if bad_urls:
        sys.exit(f'FAIL: source(s) with a non-http(s) url: {bad_urls}')

    # Topics: pull every `srcs: [...]` array.
    topics_block = extract_array(text, 'FIRSTAID_TOPICS')
    topic_ids = re.findall(r"id:\s*'([a-z0-9-]+)'", topics_block)
    dupe_ids = {i for i in topic_ids if topic_ids.count(i) > 1}
    if dupe_ids:
        sys.exit(f'FAIL: duplicate topic ids: {sorted(dupe_ids)}')
    srcs_lists = re.findall(r'srcs:\s*\[([\d,\s]+)\]', topics_block)
    if len(srcs_lists) != len(topic_ids):
        sys.exit(f'FAIL: {len(topic_ids)} topics but {len(srcs_lists)} `srcs:` arrays — every topic must cite at least one source.')

    cited = set()
    empty_topics = []
    for tid, raw in zip(topic_ids, srcs_lists):
        nums = [int(n) for n in re.findall(r'\d+', raw)]
        if not nums:
            empty_topics.append(tid)
            continue
        for n in nums:
            if n not in expected:
                sys.exit(f'FAIL: topic "{tid}" cites source {n}, which does not exist (valid range 1..{len(expected)}).')
            cited.add(n)
        if len(nums) < 4:
            print(f'WARN: topic "{tid}" cites only {len(nums)} source(s) — below the 5-source bar (may be acceptable for a narrow procedural point; verify by eye).')
    if empty_topics:
        sys.exit(f'FAIL: topic(s) with an empty srcs list: {empty_topics}')

    unused = sorted(set(expected) - cited)
    if unused:
        sys.exit(f'FAIL: source(s) never cited by any topic: {unused}')

    print(f'PASS: {len(topic_ids)} topics, all citing only valid source numbers, every source used at least once.')

    sections_block = extract_array(text, 'FIRSTAID_SECTIONS')
    section_ids = set(re.findall(r"id:\s*'([a-z]+)'", sections_block))
    topic_sections = re.findall(r"section:\s*'([a-z]+)'", topics_block)
    bad_sections = sorted({s for s in topic_sections if s not in section_ids})
    if bad_sections:
        sys.exit(f'FAIL: topic(s) reference section id(s) not in FIRSTAID_SECTIONS: {bad_sections}')
    print(f'PASS: every topic\'s section id is a real section ({sorted(section_ids)}).')


if __name__ == '__main__':
    main()
