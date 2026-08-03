/**
 * 修复后端 StatsController.java
 * 1. 让接口在数据库表不存在/出错时返回空数据而不是500
 * 2. 修复 monthly-inspection 接口的 Map key 问题
 * 
 * 运行方式：node patch-backend2.cjs
 */
const fs = require('fs')

const controllerPath = 'C:/Users/33531/IdeaProjects/demo-system -2/src/main/java/com/easonnnnn/demosystem/controller/StatsController.java'

let content = fs.readFileSync(controllerPath, 'utf8')

// 修复1: getEquipmentTypeStats - 加 try-catch
const old1 = `    @GetMapping("/equipment-type")
    @RequireLogin
    public Result<List<Map<String, Object>>> getEquipmentTypeStats() {
        return Result.success(equipmentMapper.countByType());
    }`

const new1 = `    @GetMapping("/equipment-type")
    @RequireLogin
    public Result<List<Map<String, Object>>> getEquipmentTypeStats() {
        try {
            return Result.success(equipmentMapper.countByType());
        } catch (Exception e) {
            log.error("获取设备类型统计失败", e);
            return Result.success(new ArrayList<>());
        }
    }`

// 修复2: getEquipmentStatusStats - 加 try-catch
const old2 = `    @GetMapping("/equipment-status")
    @RequireLogin
    public Result<List<Map<String, Object>>> getEquipmentStatusStats() {
        return Result.success(equipmentMapper.countGroupByStatus());
    }`

const new2 = `    @GetMapping("/equipment-status")
    @RequireLogin
    public Result<List<Map<String, Object>>> getEquipmentStatusStats() {
        try {
            return Result.success(equipmentMapper.countGroupByStatus());
        } catch (Exception e) {
            log.error("获取设备状态统计失败", e);
            return Result.success(new ArrayList<>());
        }
    }`

// 修复3: getInspectionTrend - 加 try-catch
const old3 = `    @GetMapping("/inspection-trend")
    @RequireLogin
    public Result<Map<String, Object>> getInspectionTrend() {
        List<Map<String, Object>> rows = inspectionRecordMapper.countLast7DaysTrend();`

const new3 = `    @GetMapping("/inspection-trend")
    @RequireLogin
    public Result<Map<String, Object>> getInspectionTrend() {
        List<Map<String, Object>> rows;
        try {
            rows = inspectionRecordMapper.countLast7DaysTrend();
        } catch (Exception e) {
            log.error("获取巡检趋势失败", e);
            Map<String, Object> empty = new HashMap<>();
            List<String> dates = new ArrayList<>();
            List<Integer> zeros = new ArrayList<>();
            LocalDate today = LocalDate.now();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM-dd");
            for (int i = 6; i >= 0; i--) {
                dates.add(today.minusDays(i).format(formatter));
                zeros.add(0);
            }
            empty.put("dates", dates);
            empty.put("normal", zeros);
            empty.put("abnormal", zeros);
            return Result.success(empty);
        }`

// 修复4: getMonthlyInspectionStats - 加 try-catch 及 Map key 兼容
const old4 = `    @GetMapping("/monthly-inspection")
    @RequireLogin
    public Result<Map<String, Object>> getMonthlyInspectionStats() {
        List<Map<String, Object>> rows = inspectionRecordMapper.countMonthlyStats();

        List<String> months = Arrays.asList("1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月");
        List<Integer> planned = new ArrayList<>(Collections.nCopies(12, 0));
        List<Integer> completed = new ArrayList<>(Collections.nCopies(12, 0));

        for (Map<String, Object> row : rows) {
            Number monthNum = (Number) row.get("month_num");
            Number count = (Number) row.get("count");
            int index = monthNum.intValue() - 1;
            if (index >= 0 && index < 12) {
                int cnt = count.intValue();
                completed.set(index, cnt);
                // 没有独立的计划巡检数据，使用实际完成数作为计划数
                planned.set(index, cnt);
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("months", months);
        data.put("planned", planned);
        data.put("completed", completed);
        return Result.success(data);
    }`

const new4 = `    @GetMapping("/monthly-inspection")
    @RequireLogin
    public Result<Map<String, Object>> getMonthlyInspectionStats() {
        List<String> months = Arrays.asList("1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月");
        List<Integer> planned = new ArrayList<>(Collections.nCopies(12, 0));
        List<Integer> completed = new ArrayList<>(Collections.nCopies(12, 0));

        try {
            List<Map<String, Object>> rows = inspectionRecordMapper.countMonthlyStats();
            for (Map<String, Object> row : rows) {
                Number monthNum = getNumberFromMap(row, "month_num");
                Number count = getNumberFromMap(row, "count");
                if (monthNum != null && count != null) {
                    int index = monthNum.intValue() - 1;
                    if (index >= 0 && index < 12) {
                        int cnt = count.intValue();
                        completed.set(index, cnt);
                        planned.set(index, cnt);
                    }
                }
            }
        } catch (Exception e) {
            log.error("获取月度巡检统计失败", e);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("months", months);
        data.put("planned", planned);
        data.put("completed", completed);
        return Result.success(data);
    }`

// 添加 SLF4J Logger 字段
const importLine = 'import org.springframework.beans.factory.annotation.Autowired;'
const importReplace = `import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;`

const loggerField = '    @Autowired\n    private InspectionRecordMapper inspectionRecordMapper;'
const loggerReplace = `    private static final Logger log = LoggerFactory.getLogger(StatsController.class);

    @Autowired
    private EquipmentMapper equipmentMapper;

    @Autowired
    private InspectionRecordMapper inspectionRecordMapper;`

let modified = false

if (content.includes(importLine) && !content.includes('import org.slf4j.Logger')) {
    content = content.replace(importLine, importReplace)
    modified = true
}

if (content.includes(loggerField) && !content.includes('private static final Logger log')) {
    content = content.replace(loggerField, loggerReplace)
    modified = true
}

const replacements = [
    [old1, new1],
    [old2, new2],
    [old3, new3],
    [old4, new4]
]

for (const [old, rep] of replacements) {
    if (content.includes(old)) {
        content = content.replace(old, rep)
        modified = true
        console.log('成功替换一段代码')
    } else {
        console.log('未找到对应代码段，可能已被修改')
    }
}

if (modified) {
    fs.writeFileSync(controllerPath, content, 'utf8')
    console.log('StatsController.java 修复完成！')
} else {
    console.log('没有需要修改的内容，文件可能已是最新版本。')
}
