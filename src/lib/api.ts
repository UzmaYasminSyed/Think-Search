const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface User {
  id: string;
  email: string;
  display_name?: string;
  username?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Blog {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  excerpt: string;
  slug: string;
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  reading_time: number;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async signUp(email: string, password: string, displayName?: string, username?: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName, username }),
    });
    
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    
    return data;
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    
    return data;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  signOut(): void {
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Blog methods
  async getBlogs(featured?: boolean, search?: string): Promise<Blog[]> {
    const params = new URLSearchParams();
    if (featured) params.append('featured', 'true');
    if (search) params.append('search', search);
    const query = params.toString();
    return this.request<Blog[]>(`/blogs${query ? `?${query}` : ''}`);
  }

  async getBlogBySlug(slug: string): Promise<Blog> {
    return this.request<Blog>(`/blogs/${slug}`);
  }

  async getMyBlogs(status?: 'all' | 'published' | 'drafts'): Promise<Blog[]> {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    const query = params.toString();
    return this.request<Blog[]>(`/blogs/my${query ? `?${query}` : ''}`);
  }

  async createBlog(blogData: {
    title: string;
    content: string;
    excerpt?: string;
    slug: string;
    tags?: string[];
    cover_image_url?: string;
    reading_time?: number;
    is_published?: boolean;
  }): Promise<Blog> {
    return this.request<Blog>('/blogs', {
      method: 'POST',
      body: JSON.stringify(blogData),
    });
  }

  async updateBlog(id: string, blogData: Partial<{
    title: string;
    content: string;
    excerpt: string;
    slug: string;
    tags: string[];
    cover_image_url: string;
    reading_time: number;
    is_published: boolean;
    is_featured: boolean;
  }>): Promise<Blog> {
    return this.request<Blog>(`/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(blogData),
    });
  }

  async deleteBlog(id: string): Promise<void> {
    return this.request<void>(`/blogs/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();

