Pre-PR validation checklist - ensures code is ready for pull request.

## Automated Checks

Run the full quality gate:
```bash
bunx tsc --noEmit && bun run lint && bun run build
```

Wait for all checks to complete. Address any errors before proceeding.

---

## Manual Testing Checklist

### Core Functionality
- [ ] **Dev server starts**: `bun run dev` runs without errors
- [ ] **Production build succeeds**: `bun run build` completes successfully
- [ ] **No console errors**: Check browser console for errors/warnings
- [ ] **No TypeScript errors**: `bunx tsc --noEmit` passes
- [ ] **Linting passes**: `bun run lint` reports no issues

### Feature-Specific Testing

#### SRT Upload & Processing
- [ ] Upload valid SRT file (< 430 KB)
- [ ] Verify file parsing works correctly
- [ ] Check file size validation (try > 430 KB file)
- [ ] Test invalid file format handling

#### AI Timestamp Generation
- [ ] Click "Generate Timestamps" button
- [ ] Verify streaming starts immediately
- [ ] Check timestamps display correctly line-by-line
- [ ] Confirm generation completes without errors
- [ ] Test error handling (invalid API key, network failure)

#### UI & Theming
- [ ] Toggle dark/light theme - verify styles correct
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Check all interactive elements (buttons, inputs, tooltips)
- [ ] Verify loading states show during operations
- [ ] Confirm error messages are user-friendly

### Code Quality Review

#### TypeScript & Patterns
- [ ] No `any` types without justification
- [ ] No `@ts-ignore` comments (fix types instead)
- [ ] Absolute imports used (`@/components`, `@/lib`)
- [ ] Server-side code not imported in client components
- [ ] `"use client"` directive only when needed

#### Security & Secrets
- [ ] No API keys or secrets in code
- [ ] No sensitive data in logs
- [ ] Zod validation on all user inputs (client + server)
- [ ] File size limits enforced

#### Code Organization
- [ ] Functions under 50 lines (extract complex logic)
- [ ] Components properly separated (feature vs UI)
- [ ] Utilities in `lib/`, not scattered
- [ ] Comments explain "why", not "what"

### Documentation

- [ ] **CLAUDE.md updated** if new patterns introduced
- [ ] **README updated** if user-facing features changed
- [ ] **Comments added** for complex logic
- [ ] **Commit message** follows Conventional Commits format

---

## Git Status Check

Run: `git status`

Verify:
- [ ] All intended changes are staged
- [ ] No unintended files included (`.env.local`, `bun.lock` unless intentional)
- [ ] No merge conflicts

---

## Commit Message Template

If not already committed:
```bash
git add .
git commit -m "type: brief description

Detailed explanation if needed.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`

---

## Create Pull Request

```bash
gh pr create --title "Type: Brief description" --body "$(cat <<'EOF'
## Summary
Brief overview of changes.

## Changes
- Change 1
- Change 2

## Testing
- [x] Type check passes
- [x] Lint passes
- [x] Build succeeds
- [x] Manual testing complete
- [x] All checklist items above verified

## Screenshots (if UI changes)
[Add screenshots here]

🤖 Generated with Claude Code
EOF
)"
```

---

## Final Confirmation

✅ **All automated checks pass**
✅ **Manual testing complete**
✅ **Code reviewed for quality**
✅ **Documentation updated**
✅ **Commit message clear**

**Ready to create PR!** 🚀
