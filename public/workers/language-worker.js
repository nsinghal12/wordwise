// Language Worker - Handles spell checking and grammar checking
let spellChecker = null;
let isSpellCheckerInitialized = false;

// Initialize spell checker
async function initializeSpellChecker() {
    if (isSpellCheckerInitialized) return;
    
    try {
        // Try to import Hunspell - fallback to a simple approach if not available
        try {
            importScripts('https://unpkg.com/hunspell-spellchecker@1.0.2/lib/index.js');
        } catch (error) {
            console.warn('Failed to load hunspell library, using fallback');
            // Fallback - we'll implement a simple word list checker
            self.Spellchecker = function() {
                this.dictionary = new Set();
                this.parse = function(data) { return {}; };
                this.use = function(dict) {};
                this.check = function(word) { return true; }; // Always return true as fallback
                this.suggest = function(word) { return []; };
            };
        }
        
        spellChecker = new self.Spellchecker();
        
        // Load dictionary files
        const [affResponse, dicResponse] = await Promise.all([
            fetch('/dictionaries/en_US.aff'),
            fetch('/dictionaries/en_US.dic')
        ]);
        
        const [affData, dicData] = await Promise.all([
            affResponse.text(),
            dicResponse.text()
        ]);
        
        const dictionaries = spellChecker.parse({
            aff: affData,
            dic: dicData
        });
        
        spellChecker.use(dictionaries);
        isSpellCheckerInitialized = true;
        
        // Notify main thread that spellchecker is ready
        self.postMessage({
            type: 'SPELLCHECKER_READY'
        });
    } catch (error) {
        console.error('Failed to initialize spell checker:', error);
        self.postMessage({
            type: 'SPELLCHECKER_ERROR',
            error: error.message
        });
    }
}

// Perform spell check
function performSpellCheck(text, requestId) {
    if (!isSpellCheckerInitialized || !spellChecker) {
        self.postMessage({
            type: 'SPELL_CHECK_RESULT',
            requestId,
            errors: [],
            error: 'Spell checker not initialized'
        });
        return;
    }
    
    try {
        const errors = [];
        const words = text.match(/\b\w+\b/g) || [];
        let currentOffset = 0;
        
        for (const word of words) {
            const wordIndex = text.indexOf(word, currentOffset);
            if (wordIndex !== -1) {
                // Skip numbers and URLs
                if (!word.match(/^\d+$/) && !word.match(/^https?:\/\//)) {
                    if (!spellChecker.check(word)) {
                        errors.push({
                            word,
                            start: wordIndex,
                            length: word.length,
                            suggestions: spellChecker.suggest(word) || []
                        });
                    }
                }
                currentOffset = wordIndex + word.length;
            }
        }
        
        self.postMessage({
            type: 'SPELL_CHECK_RESULT',
            requestId,
            errors
        });
    } catch (error) {
        console.error('Spell check failed:', error);
        self.postMessage({
            type: 'SPELL_CHECK_RESULT',
            requestId,
            errors: [],
            error: error.message
        });
    }
}

// Perform grammar check
async function performGrammarCheck(text, language, requestId) {
    if (!text.trim()) {
        self.postMessage({
            type: 'GRAMMAR_CHECK_RESULT',
            requestId,
            errors: []
        });
        return;
    }
    
    try {
        const formData = new URLSearchParams();
        formData.append('text', text);
        formData.append('language', language);
        
        const response = await fetch('https://api.languagetool.org/v2/check', {
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
        
        const errors = data.matches.map(match => ({
            message: match.message,
            offset: match.offset,
            length: match.length,
            replacements: match.replacements.map(r => r.value),
            rule: {
                id: match.rule.id,
                description: match.rule.description,
                category: match.rule.category.id,
            },
        }));
        
        self.postMessage({
            type: 'GRAMMAR_CHECK_RESULT',
            requestId,
            errors
        });
    } catch (error) {
        console.error('Grammar check failed:', error);
        self.postMessage({
            type: 'GRAMMAR_CHECK_RESULT',
            requestId,
            errors: [],
            error: error.message
        });
    }
}

// Check for profanity
function checkProfanity(text, requestId) {
    try {
        // Basic profanity check - in a real implementation you'd use a proper library
        // For now, we'll just return the words to be checked on the main thread
        const words = text.match(/\b\w+\b/g) || [];
        
        self.postMessage({
            type: 'PROFANITY_CHECK_RESULT',
            requestId,
            words
        });
    } catch (error) {
        console.error('Profanity check failed:', error);
        self.postMessage({
            type: 'PROFANITY_CHECK_RESULT',
            requestId,
            words: [],
            error: error.message
        });
    }
}

// Message handler
self.onmessage = function(e) {
    const { type, data } = e.data;
    
    switch (type) {
        case 'INITIALIZE_SPELLCHECKER':
            initializeSpellChecker();
            break;
            
        case 'SPELL_CHECK':
            performSpellCheck(data.text, data.requestId);
            break;
            
        case 'GRAMMAR_CHECK':
            performGrammarCheck(data.text, data.language || 'en-US', data.requestId);
            break;
            
        case 'PROFANITY_CHECK':
            checkProfanity(data.text, data.requestId);
            break;
            
        default:
            console.warn('Unknown message type:', type);
    }
};

// Initialize spell checker when worker starts
initializeSpellChecker(); 