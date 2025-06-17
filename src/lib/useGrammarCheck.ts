import { useState, useEffect, useCallback } from 'react';

export interface GrammarError {
    message: string;
    offset: number;
    length: number;
    replacements: string[];
    rule: {
        id: string;
        description: string;
        category: string;
    };
}

interface UseGrammarCheckProps {
    text: string;
    language?: string;
    debounceMs?: number;
}

const LANGUAGETOOL_API_URL = 'https://api.languagetool.org/v2/check';

export const useGrammarCheck = ({
    text,
    language = 'en-US',
    debounceMs = 1000,
}: UseGrammarCheckProps) => {
    const [errors, setErrors] = useState<GrammarError[]>([]);
    const [isChecking, setIsChecking] = useState(false);

    const checkGrammar = useCallback(async (content: string) => {
        if (!content.trim()) {
            setErrors([]);
            return;
        }

        try {
            setIsChecking(true);
            const formData = new URLSearchParams();
            formData.append('text', content);
            formData.append('language', language);

            const response = await fetch(LANGUAGETOOL_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Grammar check request failed');
            }

            const data = await response.json();
            
            setErrors(
                data.matches.map((match: any) => ({
                    message: match.message,
                    offset: match.offset,
                    length: match.length,
                    replacements: match.replacements.map((r: any) => r.value),
                    rule: {
                        id: match.rule.id,
                        description: match.rule.description,
                        category: match.rule.category.id,
                    },
                }))
            );
        } catch (error) {
            console.error('Grammar check failed:', error);
            setErrors([]);
        } finally {
            setIsChecking(false);
        }
    }, [language]);

    useEffect(() => {
        const timer = setTimeout(() => {
            checkGrammar(text);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [text, checkGrammar, debounceMs]);

    return { errors, isChecking };
}; 