# Quarterly gifts: explicit demo, defensible architecture

## Policy chosen for this prototype

A quarter is Jan-Mar, Apr-Jun, Jul-Sep or Oct-Dec in Vietnam time (UTC+07:00). The entry deadline is the following quarter's first midnight, exclusive. The nominal result time is that first day at 20:00 ICT. This is a three-calendar-month schedule, not exactly 90 days.

An active verified member can explicitly accept the demo rules and enter once. Administrators cannot enter. The UI asks the member to confirm adulthood and not to use multiple accounts; that self-declaration is **not identity/age verification**. Registration and human uniqueness checks need real controls before any valuable promotion. Likes, comments, posting frequency, spending, watch time and referrals do not grant additional tickets.

Sample travel and cinema prize cards are proposals, not inventory, booking confirmations, sponsor commitments or legal entitlements. No purchase, deposit, paid entry or payment gateway exists. Real campaigns are disabled in server services even if a database row is manually set to `demo=False`.

## Server sequence

- Open quarter: create one campaign row, terms version, three ranked sample prizes and a random 32-byte seed. Publish SHA-256 of the seed's hexadecimal string before entries.
- Enter: lock the campaign, validate active/verified membership and time window, insert a random ticket with unique `(campaign,user)` constraint. Repeating the request returns the existing ticket.
- Freeze: stop entries with an atomic state transition, select currently active/verified non-admin entrants, sort public ticket strings and persist an immutable snapshot. Publish SHA-256 of newline-joined ticket codes.
- Draw: require locked state, verify the snapshot/seed hashes, and compute HMAC-SHA256 of `snapshot_hash + '|' + ticket` with the seed's **decoded bytes** as key. Sort digest ascending (ticket ascending breaks a theoretical tie). Assign first/second/third prize to consecutive tickets. Each account can win once. With fewer entrants than prizes, the remaining prizes are unallocated.
- Record: persist winners, reveal the seed, write the audit event and transition to drawn in the same transaction. Repeating a draw request returns the saved result. There is no reroll, selected-winner input or silent replacement endpoint.

Browser simulation uses equivalent algorithms for UX testing, but browser storage is fully editable. The connected Flask service, not the UI reveal animation, owns the actual extension result. Administrator early locking is allowed **only for demonstration**.

## What verification proves

The results page checks the seed commitment, ordered unique snapshot, snapshot hash, expected winner count and every prize/rank/ticket mapping. This demonstrates internal consistency and allows reproducing the published ranking.

It does not prove that an operator did not choose among seeds, create fake accounts, omit entries, edit the database or abort an unfavorable result. The promoter knows the seed before freezing. For a real valuable promotion, design an independently witnessed process and, when appropriate, an external future randomness source chosen before entry closes, a durable append-only audit trail and reconciled eligibility records. Those controls are not implemented here.

No exact live winning odds can be advertised before the entrant count is known. Under the specified uniformly random, one-entry mechanism with up to three prizes, the mathematical chance of any prize is `min(3,N)/N`. This mathematical statement is not a fairness certification of a deployment.

## Legal and operational gate

The kit is not legal advice or an assessment that this particular free-entry program is exempt from regulation. Before accepting real entries, an identified organizer should review current promotion, privacy, consumer-protection, tax, travel and prize-fulfillment obligations for the actual countries, entrants and program structure. Define prize values, transport/accommodation, visas, insurance, exclusions, dates, claim deadline, complaints, alternate winners and what happens if a trip is unavailable.

The Ministry of Industry and Trade publishes promotion regulations and a registration procedure for relevant chance-based promotional programs. The exact applicability depends on the final design and organizer; a screenshot or "free" label does not resolve it.

Official sources checked:
https://moit.gov.vn/van-ban-phap-luat/van-ban-hop-nhat/nghi-dinh-quy-dinh-chi-tiet-luat-thuong-mai-ve-hoat-dong-xuc-tien-thuong-mai..html
https://dichvucong.moit.gov.vn/VdxpTTHCOnlineDetail.aspx?DocId=424

There is no live claim/fulfillment feature, funded sponsor agreement, external audit, actual scheduled draw job or approved public promotion in this delivery.
