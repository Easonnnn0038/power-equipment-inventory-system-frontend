const fs = require('fs');
const path = 'c:\\Users\\33531\\IdeaProjects\\demo-system -2\\src\\main\\java\\com\\easonnnnn\\demosystem\\mapper\\InspectionRecordMapper.java';

let content = fs.readFileSync(path, 'utf-8');
let lines = content.split(/\r?\n/);

let newLines = [];
for (let i = 0; i < lines.length; i++) {
    if (i === 2 || i === 3) continue;
    newLines.push(lines[i]);
}

fs.writeFileSync(path, newLines.join('\r\n'), 'utf-8');

console.log('修改成功，文件开头5行内容：');
let verifyLines = fs.readFileSync(path, 'utf-8').split(/\r?\n/);
for (let i = 0; i < Math.min(5, verifyLines.length); i++) {
    console.log((i+1) + ': ' + verifyLines[i]);
}
