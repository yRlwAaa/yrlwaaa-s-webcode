// 检查用户是否已登录
export function isLoggedIn(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem('isLoggedIn') === 'true';
}

// 获取当前用户信息
export function getUser(): { email: string } | null {
  if (typeof localStorage === 'undefined') return null;
  const email = localStorage.getItem('userEmail');
  if (!email) return null;
  return { email };
}

// 登出
export function logout(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userEmail');
  window.location.reload();
}

// 需要登录才能执行的操作
export function withAuth<T>(
  action: () => T | Promise<T>,
  onRequireLogin: () => void
): T | void | Promise<T | void> {
  if (!isLoggedIn()) {
    onRequireLogin();
    return;
  }
  return action();
}