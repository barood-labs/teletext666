# Requirements: feed-editor
- WHEN a feed is requested THE SYSTEM SHALL fetch it with a 4s timeout and cache the last good result for 10 minutes.
- IF a fetch fails and no cache exists THEN THE SYSTEM SHALL render an "OFF AIR" page explaining the source is down.
- THE SYSTEM SHALL support Open-Meteo weather (300), Aladhan prayer times (400), USGS earthquakes (888) without API keys.
- WHERE an AI editor is configured THE SYSTEM SHALL compress long feed text to fit one page (future).
