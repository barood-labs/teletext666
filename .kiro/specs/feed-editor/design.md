# Design: feed-editor
`cachedFetch(key, url)` -> JSON or throws. Each page module exports `build(lang, query) -> Promise<PageSource>`. City selectable via `?city=` from a small built-in table (lat/lon/tz).
