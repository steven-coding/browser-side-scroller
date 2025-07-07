export function getAssetPath(path: string): string {
    const basePath = import.meta.env.BASE_URL || '/';
    return basePath.endsWith('/') ? basePath + path.slice(1) : basePath + path;
}