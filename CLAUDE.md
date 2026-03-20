# CEO Support App - Project Context

## Project Overview
A personal productivity tool for idea capture, document editing, and AI-assisted content management. Supports Mac + iPhone with voice-first input.

## Core Features
1. **Voice Input** - Capture ideas anywhere (walking, driving, in bed)
2. **Dual Platform** - Mac desktop + iPhone mobile (PWA)
3. **AI Document Editing** - ChatGPT/Claude integration
4. **Bilingual Support** - Chinese/English with editable translations
5. **Typography** - Auto-formatting (spaces between Chinese/English/numbers)
6. **Grammar Check** - Logic clarity and verification
7. **Mind Maps** - Document structure visualization

## Architecture
```
Frontend: PWA (iPhone) + Native/SwiftUI (Mac)
Backend: Python FastAPI
AI: OpenAI Whisper + GPT-4 + Claude
Database: SQLite (local) / PostgreSQL (cloud)
Sync: iCloud / Git-based
```

## Key Files
- `PLAN.md` - Full implementation plan
- `CLAUDE.md` - This file (project context)
- `PROGRESS.md` - Lessons learned
- `dev-tasks.json` - Task queue for Claude instances
- `src/` - Source code directory

## Development Guidelines
1. Run tests before committing
2. Document patterns in PROGRESS.md
3. Use conventional commit messages
4. Keep functions under 50 lines
5. Add type hints for Python code

## Git Workflow
- Main branch: protected
- Feature branches via worktree
- Rebase strategy

## Voice Input Scenarios
- Walking on the street
- Driving (FSD mode)
- In Uber/taxi
- At restaurant waiting
- In bed before sleep
- On airplane

## Typography Rules
- Add space between Chinese and Latin characters
- Add space between Chinese and numbers
- Normalize quotes (Chinese vs English)
- Fix punctuation spacing
