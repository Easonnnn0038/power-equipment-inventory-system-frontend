-- ============================================================
-- 增量更新脚本 - 修复缺失的表结构和字段
-- 数据库：equipment_management
-- 执行时间：2026-08-02
-- ============================================================

USE equipment_management;

-- 1. 检查并补充 inspection_record 表的缺失列
-- 如果 inspection_plan_id 列不存在，则添加
SET @dbname = DATABASE();
SET @tablename = 'inspection_record';
SET @columnname = 'inspection_plan_id';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE inspection_record ADD COLUMN inspection_plan_id BIGINT DEFAULT NULL COMMENT "巡检计划ID"'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 如果 inspection_plan_name 列不存在，则添加
SET @columnname = 'inspection_plan_name';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE inspection_record ADD COLUMN inspection_plan_name VARCHAR(200) DEFAULT NULL COMMENT "巡检计划名称"'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 如果 inspection_method 列不存在，则添加
SET @columnname = 'inspection_method';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE inspection_record ADD COLUMN inspection_method VARCHAR(50) DEFAULT "现场巡检" COMMENT "巡检方式"'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. 检查并补充 check_item_template 表的缺失列
SET @tablename = 'check_item_template';
SET @columnname = 'update_time';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE check_item_template ADD COLUMN update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT "更新时间"'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 3. 创建缺失的表（如果不存在）
-- inspection_plan 表
CREATE TABLE IF NOT EXISTS inspection_plan (
    id              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '巡检计划ID',
    name            VARCHAR(200) NOT NULL COMMENT '计划名称',
    plan_type       VARCHAR(50)  DEFAULT '日常巡检' COMMENT '计划类型',
    description     VARCHAR(500) DEFAULT NULL COMMENT '计划描述',
    status          VARCHAR(20)  DEFAULT '启用' COMMENT '状态',
    create_time     DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id)
) ENGINE=InnoDB COMMENT='巡检计划表';

-- 插入巡检计划初始数据（如果为空）
INSERT INTO inspection_plan (id, name, plan_type, description, status)
SELECT 1, '日常巡检 - 每日 09:00', '日常巡检', '每日例行巡检', '启用'
WHERE NOT EXISTS (SELECT 1 FROM inspection_plan WHERE id = 1);

INSERT INTO inspection_plan (id, name, plan_type, description, status)
SELECT 2, '周巡检 - 每周一', '周巡检', '每周一次全面巡检', '启用'
WHERE NOT EXISTS (SELECT 1 FROM inspection_plan WHERE id = 2);

INSERT INTO inspection_plan (id, name, plan_type, description, status)
SELECT 3, '月巡检 - 每月1日', '月巡检', '每月深度巡检', '启用'
WHERE NOT EXISTS (SELECT 1 FROM inspection_plan WHERE id = 3);

INSERT INTO inspection_plan (id, name, plan_type, description, status)
SELECT 4, '季度巡检', '季度巡检', '每季度一次', '启用'
WHERE NOT EXISTS (SELECT 1 FROM inspection_plan WHERE id = 4);

INSERT INTO inspection_plan (id, name, plan_type, description, status)
SELECT 5, '年度大修', '年度巡检', '年度全面检修', '启用'
WHERE NOT EXISTS (SELECT 1 FROM inspection_plan WHERE id = 5);

-- check_item_template 表
CREATE TABLE IF NOT EXISTS check_item_template (
    id              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '模板ID',
    equipment_type  VARCHAR(100) NOT NULL COMMENT '设备类型',
    item_name       VARCHAR(200) NOT NULL COMMENT '检查项名称',
    sort_order      INT          DEFAULT 0 COMMENT '排序',
    default_status  VARCHAR(20)  DEFAULT '正常' COMMENT '默认状态',
    create_time     DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_equipment_type (equipment_type)
) ENGINE=InnoDB COMMENT='检查项模板表';

-- 插入检查项模板初始数据（如果为空）
INSERT INTO check_item_template (equipment_type, item_name, sort_order, default_status)
SELECT '变压器', '外观检查：无渗漏油、无异常声响', 1, '正常'
WHERE NOT EXISTS (SELECT 1 FROM check_item_template WHERE equipment_type = '变压器' AND sort_order = 1);

INSERT INTO check_item_template (equipment_type, item_name, sort_order, default_status)
SELECT '变压器', '温度检查：油温、绕组温度正常', 2, '正常'
WHERE NOT EXISTS (SELECT 1 FROM check_item_template WHERE equipment_type = '变压器' AND sort_order = 2);

INSERT INTO check_item_template (equipment_type, item_name, sort_order, default_status)
SELECT '变压器', '油位检查：油位指示正常', 3, '正常'
WHERE NOT EXISTS (SELECT 1 FROM check_item_template WHERE equipment_type = '变压器' AND sort_order = 3);

INSERT INTO check_item_template (equipment_type, item_name, sort_order, default_status)
SELECT '变压器', '接线检查：端子无松动发热', 4, '正常'
WHERE NOT EXISTS (SELECT 1 FROM check_item_template WHERE equipment_type = '变压器' AND sort_order = 4);

INSERT INTO check_item_template (equipment_type, item_name, sort_order, default_status)
SELECT '变压器', '冷却系统：风机、油泵运行正常', 5, '待检'
WHERE NOT EXISTS (SELECT 1 FROM check_item_template WHERE equipment_type = '变压器' AND sort_order = 5);

INSERT INTO check_item_template (equipment_type, item_name, sort_order, default_status)
SELECT '变压器', '保护装置：瓦斯、差动保护投入正常', 6, '正常'
WHERE NOT EXISTS (SELECT 1 FROM check_item_template WHERE equipment_type = '变压器' AND sort_order = 6);

INSERT INTO check_item_template (equipment_type, item_name, sort_order, default_status)
SELECT '通用', '外观检查：无异常现象', 1, '正常'
WHERE NOT EXISTS (SELECT 1 FROM check_item_template WHERE equipment_type = '通用' AND sort_order = 1);

INSERT INTO check_item_template (equipment_type, item_name, sort_order, default_status)
SELECT '通用', '温度检查：温度正常', 2, '正常'
WHERE NOT EXISTS (SELECT 1 FROM check_item_template WHERE equipment_type = '通用' AND sort_order = 2);

INSERT INTO check_item_template (equipment_type, item_name, sort_order, default_status)
SELECT '通用', '接线检查：端子无松动', 3, '正常'
WHERE NOT EXISTS (SELECT 1 FROM check_item_template WHERE equipment_type = '通用' AND sort_order = 3);

INSERT INTO check_item_template (equipment_type, item_name, sort_order, default_status)
SELECT '通用', '仪表指示：各仪表读数正常', 4, '正常'
WHERE NOT EXISTS (SELECT 1 FROM check_item_template WHERE equipment_type = '通用' AND sort_order = 4);
