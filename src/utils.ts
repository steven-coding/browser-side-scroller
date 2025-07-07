export function getAssetPath(path: string): string {
    const basePath = import.meta.env.BASE_URL || '/';
    return basePath.endsWith('/') ? basePath + path.slice(1) : basePath + path;
}

export function isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0);
}