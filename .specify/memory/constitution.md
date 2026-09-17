<!--
Sync Impact Report
- Version change: 0.0.0 (Unratified Template) → 1.0.0
- List of modified principles:
  * [PRINCIPLE_1_NAME] → I. Decoupled Modular Monolith & Strict Typing
  * [PRINCIPLE_2_NAME] → II. English-Only Codebase & Ubiquitous Language
  * [PRINCIPLE_3_NAME] → III. Clean & Minimalist Interface (UI/UX)
  * [PRINCIPLE_4_NAME] → IV. SOLID, Clean Code & DRY Discipline
  * [PRINCIPLE_5_NAME] → V. Spec-Driven TDD with Real Acceptance Testing (NON-NEGOTIABLE)
- Added sections:
  * Architectural & Quality Standards
  * Development Workflow & Quality Gates
- Removed sections:
  * None (all template placeholders replaced with concrete definitions)
- Templates requiring updates:
  * .specify/templates/plan-template.md (✅ updated)
  * .specify/templates/tasks-template.md (✅ updated)
  * .specify/templates/spec-template.md (✅ verified/aligned)
- Follow-up TODOs:
  * None. All placeholders resolved.
-->

# Document Compressor Constitution

## Core Principles

### I. Decoupled Modular Monolith & Strict Typing
- **Modular Monolith**: The project MUST be structured as a single deployable monolith partitioned into distinct, domain-bounded modules with high cohesion and loose coupling. Direct cross-module internal access or circular dependencies are strictly forbidden.
- **Contract-Driven Communication**: Inter-module interactions MUST occur solely through explicit public interfaces, abstract contracts, or domain events. Low-level implementation details must remain private to their respective module boundaries.
- **Strict Static Typing**: The entire codebase MUST enforce strict, static typing across all layers. Dynamic escape hatches (`any`, untyped dictionaries/maps, untyped function signatures, implicit type coercion) are forbidden. All data structures, domain models, inputs, outputs, and interface contracts MUST declare explicit type annotations verified by static type analyzers at build/test time.
- **Rationale**: A modular monolith avoids distributed systems overhead while ensuring modular isolation, maintainability, and clean boundaries. Strict typing eliminates an entire category of runtime type errors, guarantees predictable data shapes, and acts as self-verifying documentation.

### II. English-Only Codebase & Ubiquitous Language
- **English Discipline**: All artifacts in the repository—including source code, directory structures, module/class/function identifiers, variables, comments, docstrings, unit/integration tests, commit messages, and engineering documentation—MUST be written exclusively in English.
- **Ubiquitous Language**: Domain terminology (e.g., compression profiles, document pipelines, artifacts, chunking, telemetry) MUST be unambiguous, rigorously defined, and used consistently across specifications, user stories, and code.
- **Rationale**: Standardizing on English guarantees ecosystem interoperability, seamless developer collaboration, consistency with external tooling and libraries, and eliminates cognitive dissonance from multi-language translation.

### III. Clean & Minimalist Interface (UI/UX)
- **Minimalist Aesthetic & Focus**: The user interface MUST be distraction-free, clean, and minimalist. Every visual element, action button, and control MUST serve a direct, essential user objective.
- **Frictionless Workflow**: The core user journey (document selection/drag-and-drop, compression settings, live progress, before/after metrics, and download) MUST require minimal steps, providing intuitive defaults and zero cognitive clutter.
- **Immediate & Informative Feedback**: The UI MUST provide clear, immediate, and unambiguous status feedback for asynchronous operations (e.g., real-time progress, compression percentage, file size delta) and present explicit, human-friendly error messages when failures occur.
- **Accessibility & Consistency**: UI components MUST uphold strict visual hierarchy, predictable spacing, responsive layout, and standard accessibility (WCAG AA) compliance.
- **Rationale**: High-utility productivity tools like document compressors excel when they are fast, intuitive, and unobtrusive, allowing users to achieve their compression goals without unnecessary interaction friction.

### IV. SOLID, Clean Code & DRY Discipline
- **SOLID Adherence**:
  - **Single Responsibility (SRP)**: Each class, module, and function MUST have one, and only one, reason to change.
  - **Open/Closed (OCP)**: Components MUST be open for extension (e.g., plugging in new document format compressors or algorithms) but closed for modification.
  - **Liskov Substitution (LSP)**: Any subclass or interface implementation MUST be swappable without altering the correctness or expected behavior of the system.
  - **Interface Segregation (ISP)**: Interfaces MUST be small, focused, and client-specific. No client should be forced to depend on methods it does not consume.
  - **Dependency Inversion (DIP)**: High-level business policies and use cases MUST NOT depend on low-level infrastructure, file systems, or third-party compression utilities; both MUST depend on explicit abstractions.
- **Clean Code Standards**: Code MUST be readable, self-explanatory, and concise. Functions MUST be small, perform a single task, and have no hidden side effects. Magic numbers, arbitrary constants, and deeply nested logic are prohibited.
- **DRY (Don't Repeat Yourself)**: Domain logic, validation rules, algorithms, and schemas MUST have a single, authoritative source of truth. Common logic MUST be shared through modular composition without introducing premature or overly complex abstractions.
- **Rationale**: Rigorous software craftsmanship prevents technical debt, simplifies maintenance, accelerates feature velocity, and ensures long-term system stability.

### V. Spec-Driven TDD with Real Acceptance Testing (NON-NEGOTIABLE)
- **Mandatory TDD Cycle**: Development MUST strictly follow the Test-Driven Development (Red-Green-Refactor) lifecycle. Automated tests MUST be written and proven to fail before any production code is written. Implementation code is written only to turn failing tests green, followed by refactoring under test safety.
- **Spec-Grounded Acceptance Tests**: Tests MUST directly trace to and validate the acceptance scenarios and user stories defined in feature specifications (`spec.md`). Each acceptance scenario (`Given-When-Then`) must correspond to concrete automated test cases.
- **Real Tests Over Artificial Mocks**: Tests MUST execute against real inputs, document streams, and actual algorithms wherever feasible. Fictitious or placebo mocks that merely test internal mock configurations are strictly prohibited. Mocking is restricted exclusively to external network boundaries or third-party cloud services. File transformations, parsers, and compression pipelines MUST be tested using authentic document fixtures (valid, boundary, and corrupted).
- **Test Integrity**: Test suites MUST be deterministic, fast, isolated, and maintained with the same clean code standards as production code. Tests must fail when business requirements or compression contracts break.
- **Rationale**: Spec-grounded TDD guarantees that implementation perfectly mirrors validated specifications. Real tests eliminate false positives caused by mock drifting and guarantee software reliability under genuine execution conditions.

## Architectural & Quality Standards

- **Layered Architecture within Modules**: Each domain module inside the monolith MUST separate concerns into distinct layers: Domain (entities, value objects, business rules), Application (use cases, workflow orchestration), Infrastructure (file storage, compression engine adapters, external integrations), and Presentation (UI/CLI/API).
- **Zero Untyped Code Policy**: Static analysis and type checking MUST be executed in strict mode with zero tolerance for untyped definitions, suppressed type warnings, or implicit `any`.
- **Resource Management & Streaming**: Document processing MUST be resource-aware, utilizing streams or chunked processing for large files to avoid memory exhaustion, and guaranteeing deterministic cleanup of temporary working files.
- **Resilient Error Handling**: Error conditions MUST be expressed through strongly-typed domain errors or result patterns. Errors MUST never be silently swallowed or caught with generic, untyped catch-alls.

## Development Workflow & Quality Gates

- **Phase Sequence**: Every feature MUST proceed through the standard workflow: Specification (`spec.md`) → Plan & Architecture (`plan.md`) → Task Breakdown (`tasks.md`) → Implementation via TDD (`Red-Green-Refactor`).
- **Gated Progression**:
  1. *Specification Gate*: Feature specs must define prioritized user stories, measurable acceptance criteria, and edge cases before architecture planning.
  2. *Constitution Gate*: Implementation plans must verify compliance against all five core principles.
  3. *TDD Task Gate*: In `tasks.md`, test creation tasks MUST be placed before implementation tasks and executed first.
  4. *Quality & Verification Gate*: Before merging, the codebase MUST pass: (a) 100% clean static type checking, (b) 100% clean linter checks, and (c) all real acceptance, contract, and unit tests.

## Governance

- **Supreme Authority**: This Constitution is the primary architectural and development authority for the Document Compressor repository. Its rules supersede ad-hoc development practices or personal preferences.
- **Amendment Procedure**: Any proposed amendment to this Constitution must be formally documented with explicit rationale, reviewed for architectural impact, propagated to all dependent templates and active specifications, and ratified with an updated version number.
- **Semantic Versioning Policy**:
  - **MAJOR (X.0.0)**: Removal, fundamental redefinition, or backward-incompatible restructuring of core principles or governance rules.
  - **MINOR (1.X.0)**: Addition of new principles, architectural sections, or substantial expansion of guidance without invalidating existing rules.
  - **PATCH (1.0.X)**: Minor wording adjustments, typo corrections, formatting improvements, or non-semantic clarifications.
- **Compliance Reviews**: All feature specifications, architecture plans, and code reviews MUST explicitly reference and verify compliance with this Constitution.

**Version**: 1.0.0 | **Ratified**: 2026-09-17 | **Last Amended**: 2026-09-17
