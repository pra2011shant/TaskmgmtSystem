export interface GlobalSearchResult {
  type: 'Task' | 'User' | 'Team';
  id: number;
  title: string;
  subtitle: string;
  tag?: string;
  url: string;
}
