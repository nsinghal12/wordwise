import { useState, useEffect, useRef } from 'react';
import { useLanguageWorker, GrammarError } from './useLanguageWorker';

interface UseGrammarCheckProps {
    text: string;
    language?: string;
    debounceMs?: number;
}

export const useGrammarCheck = ({
    text,
    language = 'en-US',
    debounceMs = 1000,
}: UseGrammarCheckProps) => {
    const [errors, setErrors] = useState<GrammarError[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const { checkGrammar } = useLanguageWorker();
    const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        // Clear previous timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Set new timeout
        debounceTimeoutRef.current = setTimeout(async () => {
            if (!text.trim()) {
                setErrors([]);
                return;
            }

            try {
                setIsChecking(true);
                const grammarErrors = await checkGrammar(text, language);
                setErrors(grammarErrors);
            } catch (error) {
                console.error('Grammar check failed:', error);
                setErrors([]);
            } finally {
                setIsChecking(false);
            }
        }, debounceMs);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [text, language, debounceMs, checkGrammar]);

    return { errors, isChecking };
};

// Re-export GrammarError for backward compatibility
export type { GrammarError }; 