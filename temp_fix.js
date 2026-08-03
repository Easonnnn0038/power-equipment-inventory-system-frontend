const fs = require('fs');
const filePath = 'c:/Users/33531/IdeaProjects/demo-system-frontend-2/src/views/Home.vue';
let c = fs.readFileSync(filePath, 'utf8');

// 修改1：修复 .activities-body 样式
c = c.replace(
  'grid-template-columns: 700px 1fr;',
  'grid-template-columns: 2fr 1fr;'
);
c = c.replace(
  'gap: 600px;',
  'gap: 24px;'
);

// 修改2：在 @media (max-width: 900px) 中添加响应式规则
c = c.replace(
  '@media (max-width: 900px) {\n  .content-grid {\n    grid-template-columns: 1fr;\n  }\n}',
  '@media (max-width: 900px) {\n  .content-grid {\n    grid-template-columns: 1fr;\n  }\n  .activities-body {\n    grid-template-columns: 1fr;\n    gap: 16px;\n  }\n  .activity-slot {\n    min-height: 200px;\n  }\n  .activity-timeline {\n    gap: 8px;\n  }\n}'
);

fs.writeFileSync(filePath, c);
console.log('修改完成！');