path = r'c:\Users\33531\IdeaProjects\demo-system -2\src\main\java\com\easonnnnn\demosystem\mapper\InspectionRecordMapper.java'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    lineno = i + 1
    if lineno in (3, 4):
        continue
    new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('修改成功，文件开头5行内容：')
with open(path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i >= 5:
            break
        print(f'{i+1}: {line.rstrip()}')
