let _data = {};
let _counter = 1;

export function initCssState() {
    _data = {};
    _counter = 1;
}

export function getRule(selector) {
    return _data[selector];
}

export function setRule(selector, rule) {
    _data[selector] = rule;
}

export function deleteRule(selector) {
    delete _data[selector];
}

export function getAllRules() {
    return Object.entries(_data);
}

export function hasRule(selector) {
    return selector in _data;
}

export function getProperty(selector, prop) {
    const rule = _data[selector];
    return rule ? rule[prop] : undefined;
}

export function setProperty(selector, prop, value) {
    if (!_data[selector]) _data[selector] = {};
    _data[selector][prop] = value;
}

export function deleteProperty(selector, prop) {
    if (_data[selector]) {
        delete _data[selector][prop];
        if (Object.keys(_data[selector]).length === 0) {
            delete _data[selector];
        }
    }
}

export function renameRule(oldSelector, newSelector) {
    _data[newSelector] = _data[oldSelector];
    delete _data[oldSelector];
}

export function serialize() {
    return JSON.parse(JSON.stringify(_data));
}

export function deserialize(json) {
    _data = json || {};
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
