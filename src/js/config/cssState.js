let _blocks = [];
let _counter = 1;

function isOldFormat(data) {
    return data && !Array.isArray(data) && typeof data === 'object';
}

function upgradeOldFormat(oldData) {
    return Object.entries(oldData).map(([selector, styles]) => ({
        type: 'rule',
        selector,
        styles: { ...styles },
    }));
}

function findBlockIndex(selector, list) {
    return list.findIndex((b) => b.selector === selector && b.type === 'rule');
}

export function initCssState() {
    _blocks = [];
    _counter = 1;
}

export function getRule(selector) {
    const idx = findBlockIndex(selector, _blocks);
    return idx !== -1 ? _blocks[idx].styles : undefined;
}

export function setRule(selector, rule) {
    const idx = findBlockIndex(selector, _blocks);
    if (idx !== -1) {
        _blocks[idx].styles = rule;
    } else {
        _blocks.push({ type: 'rule', selector, styles: rule });
    }
}

export function deleteRule(selector) {
    const idx = findBlockIndex(selector, _blocks);
    if (idx !== -1) _blocks.splice(idx, 1);
}

export function getAllRules() {
    return _blocks.filter((b) => b.type === 'rule').map((b) => [b.selector, b.styles]);
}

export function hasRule(selector) {
    return findBlockIndex(selector, _blocks) !== -1;
}

export function getProperty(selector, prop) {
    const rule = getRule(selector);
    return rule ? rule[prop] : undefined;
}

export function setProperty(selector, prop, value) {
    let styles = getRule(selector);
    if (!styles) {
        styles = {};
        _blocks.push({ type: 'rule', selector, styles });
    }
    styles[prop] = value;
}

export function deleteProperty(selector, prop) {
    const styles = getRule(selector);
    if (!styles) return;
    delete styles[prop];
    if (Object.keys(styles).length === 0) {
        deleteRule(selector);
    }
}

export function renameRule(oldSelector, newSelector) {
    const idx = findBlockIndex(oldSelector, _blocks);
    if (idx !== -1) _blocks[idx].selector = newSelector;
}

export function serialize() {
    return JSON.parse(JSON.stringify(_blocks));
}

export function deserialize(data) {
    if (isOldFormat(data)) {
        _blocks = upgradeOldFormat(data);
    } else if (Array.isArray(data)) {
        _blocks = JSON.parse(JSON.stringify(data));
    } else {
        _blocks = [];
    }
}

export function nextClassIndex() {
    return _counter++;
}

export function getCounter() {
    return _counter;
}

export function setCounter(n) {
    _counter = n;
}

// Raw reference for backward compatibility during migration.
export function getRawData() {
    return _blocks;
}

// ── Tree API ──────────────────────────────────────────────

export function getBlocks() {
    return _blocks;
}

export function addBlock(block, parentSelector) {
    if (parentSelector) {
        const parent = _blocks.find(
            (b) => b.selector === parentSelector && (b.type === 'media' || b.type === 'keyframes'),
        );
        if (parent) {
            if (!parent.children) parent.children = [];
            parent.children.push(block);
            return;
        }
    }
    _blocks.push(block);
}

export function removeBlock(selector, parentSelector) {
    const list = parentSelector ? (_blocks.find((b) => b.selector === parentSelector) || {}).children : _blocks;
    if (!list) return;
    const idx = list.findIndex((b) => b.selector === selector);
    if (idx !== -1) list.splice(idx, 1);
}

export function getBlock(selector, parentSelector) {
    const list = parentSelector ? (_blocks.find((b) => b.selector === parentSelector) || {}).children : _blocks;
    if (!list) return undefined;
    return list.find((b) => b.selector === selector);
}

export function getAllFlatRules() {
    const result = [];
    function walk(blocks) {
        for (const b of blocks) {
            if (b.type === 'rule') result.push([b.selector, b.styles]);
            if (b.children) walk(b.children);
        }
    }
    walk(_blocks);
    return result;
}

// Tree-aware property access for nested rules inside media/keyframes containers.
export function hasNestedRule(selector, parentSelector) {
    const parent = _blocks.find((b) => b.selector === parentSelector && (b.type === 'media' || b.type === 'keyframes'));
    if (!parent || !parent.children) return false;
    return parent.children.some((b) => b.selector === selector && b.type === 'rule');
}

export function setNestedProperty(parentSelector, selector, prop, value) {
    const parent = _blocks.find((b) => b.selector === parentSelector && (b.type === 'media' || b.type === 'keyframes'));
    if (!parent) return;
    if (!parent.children) parent.children = [];
    let rule = parent.children.find((b) => b.selector === selector && b.type === 'rule');
    if (!rule) {
        rule = { type: 'rule', selector, styles: {} };
        parent.children.push(rule);
    }
    rule.styles[prop] = value;
}

export function getNestedProperty(parentSelector, selector, prop) {
    const parent = _blocks.find((b) => b.selector === parentSelector && (b.type === 'media' || b.type === 'keyframes'));
    if (!parent || !parent.children) return undefined;
    const rule = parent.children.find((b) => b.selector === selector && b.type === 'rule');
    return rule && rule.styles ? rule.styles[prop] : undefined;
}
