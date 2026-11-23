# Publishing these add-ons

Eight add-ons, built, tested and pushed here, with their `dist/` committed (the marketplace needs the
build output committed). All are `v80q.<name>`:

`custom-idle`, `volume-booster`, `image-filename`, `media-saver`, `quiet-hours`,
`copy-file-contents`, `message-reminders`, `sort-friend-requests`.

`send-later` and `voice-download` were removed: both were rejected for duplicating plugins that
already exist (`unbound.slowmode-queue` and `unbound.voice-message-tools`). They are in git history if
they are ever needed.

## Submit

```sh
cd ~/projects/unbound-addons
export UNBOUND_API_KEY='<key>'   # or: bunx @unbound-app/cli auth login

for id in custom-idle volume-booster image-filename media-saver quiet-hours \
          copy-file-contents message-reminders sort-friend-requests; do
  bunx @unbound-app/cli publish --addon "v80q.$id" --repository orev7s/unbound-addons
done
```

The account allows two new listings waiting for review at once, so submit in pairs as the queue clears.

## Before you submit

- The manifest author is `v80q / 1195808542628774001`. It should match the Unbound account that
  reviews the submission.
- `ubd check --all` reports 0 errors; the eight plugins have 102 passing tests.
- Re-build if you change anything: `bunx @unbound-app/cli build`, then commit `plugins/*/dist`.

## Not device-verified

The emulator (`warden34`) did not finish booting, so the add-ons are unit-tested but not exercised on
a running Discord. The targets most likely to need a one-line fix on device, each behind a guarded
lookup that logs `... skipped: Discord moved X.`:

- **custom-idle** - the presence setter (`metro.findByProps('setStatus', 'getStatus')`).
- **volume-booster** - `android.media.audiofx.LoudnessEnhancer`, applied on audio session `0`.
- **copy-file-contents / message-reminders** - the message long-press sheet, via the shared helper.
- **sort-friend-requests** - `RelationshipStore` request/suggestion methods.
- **image-filename** - `RowManager.generate`; the caption is appended to the message body.
- **quiet-hours** - the channel-mute action `updateChannelOverrideSettings`.