import { collection, addDoc, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface BlogHistoryItem {
  id: string;
  title: string;
  prompt: string;
  content: string;
  timestamp: number;
  userId?: string;
}

const BLOGS_COLLECTION = 'blogs';

export async function saveBlogToHistory(title: string, prompt: string, content: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('User not authenticated. Saving blog to local storage.');
      // Fallback to localStorage for unauthenticated users
      saveBlogToLocalStorage(title, prompt, content);
      return;
    }

    const blogData = {
      title,
      prompt,
      content,
      timestamp: Date.now(),
      userId: user.uid,
      createdAt: new Date(),
    };

    // Add timeout to prevent hanging
    const savePromise = addDoc(collection(db, BLOGS_COLLECTION), blogData);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('FIREBASE_TIMEOUT')), 5000);
    });

    await Promise.race([savePromise, timeoutPromise]);
    console.log('Blog saved to Firestore successfully');
  } catch (error) {
    if (error instanceof Error && error.message === 'FIREBASE_TIMEOUT') {
      console.log('Firebase save timed out, using local storage instead');
    } else {
      console.log('Firebase unavailable, using local storage instead');
    }
    // Fallback to localStorage if Firebase fails or times out
    saveBlogToLocalStorage(title, prompt, content);
  }
}

export async function getBlogHistory(): Promise<BlogHistoryItem[]> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('User not authenticated. Loading from local storage.');
      return getBlogHistoryFromLocalStorage();
    }

    const blogsRef = collection(db, BLOGS_COLLECTION);
    const q = query(
      blogsRef,
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    // Add timeout to prevent hanging
    const queryPromise = getDocs(q);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('FIREBASE_TIMEOUT')), 5000);
    });

    const querySnapshot = await Promise.race([queryPromise, timeoutPromise]);
    const blogs: BlogHistoryItem[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      blogs.push({
        id: doc.id,
        title: data.title,
        prompt: data.prompt,
        content: data.content,
        timestamp: data.timestamp,
        userId: data.userId,
      });
    });

    return blogs;
  } catch (error) {
    if (error instanceof Error && error.message === 'FIREBASE_TIMEOUT') {
      console.log('Firebase query timed out, using local storage instead');
    } else {
      console.log('Firebase unavailable, using local storage instead');
    }
    // Fallback to localStorage if Firebase fails or times out
    return getBlogHistoryFromLocalStorage();
  }
}

// Fallback functions for localStorage (when user is not authenticated or Firebase fails)
function saveBlogToLocalStorage(title: string, prompt: string, content: string): void {
  if (typeof window === 'undefined') return;
  
  const history = getBlogHistoryFromLocalStorage();
  const newItem: BlogHistoryItem = {
    id: Date.now().toString(),
    title,
    prompt,
    content,
    timestamp: Date.now(),
  };
  
  history.unshift(newItem); // Add to beginning of array
  localStorage.setItem('wordwise_blog_history', JSON.stringify(history.slice(0, 10))); // Keep only last 10 items
}

function getBlogHistoryFromLocalStorage(): BlogHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  const historyString = localStorage.getItem('wordwise_blog_history');
  if (!historyString) return [];
  
  try {
    return JSON.parse(historyString);
  } catch (error) {
    console.error('Error parsing blog history from localStorage:', error);
    return [];
  }
} 