/* =========================================================
 * stores/auth.js — 统一登录态封装
 * 原 8 个文件 28 处散点 localStorage.getItem('token'/'role'/'username') → 全部收敛到此处
 * 存储 key 统一前缀 pei_（Power Equipment Inventory），避免多项目共域冲突
 *
 * 导出：
 *   getToken / setToken / clearToken
 *   getUsername / setUsername
 *   getRole / setRole      —— 读取时自动 normalize（非法值→user），与路由守卫一致
 *   saveLogin({token,username,role})
 *   clearAuth()
 *   isLocalMode()          —— token 以 'local-token-' 开头判定
 *
 * 此模块无任何 Vue 依赖，router/request/api 纯 js 也可直接导入
 * =======================================================*/

const KEYS = {
  token: 'pei_token',
  username: 'pei_username',
  role: 'pei_role',
};

const VALID_ROLES = ['admin', 'inspector', 'user'];

function normalizeRole(raw) {
  return VALID_ROLES.includes(raw) ? raw : 'user';
}

/* ===== token ===== */
export function getToken() {
  return localStorage.getItem(KEYS.token) ?? '';
}
export function setToken(token) {
  localStorage.setItem(KEYS.token, token);
}
export function clearToken() {
  localStorage.removeItem(KEYS.token);
}

/* ===== username ===== */
export function getUsername() {
  return localStorage.getItem(KEYS.username) ?? '';
}
export function setUsername(v) {
  localStorage.setItem(KEYS.username, v);
}

/* ===== role（读时自动修正非法值→user） ===== */
export function getRole() {
  return normalizeRole(localStorage.getItem(KEYS.role));
}
export function setRole(v) {
  localStorage.setItem(KEYS.role, normalizeRole(v));
}

/* ===== 批量操作 ===== */
export function saveLogin(payload) {
  setToken(payload.token);
  setUsername(payload.username);
  setRole(payload.role);
}
export function clearAuth() {
  localStorage.removeItem(KEYS.token);
  localStorage.removeItem(KEYS.username);
  localStorage.removeItem(KEYS.role);
}

/* ===== 本地模式（后端不可用时前端 fallback） ===== */
export function isLocalMode() {
  return getToken().startsWith('local-token-');
}

/* ===== 兼容：旧 key 迁移（首次读时自动把老值抄到新 key，避免用户被踢登录） ===== */
(function migrateLegacyKeys() {
  try {
    const LEGACY = { token: 'token', username: 'username', role: 'role' };
    const hasAnyLegacy = Object.values(LEGACY).some((k) => localStorage.getItem(k) !== null);
    const hasAnyNew = Object.values(KEYS).some((k) => localStorage.getItem(k) !== null);
    if (hasAnyLegacy && !hasAnyNew) {
      const t = localStorage.getItem(LEGACY.token); if (t) localStorage.setItem(KEYS.token, t);
      const u = localStorage.getItem(LEGACY.username); if (u) localStorage.setItem(KEYS.username, u);
      const r = localStorage.getItem(LEGACY.role); if (r) localStorage.setItem(KEYS.role, normalizeRole(r));
      // 保留老 key 一段时间兜底，不清
    }
  } catch (_) { /* SSR/localStorage unavailable */ }
})();
