Analyze and fix GitHub issue: $ARGUMENTS

## Workflow

### 1. Fetch Issue Details
Use `gh issue view $ARGUMENTS` to get:
- Issue title and description
- Labels and assignees
- Related PRs or commits
- User-provided reproduction steps

### 2. Understand the Problem
- Identify the root cause (bug, feature request, enhancement)
- Determine affected files/components
- Check if issue is reproducible locally

### 3. Search Codebase
Use ripgrep to find relevant code:
```bash
# Find component/function mentioned in issue
rg -n "export (function|const) ComponentName" app components

# Find error messages
rg -n "error message text" app components lib

# Find related functionality
rg -n "keyword from issue" app components lib
```

### 4. Read Relevant CLAUDE.md Files
- Check `CLAUDE.md` in affected directories for established patterns
- Follow coding conventions and anti-patterns guidance
- Reference JIT index for quick navigation

### 5. Implement Fix
- Follow TypeScript strict mode
- Add/update Zod validation if input-related
- Maintain consistency with existing patterns
- Add comments explaining fix if non-obvious

### 6. Write/Update Tests
- Add test case reproducing the bug (if bug fix)
- Verify fix with test: `bun test <test-file>` (when tests exist)
- Update existing tests if behavior changed

### 7. Validate Fix
Run quality checks:
```bash
bunx tsc --noEmit       # Type check
bun run lint            # Linting
bun run build           # Build verification
bun run dev             # Manual testing
```

### 8. Create Commit
Use Conventional Commits format:
```bash
git add .
git commit -m "fix: [issue #$ARGUMENTS] brief description

Resolves #$ARGUMENTS

- Specific change 1
- Specific change 2

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 9. Push and Create PR
```bash
git push -u origin $(git branch --show-current)

gh pr create --title "Fix: [Issue #$ARGUMENTS] brief description" --body "$(cat <<'EOF'
## Summary
Fixes #$ARGUMENTS

## Changes
- Change 1
- Change 2

## Testing
- [ ] Type check passes
- [ ] Lint passes
- [ ] Build succeeds
- [ ] Manual testing complete
- [ ] Issue reproduction no longer occurs

## Screenshots (if UI change)
[Add before/after screenshots]

🤖 Generated with Claude Code
EOF
)"
```

## Important Reminders

- Reference issue number in commit and PR: `Fixes #123`
- Follow existing code patterns (see CLAUDE.md in affected directories)
- Run all quality gates before pushing
- Add tests if testing framework exists
- Update documentation if behavior changed
