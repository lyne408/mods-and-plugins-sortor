@echo off
set command=node --trace-warnings "%~dp0..\dist\SortMods"
@echo on
%command%
@echo off
ECHO.
ECHO.
pause