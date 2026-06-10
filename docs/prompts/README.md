# Prompts

This directory contains system prompts, prompt templates, and prompt engineering documentation.

## Structure

- `system/` — System prompts for AI agents and assistants
- `templates/` — Reusable prompt templates with variable slots
- `guides/` — Prompt engineering guidelines and best practices

## Security

- User input is always placed in `{user_input}` slots, never concatenated
- System prompts are immutable at runtime
- Prompt injection testing is part of the CI pipeline
- All prompts are versioned and audited
