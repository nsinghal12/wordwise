declare module 'typo-js' {
    interface TypoOptions {
        platform?: string;
        dictionary?: {
            [key: string]: any;
        };
    }

    class Typo {
        constructor(dictionary: string, affData?: string, wordsData?: string, options?: TypoOptions);
        check(word: string): boolean;
        suggest(word: string): string[];
        addWord(word: string): void;
        removeWord(word: string): void;
    }

    export = Typo;
} 