@echo off
setlocal enabledelayedexpansion

set "SRC=c:\Users\33531\IdeaProjects\demo-system -2\src\main\java\com\easonnnnn\demosystem\mapper\InspectionRecordMapper.java"
set "DST=c:\Users\33531\IdeaProjects\demo-system -2\src\main\java\com\easonnnnn\demosystem\mapper\InspectionRecordMapper_tmp.java"

set /a line=0
if exist "%DST%" del "%DST%"
for /f "usebackq delims=" %%a in ("%SRC%") do (
    set /a line+=1
    if !line! neq 3 if !line! neq 4 (
        echo.%%a>>"%DST%"
    )
)

move /y "%DST%" "%SRC%" >nul

echo 修改成功，文件开头5行内容：
set /a line=0
for /f "usebackq delims=" %%a in ("%SRC%") do (
    set /a line+=1
    if !line! leq 5 (
        echo !line!: %%a
    )
)
