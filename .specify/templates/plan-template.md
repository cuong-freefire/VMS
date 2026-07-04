# **LANGUAGE**: This specification must be written in Vietnamese with technical terms kept in English (e.g., upload, API, endpoint, authentication, OAuth, cache, session, commit, merge, rollback, validate, etc.).

# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]

**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

## Implementation Phases

### Phase 0: Research & Verification (READ-ONLY)

**Objective**: [Describe research scope and verification tasks]

**Tasks**:

1. [Research task 1]
2. [Research task 2]
3. [Research task N]

**Output**: `research.md` file with technical findings and architecture decisions

---

### Phase 1: Design & Contracts (READ-ONLY)

**Objective**: [Describe design scope and deliverables]

**Tasks**:

1. **Data Model** - [Describe schema design]
2. **API Contracts** - [Describe endpoint design]
3. **Service Contracts** - [Describe business logic interface]
4. **Quick Start Guide** - [Describe developer guide]

**Output**: 4 files (`data-model.md`, `contracts/api-contract.md`, `contracts/service-contract.md`, `quickstart.md`)

---

### Phase 2: Implementation Planning (READY FOR APPROVAL)

**Objective**: Break down implementation into atomic tasks

**Note**: Phase này sẽ được thực hiện bằng command `/speckit-tasks` sau khi plan được approve

**Expected Output**: `tasks.md` với atomic task breakdown:

- Task 1: [First task]
- Task 2: [Second task]
- Task N: [Nth task]

**Dependencies**: [Describe dependency chain and execution order]

---

## Risk Assessment

### HIGH RISK

- **[Risk Title]**: [Description]. Risk: [Impact]. 
  - **Mitigation**: [How to mitigate]

### MEDIUM RISK

- **[Risk Title]**: [Description]. Risk: [Impact].
  - **Mitigation**: [How to mitigate]

### LOW RISK

- **[Risk Title]**: [Description]. Risk: [Impact].
  - **Mitigation**: [How to mitigate]

---

## Success Criteria Review

Mapping từ spec.md Success Criteria sang implementation deliverables:

- **SC-001** [Success Criterion]: [How to verify - test method/acceptance criteria]
- **SC-002** [Success Criterion]: [How to verify - test method/acceptance criteria]
- **SC-N** [Success Criterion]: [How to verify - test method/acceptance criteria]

---

## Deployment Checklist

Trước khi merge vào main branch:

- [ ] [Checklist item 1]
- [ ] [Checklist item 2]
- [ ] [Checklist item N]

---

## Next Steps

1. [Action item 1 - e.g., Review plan này]
2. [Action item 2 - e.g., Clarify decision]
3. [Action item 3 - e.g., Phase 0 execution]
4. [Action item 4 - e.g., Run /speckit-tasks]
5. [Action item N]

## Questions for Stakeholders

1. **[Question Title]**: [Question description]
   - **Context**: [Why this matters]
   - **Options**: (A) [Option A], (B) [Option B], (C) [Option C]
   - **Recommendation**: [Suggested choice]

2. **[Question Title]**: [Question description]
   - **Context**: [Why this matters]
   - **Options**: (A) [Option A], (B) [Option B]
   - **Recommendation**: [Suggested choice]

3-N. [Additional questions]

---

**Plan Status**: READY FOR REVIEW  
**Estimated Effort**: [X-Y hours] ([breakdown: Phase 0: X h, Phase 1: Y h, Phase 2: Z h])  
**Priority**: [P0/P1/P2/P3]
