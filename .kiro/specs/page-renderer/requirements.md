# Requirements: page-renderer
## R1 Grid
- WHEN a page is rendered THE SYSTEM SHALL output exactly 24 rows of at most 40 visible columns.
- WHEN a line exceeds 40 columns THE SYSTEM SHALL wrap at the last word boundary.
- IF a single word exceeds 40 columns THEN THE SYSTEM SHALL hard-break it.
## R2 Subpages
- WHEN content exceeds the 22 body rows THE SYSTEM SHALL split it into numbered subpages and SHALL NOT drop text.
## R3 Bilingual
- WHEN a page is Arabic THE SYSTEM SHALL measure width ignoring diacritics and SHALL mark the page RTL.
- THE SYSTEM SHALL preserve every digit sequence of the source unchanged.
## R4 Outputs
- WHEN the client is curl or requests `format=text` THE SYSTEM SHALL return plain text.
- WHEN `/sms/<n>` is requested THE SYSTEM SHALL return the body without colour codes, max 480 chars per part.
- WHEN a browser requests a page THE SYSTEM SHALL return HTML with the CRT viewer.
