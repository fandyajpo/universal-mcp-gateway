Read and follow strictly:

1. PROJECT_CONSTITUTION.md
2. AI_INSTRUCTIONS.md
3. STATUS.md
4. NEXT_STEP.md
5. IMPLEMENTATION_ORDER.md

---

## TARGET TASK

Implement ONLY:

docs/implementation/phase-01/01.07-web-layout.md

---

## SCOPE RULE (VERY IMPORTANT)

You are ONLY allowed to modify:

- files explicitly listed in "Files to Create"
- files explicitly listed in "Files to Modify"
- direct dependencies required to complete THIS step ONLY

Do NOT:

- refactor unrelated modules
- restructure packages
- modify architecture outside scope
- implement future steps
- optimize unrelated code

---

## DEPENDENCY DISCOVERY RULE

Only trace dependencies that are:

- directly imported by target step
- or explicitly mentioned in the step documentation

Do NOT expand dependency graph beyond 1 level unless required for compilation.

---

## IMPLEMENTATION RULES

- Follow repository architecture strictly
- Follow package boundaries strictly
- Use existing utilities before creating new ones
- Do not duplicate logic, types, or schemas
- Use Zod validation where applicable
- Use shared logger
- Keep business logic out of route handlers

---

## EXECUTION STEPS

1. Read target step file
2. Understand required changes
3. Identify minimal affected files
4. Implement changes
5. Ensure no unrelated modifications

---

## VERIFICATION

Run:

- lint
- typecheck
- build

Fix only issues related to THIS step.

---

## OUTPUT

After completion, provide:

- Summary of implementation
- Files created
- Files modified
- Architectural decisions
- Trade-offs
- Any introduced technical debt

---

## STATE UPDATE

Update:

- STATUS.md
- NEXT_STEP.md
- ROADMAP.md (if progress changes)

---

## FINAL RULE

Stop immediately after completion. Do not continue to next step.
