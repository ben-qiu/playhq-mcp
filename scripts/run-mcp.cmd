@echo off
setlocal

set "ROOT=%~dp0.."
if not defined PLAYHQ_NODE set "PLAYHQ_NODE=node"

"%PLAYHQ_NODE%" "%ROOT%\dist\mcp.cjs"
