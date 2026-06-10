# Coding Standard

## Philosophy

Write code for humans to read. Optimize for clarity, consistency, and maintainability over cleverness or brevity.

## General Principles

- Favor readability over conciseness
- One responsibility per function, module, package
- Explicit over implicit
- Fail fast and loudly
- Composition over inheritance
- Small modules with clear interfaces

## Formatting

- 2-space indentation
- 100 character line limit
- LF line endings
- UTF-8 encoding
- Trailing comma on multiline statements
- Semicolons required
- Single quotes for strings (JS/TS), double quotes for attributes (HTML/JSX)

## Naming

- PascalCase: types, interfaces, enums, classes, components
- camelCase: variables, functions, methods, properties
- SCREAMING_SNAKE: constants, env vars
- kebab-case: filenames for config, directories
- Booleans: prefix with `is`, `has`, `should`, `can`
- Event handlers: prefix with `handle`
- Private methods: prefix with `#` (native private fields)

## File Organization

- One exported component/function per file (plus supporting utilities)
- Barrel `index.ts` re-exports only — no implementation
- Tests colocated: `module.test.ts`
- Directory per feature within packages

## Comments

- JSDoc on all public exports
- No comments on self-documenting code
- Comment WHY, not WHAT
- TODO comments must include issue reference
- No commented-out code — delete it
