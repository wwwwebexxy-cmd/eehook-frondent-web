export function getSwipeDirection({ startX, startY, endX, endY, threshold = 40 }) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (Math.abs(deltaX) < threshold || Math.abs(deltaX) <= Math.abs(deltaY)) return null;
    return deltaX < 0 ? "next" : "previous";
}
