const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function newUid(): string {
    let s = '';
    for (let i = 0; i < 16; i++) {
        s += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    return s;
}