# Branch Audit — 2026-07-28

Analysis of all branches, their relationship to `master`, and recommended
actions.

---

## Legend

| Status          | Meaning                                                      |
| --------------- | ------------------------------------------------------------ |
| ✅ **clean**    | No action needed                                             |
| ⚠️ **stale**    | Points to a commit already in `master`; branch label is dead |
| 🔶 **unmerged** | Contains commits not yet in `master`                         |
| 🧹 **cleanup**  | Minor fix available (rebased / squashed)                     |

---

## 1. `master`

**Status:** ✅ clean

| Head commit | `b07ad0a` — Mark Short-term #6 complete in ROADMAP |
| ----------- | -------------------------------------------------- |

The ROADMAP at `ROADMAP.md` still references `feature/development-roadmap` as
the active branch and describes a pre-tooling stack. These are stale since all
Short-term items (#1–#6) have been completed and merged. **Suggestion:** update
the "Current Status" section of ROADMAP.md once `feature/undo-redo` is merged.

---

## 2. Stale branches (already in `master`)

These branches have **0 unique commits** ahead of `master`. Their HEAD commit
already exists in `master`'s history. They add clutter but no risk.

| Branch                        | HEAD commit | Notes                 |
| ----------------------------- | ----------- | --------------------- |
| `feature/development-roadmap` | `9ec6e37`   | Initial roadmap draft |
| `feature/docs-pass`           | `b07ad0a`   | Points at master HEAD |
| `feature/vite-build`          | `b56fbcf`   | Short-term #4         |
| `feature/vitest-baseline`     | `23189b0`   | Short-term #3         |
| `feature/eslint-prettier`     | `eb8768c`   | Short-term #2         |
| `feature/jsconfig-typing`     | `3d53cd7`   | Short-term #5         |

**Recommendation:** 🧹 delete after confirming `git log master` includes each
HEAD commit (it does). Safe to remove at any time.

```bash
git branch -d feature/development-roadmap
git branch -d feature/docs-pass
git branch -d feature/vite-build
git branch -d feature/vitest-baseline
git branch -d feature/eslint-prettier
git branch -d feature/jsconfig-typing
```

---

## 3. Design-document branches (1 commit each, docs only)

All branch from `master` at `b07ad0a`, each adding one file under `docs/`.

| Branch                         | File                           | Lines |
| ------------------------------ | ------------------------------ | ----- |
| `feature/advanced-css-blocks`  | `docs/advanced-css-blocks.md`  | +120  |
| `feature/export-jsx-vue`       | `docs/export-jsx-vue.md`       | +111  |
| `feature/nested-components`    | `docs/nested-components.md`    | +115  |
| `feature/import-flow`          | `docs/import-flow.md`          | +106  |
| `feature/backend-sync`         | `docs/backend-sync.md`         | +120  |
| `feature/collab`               | `docs/collab.md`               | +115  |
| `feature/template-marketplace` | `docs/template-marketplace.md` | +106  |
| `feature/i18n-theming`         | `docs/i18n-theming.md`         | +100  |
| `feature/web-component-export` | `docs/web-component-export.md` | +112  |

**Recommendation:** 🔶 merge into `master` now — they are pure documentation,
zero code risk. After merging, delete the branches.

```bash
for b in \
  feature/advanced-css-blocks \
  feature/export-jsx-vue \
  feature/nested-components \
  feature/import-flow \
  feature/backend-sync \
  feature/collab \
  feature/template-marketplace \
  feature/i18n-theming \
  feature/web-component-export
do
  git checkout master
  git merge $b --no-ff -m "Merge $b: $(git log -1 --format=%s $b)"
done
```

If the merge history is too noisy, a single "squash merge" that lands all nine
docs at once is also acceptable.

---

## 4. `feature/undo-redo` (implementation + tests)

**Status:** 🔶 unmerged

| Ahead of master | 9 commits                                                                    |
| --------------- | ---------------------------------------------------------------------------- |
| Files changed   | 10 files (+892 / –96)                                                        |
| Key modules     | `history.js`, `canvas.js`, `inspector.js`, `app.js`, `storage.js`, `i18n.js` |
| Test file       | `test/history.test.js` (7 tests)                                             |

**Commits (earliest → latest):**

| Commit    | Description                                                       |
| --------- | ----------------------------------------------------------------- |
| `99b7e0d` | Add history.js design document (Mid-term #1 planning)             |
| `d4e034b` | Implement history.js command stack with bounded buffer            |
| `cdf4fc2` | Add undo/redo toolbar UI and keyboard shortcuts (Ctrl/Cmd+Z)      |
| `4c12dfa` | Wrap canvas.js drop and Sortable move with undo commands          |
| `d06e8b1` | Wrap inspector.js edits and delete with undo commands (debounced) |
| `d7fb7ed` | Wrap app.js CSS rule mutations with undo commands                 |
| `aeaa7d3` | Reset undo/redo history on project switch in storage.js           |
| `0f2fa0c` | Fix redo-branch test logic                                        |
| `d730e29` | Add trailing newline to jsconfig.json (prettier)                  |

**Verification:** `npm test` → 19/19 pass (7 history + 7 i18n + 5 storage).

**Recommendation:** 🔶 merge into `master` as a complete feature. Update
ROADMAP.md to mark Mid-term #1 as complete.

```bash
git checkout master
git merge feature/undo-redo --no-ff -m "Merge feature/undo-redo: command-based history stack with undo/redo and keyboard shortcuts"
git branch -d feature/undo-redo
```

**Post-merge:** update ROADMAP.md:

- Mark Mid-term #1 as `[x]`
- Update "Current Status" section (active branch, stack description)

---

## 5. `feature/ui-skeleton-cleanup` (superset of undo-redo)

**Status:** 🔶 unmerged, supersedes `feature/undo-redo`

| Ahead of master                         | 10 commits                                       |
| --------------------------------------- | ------------------------------------------------ |
| Unique commits beyond undo-redo         | `0e869da` — Clean up UI skeleton                 |
| Extra changes                           | `src/css/editor.css` — reorganised (+464 lines); |
| `src/css/canvas-preview.css` — deleted; |
| `index.html` — inline styles removed    |

This branch is a proper superset of `feature/undo-redo`. The additional commit
cleans up the UI layer (CSS deduplication, inline-style removal).

**Recommendation:** 🔶 merge this branch directly into `master` instead of
`feature/undo-redo`. It contains everything undo-redo has plus the CSS
cleanup, so there is no reason to merge undo-redo first.

```bash
git checkout master
git merge feature/ui-skeleton-cleanup --no-ff -m "Merge feature/ui-skeleton-cleanup: undo/redo history stack + CSS skeleton cleanup"
```

**After merging:** delete `feature/undo-redo` as well (its commits are now on
master via the superset branch).

```bash
git branch -d feature/undo-redo
git branch -d feature/ui-skeleton-cleanup
```

---

## 6. `origin/master` (remote tracking)

| Branch               | Behind origin        |
| -------------------- | -------------------- |
| `master`             | 0 commits (even)     |
| All feature branches | Not pushed to origin |

No divergence. All work is local-only.

---

## Summary of recommended actions

| What                                                             | Why                                   | When                      |
| ---------------------------------------------------------------- | ------------------------------------- | ------------------------- |
| Delete 6 stale local branches                                    | Clutter-free `git branch -l`          | Anytime                   |
| Merge 9 design-doc branches into `master`                        | Land existing planning docs           | Before or after undo-redo |
| Merge `feature/ui-skeleton-cleanup` into `master`                | Land complete undo/redo + CSS cleanup | Next                      |
| Update ROADMAP.md "Current Status" and mark Mid-term #1 as `[x]` | Keep planning doc in sync             | After merge               |
| Push `master` to `origin/master`                                 | Deploy to GitHub Pages                | After merge               |
