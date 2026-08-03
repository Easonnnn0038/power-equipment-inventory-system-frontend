const fs = require('fs')

const mapperPath = 'C:/Users/33531/IdeaProjects/demo-system -2/src/main/java/com/easonnnnn/demosystem/mapper/InspectionRecordMapper.java'

let content = fs.readFileSync(mapperPath, 'utf8')

const import1 = 'import com.easonnnnn.demosystem.dto.InspectionRecordRequest;\r\n'
const import2 = 'import com.easonnnnn.demosystem.dto.InspectionRecordResponse;\r\n'

const import1_n = 'import com.easonnnnn.demosystem.dto.InspectionRecordRequest;\n'
const import2_n = 'import com.easonnnnn.demosystem.dto.InspectionRecordResponse;\n'

let modified = false

if (content.includes(import1)) {
    content = content.replace(import1, '')
    modified = true
}
if (content.includes(import2)) {
    content = content.replace(import2, '')
    modified = true
}
if (content.includes(import1_n)) {
    content = content.replace(import1_n, '')
    modified = true
}
if (content.includes(import2_n)) {
    content = content.replace(import2_n, '')
    modified = true
}

if (modified) {
    fs.writeFileSync(mapperPath, content, 'utf8')
    console.log('InspectionRecordMapper.java 修改完成！已删除未使用的 import。')
} else {
    console.log('没有需要删除的 import，文件可能已是最新版本。')
}

console.log('\n文件开头5行内容：')
const lines = fs.readFileSync(mapperPath, 'utf8').split(/\r?\n/)
for (let i = 0; i < Math.min(5, lines.length); i++) {
    console.log((i + 1) + ': ' + lines[i])
}
