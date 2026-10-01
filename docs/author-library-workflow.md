# Author intake and approved reading editions

Author signs and Register Your eBook lead to the librarian, a 3D clipboard, and either writing seat. The four-step application records metadata, the unchanged original file, optional cover, ownership/authorization attestation, review permission, and requested public access.

The current contact is **agentlee2912@gmail.com**. Intake saves to IndexedDB on the visitor's device; it does not upload, send email, grant approval, or publish. The visitor downloads a ZIP and attaches it to the prepared email. Storage may be cleared by the browser. Reopen last saved application recovers the latest package on that device. Large files may need a manager-arranged transfer.

After review, an authorized maintainer can add a record to `content/publishing/catalog.json`. Set `status: published` and `rights.displayApproved: true` only for an approved listing. `rights.readApproved: true` and a library-hosted `content.source` additionally enable the reading edition. A listing-only record does not expose an ebook. `premiere` and `premiereRank` select the two easel slots; all approved records appear in the reader's cover catalog.

The book record includes id, title, subtitle, author.name, edition, cover.front, content.source, permissions and status. Do not insert visitor submissions directly into this catalog without review. Keep original files and covers; do not rewrite Leola's source manuscripts.

## Reader capabilities

- EPUB: unprotected EPUB spine order, safe text and archive raster images; publisher styling and active content omitted.
- PDF: browser's native document viewer with original download fallback.
- TXT/Markdown: literal text reading.
- HTML: allow-listed document content; scripts, remote content and active markup omitted.
- FB2 and DOCX: text preview; original layout is not reproduced.
- CBZ: ordered raster page images.
- Other accepted submission formats (CBR, Kindle, DjVu, RTF, Apple-specific formats, audio): retain the original and request a suitable reading edition/conversion. Acceptance is separate from reading support. DRM-protected editions are not bypassed.

The reader bounds archive sizes and rejects encryption/path traversal. Tests cover archive validation, source preservation, script/remote exclusion, reading order, local storage, package download and seated exit.

## Librarian recording

`content/librarian-conversations.json` supplies the NPC question menu. The books topic has a NotebookLM recording descriptor. Its `src` is intentionally null because the generated recording's media download was blocked; no exact recording is claimed to play. Once the authorized media file is supplied, store it under `assets/media/`, set the relative `src` and `kind` (`audio` or `video`), and verify play/pause/close and mute behavior. Never embed the private notebook as a public library player.

The completed private NotebookLM video is “Leola's Learning Library” (7:21). The separate crochet overview was last observed generating. Neither video is publicly published by this change.
