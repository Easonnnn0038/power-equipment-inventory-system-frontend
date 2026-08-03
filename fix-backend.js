const fs = require('fs');

const basePath = 'c:\\Users\\33531\\IdeaProjects\\demo-system -2\\src\\main\\java\\com\\easonnnnn\\demosystem\\';

const files = {
  'service/InspectionPlanService.java': `package com.easonnnnn.demosystem.service;

import com.easonnnnn.demosystem.entity.InspectionPlan;

import java.util.List;

public interface InspectionPlanService {
    List<InspectionPlan> findAll();
    InspectionPlan findById(Long id);
}
`,
  'service/CheckItemTemplateService.java': `package com.easonnnnn.demosystem.service;

import com.easonnnnn.demosystem.entity.CheckItemTemplate;

import java.util.List;

public interface CheckItemTemplateService {
    List<CheckItemTemplate> findByEquipmentType(String equipmentType);
    List<CheckItemTemplate> findAll();
}
`,
  'service/impl/InspectionPlanServiceImpl.java': `package com.easonnnnn.demosystem.service.impl;

import com.easonnnnn.demosystem.entity.InspectionPlan;
import com.easonnnnn.demosystem.mapper.InspectionPlanMapper;
import com.easonnnnn.demosystem.service.InspectionPlanService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class InspectionPlanServiceImpl implements InspectionPlanService {

    private static final Logger log = LoggerFactory.getLogger(InspectionPlanServiceImpl.class);

    @Autowired
    private InspectionPlanMapper inspectionPlanMapper;

    @Override
    public List<InspectionPlan> findAll() {
        try {
            return inspectionPlanMapper.findAll();
        } catch (Exception e) {
            log.error("查询所有巡检计划失败", e);
            return new ArrayList<>();
        }
    }

    @Override
    public InspectionPlan findById(Long id) {
        try {
            return inspectionPlanMapper.findById(id);
        } catch (Exception e) {
            log.error("根据ID查询巡检计划失败, id={}", id, e);
            return null;
        }
    }
}
`,
  'service/impl/CheckItemTemplateServiceImpl.java': `package com.easonnnnn.demosystem.service.impl;

import com.easonnnnn.demosystem.entity.CheckItemTemplate;
import com.easonnnnn.demosystem.mapper.CheckItemTemplateMapper;
import com.easonnnnn.demosystem.service.CheckItemTemplateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CheckItemTemplateServiceImpl implements CheckItemTemplateService {

    private static final Logger log = LoggerFactory.getLogger(CheckItemTemplateServiceImpl.class);

    @Autowired
    private CheckItemTemplateMapper checkItemTemplateMapper;

    @Override
    public List<CheckItemTemplate> findByEquipmentType(String equipmentType) {
        try {
            if (equipmentType == null || equipmentType.isEmpty()) {
                return findAll();
            }
            return checkItemTemplateMapper.findByEquipmentType(equipmentType);
        } catch (Exception e) {
            log.error("根据设备类型查询检查项模板失败, equipmentType={}", equipmentType, e);
            return new ArrayList<>();
        }
    }

    @Override
    public List<CheckItemTemplate> findAll() {
        try {
            return checkItemTemplateMapper.findAll();
        } catch (Exception e) {
            log.error("查询所有检查项模板失败", e);
            return new ArrayList<>();
        }
    }
}
`,
  'entity/CheckItemTemplate.java': `package com.easonnnnn.demosystem.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CheckItemTemplate {
    private Long id;
    private String equipmentType;
    private String itemName;
    private Integer sortOrder;
    private String defaultStatus;
    private LocalDateTime createTime;
}
`
};

let allOk = true;
for (const [relPath, content] of Object.entries(files)) {
  const fullPath = basePath + relPath;
  try {
    fs.writeFileSync(fullPath, content, 'utf8');
    const written = fs.readFileSync(fullPath, 'utf8');
    if (written.length > 0) {
      console.log(`✅ ${relPath} (${written.length} 字节)`);
    } else {
      console.log(`❌ ${relPath} 写入后仍为空！`);
      allOk = false;
    }
  } catch (e) {
    console.log(`❌ ${relPath} 写入失败: ${e.message}`);
    allOk = false;
  }
}

console.log('\n' + (allOk ? '🎉 所有文件修复成功！请重新编译后端。' : '⚠️ 部分文件修复失败，请手动检查。'));
