@echo off
set command=node --trace-warnings "%~dp0..\dist\SortModsAndPlugins"
@echo on
%command%
@echo off
ECHO.
ECHO.
pause