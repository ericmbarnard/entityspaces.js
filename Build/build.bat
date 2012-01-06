@ECHO OFF

SET CurrentDir=%CD%
SET OutPutFile=%CurrentDir%\..\Release\entityspaces.jqAjax.debug.js
SET BuildOrder=%CurrentDir%\jqAjax-build-order.txt

ECHO JSBuild Starting...
FOR /F "tokens=*" %%A in (%BuildOrder%) DO (  
@REM Wrap each file output in a new line
@ECHO. >>%OutPutFile%.temp
ECHO Building... %%A
@ECHO. >>%OutPutFile%.temp
@ECHO /*********************************************** >> %OutPutFile%.temp
@ECHO * FILE: %%A >> %OutPutFile%.temp
@ECHO ***********************************************/ >> %OutPutFile%.temp
@TYPE %CurrentDir%\%%A >> %OutPutFile%.temp
@ECHO. >>%OutPutFile%.temp
)

@REM Remove the OutputFile if it exists
DEL %OutPutFile%

@REM Wrap the final output in an IIFE
@ECHO /*********************************************** >> %OutPutFile%
@ECHO * Built on %Date% at %Time%      * >> %OutPutFile% 
@ECHO ***********************************************/ >> %OutPutFile%
@ECHO (function(window, undefined) { >> %OutPutFile%
@TYPE %OutPutFile%.temp >> %OutPutFile%
@ECHO }(window)); >> %OutPutFile%
DEL %OutPutFile%.temp
ECHO JSBuild Succeeded
ENDLOCAL

SET OutPutFile=%CurrentDir%\..\Release\entityspaces.XHR.debug.js
SET BuildOrder=%CurrentDir%\XHR-build-order.txt

ECHO JSBuild Starting...
FOR /F "tokens=*" %%A in (%BuildOrder%) DO (  
@REM Wrap each file output in a new line
@ECHO. >>%OutPutFile%.temp
ECHO Building... %%A
@ECHO. >>%OutPutFile%.temp
@ECHO /*********************************************** >> %OutPutFile%.temp
@ECHO * FILE: %%A >> %OutPutFile%.temp
@ECHO ***********************************************/ >> %OutPutFile%.temp
@TYPE %CurrentDir%\%%A >> %OutPutFile%.temp
@ECHO. >>%OutPutFile%.temp
)

@REM Remove the OutputFile if it exists
DEL %OutPutFile%

@REM Wrap the final output in an IIFE
@ECHO /*********************************************** >> %OutPutFile%
@ECHO * Built on %Date% at %Time%      * >> %OutPutFile% 
@ECHO ***********************************************/ >> %OutPutFile%
@ECHO (function(window, undefined) { >> %OutPutFile%
@TYPE %OutPutFile%.temp >> %OutPutFile%
@ECHO }(window)); >> %OutPutFile%
DEL %OutPutFile%.temp
ECHO JSBuild Succeeded
ENDLOCAL


GOTO :eof