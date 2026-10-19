# dsh-codex-style · Codex style

[English](README.md) | [中文](docs/zh.md)

An independent, optional DeepSeek Harness output-style plugin targeting desktop **0.2.0-rc.2 and 0.2.1-rc.2**. It does not modify DSH, Butler, or Aqua source code, and starts no service or resident process.

## Features and boundaries

- **Answer wording:** conclusions first, concise delivery, real verification, and explicit disclosure of checks not run. The prompt is a presentation preference, not a change to tools, permissions, or execution rules; identical behavior across all models is not guaranteed.
- **Progress display:** reuses native work-step grouping and collapsing, with elapsed time derived from original `turn/start` / `turn/end` timestamps. Failed and stopped turns cannot be collapsed as a whole. DSH still renders final answers, approvals, errors, and attachments.
- **File changes:** fully preserves DSH's native change cards, expanded lists, and Diff interactions. It registers no turn-tail card, hides no native cards, fetches or caches no separate change data, and adds no undo feature.
- **Theme compatibility:** adjusts only chat answer text and its own progress headings; it does not override Aqua layout, glass effects, or theme tokens.

## Install and build

```sh
npm install --ignore-scripts
npm run build
npm test
```

The package and repository are named `dsh-codex-style`, with repository metadata `https://github.com/fegnze/dsh-codex-style` and local directory `<workspace>/MySpace/dsh-plugins/dsh-codex-style`. Cordis component IDs `codex-style` / `codex-style-prompt`, settings component IDs, existing browser preference keys, and the prompt section ID remain unchanged. The client loader and style ownership use the new package name.

The npm allowlist includes the patch, Host/prompt entry points, built client, and English/Chinese READMEs; it excludes tests, dependency directories, browser snapshots, and logs. Source retains the MySpace root repository's Zlib license; see `LICENSE` for a copy. Dependencies retain their respective licenses.

Add this directory's absolute path in the **desktop profile** plugin manager, or install the local directory through the Agent's `plugin_manager`. Build artifacts live in the ignored `lib/` directory, so build before installing. The current setup uses a local link installation; do not move the source directory arbitrarily.

Refresh the current DSH window after installation or updates. This standalone plugin has no development watcher: rebuild and refresh after changing client source; refresh-free updates are not promised. There is no need to start another Web server.

Under **Settings → General settings**, the recommended setting for “Work-step display” and “Performance and usage” is “Compact”. The plugin does not override these host preferences; you can switch back to detailed display at any time. Persisted desktop preferences may take precedence over profile defaults.

## Disabling and scope

- **Disable only the UI:** Settings → General settings → **Codex 风格** (Codex style). This immediately removes the plugin's CSS and progress headings and restores native rendering; native file-change cards are always preserved. The switch is stored per browser origin and does not change the model prompt or native work-step preferences.
- **Disable only wording preferences:** disable `codex-style-prompt` (module `dsh-codex-style/prompt`) in plugin management.
- **Disable everything:** disable the entire `dsh-codex-style` bundle in plugin management.

By default the prompt is added globally to the current profile, and the UI applies to that profile's sessions. No Agent presets are created or changed, and the default model is unchanged. To apply wording preferences to only one preset, disable the global `codex-style-prompt` and declare `dsh-codex-style/prompt` in that preset's `plugins`. The UI switch is not a preset switch.

## Style lifecycle and verification

DSH's Client module loader attributes unmarked `style` tags to the module materialized next and removes them when that module unloads. This is not a shared general-purpose style layer: this plugin writes `data-plugin` and `data-plugin-css` **before** inserting its styles into the DOM, and removes only its own style tags. Progress arrows declare both SVG dimensions and inline dimensions to prevent unbounded enlargement when CSS is missing.

Each `npm test` first rebuilds the real client bundle, then verifies: no registration or hiding of native change cards; style ownership before insertion; no accidental deletion when simulating another module claiming/unloading styles; repeated toggling and unload lifecycle; error/stop boundaries; real timing; and bounded SVGs.

A previous session in the existing host at `http://127.0.0.1:19387` verified zero custom-drawn cards, visible native cards retaining all 24 records when expanded, and native file buttons opening the sidebar Diff. After simulating the loader claiming/unloading other styles, this plugin still owned its styles, with zero console or Slot errors. This is a historical acceptance record, not a claim that the current installation has been revalidated.

Real-browser acceptance and Happy DOM component tests are reported separately. The first browser check of the historical custom-card implementation did not cover later loading/unloading of other plugins and could not establish long-term style reliability; that implementation has been removed. DSH owns native change-card data scope, lifetime, and Diff behavior; this plugin does not reinterpret or rebuild them.

## Layout

- `src/prompt.mjs`: independently removable wording preferences.
- `src/host.mjs`: empty Host entry for client discovery.
- `src/client.jsx`: progress headings, settings switch, and style lifecycle.
- `src/model.mjs`: actual elapsed time and progress state.
- `src/style.css`: scoped CSS for answer text and progress headings.

Compatibility is pinned to the DSH version above. After upgrading DSH, read its actual Slot and service contracts and repeat acceptance checks; do not force execution through a version exemption.
