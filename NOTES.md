# v80q Unbound add-on workspace

Standalone `ubd` workspace at `/home/ubuntu/projects/unbound-addons`. Add-ons live in
`plugins/<name>/`. A local helper package, `@v80q/plugin-shared` (in `packages/plugin-shared`),
holds the action-sheet, React-tree and Android/Java helpers Unbound's own plugins import from its
unpublished `@unbound-plugins/shared`.

The reference checkout of Unbound itself is at `/home/ubuntu/projects/unbound`. Use it to confirm
Discord module paths and export names from `packages/api/src/metro/index.d.ts` (the generated list of
every Metro module path and its exports), and to read how a first-party plugin does the same thing.
Never edit anything under `/home/ubuntu/projects/unbound`.

## Finished references (copy their shape)

- `plugins/send-later` - a slash-command plugin with pure logic, i18n, settings and tests.
- `plugins/voice-download` - an action-sheet row plus Android/iOS native save, using
  `@v80q/plugin-shared` and `metro.definePlatform`.

## Adding a plugin

1. Create `plugins/<kebab-name>/` and copy the config from `plugins/send-later`: `rollup.config.mjs`,
   `bunfig.toml`, `.oxlintrc.json`, `tsconfig.json`, `.gitignore`, and a `package.json` with the same
   `devDependencies` (add `"@v80q/plugin-shared": "workspace:*"` to `dependencies` when you import it).
2. Write `manifest.json` (`id: v80q.<name>`, `name`, `description` <= 160 chars, `authors` as
   `[{ "name": "v80q", "id": "1195808542628774001" }]`, `version: "1.0.0"`, `icon` = a Discord icon
   name, `main: "index.tsx"`).
3. `settings.ts` (optional), `i18n/en-US.json`, `src/`, `tests/`, `ADDON.md`, `CHANGELOG.md`.
4. `bun install` at the workspace root once after adding folders (links the new plugin).
5. Build and test from the plugin folder:
   - `bunx @unbound-app/cli build`
   - `bun test`
   - `bunx @unbound-app/cli check` (should be 0 errors)

## API cheatsheet

Imports come from `@unbound-app/api` (and subpaths like `@unbound-app/api/native`):

- `metro.findByProps('a', 'b')`, `metro.findByFilePath('modules/x/y.tsx')`,
  `metro.onModuleLoaded(filter, cb)`, `metro.filters.byFilePath(...)`. Lookups are lazy; wrap each in
  a guard and `logger.warn('<Feature> skipped: Discord moved X.')` on `undefined`.
- `metro.api` holds ready-made handles: `Messages` (`sendMessage`, `_sendMessage`), `ActionSheets`
  (`openLazy`, `hideActionSheet`), `Profiles`, `Invites`, `AsyncUsers`. `metro.common` holds
  `Clipboard`, `Theme`, `ReactNative` (with `AppState`), `ImageSources`. `metro.components` holds
  `BottomSheets`, `Discord`, `Media`.
- `patcher.before/after/instead(parent, method, cb)`, `patcher.react.after(Module, 'default', cb)`,
  `patcher.unpatchAll()`. The Addon scope removes every patch on stop.
- `flux.getStore('User'|'Channel'|'SelectedChannel'|'Guild'|'Relationship'|'Typing'|'Message')`,
  `flux.onAction('MESSAGE_CREATE'|'APP_STATE_UPDATE'|... | cb)`, `flux.dispatch({ type, ... })`,
  `flux.useStore`. `APP_STATE_UPDATE` gives `{ state: 'active'|'background'|'inactive' }`.
- `storage.getBucket()` -> `{ get(key, def), set, remove, clear }`; `storage.onChange(pred, cb)`.
- `@unbound-app/settings`: `import { settings, useSetting } from '@unbound-app/settings'` and declare
  the schema in `settings.ts` with `defineSettings`/`setting`. Builders: `boolean`, `number`
  (`displayAs: 'duration'` with `units`), `integer` (`displayAs: 'stepper'`), `string`
  (`displayAs: 'input'|'multiline'|'color'|'user'|...`), `choice`, `array`, `section`, `button`
  (calls a function `src/actions.ts` exports), `notice`.
- `toasts.success/info/warning(key, vars?, options?)`, `toasts.error(key, vars?, error)`,
  `toasts.show({ title, content, icon?, duration?, buttons? })`.
- `dialogs.confirm(key, {...})`, `dialogs.alert(key, {...})`.
- `commands.register({ name: { description: 'KEY', options: {...}, execute(args, context) } })`.
- `fs.readFile/writeFile/removeFile/exists`, `fs.documentsPath`. `format(key, vars)` and `messages`
  from `@unbound-app/i18n`. `assets.getIdByName('LinkIcon')`.
- Native: `native.definePlatform({ ios, android })`; the plugin's bridge is `context.native`.
  `native.has(capability)`, `native.getNativeModule(name)`. Android Java: `bridge.java` with
  `getClass`, `invoke`, `construct`, `getField`, and the tagged values in
  `@v80q/plugin-shared/native/android/java-values`.
- Background: `unbound.background?.add('name', job)` (import `background` will break tests; use the
  `unbound` global with a guard, as `send-later` does).
- Device state: `globalThis.NativePlatform?.device?.getState?.()` -> `{ network?: { type:
  'wifi'|'cellular'|'ethernet'|'other'|'offline', metered?, lowData? }, power?, ... }`.

## Build-check gotchas (they fail the build)

- A file at `src/` root must be one of `index.tsx`, `settings.tsx`, `patches.ts`, `commands.ts`,
  `actions.ts`, or a folder (`native/`, `flux/`, `components/`, `lib/`). Put helpers in `lib/`.
- Native calls must be reachable by name. Do not pass a `NativeBridge` parameter into a function;
  pass a getter `() => NativeBridge` and call `save(bridge(), ...)` (see `voice-download`).
- `native.definePlatform` handlers must be imported bindings (`{ ios, android }`), not arrow wrappers.
  Platform files live in `src/native/ios/` and `src/native/android/` and are selected by the
  `definePlatform` call in `src/native/<name>.ts`.
- The manifest must not list `platforms` or `capabilities`; the build derives them. An `ios` build
  fails if a file selected only for `android` reaches `java.*`, so keep each platform's calls inside
  its own platform file.
- `i18n/en-US.json` keys must all be used; `ubd check` warns about unused keys.

## Testing

Tests use the preset (`preload = ["@unbound-app/api/testing/preset"]`, already in `bunfig.toml`).
From `@unbound-app/api/testing`: `startPlugin(context?)`, `stopPlugin()`, `render(element, {
settings, stores, locale })`, and recorders `toasts.shown`, `dialogs.opened`, `commands.run(path,
args)`, `patches.applied`, `flux.dispatched`, `metro.register(module, path)`,
`metro.markMissing(term)`, `logs.entries`, `native` (with `native.java`/`native.objc` fakes and
`native.calls`), `setLocale`.

Test behavior a user sees, and the pure logic under it. Do not mock Discord and assert the mock was
called. Keep each file's tests focused; mirror `src/` under `tests/`.

## The eight plugins still to build

Each: `id: v80q.<name>`, `author v80q / 1195808542628774001`, version `1.0.0`, with `ADDON.md`,
`CHANGELOG.md`, `settings.ts` where it makes sense, `i18n/en-US.json`, and tests. Prefer a small,
correct feature that builds and is tested over a large one that does not. Where a Discord module
target is uncertain, use a props-based lookup (`metro.findByProps(...)`) with a guard and a
`logger.warn`, and confirm the path/export against
`/home/ubuntu/projects/unbound/packages/api/src/metro/index.d.ts`.

1. **image-filename** - "Shows an image's file name under it in chat." Replace the scaffold
   placeholder. Add a caption (the attachment `filename`) under image attachments in message rows.
   Candidate target: patch the message attachment/media row render, or `patcher.react.after` on the
   component that renders a message's attachments and append a `<Text>` with the file name, reading
   the attachment list from props. Settings: show extension, and a max length that truncates.

2. **copy-file-contents** - "Copies the text inside a file attachment." Add a row to the message
   long-press sheet for text-like attachments (`.txt`, `.md`, `.json`, `.csv`, code, `.log`) that
   fetches the attachment `url`, then `metro.common.Clipboard.setString(text)` and toasts success.
   Guard on size. Use the action-sheet helpers (see `voice-download`). Tests: the "is this a
   copyable file" predicate and the size guard.

3. **sort-friend-requests** - "Orders pending friend requests newest first." Sort incoming/outgoing
   pending friend requests by date. The Relationship store and the People/friends list are the
   targets; check `modules/people/hooks/useFriendRequestCounts.tsx` and the friend-request list
   component in the metro types. Settings: direction (newest/oldest), and whether to also sort
   suggestions. Tests: the pure sort comparator.

4. **custom-idle** - "Sets you idle when you stop using Discord, with a schedule and exceptions."
   A broad, well-labelled setting set: idle delay (duration); target status (idle / dnd / invisible);
   only when Discord is backgrounded; only when not in a voice call; an active-hours window; a
   separate quiet-hours window; restore the previous status on activity; exclude while an activity is
   running; reset on message send. Set presence through the client: find the status-setting action
   (search `/home/ubuntu/projects/unbound` for how presence is set, e.g. a `SET_STATUS`-style Flux
   action or a user-settings module; `custom-rpc/src/lib/presence.ts` shows Flux dispatch). If the
   exact presence API cannot be confirmed, implement the decision logic and the timer, and call the
   presence setter behind a single guarded lookup with a clear `logger.warn` - tests must cover the
   decision logic (which status applies right now, given the settings and the current state).

5. **volume-booster** - "Raises the volume of voice messages and audio past the system maximum."
   Android-first. Use the Java bridge with `android.media.audiofx.LoudnessEnhancer` attached to the
   audio session, selecting the boost per source. The exact audio session id may not be reachable;
   implement the settings (boost in dB, enable per source) and the Android apply behind a guarded
   lookup, with the pure gain math (dB -> millibels, clamped) fully tested. iOS: no-op with a note.

6. **message-reminders** - "Reminds you about a message at a time you choose." A long-press sheet
   row "Remind me" that opens a small sheet of preset delays (10m, 1h, 3h, tomorrow); on pick, store
   the reminder (channel id, message id, jump link, due time) in the bucket and schedule it. Fire a
   `toasts.show` with a button that opens the message (`metro.api` navigation:
   `transitionToMessage` / `jumpToMessage`) and, when backgrounded, a local notification if
   available. Tests: the preset/due logic and the stored-reminder validation.

7. **quiet-hours** - "Mutes chosen channels or servers on a schedule." Settings: a start and end
   time, weekdays, and a list of channel/server ids or a mode. While the window is active, suppress
   the user's own send notifications / set the channels muted. Implement the window logic (handles
   crossing midnight and per-weekday) as pure, tested code, and apply it through the mute/notification
   path (guarded lookup). Tests: the window predicate across midnight and weekdays.

8. **media-saver** - "Stops images and videos loading on mobile data." Settings: master switch, a
   per-type set (images / GIFs / videos / emojis / stickers), and whether to load on wifi only or
   also on metered. Use `globalThis.NativePlatform?.device?.getState?.().network` for the connection,
   listen for changes, and stop media loading (candidate: patch
   `metro.common.ImageSources.getImageSourcesFromImageProps` to return `null`, or a message-row
   guard). Add a tap-to-load affordance if feasible. Tests: the "should this media load" policy for
   wifi / cellular / metered / low-data, and per-type toggles.
