
export function generateNumericId(): number {
    return Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
}