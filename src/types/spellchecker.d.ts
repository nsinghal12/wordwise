declare module 'spellchecker' {
    class SpellChecker {
        isMisspelled(word: string): boolean;
        getCorrectionsForMisspelling(word: string): string[];
        checkSpelling(text: string): { start: number; end: number }[];
        checkSpellingAsync(text: string): Promise<{ start: number; end: number }[]>;
        add(word: string): void;
    }
    export = SpellChecker;
} 