export interface BlogHistoryItem {
  id: string;
  prompt: string;
  content: string;
  timestamp: number;
}

const BLOG_HISTORY_KEY = 'wordwise_blog_history';

export function saveBlogToHistory(prompt: string, content: string): void {
  if (typeof window === 'undefined') return;
  
  const history = getBlogHistory();
  const newItem: BlogHistoryItem = {
    id: Date.now().toString(),
    prompt,
    content,
    timestamp: Date.now(),
  };
  
  history.unshift(newItem); // Add to beginning of array
  localStorage.setItem(BLOG_HISTORY_KEY, JSON.stringify(history.slice(0, 10))); // Keep only last 10 items
}

export function getBlogHistory(): BlogHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  const historyString = localStorage.getItem(BLOG_HISTORY_KEY);
  if (!historyString) return [];
  
  try {
    return JSON.parse(historyString);
  } catch (error) {
    console.error('Error parsing blog history:', error);
    return [];
  }
} 