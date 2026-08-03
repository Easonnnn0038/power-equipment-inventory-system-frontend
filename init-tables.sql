-- ============================================================
-- 电力设备台账管理系统 - 完整建表脚本
-- 包含：设备表、巡检记录表
-- ============================================================

USE equipment_management;

-- ------------------------------------------------------------
-- 1. 设备表 equipment
-- ------------------------------------------------------------
DROP TABLE IF EXISTS equipment;
CREATE TABLE equipment (
    id              BIGINT        NOT NULL AUTO_INCREMENT COMMENT '设备ID',
    equipment_code  VARCHAR(50)   NOT NULL COMMENT '设备编号（唯一标识）',
    equipment_name  VARCHAR(100)  NOT NULL COMMENT '设备名称',
    equipment_type  VARCHAR(50)   DEFAULT NULL COMMENT '设备类型（如：变压器、开关柜、直流屏）',
    equipment_model VARCHAR(100)  DEFAULT NULL COMMENT '设备型号',
    manufacturer    VARCHAR(100)  DEFAULT NULL COMMENT '制造商',
    manufacture_date DATETIME    DEFAULT NULL COMMENT '制造日期',
    installation_date DATETIME   DEFAULT NULL COMMENT '安装日期',
    location        VARCHAR(200)  DEFAULT NULL COMMENT '安装位置（如：1号变电站）',
    status          VARCHAR(20)   DEFAULT '运行中' COMMENT '设备状态（运行中、停运、检修中、报废）',
    voltage_level   VARCHAR(20)   DEFAULT NULL COMMENT '电压等级（如：10kV、220kV）',
    capacity        VARCHAR(50)   DEFAULT NULL COMMENT '设备容量（如：500kVA、630A）',
    remark          VARCHAR(500)  DEFAULT NULL COMMENT '备注信息',
    create_time     DATETIME      DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time     DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_equipment_code (equipment_code)
) ENGINE=InnoDB COMMENT='设备台账表';

-- 初始设备数据
INSERT INTO equipment (equipment_code, equipment_name, equipment_type, equipment_model, manufacturer, location, status, voltage_level) VALUES
('TR-001', '1号主变压器', '变压器', 'SFSZ11-31500/220', '特变电工', '110kV变电站', '运行中', '220kV'),
('TR-002', '2号主变压器', '变压器', 'SFSZ11-31500/220', '特变电工', '110kV变电站', '运行中', '220kV'),
('CB-001', '110kV进线断路器', '开关柜', 'ZW32-12', 'ABB', '110kV变电站', '运行中', '110kV'),
('CB-002', '10kV馈线断路器', '开关柜', 'VS1-12', '西门子', '110kV变电站', '运行中', '10kV'),
('CB-003', '10kV分段开关', '开关柜', 'VS1-12', '西门子', '110kV变电站', '停运', '10kV'),
('CT-001', '1号电流互感器', '互感器', 'LZZBJ9-10', '正泰电器', '10kV配电室', '运行中', '10kV'),
('PT-001', '1号电压互感器', '互感器', 'JDZX9-10', '正泰电器', '10kV配电室', '运行中', '10kV'),
('LA-001', '1号避雷器', '避雷器', 'Y5W-17/50', '西电避雷器', '110kV变电站', '运行中', '110kV'),
('LA-002', '2号避雷器', '避雷器', 'Y5W-17/50', '西电避雷器', '110kV变电站', '检修中', '110kV'),
('DC-001', '直流屏', '直流屏', 'GZDW-100', '许继电气', '主控室', '运行中', '-'),
('CB-004', '备用断路器', '开关柜', 'VS1-12', '西门子', '仓库', '报废', '10kV'),
('TR-003', '站用变压器', '变压器', 'S11-M-500/10', '特变电工', '10kV配电室', '运行中', '10kV');

-- ------------------------------------------------------------
-- 2. 巡检记录表 inspection_record
-- ------------------------------------------------------------
DROP TABLE IF EXISTS inspection_record;
CREATE TABLE inspection_record (
    id                BIGINT        NOT NULL AUTO_INCREMENT COMMENT '巡检记录ID',
    equipment_id       BIGINT        NOT NULL COMMENT '关联的设备ID',
    equipment_name     VARCHAR(100)  DEFAULT NULL COMMENT '设备名称（冗余字段）',
    inspection_plan_id BIGINT        DEFAULT NULL COMMENT '巡检计划ID',
    inspection_plan_name VARCHAR(200) DEFAULT NULL COMMENT '巡检计划名称（冗余）',
    inspection_method  VARCHAR(50)   DEFAULT '现场巡检' COMMENT '巡检方式：现场巡检/远程巡检',
    inspection_result  VARCHAR(20)   DEFAULT NULL COMMENT '巡检结果：正常/异常',
    problem_desc       TEXT          COMMENT '问题描述',
    check_items        TEXT          COMMENT '检查项清单（JSON格式）',
    attachments        TEXT          COMMENT '附件列表（JSON格式）',
    inspector_id       VARCHAR(50)   DEFAULT NULL COMMENT '巡检员ID',
    inspector_name     VARCHAR(50)   DEFAULT NULL COMMENT '巡检员名称',
    inspection_date    DATETIME      DEFAULT NULL COMMENT '巡检日期',
    remark             VARCHAR(500)  DEFAULT NULL COMMENT '备注/处理措施',
    create_time        DATETIME      DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time        DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_inspection_result (inspection_result),
    INDEX idx_inspection_date (inspection_date),
    INDEX idx_inspector_id (inspector_id)
) ENGINE=InnoDB COMMENT='巡检记录表';

-- 初始巡检数据（近7天）
INSERT INTO inspection_record (equipment_id, equipment_name, inspection_result, problem_desc, inspector_id, inspector_name, inspection_date) VALUES
(1, '1号主变压器', '正常', NULL, '1', 'admin', '2026-07-25 09:00:00'),
(2, '2号主变压器', '正常', NULL, '1', 'admin', '2026-07-25 10:00:00'),
(4, '10kV馈线断路器', '正常', NULL, '1', 'admin', '2026-07-25 11:00:00'),
(1, '1号主变压器', '正常', NULL, '1', 'admin', '2026-07-26 09:00:00'),
(3, '110kV进线断路器', '异常', '断路器动作异常', '1', 'admin', '2026-07-26 10:00:00'),
(1, '1号主变压器', '正常', NULL, '1', 'admin', '2026-07-27 09:00:00'),
(2, '2号主变压器', '正常', NULL, '1', 'admin', '2026-07-27 10:00:00'),
(5, '10kV分段开关', '异常', '温度异常偏高', '1', 'admin', '2026-07-27 11:00:00'),
(1, '1号主变压器', '正常', NULL, '1', 'admin', '2026-07-28 09:00:00'),
(6, '1号电流互感器', '正常', NULL, '1', 'admin', '2026-07-28 10:00:00'),
(1, '1号主变压器', '正常', NULL, '1', 'admin', '2026-07-29 09:00:00'),
(7, '1号电压互感器', '异常', '二次电压异常', '1', 'admin', '2026-07-29 10:00:00'),
(1, '1号主变压器', '正常', NULL, '1', 'admin', '2026-07-30 09:00:00'),
(10, '直流屏', '正常', NULL, '1', 'admin', '2026-07-30 10:00:00'),
(1, '1号主变压器', '正常', NULL, '1', 'admin', '2026-07-31 09:00:00'),
(2, '2号主变压器', '正常', NULL, '1', 'admin', '2026-07-31 10:00:00'),
(8, '1号避雷器', '正常', NULL, '1', 'admin', '2026-07-31 11:00:00'),
(11, '备用断路器', '异常', '触头磨损严重', '1', 'admin', '2026-07-31 14:00:00');

-- ------------------------------------------------------------
-- 3. 巡检计划表 inspection_plan
-- ------------------------------------------------------------
DROP TABLE IF EXISTS inspection_plan;
CREATE TABLE inspection_plan (
    id              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '巡检计划ID',
    name            VARCHAR(200) NOT NULL COMMENT '计划名称',
    plan_type       VARCHAR(50)  DEFAULT '日常巡检' COMMENT '计划类型',
    description     VARCHAR(500) DEFAULT NULL COMMENT '计划描述',
    status          VARCHAR(20)  DEFAULT '启用' COMMENT '状态',
    create_time     DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id)
) ENGINE=InnoDB COMMENT='巡检计划表';

INSERT INTO inspection_plan (id, name, plan_type, description, status) VALUES
(1, '日常巡检 - 每日 09:00', '日常巡检', '每日例行巡检', '启用'),
(2, '周巡检 - 每周一', '周巡检', '每周一次全面巡检', '启用'),
(3, '月巡检 - 每月1日', '月巡检', '每月深度巡检', '启用'),
(4, '季度巡检', '季度巡检', '每季度一次', '启用'),
(5, '年度大修', '年度巡检', '年度全面检修', '启用');

-- ------------------------------------------------------------
-- 4. 检查项模板表 check_item_template
-- ------------------------------------------------------------
DROP TABLE IF EXISTS check_item_template;
CREATE TABLE check_item_template (
    id              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '模板ID',
    equipment_type  VARCHAR(100) NOT NULL COMMENT '设备类型',
    item_name       VARCHAR(200) NOT NULL COMMENT '检查项名称',
    sort_order      INT          DEFAULT 0 COMMENT '排序',
    default_status  VARCHAR(20)  DEFAULT '正常' COMMENT '默认状态',
    create_time     DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_equipment_type (equipment_type)
) ENGINE=InnoDB COMMENT='检查项模板表';

INSERT INTO check_item_template (equipment_type, item_name, sort_order, default_status) VALUES
('变压器', '外观检查：无渗漏油、无异常声响', 1, '正常'),
('变压器', '温度检查：油温、绕组温度正常', 2, '正常'),
('变压器', '油位检查：油位指示正常', 3, '正常'),
('变压器', '接线检查：端子无松动发热', 4, '正常'),
('变压器', '冷却系统：风机、油泵运行正常', 5, '待检'),
('变压器', '保护装置：瓦斯、差动保护投入正常', 6, '正常'),
('通用', '外观检查：无异常现象', 1, '正常'),
('通用', '温度检查：温度正常', 2, '正常'),
('通用', '接线检查：端子无松动', 3, '正常'),
('通用', '仪表指示：各仪表读数正常', 4, '正常');
