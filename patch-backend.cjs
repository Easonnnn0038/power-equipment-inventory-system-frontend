/**
 * 修复后端 StatsController.java 的 Map key 大小写问题
 * MySQL JDBC 返回的 HashMap key 默认是大写，导致 row.get("date_label") 返回 null
 *
 * 运行方式：node patch-backend.cjs
 */
const fs = require('fs')

const controllerPath = 'C:/Users/33531/IdeaProjects/demo-system -2/src/main/java/com/easonnnnn/demosystem/controller/StatsController.java'

let content = fs.readFileSync(controllerPath, 'utf8')

// 修复 inspection-trend 接口中 HashMap key 大小写问题
const oldCode = `        // 填充数据库查询到的数据
        for (Map<String, Object> row : rows) {
            String dateLabel = (String) row.get("date_label");
            Number normalCount = (Number) row.get("normal_count");
            Number abnormalCount = (Number) row.get("abnormal_count");

            int index = dates.indexOf(dateLabel);
            if (index >= 0) {
                normal.set(index, normalCount.intValue());
                abnormal.set(index, abnormalCount.intValue());
            }
        }`

const newCode = `        // 填充数据库查询到的数据
        // 注意：MySQL JDBC 返回的 HashMap key 可能是大写，需要兼容处理
        for (Map<String, Object> row : rows) {
            String dateLabel = getStringFromMap(row, "date_label");
            Number normalCount = getNumberFromMap(row, "normal_count");
            Number abnormalCount = getNumberFromMap(row, "abnormal_count");

            int index = dates.indexOf(dateLabel);
            if (index >= 0 && normalCount != null) {
                normal.set(index, normalCount.intValue());
            }
            if (index >= 0 && abnormalCount != null) {
                abnormal.set(index, abnormalCount.intValue());
            }
        }`

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode)

  // 在类末尾添加辅助方法（在最后一个 } 之前）
  const lastBrace = content.lastIndexOf('}')
  const helperMethods = `
    /**
     * 从 Map 中获取字符串值，兼容大小写key
     */
    private String getStringFromMap(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) val = map.get(key.toUpperCase());
        if (val == null) val = map.get(key.toLowerCase());
        return val != null ? val.toString() : null;
    }

    /**
     * 从 Map 中获取数值，兼容大小写key
     */
    private Number getNumberFromMap(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) val = map.get(key.toUpperCase());
        if (val == null) val = map.get(key.toLowerCase());
        return (Number) val;
    }
}
`
  content = content.substring(0, lastBrace) + helperMethods

  fs.writeFileSync(controllerPath, content, 'utf8')
  console.log('StatsController.java 修复成功！')
} else {
  console.log('未找到目标代码，可能已修复或代码结构有变化。')
  console.log('请检查 StatsController.java 中的 getInspectionTrend() 方法。')
}
