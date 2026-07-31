import { describe, it, expect } from 'vitest';
import zlib from 'node:zlib';
import { crc32, makeZip } from '../src/js/modules/zipWriter.js';

function encoder() {
    return new TextEncoder();
}

function findEocd(bytes) {
    for (let i = bytes.length - 22; i >= 0; i--) {
        if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) {
            return i;
        }
    }
    return -1;
}

function parseZip(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const eocd = findEocd(bytes);
    expect(eocd).toBeGreaterThanOrEqual(0);
    const count = view.getUint16(eocd + 10, true);
    const cdStart = view.getUint32(eocd + 16, true);

    const entries = [];
    let pos = cdStart;
    for (let i = 0; i < count; i++) {
        expect(view.getUint32(pos, true)).toBe(0x02014b50);
        const method = view.getUint16(pos + 10, true);
        const crc = view.getUint32(pos + 16, true);
        const compSize = view.getUint32(pos + 20, true);
        const uncompSize = view.getUint32(pos + 24, true);
        const nameLen = view.getUint16(pos + 28, true);
        const extraLen = view.getUint16(pos + 30, true);
        const commentLen = view.getUint16(pos + 32, true);
        const localOffset = view.getUint32(pos + 42, true);
        const name = new TextDecoder().decode(bytes.subarray(pos + 46, pos + 46 + nameLen));
        entries.push({ method, crc, compSize, uncompSize, name, localOffset });
        pos += 46 + nameLen + extraLen + commentLen;
    }
    return { entries, eocd };
}

function readLocalFileData(bytes, localOffset, name) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(view.getUint32(localOffset, true)).toBe(0x04034b50);
    const nameLen = view.getUint16(localOffset + 26, true);
    const extraLen = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + nameLen + extraLen;
    const entryName = new TextDecoder().decode(bytes.subarray(localOffset + 30, localOffset + 30 + nameLen));
    expect(entryName).toBe(name);
    const compSize = view.getUint32(localOffset + 18, true);
    return bytes.subarray(dataStart, dataStart + compSize);
}

describe('crc32', () => {
    it('matches the well-known check value for "123456789"', () => {
        expect(crc32(encoder().encode('123456789'))).toBe(0xcbf43926);
    });

    it('handles empty input', () => {
        expect(crc32(new Uint8Array(0))).toBe(0);
    });
});

describe('makeZip', () => {
    it('produces a valid zip structure with correct entry names', async () => {
        const bytes = await makeZip([
            { name: 'index.html', data: '<h1>hi</h1>' },
            { name: 'style.css', data: 'body { color: red; }' },
        ]);
        expect(bytes[0]).toBe(0x50);
        expect(bytes[1]).toBe(0x4b);
        const { entries, eocd } = parseZip(bytes);
        expect(entries.map((e) => e.name)).toEqual(['index.html', 'style.css']);
        expect(eocd).toBe(bytes.length - 22);
    });

    it('round-trips file content (deflate or store depending on environment)', async () => {
        const hello = encoder().encode('Hello, ZIP! '.repeat(50));
        const bytes = await makeZip([{ name: 'a.txt', data: hello }]);
        const { entries } = parseZip(bytes);
        const entry = entries[0];
        expect(entry.uncompSize).toBe(hello.length);
        expect(entry.crc).toBe(crc32(hello));

        const payload = readLocalFileData(bytes, entry.localOffset, 'a.txt');
        let decoded;
        if (entry.method === 8) {
            decoded = zlib.inflateRawSync(payload);
        } else {
            decoded = payload;
        }
        expect(new Uint8Array(decoded)).toEqual(hello);
    });

    it('accepts strings and Uint8Array payloads and preserves order', async () => {
        const bytes = await makeZip([
            { name: 'one.txt', data: 'first' },
            { name: 'two.bin', data: new Uint8Array([1, 2, 3]) },
        ]);
        const { entries } = parseZip(bytes);
        const one = readLocalFileData(bytes, entries[0].localOffset, 'one.txt');
        const two = readLocalFileData(bytes, entries[1].localOffset, 'two.bin');
        expect(new TextDecoder().decode(one)).toBe('first');
        expect(Array.from(two)).toEqual([1, 2, 3]);
    });
});
