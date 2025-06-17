declare module 'simple-spellchecker' {
    namespace SimpleSpellChecker {
        interface Dictionary {
            spellCheck(word: string): boolean;
            getSuggestions(word: string): string[];
            addWord(word: string): void;
        }
    }

    function getDictionary(
        lang: string,
        callback: (err: Error | null, dictionary: SimpleSpellChecker.Dictionary) => void
    ): void;
    function getDictionarySync(lang: string): SimpleSpellChecker.Dictionary;

    export = SimpleSpellChecker;
} 