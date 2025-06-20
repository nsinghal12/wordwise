import { useEffect, useRef, useCallback, useState } from 'react';

export interface SpellingError {
    word: string;
    start: number;
    length: number;
    suggestions: string[];
}

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

interface LanguageWorkerMessage {
    type: string;
    requestId?: string;
    errors?: SpellingError[] | GrammarError[];
    words?: string[];
    error?: string;
}

export const useLanguageWorker = () => {
    const workerRef = useRef<Worker | null>(null);
    const requestIdRef = useRef<number>(0);
    const pendingRequestsRef = useRef<Map<string, (data: any) => void>>(new Map());
    const [isWorkerReady, setIsWorkerReady] = useState(false);

    // Initialize worker
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                workerRef.current = new Worker('/workers/language-worker.js');
                
                workerRef.current.onmessage = (e: MessageEvent<LanguageWorkerMessage>) => {
                    const { type, requestId, ...data } = e.data;
                    
                    switch (type) {
                        case 'SPELLCHECKER_READY':
                            setIsWorkerReady(true);
                            break;
                            
                        case 'SPELLCHECKER_ERROR':
                            console.error('Spellchecker error:', data.error);
                            setIsWorkerReady(false);
                            break;
                            
                        case 'SPELL_CHECK_RESULT':
                        case 'GRAMMAR_CHECK_RESULT':
                        case 'PROFANITY_CHECK_RESULT':
                            if (requestId && pendingRequestsRef.current.has(requestId)) {
                                const resolver = pendingRequestsRef.current.get(requestId);
                                resolver?.(data);
                                pendingRequestsRef.current.delete(requestId);
                            }
                            break;
                            
                        default:
                            console.warn('Unknown worker message type:', type);
                    }
                };
                
                workerRef.current.onerror = (error) => {
                    console.error('Worker error:', error);
                    setIsWorkerReady(false);
                };
                
                // Initialize spellchecker
                workerRef.current.postMessage({
                    type: 'INITIALIZE_SPELLCHECKER'
                });
            } catch (error) {
                console.error('Failed to create worker:', error);
            }
        }
        
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, []);

    // Generate unique request ID
    const generateRequestId = useCallback(() => {
        return `req_${++requestIdRef.current}_${Date.now()}`;
    }, []);

    // Spell check function
    const checkSpelling = useCallback(async (text: string): Promise<SpellingError[]> => {
        return new Promise((resolve) => {
            if (!workerRef.current || !isWorkerReady) {
                resolve([]);
                return;
            }
            
            const requestId = generateRequestId();
            pendingRequestsRef.current.set(requestId, (data) => {
                resolve(data.errors || []);
            });
            
            workerRef.current.postMessage({
                type: 'SPELL_CHECK',
                data: { text, requestId }
            });
        });
    }, [isWorkerReady, generateRequestId]);

    // Grammar check function
    const checkGrammar = useCallback(async (text: string, language: string = 'en-US'): Promise<GrammarError[]> => {
        return new Promise((resolve) => {
            if (!workerRef.current) {
                resolve([]);
                return;
            }
            
            const requestId = generateRequestId();
            pendingRequestsRef.current.set(requestId, (data) => {
                resolve(data.errors || []);
            });
            
            workerRef.current.postMessage({
                type: 'GRAMMAR_CHECK',
                data: { text, language, requestId }
            });
        });
    }, [generateRequestId]);

    // Profanity check function
    const checkProfanity = useCallback(async (text: string): Promise<string[]> => {
        return new Promise((resolve) => {
            if (!workerRef.current) {
                resolve([]);
                return;
            }
            
            const requestId = generateRequestId();
            pendingRequestsRef.current.set(requestId, (data) => {
                resolve(data.words || []);
            });
            
            workerRef.current.postMessage({
                type: 'PROFANITY_CHECK',
                data: { text, requestId }
            });
        });
    }, [generateRequestId]);

    return {
        isWorkerReady,
        checkSpelling,
        checkGrammar,
        checkProfanity
    };
}; 