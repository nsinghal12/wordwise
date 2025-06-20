import { collection, addDoc, query, orderBy, limit, getDocs, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

type STORAGE_STRATEGY = 'LOCAL_STORAGE' | 'FIREBASE';

const CHOSEN_STORAGE_STRATEGY: STORAGE_STRATEGY = 'FIREBASE';

export interface BlogHistoryItem {
  id: string;
  title: string;
  prompt: string;
  content: string;
  timestamp: number;
  userId?: string;
  persistenceState?: 'loading' | 'success' | 'error';
  isDeleting?: boolean;
}

const BLOGS_COLLECTION = 'blogs';

export async function saveBlogToHistory(title: string, prompt: string, content: string): Promise<{ success: boolean; error?: string }> {
  if (CHOSEN_STORAGE_STRATEGY === 'LOCAL_STORAGE') {
    try {
      saveBlogToLocalStorage(title, prompt, content);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Firebase strategy
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('User not authenticated. Saving blog to local storage.');
      // Fallback to localStorage for unauthenticated users
      try {
        saveBlogToLocalStorage(title, prompt, content);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
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
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === 'FIREBASE_TIMEOUT') {
      console.log('Firebase save timed out, using local storage instead');
    } else {
      console.log('Firebase unavailable, using local storage instead');
    }
    // Fallback to localStorage if Firebase fails or times out
    try {
      saveBlogToLocalStorage(title, prompt, content);
      return { success: true };
    } catch (fallbackError) {
      return { success: false, error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error' };
    }
  }
}

export async function getBlogHistory(): Promise<BlogHistoryItem[]> {
  if (CHOSEN_STORAGE_STRATEGY === 'LOCAL_STORAGE') {
    return getBlogHistoryFromLocalStorage();
  }

  // Firebase strategy
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

export async function updateBlogInHistory(id: string, title: string, prompt: string, content: string): Promise<{ success: boolean; error?: string }> {
  if (CHOSEN_STORAGE_STRATEGY === 'LOCAL_STORAGE') {
    try {
      updateBlogInLocalStorage(id, title, prompt, content);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Firebase strategy
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('User not authenticated. Updating blog in local storage.');
      // Fallback to localStorage for unauthenticated users
      try {
        updateBlogInLocalStorage(id, title, prompt, content);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    const blogData = {
      title,
      prompt,
      content,
      timestamp: Date.now(),
      updatedAt: new Date(),
    };

    // Add timeout to prevent hanging
    const updatePromise = updateDoc(doc(db, BLOGS_COLLECTION, id), blogData);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('FIREBASE_TIMEOUT')), 5000);
    });

    await Promise.race([updatePromise, timeoutPromise]);
    console.log('Blog updated in Firestore successfully');
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === 'FIREBASE_TIMEOUT') {
      console.log('Firebase update timed out, using local storage instead');
    } else {
      console.log('Firebase unavailable, using local storage instead');
    }
    // Fallback to localStorage if Firebase fails or times out
    try {
      updateBlogInLocalStorage(id, title, prompt, content);
      return { success: true };
    } catch (fallbackError) {
      return { success: false, error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error' };
    }
  }
}

export async function copyBlogFromHistory(originalItem: BlogHistoryItem): Promise<{ success: boolean; error?: string; newItem?: BlogHistoryItem }> {
  const copiedTitle = `${originalItem.title} (Copy)`;
  const newItem: BlogHistoryItem = {
    id: Date.now().toString(), // Temporary ID for optimistic update
    title: copiedTitle,
    prompt: originalItem.prompt,
    content: originalItem.content,
    timestamp: Date.now(),
    userId: originalItem.userId,
    persistenceState: 'loading'
  };

  const result = await saveBlogToHistory(copiedTitle, originalItem.prompt, originalItem.content);
  
  if (result.success) {
    return { 
      success: true, 
      newItem: {
        ...newItem,
        persistenceState: 'success'
      }
    };
  } else {
    return { 
      success: false, 
      error: result.error,
      newItem: {
        ...newItem,
        persistenceState: 'error'
      }
    };
  }
}

export async function deleteBlogFromHistory(id: string): Promise<{ success: boolean; error?: string }> {
  if (CHOSEN_STORAGE_STRATEGY === 'LOCAL_STORAGE') {
    try {
      deleteBlogFromLocalStorage(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Firebase strategy
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('User not authenticated. Deleting from local storage.');
      // Fallback to localStorage for unauthenticated users
      try {
        deleteBlogFromLocalStorage(id);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // Add timeout to prevent hanging
    const deletePromise = deleteDoc(doc(db, BLOGS_COLLECTION, id));
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('FIREBASE_TIMEOUT')), 5000);
    });

    await Promise.race([deletePromise, timeoutPromise]);
    console.log('Blog deleted from Firestore successfully');
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === 'FIREBASE_TIMEOUT') {
      console.log('Firebase delete timed out, using local storage instead');
    } else {
      console.log('Firebase unavailable, using local storage instead');
    }
    // Fallback to localStorage if Firebase fails or times out
    try {
      deleteBlogFromLocalStorage(id);
      return { success: true };
    } catch (fallbackError) {
      return { success: false, error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error' };
    }
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

function updateBlogInLocalStorage(id: string, title: string, prompt: string, content: string): void {
  if (typeof window === 'undefined') return;
  
  const history = getBlogHistoryFromLocalStorage();
  const itemIndex = history.findIndex(item => item.id === id);
  
  if (itemIndex !== -1) {
    history[itemIndex] = {
      ...history[itemIndex],
      title,
      prompt,
      content,
      timestamp: Date.now(),
    };
    localStorage.setItem('wordwise_blog_history', JSON.stringify(history));
  }
}

function deleteBlogFromLocalStorage(id: string): void {
  if (typeof window === 'undefined') return;
  
  const history = getBlogHistoryFromLocalStorage();
  const filteredHistory = history.filter(item => item.id !== id);
  localStorage.setItem('wordwise_blog_history', JSON.stringify(filteredHistory));
} 