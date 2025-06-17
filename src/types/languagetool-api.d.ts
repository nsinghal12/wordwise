declare module 'languagetool-api' {
    interface CheckOptions {
        text: string;
        language?: string;
    }

    interface Replacement {
        value: string;
    }

    interface Rule {
        id: string;
        description: string;
        category: {
            id: string;
            name: string;
        };
    }

    interface Match {
        message: string;
        offset: number;
        length: number;
        replacements: Replacement[];
        rule: Rule;
    }

    interface CheckResult {
        matches: Match[];
    }

    export function check(options: CheckOptions): Promise<CheckResult>;
} 