declare module 'nspell' {
    interface NSpell {
        correct(word: string): boolean;
        suggest(word: string): string[];
        add(word: string): void;
    }

    function nspell(dictionary: any): NSpell;
    export default nspell;
}

declare module 'dictionary-en' {
    function dictionary(callback: (error: Error | null, dict: any) => void): void;
    export default dictionary;
} 