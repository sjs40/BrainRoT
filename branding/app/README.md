# App Packaging Icons

This project does not currently use Electron Builder or Electron Forge, so there is no packaging pipeline config to wire `.ico` or `.icns` files into yet.

Current icon wiring:
- Windows BrowserWindow/taskbar icon: `branding/app/app-icon.ico`
- macOS/Linux runtime icon: `branding/png/light/icon-512.png`

Recommended follow-up when packaging is added:
- Export `.ico` and `.icns` from the source SVG masters into this directory
- Point the chosen packaging config at those generated files
