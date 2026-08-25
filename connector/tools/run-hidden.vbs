' ─────────────────────────────────────────────────────────────────────────────
' run-hidden.vbs - launches GymDoorConnector hidden (no console window).
' Used by autostart.ps1 (Task Scheduler at logon) so the connector runs
' silently in the background on the gym PC.
' ─────────────────────────────────────────────────────────────────────────────
Option Explicit
Dim fso, ws, connectorDir, nodeCandidates, nodeExe, cmd
Set fso = CreateObject("Scripting.FileSystemObject")
Set ws  = CreateObject("WScript.Shell")

' Connector lives next to this script: <connector>\tools\..\
connectorDir = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))

' Try common Node install locations (32 and 64 bit program files).
nodeExe = ""
Dim i
For i = 0 To 3
  Select Case i
    Case 0: nodeExe = ws.ExpandEnvironmentStrings("%ProgramFiles%\nodejs\node.exe")
    Case 1: nodeExe = ws.ExpandEnvironmentStrings("%ProgramFiles(x86)%\nodejs\node.exe")
    Case 2: nodeExe = ws.ExpandEnvironmentStrings("%LocalAppData%\Programs\nodejs\node.exe")
    Case 3: nodeExe = "node.exe"
  End Select
  If nodeExe <> "" And nodeExe <> "node.exe" Then
    If fso.FileExists(nodeExe) Then Exit For
  End If
Next

' Run node src\main.js serve from the connector directory, hidden (windowstyle 0).
ws.CurrentDirectory = connectorDir
ws.Run """" & nodeExe & """ """ & connectorDir & "\src\main.js"" serve", 0, False