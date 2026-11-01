# Requirements: text-gateway
- WHEN a user sends "P<num>" (optionally "AR P<num>") THE SYSTEM SHALL reply with the SMS rendering of that page.
- THE SYSTEM SHALL expose `/sms?body=P100` so any SMS provider webhook can be wired later.
- IF the page number is unknown THEN THE SYSTEM SHALL reply with the index.
