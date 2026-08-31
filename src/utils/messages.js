/* =========================================================
 * utils/messages.js — clarify 统一文案目录
 * 四段 Toast 结构：[事实] · [原因（知则披露）] · [下一步建议（必填）]
 * ========================================================= */
import { ElMessage, ElMessageBox } from 'element-plus';

export const ROLE_LABEL = Object.freeze({ admin: "管理员", inspector: "巡检人员", user: "普通用户" });

export function logCtx(scope, detail) {
  const t = new Date().toISOString().substring(11, 19);
  console.info(`[UX ${t}] ${scope} — ${detail}`);
}

/* ===== Tier 1. 权限错误（身份 vs 功能不匹配）===== */
export function permissionDenied(role = "user", operationHint) {
  const label = ROLE_LABEL[role] || role;
  const permsMap = {
    admin:     "拥有所有功能权限",
    inspector: "可操作首页、设备台账、巡检记录、数据统计、AI 助手；不可系统设置，也不可编辑/删除已提交的巡检记录",
    user:      "仅可使用首页、数据统计、AI 助手；设备与巡检类操作需联系管理员开通巡检人员身份",
  };
  const perms = permsMap[role] || "该身份的权限范围有限";
  const hint = operationHint ? `，其中 ${operationHint} 仅支持管理员或更高身份` : "";
  return {
    fact:   `当前以「${label}」身份登录，暂不支持此操作`,
    reason: `${label}的权限范围：${perms}${hint}`,
    action: "如需扩展权限，请联系系统管理员切换或提升身份",
  };
}
export function toastPermission(role, hint) {
  const m = permissionDenied(role, hint);
  ElMessage.warning({ message: `${m.fact}\n💡 ${m.action}`, duration: 3200, showClose: true, grouping: true });
  logCtx("permission.denied", `role=${role} hint=${hint||"none"}`);
}

/* ===== Tier 2. 登录错误（按身份三态精确说明）===== */
export function loginWrong(selectedRole) {
  const samples = { admin:"管理员身份示例 → admin / admin123", inspector:"巡检人员身份示例 → inspector / inspector123", user:"普通用户身份示例 → user / user123" };
  const sample = samples[selectedRole] || "";
  const label = ROLE_LABEL[selectedRole] || selectedRole || "身份";
  return `身份与账号或密码不匹配。请检查：\n1) 左上角选择的「${label}」是否与账号对应；\n2) 账号密码大小写是否正确。${sample ? `\n💡 ${sample}（演示账号）` : ""}`;
}

/* ===== Tier 3. 网络 / HTTP 层错误（request.js 拦截器消费）===== */
export function networkErrorMessage(error) {
  if (!error) return { fact: "请求失败，原因未知", action: "请稍后重试" };
  const status = error.status || error.response?.status;
  const code   = error.code;
  const msg    = error.message || "";
  if (code === "ERR_NETWORK" || /NetworkError|CORS|ECONNABORTED/.test(msg)) {
    return { fact: "无法连接到服务器", reason: "可能是网络断开或后端服务未启动（本地模式下常见）", action: "请检查网络或稍后重试；本地模式可继续使用前端离线功能" };
  }
  if (status === 401) return { fact: "登录已过期", reason: "超过免登录时长或账号在别处登录", action: "请重新登录，登录后将自动返回当前页面" };
  if (status === 403) return { fact: "没有访问该数据的权限", action: "请联系管理员开通对应数据权限" };
  if (status === 404) return { fact: "请求的资源不存在", reason: "接口可能已迁移或数据已被删除", action: "刷新页面重试；如重复出现请报告管理员" };
  if (status && status >= 500) return { fact: `服务器处理失败（HTTP ${status}）`, reason: "后端业务异常，内部错误不会展示给您", action: "请稍后重试，或联系管理员附上时间排查" };
  return { fact: msg || "请求失败", action: "请稍后重试" };
}

/* ===== Tier 4. 表单校验（就近原则）===== */
export const FORM = Object.freeze({
  required: (label)       => ({ fact: `${label}不能为空`, action: "请填写或选择后重试" }),
  minLen:   (label, n)    => ({ fact: `${label}长度不能少于${n}位`, action: `请补充到至少${n}个字符` }),
  match:    (a, b)        => ({ fact: `${a}与${b}不一致`, action: "请检查两次输入的内容" }),
});

/* ===== Destructive action 确认框 ===== */
export function confirmDestructive({ title, body, confirmText, cancelText, type = "warning" }) {
  return ElMessageBox.confirm(body, title, {
    type,
    confirmButtonText: confirmText || "确认",
    cancelButtonText:  cancelText  || "取消",
    distinguishCancelAndClose: true,
    customClass: "destructive-confirm",
    showClose: false,
    closeOnClickModal: false,
    closeOnPressEscape: true,
  });
}
