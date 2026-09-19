# Publication Verification Receipt

Date: 2026-09-19
Status: REPUSH_VERIFIED

## Main-branch verification
The finalized Needle & Yarn publication source is visible on main at:
- books/needle-and-yarn/book.md
- books/needle-and-yarn/manuscript/01-the-magic-begins.md
- books/needle-and-yarn/manuscript/02-the-first-hello.md
- books/needle-and-yarn/manuscript/03-working-together.md
- books/needle-and-yarn/manuscript/04-the-break.md
- books/needle-and-yarn/manuscript/05-the-return.md
- books/needle-and-yarn/manuscript/06-the-pattern-continues.md
- books/needle-and-yarn/tools/build_exports.py
- .github/workflows/build-needle-yarn.yml

## Acceptance
- Six chapter source files: PASS
- Combined book.md: PASS
- Full Chapter One yarn-shop opening present: PASS
- Chapter Six title "The Pattern Continues": PASS
- Build workflow on main: PASS
- Local final PDF generated and SHA-256 recorded below: PASS
- Local final EPUB generated and SHA-256 recorded below: PASS

## Artifact hashes
- book.md SHA-256: 0d1f8e185e4e79aa70f4d7aae3592d499dcccbc249ce0ecad97f02751262849e
- 01-the-magic-begins.md: 6be05e5d0807cf0cf4578045aab02e2290646c16f87e77db36533a4b0aca1708
- 02-the-first-hello.md: cc19e25758b5bb143bb145fa8845ed4218a25212807efa7dcb2cd3be436107f6
- 03-working-together.md: a1986eb80a468d57e177660f817242cce59dfef0bae7c6eb3471591f20e42484
- 04-the-break.md: 2df5a1e65a836477ca061a7c94352a33a071f3547d57c7fb8e463b2b20127fd7
- 05-the-return.md: f1374b2e7fc7a5bb03b480c7f4777a4bc0a673d85e532ce171d667c8db74f127
- 06-the-pattern-continues.md: c7e49933167e0e32db492a186b14dea3a4cb762631c3b4de00854f40d3b54575
- Final PDF: c9d6a57a65255ba7e5b42c5d67f61d274f763a4c0b29bd519929c7c65be1fab7
- Final EPUB: aed761e1e950800a9bf65d1703ee352d825e67bb68dc03f046a551fc779c1e47

## GitHub export state
The GitHub Actions workflow is committed and configured to generate and commit PDF/EPUB exports. A generated binary export commit must be observed before claiming the GitHub binary-export gate PASS.

This receipt supersedes the earlier BLOCKED_EXACT_TRANSCRIPT_ASSEMBLY state.
