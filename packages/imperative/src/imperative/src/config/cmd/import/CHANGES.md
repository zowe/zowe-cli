# Changes to `zowe config import`

## Summary

The `zowe config import` command has been enhanced with two new flags (`--merge` and `--dry-run`) and a safer conflict-resolution strategy when merging into an existing `zowe.config.json`.

---

## New Flags

### `--merge` / `--mg`

Merges properties from the imported config into the existing `zowe.config.json` instead of overwriting it.

- **Existing values always win.** If a key exists in both the target file and the imported file, the target's value is kept unchanged.
- If no config file exists yet at the target location, the imported config is written as-is (same behaviour as a normal first-time import).
- Cannot be combined with `--overwrite` (mutually exclusive — the handler raises a clear error if both are passed).

### `--dry-run` / `--dr`

Previews what the resulting config would look like without writing any changes to disk.

- Works independently of `--merge`: use alone to preview a full overwrite, or combine with `--merge` to preview a merge.
- Prints a `[Dry Run]` header, the full JSON that would be written, and a reminder that no changes were made.
- Schema download is skipped during a dry run (no side effects of any kind).

---

## Behaviour Matrix

| Scenario | Result |
|---|---|
| File does not exist | Import as normal (write the incoming config) |
| File exists, no flags | Skip with a message listing all available options |
| File exists, `--overwrite` | Full replace (existing behaviour, unchanged) |
| File exists, `--merge` | Safe merge — existing values win; missing keys are added from import |
| Any scenario, `--dry-run` | Print the would-be result; nothing written to disk |
| `--merge --dry-run` | Print the merged preview; nothing written to disk |
| `--overwrite --dry-run` | Print the overwrite preview; nothing written to disk |
| `--merge --overwrite` | Error — options are mutually exclusive |

---

## Merge Semantics (field-by-field)

When `--merge` is used against an existing file, each top-level field is handled as follows:

| Field | Rule |
|---|---|
| `profiles` | Deep-merged. For every nested property, the existing target value wins on conflict. New profiles present only in the import are added. |
| `profiles.*.properties` (arrays) | Existing arrays are kept entirely as-is — no elements are removed or reordered. |
| `defaults` | Shallow merge. Existing default entries win on conflict. Only keys absent from the target are added from the import. |
| `plugins` | Additive only. New plugin names from the import are appended if not already in the list. Existing plugins are never removed. |
| `autoStore` | Only set from the import if the target does not already define the property (even an explicit `false` in the target is respected). |

---

## Skip Message Update

When an existing file is found and no relevant flag is passed, the skip message now lists all three escape hatches:

```
Skipping import because <path> already exists.
Rerun the command with --overwrite to replace it, --merge to add missing
properties, or --dry-run to preview what would happen.
```

---

## Files Changed

| File | Change |
|---|---|
| `import.definition.ts` | Added `--merge` and `--dry-run` option definitions; added three new usage examples |
| `import.handler.ts` | Rewrote `process()` to support merge, dry-run, and safe field-level conflict resolution; added `lodash` import for merge logic |

---

## Implementation Notes

- The merge logic is implemented directly in `import.handler.ts` rather than delegating to `ConfigLayers.merge()`. This is intentional: the framework's `merge()` method has argument-order subtleties with `lodash.merge` that can cause imported `defaults` to overwrite existing ones, and it unconditionally overwrites `autoStore`. The handler's own merge makes the "existing wins" guarantee explicit for every field.
- Schema import is unchanged for normal and `--overwrite` modes. It is intentionally skipped during `--dry-run` to ensure the operation has no side effects.
