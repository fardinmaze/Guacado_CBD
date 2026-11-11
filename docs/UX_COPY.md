> **Superseded 2026-11-11** by the food-focused copy deck from the owner, now applied in `src/`. Kept for reference only.

# Guacado: UX copy deck (v1, 2026-11-11)

Covers the marketing site (/, /menu, /catering, /locations) plus global chrome. Each row shows **Now** and **New**. Anything not listed stays as is.

**Rules used**
- Facts only from the site data: pickup only (no delivery), open daily 10:30am–3am, 19 open locations in 6 states, prices from `menu.json`. No invented promos, rewards or claims.
- Voice: friendly, quick, a little cheeky. Short sentences. Say what the guest gets, then what to tap.
- One verb per button: Order, Build, Find, Call/Email. Never "Click here", "Submit", "Learn more".
- Numbers beat adjectives: "from $11.95" works; speed claims like "ready in minutes" are not used (no data).
- Sentence case for body and helper text. Buttons and headlines are uppercased by CSS, so write them in normal case.
- Placeholders in `{braces}` are filled from data.

---

## 1. Global

| Where | Now | New |
|---|---|---|
| Utility bar left | Open every day · 10:30am – 3am | Open every day, 10:30am to 3am |
| Utility bar right | Accessibility | Accessibility |
| Nav | Menu · Catering · Locations · Order | Menu · Catering · Locations · Order |
| Header action | Find a location | Find a location |
| Header button | Order now | Order pickup |
| Bag icon label | Your order | Start an order |
| Drawer button | Order now | Order pickup |
| Skip link | Skip to content | Skip to main content |
| Mobile order bar (idle) | Menu · Order now | Menu · Order pickup |
| Mobile order bar (building) | Order this | Order this bowl |
| Toast: copied | Order copied | Order copied. Paste it in at checkout. |
| Toast: email copied | (none) | Email copied |
| 404 (redirects home today) | n/a | Headline: "That page isn't on the menu." Body: "Head back home or find your nearest Guacado." Buttons: Home · Find a location |

**Button naming:** "Order pickup" replaces "Order now" everywhere a location is not yet chosen. It tells guests this is pickup, which removes the most common doubt before they click.

## 2. Home page

### Hero
| | Now | New |
|---|---|---|
| Badge | Open till 3am | Open till 3am |
| Headline | Your bowl. Your way. | Your bowl. Your way. |
| Sub | Build your own from $11.95 | Build your own from {$11.95} |
| Body | Pick a base, a protein, fresh toppings and a homemade sauce. | Four picks and it's yours: base, protein, toppings, sauce. |
| Button | Order now | Order pickup |
| Fine print | Pickup only. Menu-board prices before tax; final price and availability are set by your location at checkout. | Pickup only. Prices are menu-board prices before tax. Your location confirms the final total at checkout. |

### Order strip
| Now | New |
|---|---|
| Order ahead. Skip the line. | Order ahead. Skip the line. |
| Order now / or / Find one of 19 locations | Order pickup / or / Find one of {19} locations |

### Category grid (no section heading today; add a visually hidden H2 "Menu categories")
| Tile | Sub-line now | Sub-line new |
|---|---|---|
| Family Kits | Feeds 4–6 · from $49.95 | Feeds 4–6 · from {$49.95} |
| Burrito & More | Burritos, nachos, quesadillas · from $11.95 | Burritos, nachos, quesadillas · from {$11.95} |
| Burrito Bowl | From $11.95 | From {$11.95} |
| Birria Tacos | From $11.95 | Chicken or beef · from {$11.95} |
| Tostada | $8.95 | {$8.95} |
| Tacos | From $11.95 | Soft or crispy · from {$11.95} |
| Kid's Meal | From $8.95 | Comes with milk or water · from {$8.95} |
| Chips & Sides | Guac, queso, fries · from $0.95 | Guac, queso, fries · from {$0.95} |
| Drinks & Desserts | From $1.95 | Shakes, lemonade, churros · from {$1.95} |
| Badges | Serves a crowd · Signature | Feeds a crowd · Signature |

### Story cards
| | Now | New |
|---|---|---|
| Card 1 title | Build it your way | Build it your way |
| Card 1 body | Pick a base, a protein, fresh toppings and a homemade sauce. Your protein sets the price; the rest is on us. | Your protein sets the price. Base, toppings and sauce don't cost extra. |
| Card 1 button | Build yours | Start building |
| Card 2 title | Fresh guac on anything | Fresh guac on anything |
| Card 2 body | Bowl, burrito, nachos or tacos. Add a scoop of fresh guacamole for $1.95. | Add a scoop to a bowl, burrito, nachos or tacos for {$1.95}. |
| Card 2 button | Order now | Order pickup |

### Featured band
| Now | New |
|---|---|
| Featured | Fan favorites |
| Find a location (button) | Find a location |
| Card caption: "Birria Tacos / From $11.95" | Same (name left, price right) |

### Build your own section
| | Now | New |
|---|---|---|
| Eyebrow | Build your own · From $11.95 | Build your own · from {$11.95} |
| Headline | Make it exactly how you like it | Build it your way |
| Lead | Four quick picks. Your protein sets the price; base, toppings and sauce are on us. | Four quick picks. Your protein sets the price. |
| Step 1 | Choose your base | 1. Pick a base |
| Step 2 | Choose your protein · Sets your price | 2. Pick a protein · This sets your price |
| Step 3 | Choose your toppings | 3. Pick your toppings |
| Step 4 | Choose a homemade sauce · Chili icons show heat | 4. Pick a homemade sauce · Chili icons show the heat |
| Add-on toggle | Add fresh guac (+$1.95) | Add fresh guac (+{$1.95}) |
| Add-on toggle | Extra protein | Double the protein (+{price}) |
| Ticket title | Your order | Your bowl |
| Ticket button | Order this online | Order this for pickup |
| Secondary | Copy my order | Copy my order |
| Reset | Start over | Start over |
| Footnote | Menu-board prices before tax. Final price and availability are set by your location at checkout. | Prices are before tax. Your location confirms the final total at checkout. |

### Make it a meal
| Now | New |
|---|---|
| Make it a meal | Make it a meal |
| (no lead) | Add a side or a drink to any order. |
| Add to your order | Add to your order |

### Crowd pleasers
| | Now | New |
|---|---|---|
| Heading | Crowd pleasers | Feeding a crowd? |
| Kits title | Family kits | Family kits |
| Kits body | Feeds 4–6. Two proteins, tortillas or chips and all the fixings, from $49.95. | Feeds 4–6. Two proteins, tortillas or chips and all the fixings, packed to go. |
| Kits button | Order a kit | Order a kit |
| Catering title | Catering | Catering |
| Catering body | Every event is built around your tastes and your guest list. Tell us the date and headcount and we'll plan the spread. | Tell us the date and headcount. We'll plan the spread around your guests. |
| Catering buttons | Order catering · Email us | See catering packages · Email us |

### Locations block
| | Now | New |
|---|---|---|
| Eyebrow | Order ahead for pickup | Order ahead for pickup |
| Headline | Find your Guacado | Find your Guacado |
| Lead | 19 open, 4 coming soon across 6 states. Open every day from 10:30am to 3am. | {19} open and {4} coming soon in {6} states. Open every day from 10:30am to 3am. |
| Search placeholder | Enter a city, street or ZIP code | Search by city, street or ZIP |
| Search label (sr-only) | Search locations by street, city or ZIP | Search locations by city, street or ZIP |
| Empty state | No locations match "{q}". Try a city or ZIP code. | No locations match "{q}". Check the spelling or try a nearby ZIP. |
| Show-all button | See all {n} locations | See all {n} locations |
| Card, open | Open daily · 10:30am – 3am | Open daily, 10:30am to 3am |
| Card, soon | Coming soon | Coming soon |
| Card buttons | Order pickup · Directions | Order pickup · Get directions |

### Jobs and franchise
| | Now | New |
|---|---|---|
| Jobs eyebrow / title | We are hiring / Join the line | Now hiring / Join the line |
| Jobs body | Grill, build and serve with us. See current openings and apply in a few clicks. | Grill, build and serve with us. See what's open and apply online. |
| Jobs button | See open jobs | See open jobs |
| Franchise eyebrow / title | Franchise opportunities / Open a Guacado | Franchise opportunities / Open a Guacado |
| Franchise body | Bring build-your-own Mexican to your neighborhood. | Bring build-your-own Mexican to your neighborhood. |
| Franchise button | Franchise info | Explore franchising |

## 3. Menu page (/menu)
| | Now | New |
|---|---|---|
| Eyebrow | Order for pickup | Order for pickup |
| H1 | Menu | Menu |
| Lead | Prices are from our menu board. Tap Order to check out online with your nearest location. | Browse the full menu, then tap Order to pick a location and check out. |
| Tabs | Signature · Build Your Own · Family Kits · Kids · Sides & Dips · Drinks & Desserts | Same |
| Signature, Birria | Chicken or Beef. Slow-braised and griddled, served for dipping. | Chicken or beef, slow-braised, griddled and served with consommé for dipping. *(confirm "consommé" with owner before use)* |
| Signature, Tostada badge | Special | Special |
| Item button | Order | Order |
| Calories | 430–1150 Cal | 430–1150 Cal (keep) |
| Advisory (bottom) | Consuming raw or undercooked… | Keep the legal text word for word |

## 4. Catering page (/catering)
| | Now | New |
|---|---|---|
| Eyebrow | Catering | Catering |
| H1 | Let us cater your next event | Let us cater your next event |
| Body | Every event is built around your tastes and your guest list, from a birthday at home to a company lunch. Tell us the date and headcount and we'll plan the spread. | From a birthday at home to a company lunch, we build the spread around your guests. Tell us the date and headcount and we'll take it from there. |
| Buttons | Catering packages · Email us | See catering packages · Email us |
| Occasions | Birthdays, Holiday Parties, Corporate, Weddings, Rehearsal Dinners, Game Day | Same |
| Kits eyebrow | Smaller group? Order a kit today | Smaller group? A family kit does the job. |
| Email subject | Catering enquiry | Catering enquiry |

## 5. Locations page (/locations)
H1 is "Find your Guacado" (same block as home, full list). Add one line under the lead: "Tap Order pickup on any location to start your order."

## 6. Footer
| | Now | New |
|---|---|---|
| Big links | Menu · Order · Catering · Locations · Jobs · Franchise | Same |
| Small links | Full menu on guacadomexican.com · Catering packages · All locations · Accessibility | Same |
| Promo kicker | Order online | Order for pickup |
| Promo headline | Skip the line | Skip the line |
| Promo body | Pick up at your nearest Guacado, open every day 10:30am – 3am. | Pick up at your nearest Guacado, open every day 10:30am to 3am. |
| Promo button | Order now | Order pickup |
| Promo link | Find a location | Find a location |
| Contact | Contact us / email | Questions? Email us (email shown, tap to copy) |
| Copyright | © 2026 Guacado Mexican Grill · Open every day … | © 2026 Guacado Mexican Grill |

## 7. Accessibility labels
| Element | Label |
|---|---|
| Logo link | Guacado Mexican Grill, home |
| Hero video | A burrito bowl being built layer by layer, rice, beans, protein, toppings and sauce |
| Directions link | Get directions to {address} (opens Google Maps in a new tab) |
| Menu tile links | {Name}, {from price}. View on the menu |
| Burger | Open menu |

## 8. SEO (page title · meta description, 155 characters max)
| Page | Title | Description |
|---|---|---|
| Home | Guacado Mexican Grill · Build-Your-Own Bowls, Birria Tacos, Pickup | Order birria tacos, burrito bowls and family kits for pickup. Open daily till 3am at 19 locations across NY, NJ, MD, CT, PA and MI. |
| Menu | Menu and Prices · Guacado Mexican Grill | See every bowl, taco, kit, side and drink with prices. Build your own from $11.95 and order for pickup. |
| Catering | Catering · Guacado Mexican Grill | Birthdays, offices, weddings and game day. Tell us the date and headcount and we'll plan the Mexican spread. |
| Locations | Find a Guacado Near You · Guacado Mexican Grill | 19 locations open daily 10:30am to 3am in NY, NJ, MD, CT, PA and MI. Search by city or ZIP and order for pickup. |

## 9. Open questions for the owner
1. Is "Order pickup" the right wording, or does the brand prefer "Order online"?
2. Can we say "consommé" for birria dipping, and are the sauces really made in-house daily?
3. Any real offers (app, rewards, delivery partners)? If yes, they need copy slots in the order strip and hero fine print.
4. Is there a tagline beyond "Your bowl. Your way."?
