/**
 * 修复 StatsController 重复字段问题
 * 删除重复的 equipmentMapper 声明
 */
const fs = require('fs')

const controllerPath = 'C:/Users/33531/IdeaProjects/demo-system -2/src/main/java/com/easonnnnn/demosystem/controller/StatsController.java'

let content = fs.readFileSync(controllerPath, 'utf8')

// 删除重复的字段声明（保留第一个，删除后面重复的）
// 找到第一个 equipmentMapper 声明，删除第二个
const duplicateBlock = `
    private static final Logger log = LoggerFactory.getLogger(StatsController.class);

    @Autowired
    private EquipmentMapper equipmentMapper;

    @Autowired`

const fixedBlock = `
    private static final Logger log = LoggerFactory.getLogger(StatsController.class);

    @Autowired`

if (content.includes(duplicateBlock)) {
    content = content.replace(duplicateBlock, fixedBlock)
    fs.writeFileSync(controllerPath, content, 'utf8')
    console.log('修复成功！已删除重复的 equipmentMapper 字段。')
} else {
    console.log('未找到重复字段，请手动检查 StatsController.java 文件。')
}
