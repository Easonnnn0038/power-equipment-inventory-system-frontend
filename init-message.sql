-- ============================================================
-- 电力设备台账管理系统 - 消息表建表脚本
-- 数据库：equipment_management
-- ============================================================

USE equipment_management;

-- ------------------------------------------------------------
-- 消息表 sys_message
-- ------------------------------------------------------------
DROP TABLE IF EXISTS sys_message;
CREATE TABLE sys_message (
    id            BIGINT        NOT NULL AUTO_INCREMENT COMMENT '消息ID',
    type          VARCHAR(20)   NOT NULL COMMENT '消息分类（system=系统消息, task=任务消息）',
    sub_type      VARCHAR(20)   DEFAULT NULL COMMENT '消息子类型（alert=告警, announcement=公告, system=通知, task=任务）',
    title         VARCHAR(200)  NOT NULL COMMENT '消息标题',
    content       TEXT          NOT NULL COMMENT '消息内容',
    priority      VARCHAR(20)   DEFAULT 'normal' COMMENT '优先级（normal=普通, urgent=紧急）',
    read_status   TINYINT       DEFAULT 0 COMMENT '已读状态（0=未读, 1=已读）',
    added_to_todo TINYINT       DEFAULT 0 COMMENT '是否已加入待办（0=否, 1=是）',
    publisher_id  BIGINT        DEFAULT NULL COMMENT '发布者用户ID',
    publisher_name VARCHAR(50)  DEFAULT NULL COMMENT '发布者名称',
    target_user_id BIGINT       DEFAULT NULL COMMENT '目标用户ID（NULL=全员可见）',
    create_time   DATETIME      DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time   DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    INDEX idx_type (type),
    INDEX idx_read_status (read_status),
    INDEX idx_target_user (target_user_id),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB COMMENT='消息表';

-- 初始消息数据
INSERT INTO sys_message (type, sub_type, title, content, priority, read_status, publisher_name, create_time) VALUES
-- 系统消息
('system', 'alert', '设备告警：1号主变压器温度异常', '1号主变压器当前温度85°C，已超过预警阈值（80°C），请运维人员及时检查处理。', 'urgent', 0, '系统', '2026-07-31 14:30:00'),
('system', 'announcement', '系统维护通知', '系统将于今晚22:00-23:00进行例行维护，届时将短暂无法访问系统，请提前保存工作内容。', 'normal', 0, '管理员', '2026-07-31 10:00:00'),
('system', 'system', '今日巡检提醒', '今日还有3台设备待巡检（2号主变压器、110kV进线断路器、直流屏），请及时完成巡检记录。', 'normal', 1, '系统', '2026-07-31 08:00:00'),
-- 任务消息
('task', 'task', '设备检修任务', '请于本周五（8月4日）前完成2号主变压器的季度检修工作，并提交检修报告至系统。', 'urgent', 0, '管理员', '2026-07-31 09:00:00'),
('task', 'task', '巡检计划编制', '请编制下月（8月）的设备巡检计划表，需覆盖所有运行中设备，并于本周三前提交。', 'normal', 0, '管理员', '2026-07-30 15:00:00'),
('task', 'task', '设备台账更新', '请更新近期新增设备的台账信息，确保数据完整性。重点关注3台新入库设备的参数录入。', 'normal', 1, '管理员', '2026-07-30 10:00:00');
