# Design: text-gateway
`parseCommand(body) -> {num, lang}`; reuses `toSms`. Provider adapters (Twilio etc.) are thin wrappers, out of MVP.
