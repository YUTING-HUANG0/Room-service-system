declare module 'node-ical' {
    export const async: {
        fromURL: (url: string) => Promise<Record<string, any>>;
    };
    export function parseICS(ics: string): Record<string, any>;
}
