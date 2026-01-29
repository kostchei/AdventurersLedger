# Agent Operational Rules

These rules are established to prevent "flailing" during code editing and ensure high-reliability file modifications.

## 1. File Editing Protocol

### The "Read-Before-Write" Mandate
- **Never** rely on assumed file state when `replace_file_content` fails.
- If an edit fails **ONCE**:
    1. STOP. Do not retry correctly immediately.
    2. Call `view_file` on the specific line range to see the *exact* current state.
    3. Copy the output exactly for the next `TargetContent`.

### Target Content Precision
- **Minimal Anchors**: Do not use 20+ lines of context to change 1 line. Use the minimum unique context (3-5 lines) required to locate the change.
- **Whitespace Hygiene**: Be extremely suspicious of indentation. If possible, anchor on content with unique strings rather than closing braces `}` or generic whitespace.

### Fallback Strategy
- **Strike Two Rule**: If `replace_file_content` fails **twice** on the same logical edit:
    - **ABORT** incremental editing.
    - **SWITCH** to `write_to_file` to overwrite the entire file (if file size < 800 lines).
    - This is faster and more reliable than guessing why the diff match failed.

## 2. Agent Behavior
- **Honesty**: If a tool fails, acknowledge it in the thought process. Do not silently retry the same failed action hoping for a different result.
- **Verification**: After a complex edit (especially a full rewrite), verify the file works or compiles (if applicable) or read it back to ensure integrity.
