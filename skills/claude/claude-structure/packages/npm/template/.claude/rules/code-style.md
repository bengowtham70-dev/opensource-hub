# Code Style Guide

## General
- Use 2-space indentation
- Max line length: 100 characters
- Use single quotes for strings (JS/TS)
- Always use trailing commas in multi-line structures

## Naming Conventions
- Variables & functions: `camelCase`
- Classes & types: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- File names: `kebab-case`

## TypeScript
- Always define explicit return types for public functions
- Prefer `interface` over `type` for object shapes
- Avoid `any`; use `unknown` when type is uncertain

## Python
- Follow PEP 8
- Use type hints for all function signatures
- Prefer f-strings over `.format()`

## Comments
- Write comments explaining *why*, not *what*
- Use JSDoc / docstrings for public APIs
