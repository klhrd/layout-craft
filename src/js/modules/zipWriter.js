const CRC_TABLE = (() => {
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[n] = c;
    }
    return table;
})();

export function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
        c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
}

async function deflateRaw(bytes) {
    if (typeof CompressionStream === 'undefined') return null;
    const cs = new CompressionStream('deflate-raw');
    const writer = cs.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const reader = cs.readable.getReader();
    const chunks = [];
    let total = 0;
    for (let res = await reader.read(); !res.done; res = await reader.read()) {
        chunks.push(res.value);
        total += res.value.byteLength;
    }
    const out = new Uint8Array(total);
    let off = 0;
    for (const chunk of chunks) {
        out.set(chunk, off);
        off += chunk.byteLength;
    }
    return out;
}

export async function makeZip(files) {
    const encoder = new TextEncoder();
    const prepared = await Promise.all(
        files.map(async (file) => {
            const data = file.data instanceof Uint8Array ? file.data : encoder.encode(String(file.data));
            const nameBytes = encoder.encode(file.name);
            const deflated = await deflateRaw(data);
            const useDeflate = deflated !== null && deflated.length < data.length;
            const payload = useDeflate ? deflated : data;
            return { nameBytes, data, payload, useDeflate, crc: crc32(data) };
        }),
    );

    const totalSize = prepared.reduce((sum, p) => sum + 30 + p.nameBytes.length + p.payload.length, 0);
    const cdSize = prepared.reduce((sum, p) => sum + 46 + p.nameBytes.length, 0);
    const out = new Uint8Array(totalSize + cdSize + 22);
    const view = new DataView(out.buffer);
    let offset = 0;
    const centralEntries = [];

    for (const p of prepared) {
        const localOffset = offset;
        view.setUint32(offset, 0x04034b50, true);
        view.setUint16(offset + 4, 20, true);
        view.setUint16(offset + 6, 0, true);
        view.setUint16(offset + 8, p.useDeflate ? 8 : 0, true);
        view.setUint16(offset + 10, 0, true);
        view.setUint16(offset + 12, 0x21, true);
        view.setUint32(offset + 14, p.crc, true);
        view.setUint32(offset + 18, p.payload.length, true);
        view.setUint32(offset + 22, p.data.length, true);
        view.setUint16(offset + 26, p.nameBytes.length, true);
        view.setUint16(offset + 28, 0, true);
        out.set(p.nameBytes, offset + 30);
        out.set(p.payload, offset + 30 + p.nameBytes.length);
        offset += 30 + p.nameBytes.length + p.payload.length;
        centralEntries.push({ p, localOffset });
    }

    const cdStart = offset;
    for (const { p, localOffset } of centralEntries) {
        view.setUint32(offset, 0x02014b50, true);
        view.setUint16(offset + 4, 20, true);
        view.setUint16(offset + 6, 20, true);
        view.setUint16(offset + 8, 0, true);
        view.setUint16(offset + 10, p.useDeflate ? 8 : 0, true);
        view.setUint16(offset + 12, 0, true);
        view.setUint16(offset + 14, 0x21, true);
        view.setUint32(offset + 16, p.crc, true);
        view.setUint32(offset + 20, p.payload.length, true);
        view.setUint32(offset + 24, p.data.length, true);
        view.setUint16(offset + 28, p.nameBytes.length, true);
        view.setUint16(offset + 30, 0, true);
        view.setUint16(offset + 32, 0, true);
        view.setUint16(offset + 34, 0, true);
        view.setUint16(offset + 36, 0, true);
        view.setUint32(offset + 38, 0, true);
        view.setUint32(offset + 42, localOffset, true);
        out.set(p.nameBytes, offset + 46);
        offset += 46 + p.nameBytes.length;
    }

    view.setUint32(offset, 0x06054b50, true);
    view.setUint16(offset + 4, 0, true);
    view.setUint16(offset + 6, 0, true);
    view.setUint16(offset + 8, prepared.length, true);
    view.setUint16(offset + 10, prepared.length, true);
    view.setUint32(offset + 12, cdSize, true);
    view.setUint32(offset + 16, cdStart, true);
    view.setUint16(offset + 20, 0, true);

    return out;
}
