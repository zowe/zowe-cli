// This file is needed because Hogan fork does not bundle type definitions
declare namespace Hogan {
    interface Context {
        [key: string]: any;
    }

    interface Template {
        render(context: Context, partials?: Partials, indent?: string): string;
    }

    interface Partials {
        [name: string]: Template;
    }
}

declare module '@profoundlogic/hogan' {
    const hogan: any;
    export = hogan;
}
