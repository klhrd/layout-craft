import { describe, it, expect, beforeEach } from 'vitest';

// history.js is pure state with no DOM access, so we import it normally.
import { push, undo, redo, canUndo, canRedo, reset, subscribe, __internalState } from '../src/js/modules/history.js';

// Build a synthetic command with side-effectful perform/rollback so we can
// observe call order and assert on a tiny state model object.
function makeCommand(label, state) {
    return {
        label,
        perform: () => {
            state.applied = label;
            state.log.push(`+${label}`);
        },
        rollback: () => {
            state.applied = null;
            state.log.push(`-${label}`);
        },
    };
}

describe('history.js command stack', () => {
    let state;
    let unsubscribeAll;

    beforeEach(() => {
        reset();
        state = { applied: null, log: [] };
        unsubscribeAll = null;
    });

    it('records and rolls back a single command', () => {
        push(makeCommand('a', state));
        state.applied = 'a'; // simulate that the caller already performed the action
        state.log.push('+a');

        expect(canUndo()).toBe(true);
        expect(canRedo()).toBe(false);

        undo();

        expect(state.applied).toBeNull();
        expect(state.log).toEqual(['+a', '-a']);
        expect(canUndo()).toBe(false);
        expect(canRedo()).toBe(true);
    });

    it('re-applies a command on redo', () => {
        push(makeCommand('a', state));
        state.applied = 'a';
        state.log.push('+a');

        undo();
        redo();

        expect(state.applied).toBe('a');
        expect(state.log).toEqual(['+a', '-a', '+a']);
    });

    it('drops the redo branch when a new command is pushed after an undo', () => {
        push(makeCommand('a', state));
        push(makeCommand('b', state));
        undo(); // roll back b so pointer at 'a'
        // Now the redo stack contains only 'b'; push('c') should splice it.
        push(makeCommand('c', state)); // stack = [a, c]; pointer = 1

        // Undo once → rollback 'c' → pointer = 0.
        undo();
        expect(state.log.filter((l) => l === '-c')).toHaveLength(1);
        // Undo again → rollback 'a' → pointer = -1.
        undo();
        expect(state.log.filter((l) => l === '-a')).toHaveLength(1);
        // Two redos: first a, then c (b was spliced and cannot return).
        redo(); // perform a
        redo(); // perform c
        expect(state.log.filter((l) => l === '+c')).toContain('+c');
        // Ensure b cannot come back
        expect(canRedo()).toBe(false);
        // Attempt redo should be a no-op
        redo();
        expect(state.log).not.toContain('+b');
    });

    it('caps the stack at MAX_ENTRIES by dropping the oldest', () => {
        const cap = __internalState().maxEntries;
        for (let i = 0; i < cap + 5; i++) {
            push(makeCommand(`cmd-${i}`, state));
        }
        const s = __internalState();
        expect(s.stackLength).toBe(cap);
        expect(s.pointer).toBe(cap - 1);
        // Undoing to the bottom should not be able to reach cmd-0
        for (let i = 0; i < cap; i++) undo();
        // The oldest reachable label should be cmd-5 (we pushed cap+5 total,
        // dropping the first 5 once cap is exceeded).
        expect(state.applied).toBeNull();
        // canUndo() should be false after walking the whole reachable stack back.
        expect(canUndo()).toBe(false);
    });

    it('ignores commands missing perform/rollback', () => {
        push({ label: 'broken' });
        push({ label: 'ok', perform: () => {}, rollback: () => {} });
        expect(__internalState().stackLength).toBe(1);
    });

    it('notifies subscribers on push, undo, redo, and reset', () => {
        const events = [];
        const unsubscribe = subscribe((s) => events.push({ ...s }));
        unsubscribeAll = unsubscribe;

        // subscribe() emits once immediately with the initial state.
        expect(events).toHaveLength(1);
        expect(events[0]).toEqual({ canUndo: false, canRedo: false });

        push(makeCommand('a', state));
        expect(events.at(-1)).toEqual({ canUndo: true, canRedo: false });

        undo();
        expect(events.at(-1)).toEqual({ canUndo: false, canRedo: true });

        redo();
        expect(events.at(-1)).toEqual({ canUndo: true, canRedo: false });

        reset();
        expect(events.at(-1)).toEqual({ canUndo: false, canRedo: false });
    });

    it('unsubscribe removes the listener', () => {
        if (unsubscribeAll) unsubscribeAll();
        // Pushing now should not throw and should not append to a captured
        // events list (we re-create one to be safe).
        const events = [];
        const unsub2 = subscribe((s) => events.push(s));
        unsub2();
        push(makeCommand('a', state));
        // Only the initial subscribe snapshot was captured; no further pushes.
        expect(events).toHaveLength(1);
    });
});
