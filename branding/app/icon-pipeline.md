# Icon Pipeline

Run:

```bash
npm run icons:generate
```

Outputs:
- PNG exports in `branding/png/light`
- PNG exports in `branding/png/dark`
- Windows `.ico` in `branding/app/app-icon.ico`
- macOS `.icns` in `branding/app/app-icon.icns` when run on macOS with `iconutil` available

Requirements:
- Node dependencies: `sharp`, `png-to-ico`
- For automatic `.icns` generation: macOS and Apple `iconutil`

Notes:
- PNG and ICO generation are cross-platform.
- ICNS generation is skipped automatically when `iconutil` is unavailable.
- Source artwork lives in `branding/source`.
