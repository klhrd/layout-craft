/**
 * history.js — bounded command-pattern undo/redo stack.
 *
 * Pure state. No DOM access. Generators elsewhere (canvas.js, inspector.js,
 * app.js) construct `command` objects and `push()` them. The stack holds up
 * to `MAX_ENTRIES` commands; the oldest is dropped when the cap is exceeded.
 *
 * A command shape:
 *   {
 *     label: string,                // human-readable hint for debugging
 *     perform: () => void,          // apply the change (no-op on first push
 *                                   //   since the caller already did it)
 *     rollback: () => void,         // undo the change
 *   }
 *
 * `push()` assumes the caller has already executed `perform` once; we do not
 * re-invoke it. `undo()` invokes `rollback` of the current head then moves the
 * pointer back; `redo()` moves the pointer forward then invokes `perform`.
 *
 * Listeners receive `{ canUndo, canRedo }` snapshots on every mutation so the
 * toolbar UI stays in sync without inspecting internals.
 */

const MAX_ENTRIES = 100;

const stack = [];
let pointer = -1; // index of the most recent command (or -1 when empty)
const listeners = new Set();

function emit() {
    const snapshot = { canUndo: canUndo(), canRedo: canRedo() };
    for (const cb of listeners) {
        try {
            cb(snapshot);
        } catch {
            // A listener throwing must not break history state.
        }
    }
}

export function push(command) {
    if (!command || typeof command.rollback !== 'function' || typeof command.perform !== 'function') {
        return;
    }
    // Any new push discards the redo branch beyond the current pointer.
    stack.splice(pointer + 1);
    stack.push(command);
    // Enforce the bounded buffer by dropping the oldest.
    if (stack.length > MAX_ENTRIES) {
        stack.shift();
    } else {
        pointer++;
    }
    emit();
}

export function undo() {
    if (!canUndo()) return;
    const cmd = stack[pointer];
    try {
        cmd.rollback();
    } finally {
        pointer--;
        emit();
    }
}

export function redo() {
    if (!canRedo()) return;
    pointer++;
    const cmd = stack[pointer];
    try {
        cmd.perform();
    } catch {
        // If re-apply fails, roll the pointer back so the UI does not
        // believe a state was reached that wasn't.
        pointer--;
    } finally {
        emit();
    }
}

export function canUndo() {
    return pointer >= 0;
}

export function canRedo() {
    return pointer < stack.length - 1;
}

export function reset() {
    stack.length = 0;
    pointer = -1;
    emit();
}

export function subscribe(listener) {
    if (typeof listener === 'function') listeners.add(listener);
    // Emit once immediately so the new subscriber initializes correctly.
    listener({ canUndo: canUndo(), canRedo: canRedo() });
    return () => {
        listeners.delete(listener);
    };
}

// Test-only accessor (kept internal; not consumed by production callers).
export function __internalState() {
    return {
        stackLength: stack.length,
        pointer,
        maxEntries: MAX_ENTRIES,
    };
}
