@echo off
chcp 65001 >nul
echo ========================================
echo Copying files to demo-system project...
echo ========================================
echo.

set "TARGET=c:\Users\33531\IdeaProjects\demo-system -2"
set "SOURCE=c:\Users\33531\IdeaProjects\demo-system-frontend-2\temp"

echo Copying InspectionRecordController.java ...
copy /Y "%SOURCE%\InspectionRecordController.java" "%TARGET%\src\main\java\com\easonnnnn\demosystem\controller\InspectionRecordController.java"

echo Copying InspectionRecordService.java ...
copy /Y "%SOURCE%\InspectionRecordService.java" "%TARGET%\src\main\java\com\easonnnnn\demosystem\service\InspectionRecordService.java"

echo Copying InspectionRecordServiceImpl.java ...
copy /Y "%SOURCE%\InspectionRecordServiceImpl.java" "%TARGET%\src\main\java\com\easonnnnn\demosystem\service\impl\InspectionRecordServiceImpl.java"

echo Copying InspectionPlanMapper.xml ...
copy /Y "%SOURCE%\InspectionPlanMapper.xml" "%TARGET%\src\main\resources\mapper\InspectionPlanMapper.xml"

echo Copying CheckItemTemplateMapper.xml ...
copy /Y "%SOURCE%\CheckItemTemplateMapper.xml" "%TARGET%\src\main\resources\mapper\CheckItemTemplateMapper.xml"

echo.
echo ========================================
echo All files have been copied!
echo ========================================
pause