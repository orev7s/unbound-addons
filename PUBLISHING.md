# Publishing these add-ons

The ten add-ons are built, tested and pushed here, with their `dist/` committed (the marketplace needs
the build output committed). Ten add-ons, `v80q.<name>`:

`send-later`, `voice-download`, `custom-idle`, `volume-booster`, `image-filename`, `media-saver`,
`quiet-hours`, `copy-file-contents`, `message-reminders`, `sort-friend-requests`.

## One-time login, then submit

Submitting for review needs a Unbound session. That step is interactive (you approve a code on the
Unbound website), so it has to be done on the machine with a browser:

```sh
cd ~/projects/unbound-addons
bunx @unbound-app/cli auth login

# then submit each add-on for review
for id in send-later voice-download custom-idle volume-booster image-filename \
          media-saver quiet-hours copy-file-contents message-reminders sort-friend-requests; do
  bunx @unbound-app/cli publish --addon "v80q.$id" --repository orev7s/unbound-addons
done
```

For CI instead of a login, set `UNBOUND_API_KEY`.

## Before you submit

- The manifest author is `v80q / 1195808542628774001`. It should match the Unbound account that
  reviews the submission.
- `ubd check --all` reports 0 errors; the ten plugins have 137 passing tests.
- Re-build if you change anything: `bunx @unbound-app/cli build`, then commit `plugins/*/dist`.

## Status after this run

- `git push` to `github.com/orev7s/unbound-addons` succeeded.
- `ubd publish` returned `Not logged in. Run ubd auth login, or set UNBOUND_API_KEY.`
- No UNBOUND_API_KEY is set on the machine, so the login above is the missing step.

## What is not device-verified

The emulator (`warden34`) did not finish booting in the time budget, so the add-ons are unit-tested
but not exercised on a running Discord. The Discord targets most likely to need a one-line fix on
device, each already behind a guarded lookup that logs `... skipped: Discord moved X.`:

- **custom-idle** - the presence setter (`metro.findByProps('setStatus', 'getStatus')`).
- **volume-booster** - `android.media.audiofx.LoudnessEnhancer`, applied on audio session `0`.
- **copy-file-contents / message-reminders** - the message long-press sheet, via the shared helper.
- **sort-friend-requests** - `RelationshipStore` request/suggestion methods.
- **image-filename** - `RowManager.generate`; the caption is appended to the message body.
- **quiet-hours** - the channel-mute action `updateChannelOverrideSettings`.
