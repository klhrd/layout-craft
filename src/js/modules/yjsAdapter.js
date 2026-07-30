import * as Y from 'yjs';
import * as cssState from './cssState.js';
import { compileAndRenderCss } from './cssEditor.js';

let _localMutation = false;
let _domObserver = null;
let _yjsCanvasObserver = null;
let _yjsCssObserver = null;
let _yDoc = null;

const _domToY = new WeakMap();
const _yToDom = new WeakMap();

export function createYDoc() {
    return new Y.Doc();
}

export function getCanvasFragment(yDoc) {
    return yDoc.getXmlFragment('canvas');
}

export function getCssMap(yDoc) {
    return yDoc.getMap('css');
}

function getDomChildren(parent) {
    return Array.from(parent.childNodes);
}

function isSignificantNode(n) {
    return n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
}

function findYIndex(domNode, domParent, _yParent) {
    const siblings = getDomChildren(domParent).filter(isSignificantNode);
    const domIdx = siblings.indexOf(domNode);
    if (domIdx === -1) return -1;
    let yIdx = 0;
    for (const child of domParent.childNodes) {
        if (!isSignificantNode(child)) continue;
        if (child === domNode) return yIdx;
        const _yChild = _domToY.get(child);
        yIdx++;
    }
    return yIdx;
}

function elementChildren(el) {
    const result = [];
    for (let i = 0; i < el.childNodes.length; i++) {
        const n = el.childNodes[i];
        if (n.nodeType === Node.ELEMENT_NODE) result.push(n);
    }
    return result;
}

function convertDomToY(domEl) {
    let yNode;
    if (domEl.nodeType === Node.TEXT_NODE) {
        yNode = new Y.XmlText(domEl.textContent);
    } else {
        yNode = new Y.XmlElement(domEl.tagName.toLowerCase());
        for (const attr of domEl.attributes) {
            yNode.setAttribute(attr.name, attr.value);
        }
        for (const child of domEl.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
                if (child.textContent.length > 0) {
                    yNode.push([new Y.XmlText(child.textContent)]);
                }
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                yNode.push([convertDomToY(child)]);
            }
        }
    }
    _domToY.set(domEl, yNode);
    _yToDom.set(yNode, domEl);
    return yNode;
}

function convertYToDom(yNode) {
    if (yNode instanceof Y.XmlElement) {
        const el = document.createElement(yNode.nodeName);
        _domToY.set(el, yNode);
        _yToDom.set(yNode, el);
        const attrs = yNode.getAttributes();
        if (attrs && typeof attrs === 'object') {
            for (const key of Object.keys(attrs)) {
                el.setAttribute(key, attrs[key]);
            }
        }
        for (let i = 0; i < yNode.length; i++) {
            el.appendChild(convertYToDom(yNode.get(i)));
        }
        return el;
    } else if (yNode instanceof Y.XmlText) {
        return document.createTextNode(yNode.toString());
    }
    return document.createTextNode('');
}

function seedYjsFromDom(fragment, canvasEl) {
    const children = elementChildren(canvasEl);
    const yNodes = children.map((child) => convertDomToY(child));
    for (const yn of yNodes) {
        fragment.push([yn]);
    }
}

function applyFullFragmentToDom(fragment, canvasEl) {
    while (canvasEl.firstChild) {
        const child = canvasEl.firstChild;
        const yNode = _domToY.get(child);
        if (yNode) {
            _yToDom.delete(yNode);
            _domToY.delete(child);
        }
        canvasEl.removeChild(child);
    }
    for (let i = 0; i < fragment.length; i++) {
        canvasEl.appendChild(convertYToDom(fragment.get(i)));
    }
}

export function initCanvasSync(yDoc, canvasEl) {
    _yDoc = yDoc;
    const fragment = getCanvasFragment(yDoc);

    if (fragment.length === 0) {
        seedYjsFromDom(fragment, canvasEl);
    } else {
        applyFullFragmentToDom(fragment, canvasEl);
    }

    _yjsCanvasObserver = (_events, _tr) => {
        if (_localMutation) return;
        _localMutation = true;
        applyFullFragmentToDom(fragment, canvasEl);
        _localMutation = false;
    };
    fragment.observeDeep(_yjsCanvasObserver);

    _domObserver = new MutationObserver((mutations) => {
        if (_localMutation) return;
        _localMutation = true;
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const addedNode of mutation.addedNodes) {
                    if (addedNode.nodeType !== Node.ELEMENT_NODE) continue;
                    if (addedNode.classList && addedNode.classList.contains('canvas-placeholder')) continue;
                    const parentY = _domToY.get(mutation.target);
                    if (mutation.target === canvasEl) {
                        const yParent = fragment;
                        const refIdx = findYIndex(addedNode, mutation.target, yParent);
                        const yNode = convertDomToY(addedNode);
                        if (refIdx >= 0) {
                            yParent.insert(refIdx, [yNode]);
                        } else {
                            yParent.push([yNode]);
                        }
                    } else if (parentY && parentY instanceof Y.XmlElement) {
                        const yParent = parentY;
                        const refIdx = findYIndex(addedNode, mutation.target, yParent);
                        const yNode = convertDomToY(addedNode);
                        if (refIdx >= 0) {
                            yParent.insert(refIdx, [yNode]);
                        } else {
                            yParent.push([yNode]);
                        }
                    }
                }
                for (const removedNode of mutation.removedNodes) {
                    if (removedNode.nodeType !== Node.ELEMENT_NODE) continue;
                    if (removedNode.classList && removedNode.classList.contains('canvas-placeholder')) continue;
                    const yNode = _domToY.get(removedNode);
                    if (yNode) {
                        const parent = yNode.parent;
                        if (parent instanceof Y.Array || parent instanceof Y.XmlFragment) {
                            const idx = Array.from(parent).indexOf(yNode);
                            if (idx !== -1) {
                                parent.delete(idx, 1);
                            }
                        }
                        _yToDom.delete(yNode);
                        _domToY.delete(removedNode);
                    }
                    cleanupWeakMaps(removedNode);
                }
            } else if (mutation.type === 'attributes') {
                const yNode = _domToY.get(mutation.target);
                if (yNode && yNode instanceof Y.XmlElement) {
                    if (mutation.attributeName) {
                        const val = mutation.target.getAttribute(mutation.attributeName);
                        if (val !== null && val !== undefined) {
                            yNode.setAttribute(mutation.attributeName, val);
                        } else {
                            yNode.removeAttribute(mutation.attributeName);
                        }
                    }
                }
            } else if (mutation.type === 'characterData') {
                const parentEl = mutation.target.parentElement;
                if (parentEl) {
                    const yParent = _domToY.get(parentEl);
                    if (yParent && yParent instanceof Y.XmlElement) {
                        let yText = null;
                        for (let i = 0; i < yParent.length; i++) {
                            const child = yParent.get(i);
                            if (child instanceof Y.XmlText) {
                                yText = child;
                                break;
                            }
                        }
                        const newText = parentEl.textContent;
                        if (yText) {
                            yText.delete(0, yText.length);
                            yText.insert(0, newText);
                        } else {
                            yText = new Y.XmlText(newText);
                            yParent.insert(0, [yText]);
                        }
                    }
                }
            }
        }
        _localMutation = false;
    });
    _domObserver.observe(canvasEl, {
        childList: true,
        attributes: true,
        subtree: true,
        characterData: true,
    });
}

function cleanupWeakMaps(domNode) {
    const yNode = _domToY.get(domNode);
    if (yNode) {
        _yToDom.delete(yNode);
        _domToY.delete(domNode);
    }
    for (const child of domNode.childNodes) {
        cleanupWeakMaps(child);
    }
}

function seedCssMap(cssMap) {
    if (_localMutation) return;
    _localMutation = true;
    const rules = cssState.getAllRules();
    _yDoc.transact(() => {
        cssMap.clear();
        for (const [selector, styles] of rules) {
            const propMap = new Y.Map();
            for (const [prop, val] of Object.entries(styles)) {
                propMap.set(prop, val);
            }
            cssMap.set(selector, propMap);
        }
    });
    _localMutation = false;
}

function applyCssMap(cssMap) {
    cssState.initCssState();
    for (const [selector, propMap] of cssMap) {
        const styles = {};
        for (const [prop, val] of propMap) {
            styles[prop] = val;
        }
        cssState.setRule(selector, styles);
    }
}

export function initCssSync(yDoc) {
    _yDoc = yDoc;
    const cssMap = getCssMap(yDoc);

    if (cssMap.size === 0) {
        seedCssMap(cssMap);
    } else {
        applyCssMap(cssMap);
    }

    _yjsCssObserver = () => {
        if (_localMutation) return;
        _localMutation = true;
        applyCssMap(cssMap);
        compileAndRenderCss();
        _localMutation = false;
    };
    cssMap.observeDeep(_yjsCssObserver);

    cssState.setOnChange(() => {
        if (_localMutation) return;
        seedCssMap(cssMap);
    });
}

export function destroySync() {
    if (_domObserver) {
        _domObserver.disconnect();
        _domObserver = null;
    }
    if (_yjsCanvasObserver && _yDoc) {
        getCanvasFragment(_yDoc).unobserveDeep(_yjsCanvasObserver);
        _yjsCanvasObserver = null;
    }
    if (_yjsCssObserver && _yDoc) {
        getCssMap(_yDoc).unobserveDeep(_yjsCssObserver);
        _yjsCssObserver = null;
    }
    cssState.setOnChange(null);
    _localMutation = false;
    _yDoc = null;
}
