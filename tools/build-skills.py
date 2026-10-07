#!/usr/bin/env python3
"""Merge content/<category>.json into skills.json (minified, with stable ids).

Each category file is a JSON array of
  {"c", "d": 30|60|120, "type": "study"|"do", "t", "desc", "check": [3], "a": [3] (study only)}
An entry's id is 10000 + 100*category_index + position, so appending to a
category keeps every existing id (and everyone's progress) intact.
Run from the repo root: python3 tools/build-skills.py
"""
import json, pathlib, sys

ORDER = ["pwn", "rev", "crypto", "forensics", "net", "linux", "kernel", "winint", "bsd", "dsa", "ctf",
         "geo", "history", "science", "space", "nature", "philosophy", "psychology", "mind", "lang",
         "money", "cube", "games", "life", "habit", "faith"]
root = pathlib.Path(__file__).resolve().parent.parent
out, problems = [], []
for ci, cat in enumerate(ORDER):
    f = root / "content" / f"{cat}.json"
    if not f.exists():
        problems.append(f"{cat}: missing {f.name}")
        continue
    for i, s in enumerate(json.loads(f.read_text())):
        where = f"{cat}[{i}]"
        if i >= 100:
            problems.append(f"{where}: more than 100 entries in one category")
        if s.get("c") != cat:
            problems.append(f"{where}: c is {s.get('c')!r}")
        if s.get("d") not in (30, 60, 120):
            problems.append(f"{where}: d is {s.get('d')!r}")
        if s.get("type") not in ("study", "do"):
            problems.append(f"{where}: type is {s.get('type')!r}")
        if not s.get("t") or not s.get("desc"):
            problems.append(f"{where}: empty title or desc")
        if len(s.get("check", [])) != 3:
            problems.append(f"{where}: needs 3 checks")
        if s.get("type") == "study" and len(s.get("a", [])) != 3:
            problems.append(f"{where}: study entry needs 3 answers")
        e = {"id": 10000 + 100 * ci + i, "c": cat, "d": s["d"], "type": s["type"], "t": s["t"].strip(),
             "desc": s["desc"].strip(), "check": [x.strip() for x in s["check"]]}
        if s["type"] == "study":
            e["a"] = [x.strip() for x in s["a"]]
        out.append(e)

titles = [s["t"].lower() for s in out]
for t in {t for t in titles if titles.count(t) > 1}:
    problems.append(f"duplicate title: {t}")
(root / "skills.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
print(f"{len(out)} skills -> skills.json")
for p in problems:
    print("  !", p)
sys.exit(1 if problems else 0)
