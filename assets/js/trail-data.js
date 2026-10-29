/* ==========================================================================
   TRAIL DATA — one source for the interactive map, the homepage map and the
   Gateway Communities page.

   ROUTE: an APPROXIMATE trace of the 1,000-mile primary route, Seward to Nome,
   drawn through known waypoints. It is close enough to tell the story at
   state scale; it is not survey data. When BLM's GIS layer for the trail is
   supplied, set TRAIL_GEOJSON_URL and the maps use it automatically.
   ========================================================================== */
window.TRAIL_GEOJSON_URL = '';   // e.g. 'assets/data/inht-primary-route.geojson'

window.TRAIL_ROUTE = [
  [-149.4422,60.1042],[-149.40,60.20],[-149.37,60.33],[-149.37,60.43],[-149.3650,60.4880],
  [-149.38,60.56],[-149.33,60.70],[-149.26,60.80],[-149.12,60.86],[-149.1664,60.9425],
  [-149.106,61.039],[-149.20,61.13],[-149.317,61.234],[-149.45,61.29],[-149.568,61.322],
  [-149.46,61.40],[-149.360,61.461],[-149.28,61.52],[-149.42,61.55],[-149.60,61.50],[-149.735,61.455],
  [-150.10,61.50],[-150.50,61.54],[-150.62,61.72],[-150.90,61.88],[-151.18,61.96],
  [-151.60,61.98],[-151.98,61.99],[-152.35,62.03],[-152.73,62.09],[-152.70,62.25],
  [-152.98,62.45],[-153.37,62.59],[-153.75,62.72],[-154.05,62.86],[-154.38,63.01],
  [-154.95,62.98],[-155.59,62.95],[-156.06,62.99],[-156.52,63.14],[-157.10,62.95],
  [-157.60,62.72],[-158.10,62.54],[-158.20,63.05],[-158.35,63.65],[-158.55,64.05],[-158.72,64.33],
  [-159.20,64.18],[-159.70,64.05],[-160.20,63.95],[-160.79,63.876],[-161.00,64.10],
  [-161.19,64.35],[-161.20,64.65],[-161.16,64.93],[-161.70,64.78],[-162.26,64.62],
  [-162.65,64.56],[-163.03,64.54],[-163.40,64.68],[-163.90,64.62],[-164.40,64.56],
  [-164.73,64.47],[-165.05,64.50],[-165.41,64.50]
];

/* Regions follow the Alliance's own board seats. */
window.TRAIL_REGIONS = {
  kenai: 'Kenai Peninsula', cook: 'Cook Inlet', range: 'Alaska Range',
  kusko: 'Kuskokwim & Innoko', yukon: 'Yukon', norton: 'Norton Sound'
};

/* Stops along the primary route, south to north. `img` keys resolve to
   assets/img/<key>.jpg. `community: true` puts it on Gateway Communities. */
window.TRAIL_STOPS = [
  { id: 'seward', name: 'Seward', kind: 'Mile 0', region: 'kenai', lng: -149.4422, lat: 60.1042, img: 'seward-statue', community: true,
    alt: 'The Trail Blazers statue of a musher and husky beside Resurrection Bay in Seward',
    blurb: 'The trail begins at tidewater on Resurrection Bay. Founded in 1903 as the ocean terminus for the railroad, Seward became the winter port for the Iditarod gold fields — thousands of stampeders came ashore here and walked north.',
    see: 'Mile 0 and the Trail Blazers statue outside the Alaska SeaLife Center; the first-mile walking path; a passport stamp at the Kenai Fjords National Park information center.' },
  { id: 'moose-pass', name: 'Moose Pass & Johnson Pass', kind: 'Kenai Mountains', region: 'kenai', lng: -149.3650, lat: 60.4880, img: 'chugach-valley-2', community: true,
    alt: 'A green alpine valley with a winding river',
    blurb: 'Named, the story goes, for a 1903 mail carrier whose dog team had trouble getting the right-of-way from a moose. North of town the historic route climbs over Johnson Pass, today one of the trail’s best-loved summer hikes.',
    see: 'The Johnson Pass segment on the Chugach National Forest, a summer hiking and winter ski route.' },
  { id: 'girdwood', name: 'Girdwood & Crow Pass', kind: 'Chugach Mountains', region: 'cook', lng: -149.1664, lat: 60.9425, img: 'crow-pass', community: true,
    alt: 'Fog lifting off green ridges on the Crow Pass trail',
    blurb: 'Glacier City, renamed for James Girdwood, was a gold-mining and railroad supply camp. From here the historic route crosses Crow Pass to the Eagle River valley — the most popular backcountry stretch of the whole trail.',
    see: 'The Crow Pass trail and Forest Service cabin; a passport stamp at The Roundhouse.' },
  { id: 'eagle-river', name: 'Eagle River', kind: 'Chugach State Park', region: 'cook', lng: -149.568, lat: 61.322, img: 'chugach-valley', community: true,
    alt: 'A braided glacial river running through a mountain valley',
    blurb: 'Long the hunting grounds of Dena’ina Athabascan families from Eklutna and Matanuska, the valley was opened to entry in 1919. The Crow Pass trail ends at the Eagle River Nature Center.',
    see: 'The northern end of the Crow Pass crossing inside Chugach State Park.' },
  { id: 'eklutna', name: 'Eklutna', kind: 'Dena’ina village', region: 'cook', lng: -149.360, lat: 61.461, img: 'fireweed', community: true,
    alt: 'Fireweed in bloom on a mountain slope',
    blurb: 'At the head of Knik Arm, Eklutna has been the site of Dena’ina villages for some 800 years. Russian Orthodox missionaries arrived in the 1840s; the brightly painted spirit houses still give the village its character.',
    see: 'Eklutna Historical Park and its spirit houses.' },
  { id: 'knik', name: 'Knik', kind: 'Mushing heritage', region: 'cook', lng: -149.735, lat: 61.455, img: 'team-forest', community: true,
    alt: 'A dog team running through snowy spruce forest',
    blurb: 'Knik, a Dena’ina name meaning “fire”, grew into a busy supply town during the gold rush. It is still the heart of Alaska’s mushing tradition.',
    see: 'The Knik Museum and Mushers Hall of Fame (passport stamp); Iditarod race headquarters nearby in Wasilla (passport stamp).' },
  { id: 'skwentna', name: 'Skwentna', kind: 'River crossing', region: 'cook', lng: -151.18, lat: 61.96, img: 'habs-skwentna', community: true,
    alt: 'Black-and-white survey photograph of a log shelter cabin at the Skwentna crossing',
    blurb: 'Where the trail met the Skwentna River, a shelter cabin served mail carriers and freighters. Today Skwentna is a small, roadless community and a busy checkpoint during race season.',
    see: 'Historic American Buildings Survey records of the Skwentna Crossing shelter cabins.' },
  { id: 'rainy-pass', name: 'Rainy Pass', kind: 'Alaska Range', region: 'range', lng: -152.73, lat: 62.09, img: 'hero-alpenglow', community: true,
    alt: 'Pink alpenglow over a snowy mountain range',
    blurb: 'The trail crosses the Alaska Range through Rainy Pass, a winter route the Alaska Road Commission kept up for mining access long after the mail moved on. Wind, steep descents and deep snow make it the trail’s great test.',
    see: 'Remote country — travel here is for experienced, self-sufficient winter parties.' },
  { id: 'rohn', name: 'Rohn', kind: 'Shelter cabin', region: 'range', lng: -153.37, lat: 62.59, img: 'habs-rhon', community: false,
    alt: 'Black-and-white survey photograph of the Rohn River shelter cabin and a radio tower',
    blurb: 'Below the Dalzell Gorge, the Rohn shelter cabin is one of the public cabins the Bureau of Land Management maintains along the route.',
    see: 'One of five BLM public shelter cabins on the trail.' },
  { id: 'mcgrath', name: 'McGrath', kind: 'Kuskokwim River', region: 'kusko', lng: -155.59, lat: 62.95, img: 'dogs-resting', community: true,
    alt: 'Sled dogs resting on straw beside a log cabin',
    blurb: 'By the 1930s McGrath had become the dominant supply center on the upper Kuskokwim. A Trail Blazers chapter keeps the local trail open.',
    see: 'A passport stamp at the McGrath museum run by the Tochak Historical Society.' },
  { id: 'takotna', name: 'Takotna', kind: 'Supply town', region: 'kusko', lng: -156.06, lat: 62.99, img: 'aerial-team', community: true,
    alt: 'Aerial view of a dog team on a trail through snowy spruce',
    blurb: 'Founded where Arthur Berry’s sternwheeler could go no further upriver in 1908. By 1919 it had stores, roadhouses, a post office and about fifty houses — and in 1923 its own newspaper, The Kusko Times.',
    see: 'A village famous among mushers for its hospitality.' },
  { id: 'iditarod', name: 'Iditarod', kind: 'Ghost town', region: 'kusko', lng: -158.10, lat: 62.54, img: 'trail-spruce', community: true,
    alt: 'The trail cutting through snowy spruce wilderness',
    blurb: 'The strike that named the trail. Between 1910 and 1912 more than 10,000 gold seekers poured into the Iditarod district, and over $30 million in gold left along the trail. Today the town is a ghost town on the Iditarod River.',
    see: 'The remains of Iditarod and nearby Flat — remote, and largely on private and Native corporation land.' },
  { id: 'kaltag', name: 'Kaltag', kind: 'Yukon River', region: 'yukon', lng: -158.72, lat: 64.33, img: 'musher-cabin', community: true,
    alt: 'A musher passing the Old Woman shelter cabin on the Kaltag Portage',
    blurb: 'In Koyukon Athabascan country, at the head of the Kaltag Portage — an ancient route between the Yukon and the coast that Russian traders used in the 1840s.',
    see: 'The start of the Kaltag Portage, traveled by village residents all winter.' },
  { id: 'unalakleet', name: 'Unalakleet', kind: 'Norton Sound', region: 'norton', lng: -160.79, lat: 63.876, img: 'musher-dusk', community: true,
    alt: 'A musher at dusk on the trail between Kaltag and Unalakleet',
    blurb: '“Place where the east wind blows.” House remains on the beach ridge date back to 200 B.C. Unalakleet has long been a trade center at the coastal end of the Kaltag Portage.',
    see: 'The trail meets the sea ice of Norton Sound.' },
  { id: 'golovin', name: 'Golovin', kind: 'Norton Sound', region: 'norton', lng: -163.03, lat: 64.54, img: 'hero-sea-ice', community: true,
    alt: 'A dog team crossing wind-packed sea ice below distant mountains',
    blurb: 'Once the Iñupiaq village of Chinik. When gold was found at Council in 1898, Golovin became the supply point for the gold fields.',
    see: 'Coastal travel across Golovin Bay.' },
  { id: 'solomon', name: 'Solomon', kind: 'Roadhouse', region: 'norton', lng: -164.40, lat: 64.56, img: 'habs-solomon', community: true,
    alt: 'Black-and-white survey photograph of the Solomon Roadhouse',
    blurb: 'The 1899–1900 rush brought thousands here. By 1904 Solomon had seven saloons, a post office and a narrow-gauge railroad; the Solomon Roadhouse operated until the 1970s.',
    see: 'The Solomon Roadhouse, documented by the Historic American Buildings Survey.' },
  { id: 'safety', name: 'Port Safety', kind: 'Last roadhouse', region: 'norton', lng: -164.73, lat: 64.47, img: 'habs-safety', community: false,
    alt: 'Black-and-white survey photograph of the Safety Roadhouse',
    blurb: 'The last roadhouse before Nome, on the spit at Safety Sound.',
    see: 'The Safety Roadhouse, documented by the Historic American Buildings Survey.' },
  { id: 'nome', name: 'Nome', kind: 'End of the trail', region: 'norton', lng: -165.41, lat: 64.50, img: 'habs-cape-nome-beach', community: true,
    alt: 'Black-and-white photograph of the beach and headland at Cape Nome',
    blurb: 'A $1,500-to-the-pan strike on Anvil Creek in 1898 turned a stretch of tundra into a tent city of 20,000. Nome is the end of the trail, and of the 1925 serum run.',
    see: 'A passport stamp at the Nome Visitor Center.' }
];

/* Communities on connecting trails (not on the primary-route map line). */
window.TRAIL_CONNECTING = [
  { id: 'galena', name: 'Galena', kind: 'Yukon River', region: 'yukon', lng: -156.93, lat: 64.74, img: 'snowmachine-sunset',
    alt: 'A snowmachine at sunset on the frozen trail',
    blurb: 'A Koyukon Athabascan community on the Yukon River and home of the Innoko National Wildlife Refuge office, one of the trail’s land managers.' },
  { id: 'tolovana', name: 'Tolovana Roadhouse', kind: 'Serum run route', region: 'yukon', lng: -149.80, lat: 64.86, img: 'husky',
    alt: 'A frost-covered husky resting in the snow',
    blurb: 'Established in 1903 on the Fairbanks–Nome mail trail. Tolovana was the first relay point of the 1925 serum run and is the last surviving roadhouse on that trail, listed on the National Register of Historic Places in 1989.' }
];
