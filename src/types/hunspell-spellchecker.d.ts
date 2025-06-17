declare module 'hunspell-spellchecker' {
    class Spellchecker {
        constructor();
        check(word: string): boolean;
        suggest(word: string): string[];
        addDictionary(data: {
            aff: string;
            dic: string;
        }): void;
    }
    export = Spellchecker;
} 