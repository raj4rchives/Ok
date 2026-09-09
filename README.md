# EXAMYWEB

Study-tracker SaaS-style portal built around the existing tracker.

## Flow
Landing page → Login / account → Plan selection → Paytm checkout → verified success → `tracker.html`.

## Paytm setup
1. Create/activate your Paytm merchant account and get MID + merchant key.
2. Copy `.env.example` to `.env` and add credentials.
3. Run `npm install` then `npm start`.
4. Use the Paytm staging credentials first. Move to production credentials only after testing.

**Security:** Merchant keys stay on the server. The browser only receives the transaction token. Payment status must be verified server-side before granting access.

## Important
The starter UI shows **$1/month / ₹99/month**. Paytm transactions here are in INR. If you need true automatic recurring monthly billing rather than a monthly purchase, enable Paytm's subscription/UPI AutoPay flow and store subscription status server-side.

## UPI payment
UPI is enabled on checkout using UPI ID `6900365026@superyes`. Each plan generates an Android UPI intent with the correct INR amount. The customer submits the UTR after payment; `/api/upi/submit` records it as `PENDING`. Verify the UTR with your payment provider before granting access. Do not treat the client-side UTR form as proof of payment.
