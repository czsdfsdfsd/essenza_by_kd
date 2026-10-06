ESSENZA BY KD - LUXURY WEBSITE

Updated for Sri Lanka:
- WhatsApp: +94 76 066 9736
- Location: New Commercial Complex, Mirigama, Sri Lanka
- 5ML: Rs. 1,000/-
- 10ML: Rs. 2,000/-
- Full Bottle: Rs. 27,900/-

ORDER PDF:
When a customer checks out on WhatsApp, the website first generates and downloads a premium A4 order-summary PDF with the ESSENZA BY KD logo, order number, date/time, customer details, items, quantities, prices and total. Then it opens the WhatsApp order message.

The PDF is an order summary, not a payment receipt.

PRODUCT DATA:
All products live in the PRODUCTS array. The centralized CONFIG block contains the default website prices and WhatsApp number. Product flags control New Arrivals, Special Offers, Best Sellers, Featured and Limited Edition sections.

ASSETS:
assets/essenza-logo.jpg is the supplied ESSENZA BY KD logo.


OWNER LOGIN + PRICE MANAGER (new):
- Press the gold OWNER LOGIN tab on the left side of the website (or the OWNER LOGIN link in the footer, or open yourwebsite.com/#admin) and log in.
- Default login:  ID  kd999   /   Password  kd999
- Change the default prices (5ml / 10ml / Full Bottle) or set a different price for one perfume, then press SAVE PRICES.
  Every customer sees the new prices straight away. No code editing needed.
- Prices are stored with Netlify Blobs through the function netlify/functions/prices.js.
  Deploy with Git or the Netlify CLI so the function and its package are installed.
- To change the login later (recommended): Netlify > Site configuration > Environment variables
  > add ADMIN_USER and ADMIN_PASS, then redeploy.
- Special-offer prices and offer end dates are still set in the PRODUCTS list inside index.html.
