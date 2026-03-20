# CEO Support App - Implementation Plan

> Based on the article "我给 10 个 Claude Code 打工" by 胡渊鸣 (Ethan Hu)
> Source: https://mp.weixin.qq.com/s/9qPD3gXj3HLmrKC64Q6fbQ

---

## Section 1: System Architecture

### 1.1 Overview

The CEO Support App is a personal productivity tool designed for idea capture, document editing, and AI-assisted content management. It supports dual platforms (Mac + iPhone) with voice-first input capabilities.

### 1.2 Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Voice Input | Capture ideas anywhere (walking, driving, in bed, etc.) | P0 |
| Dual Platform | Mac desktop + iPhone mobile support | P0 |
| AI Document Editing | ChatGPT/Claude integration for agentic editing | P0 |
| Bilingual Support | Chinese/English with editable translations | P1 |
| Typography | Auto-formatting (spaces between Chinese/English/numbers) | P1 |
| Grammar Check | Logic clarity and grammar verification | P1 |
| Mind Maps | Document structure visualization | P2 |

### 1.3 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────┬───────────────────────────────────────┤
│     Mac Desktop App     │          iPhone App (PWA)             │
│   - Native/Electron     │    - Safari wrapped as App            │
│   - Full keyboard       │    - Voice input focus                │
│   - Local storage       │    - Offline-first                    │
└─────────────────────────┴───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SYNC LAYER                                  │
│   - iCloud/Git-based sync                                        │
│   - Conflict resolution                                          │
│   - Real-time collaboration (optional)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                               │
├─────────────────────────┬───────────────────────────────────────┤
│   Claude Code Manager   │         AI Integration                │
│   - Task dispatch       │    - OpenAI API (ChatGPT)             │
│   - Worktree management │    - Anthropic API (Claude)           │
│   - Progress tracking   │    - Translation services             │
└─────────────────────────┴───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│   - SQLite (local) / PostgreSQL (cloud)                         │
│   - File storage (documents, images)                            │
│   - Vector store (for AI context)                               │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Tech Stack Recommendation

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend (Mac)** | Swift/SwiftUI or Electron | Native performance vs cross-platform |
| **Frontend (iPhone)** | PWA (Safari wrapper) | Quick deployment, offline support |
| **Backend** | Python/FastAPI | Claude Code friendly, AI ecosystem |
| **Voice** | OpenAI Whisper API | High accuracy, multilingual |
| **AI** | OpenAI GPT-4 + Anthropic Claude | Best-in-class for editing/translation |
| **Database** | SQLite (local) + PostgreSQL (sync) | Offline-first with cloud backup |
| **Sync** | iCloud / Git-based | Leverage existing infrastructure |

### 1.5 Data Models

```yaml
Document:
  id: UUID
  title: String
  content_zh: Text  # Chinese version
  content_en: Text  # English version
  created_at: Timestamp
  updated_at: Timestamp
  voice_recording_id: UUID?  # Original voice memo
  mind_map_data: JSON?       # Structure visualization
  tags: [String]
  status: Enum(draft, review, final)

VoiceRecording:
  id: UUID
  audio_url: String
  transcript: Text
  language: Enum(zh, en, mixed)
  created_at: Timestamp
  document_id: UUID?

AIEditSession:
  id: UUID
  document_id: UUID
  prompt: Text
  response: Text
  model: String
  created_at: Timestamp
```

### 1.6 API Design

```
POST   /api/voice/transcribe     # Voice to text
POST   /api/documents            # Create document
GET    /api/documents/:id        # Get document
PUT    /api/documents/:id        # Update document
POST   /api/documents/:id/ai     # AI edit/translate
POST   /api/documents/:id/mindmap # Generate mind map
GET    /api/sync/status          # Check sync status
POST   /api/sync/push            # Push local changes
GET    /api/sync/pull            # Pull remote changes
```

---

## Section 2: Implementation Plan

### Phase 0: Infrastructure Setup (Week 1)

#### Task 0.1: Development Environment
- [ ] Set up Git repository with CLAUDE.md for AI context
- [ ] Configure Git worktree for parallel development
- [ ] Create PROGRESS.md for tracking lessons learned
- [ ] Set up CI/CD pipeline (GitHub Actions)

#### Task 0.2: Claude Code Manager
- [ ] Build web-based task dispatcher (Python + FastAPI)
- [ ] Implement `claude -p --dangerously-skip-permissions --output-format stream-json`
- [ ] Create task queue (dev-tasks.json with file locking)
- [ ] Build monitoring dashboard for Claude instances

**Key files from article:**
```
.claude/
├── CLAUDE.md          # Project context for AI
├── PROGRESS.md        # Lessons learned
├── dev-tasks.json     # Task queue
├── dev-task.lock      # File lock
└── api-key.json       # API credentials
```

---

### Phase 1: MVP - Voice to Document (Weeks 2-3)

#### Task 1.1: Voice Input System
**Dependencies:** Phase 0 complete
- [ ] Integrate OpenAI Whisper API for transcription
- [ ] Build voice recording UI (iPhone Safari)
- [ ] Handle offline recording with queue sync
- [ ] Support mixed Chinese/English detection

**Effort:** 3-4 days
**Risk:** API rate limits, accuracy in noisy environments

#### Task 1.2: Document Storage
- [ ] Design SQLite schema for documents
- [ ] Implement CRUD operations
- [ ] Build document list/detail views
- [ ] Add search functionality

**Effort:** 2-3 days

#### Task 1.3: Basic AI Integration
- [ ] Connect to ChatGPT API for text improvement
- [ ] Build prompt templates for:
  - Grammar correction
  - Logic clarity check
  - Tone adjustment
- [ ] Create diff view for AI suggestions

**Effort:** 2-3 days

---

### Phase 2: Bilingual Support (Weeks 4-5)

#### Task 2.1: Translation Pipeline
**Dependencies:** Phase 1 complete
- [ ] Implement bidirectional translation (zh↔en)
- [ ] Create parallel editing interface
- [ ] Allow manual translation overrides
- [ ] Track translation confidence scores

**Effort:** 4-5 days
**Risk:** Translation quality, context preservation

#### Task 2.2: Typography Engine
- [ ] Build text formatter rules:
  - Add space between Chinese and Latin characters
  - Add space between Chinese and numbers
  - Normalize quote styles (Chinese vs English)
  - Fix punctuation spacing
- [ ] Create auto-format on save/paste
- [ ] Allow manual format toggle

**Effort:** 2 days

---

### Phase 3: Advanced Features (Weeks 6-8)

#### Task 3.1: Mind Map Generation
**Dependencies:** Phase 2 complete
- [ ] Extract document structure (headings, sections)
- [ ] Generate mind map JSON data
- [ ] Build interactive visualization (D3.js or Mermaid)
- [ ] Allow manual structure editing

**Effort:** 4-5 days

#### Task 3.2: Mac Desktop App
- [ ] Build native Mac app (SwiftUI or Electron)
- [ ] Implement keyboard shortcuts
- [ ] Add menu bar quick capture
- [ ] Enable local file export (Markdown, PDF)

**Effort:** 5-7 days

#### Task 3.3: Sync System
- [ ] Implement iCloud sync for Apple ecosystem
- [ ] Build conflict resolution (last-write-wins + manual merge)
- [ ] Add offline queue with retry logic
- [ ] Create sync status indicators

**Effort:** 4-5 days

---

### Phase 4: Polish & Optimization (Weeks 9-10)

#### Task 4.1: Performance Optimization
- [ ] Implement lazy loading for documents
- [ ] Add caching for AI responses
- [ ] Optimize voice transcription (streaming)
- [ ] Reduce app bundle size

#### Task 4.2: User Experience
- [ ] Add onboarding tutorial
- [ ] Create keyboard shortcut reference
- [ ] Build settings/preferences panel
- [ ] Add dark mode support

#### Task 4.3: Testing & Documentation
- [ ] Write unit tests (80%+ coverage)
- [ ] Create integration tests
- [ ] Document API endpoints
- [ ] Write user guide

---

## Section 3: Agentic Development Workflow

### 3.1 Claude Code Configuration

```markdown
# CLAUDE.md Template

## Project Overview
CEO Support App - Personal productivity tool with voice input and AI-assisted document editing.

## Architecture
- Frontend: PWA (iPhone) + Native (Mac)
- Backend: Python FastAPI
- AI: OpenAI + Anthropic APIs
- Database: SQLite local / PostgreSQL cloud

## Key Files
- CLAUDE.md: This file - project context
- PROGRESS.md: Lessons learned and patterns
- dev-tasks.json: Task queue for Claude instances
- src/: Source code directory

## Development Guidelines
1. Always run tests before committing
2. Document new patterns in PROGRESS.md
3. Use conventional commit messages
4. Keep functions under 50 lines
5. Add type hints for all Python code

## Git Workflow
- Main branch: protected, requires PR
- Feature branches: auto-created via worktree
- Rebase strategy for clean history
```

### 3.2 Git Worktree Parallelization

```
# Architecture from article
┌─────────────────────────────────────────┐
│     Parallel Development Workflow        │
├─────────────────────────────────────────┤
│                                         │
│  Worker 1 (port 5200) → worktree-1      │
│  Worker 2 (port 5201) → worktree-2      │
│  Worker 3 (port 5202) → worktree-3      │
│  ...                                    │
│                                         │
│  Shared via symlink:                    │
│  - dev-tasks.json (task queue)          │
│  - dev-task.lock (file lock)            │
│  - api-key.json (credentials)           │
│                                         │
│  ⚠️ NOT symlinked:                      │
│  - PROGRESS.md (edited in main repo)    │
└─────────────────────────────────────────┘
```

### 3.3 Conflict Resolution Protocol

```markdown
## Rebase Failure Handling
1. If "unstaged changes" error → commit or stash first
2. If merge conflicts:
   - `git status` to see conflict files
   - Read both sides, understand intent
   - Manually resolve (keep correct code)
   - `git add <resolved-files>`
   - `git rebase --continue`
3. Repeat until rebase complete

## Test Failure Handling
1. Run tests: `npm test` or `pytest`
2. Analyze error messages
3. Fix bugs in code
4. Re-run tests until all pass
5. Commit fix: `git commit -m "fix: ..."`

⚠️ Don't give up - must resolve issues before continuing
```

### 3.4 Experience Documentation

After each significant change, update PROGRESS.md:

```markdown
## [Date] - What was done

### Problem
What issue was encountered?

### Solution
How was it resolved?

### Prevention
How to avoid this in the future?

**Commit ID:** abc123
```

---

## Section 4: Testing Strategy

### 4.1 Unit Tests
- Voice transcription accuracy
- Typography formatting rules
- Translation bidirectional consistency
- Document CRUD operations

### 4.2 Integration Tests
- End-to-end voice → document flow
- AI edit suggestions acceptance
- Sync conflict resolution
- Offline mode handling

### 4.3 E2E Tests (Playwright)
- User journey: Record voice → Edit → Save
- Cross-platform sync verification
- Mobile Safari compatibility

---

## Section 5: Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| API rate limits | High | Implement caching, queue requests |
| Voice accuracy in noise | Medium | Offer manual edit, retry options |
| Sync conflicts | Medium | Clear conflict UI, merge tools |
| Translation quality | Medium | Allow manual overrides, confidence scores |
| Offline functionality | High | Queue-based sync, local-first design |

---

## Section 6: Success Metrics

### MVP Success Criteria
- [ ] Voice input works in 5+ scenarios (walking, driving, bed, etc.)
- [ ] Document syncs between Mac and iPhone within 30 seconds
- [ ] AI suggestions improve text quality (user rating 4/5+)
- [ ] App loads in under 2 seconds

### Full Release Success Criteria
- [ ] 95%+ voice transcription accuracy
- [ ] Translation quality rated 4/5+ by users
- [ ] Zero data loss in sync operations
- [ ] Mind maps generated for 100% of documents

---

## Appendix: Reference Images

### A. CEO Support App Interface
The app features a dark-themed mobile interface with:
- Text content display (articles, notes)
- Bottom navigation bar (Home, Messages, CEO Support, Tools, Profile)
- Voice input button (prominent)
- AI editing controls

### B. Git Worktree Architecture
Parallel Claude Code instances working in isolated worktrees:
- Each worker has isolated data directory
- Shared configuration via symlinks
- PROGRESS.md edited directly in main repo

### C. Conflict Handling Workflow
Structured process for:
- Rebase failure resolution
- Test failure debugging
- "Don't give up" principle - always resolve issues

---

*Generated: 2026-03-20*
*Based on: 胡渊鸣's "我给 10 个 Claude Code 打工"*
