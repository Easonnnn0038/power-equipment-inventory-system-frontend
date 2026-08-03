-- ============================================================
-- 电力设备台账管理系统 - 角色与权限表建表脚本
-- 数据库：equipment_management
-- ============================================================

USE equipment_management;

-- ------------------------------------------------------------
-- 1. 角色表 sys_role
-- ------------------------------------------------------------
DROP TABLE IF EXISTS sys_role;
CREATE TABLE sys_role (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '角色ID',
    role_name   VARCHAR(50)  NOT NULL COMMENT '角色名称（如：管理员、普通用户）',
    role_code   VARCHAR(50)  NOT NULL COMMENT '角色编码（如：admin、user）',
    description VARCHAR(200) DEFAULT NULL COMMENT '角色描述',
    status      VARCHAR(20)  DEFAULT '正常' COMMENT '角色状态（正常、禁用）',
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_role_code (role_code)
) ENGINE=InnoDB COMMENT='角色表';

-- 初始角色数据
INSERT INTO sys_role (id, role_name, role_code, description, status) VALUES
(1, '系统管理员', 'admin', '拥有系统全部权限，可管理所有模块和用户', '正常'),
(2, '普通用户', 'user', '基础用户权限，可查看数据和执行日常操作', '正常'),
(3, '巡检人员', 'inspector', '巡检相关权限，负责设备巡检记录', '正常');

-- ------------------------------------------------------------
-- 2. 权限表 sys_permission
-- ------------------------------------------------------------
DROP TABLE IF EXISTS sys_permission;
CREATE TABLE sys_permission (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '权限ID',
    permission_name VARCHAR(100) NOT NULL COMMENT '权限名称',
    permission_code VARCHAR(100) NOT NULL COMMENT '权限编码',
    description VARCHAR(200) DEFAULT NULL COMMENT '权限描述',
    module      VARCHAR(50)  DEFAULT NULL COMMENT '所属模块',
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_permission_code (permission_code)
) ENGINE=InnoDB COMMENT='权限表';

-- 初始权限数据
INSERT INTO sys_permission (id, permission_name, permission_code, description, module) VALUES
-- 设备管理权限
(1, '查看设备', 'equipment:view', '查看设备台账数据', 'equipment'),
(2, '新增设备', 'equipment:add', '新增设备记录', 'equipment'),
(3, '编辑设备', 'equipment:edit', '修改设备信息', 'equipment'),
(4, '删除设备', 'equipment:delete', '删除设备记录', 'equipment'),
(5, '导入设备', 'equipment:import', '批量导入设备数据', 'equipment'),
(6, '导出设备', 'equipment:export', '导出设备数据', 'equipment'),
-- 巡检管理权限
(7, '查看巡检', 'inspection:view', '查看巡检记录', 'inspection'),
(8, '新增巡检', 'inspection:add', '创建巡检记录', 'inspection'),
(9, '编辑巡检', 'inspection:edit', '修改巡检记录', 'inspection'),
(10, '删除巡检', 'inspection:delete', '删除巡检记录', 'inspection'),
-- 统计权限
(11, '查看统计', 'statistics:view', '查看数据统计页面', 'statistics'),
-- 用户管理权限
(12, '查看用户', 'user:view', '查看用户列表', 'user'),
(13, '新增用户', 'user:add', '新增用户', 'user'),
(14, '编辑用户', 'user:edit', '编辑用户信息', 'user'),
(15, '删除用户', 'user:delete', '删除用户', 'user'),
(16, '分配角色', 'user:assign-role', '为用户分配角色', 'user'),
(17, '修改密码', 'user:change-password', '修改用户密码', 'user');

-- ------------------------------------------------------------
-- 3. 角色-权限关联表 sys_role_permission
-- ------------------------------------------------------------
DROP TABLE IF EXISTS sys_role_permission;
CREATE TABLE sys_role_permission (
    id             BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    role_id        BIGINT NOT NULL COMMENT '角色ID',
    permission_id  BIGINT NOT NULL COMMENT '权限ID',
    PRIMARY KEY (id),
    UNIQUE KEY uk_role_permission (role_id, permission_id)
) ENGINE=InnoDB COMMENT='角色权限关联表';

-- 初始角色权限关联
-- 系统管理员：拥有全部权限
INSERT INTO sys_role_permission (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6),
(1, 7), (1, 8), (1, 9), (1, 10),
(1, 11),
(1, 12), (1, 13), (1, 14), (1, 15), (1, 16), (1, 17);

-- 普通用户：查看设备、查看巡检、查看统计
INSERT INTO sys_role_permission (role_id, permission_id) VALUES
(2, 1), (2, 6),
(2, 7),
(2, 11);

-- 巡检人员：查看设备、查看巡检、新增巡检、编辑巡检、查看统计
INSERT INTO sys_role_permission (role_id, permission_id) VALUES
(3, 1),
(3, 7), (3, 8), (3, 9),
(3, 11);
