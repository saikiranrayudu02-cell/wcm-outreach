export interface GeographicOrigin {
  state: string;
  zone: string;
  district: string;
  part: string;
}

const STATE_MAPPINGS: Record<string, { canonical: string; zone: string }> = {
  ap: { canonical: "Andhra Pradesh", zone: "South" },
  andhra: { canonical: "Andhra Pradesh", zone: "South" },
  "andhra pradesh": { canonical: "Andhra Pradesh", zone: "South" },
  tn: { canonical: "Tamil Nadu", zone: "South" },
  "tamil nadu": { canonical: "Tamil Nadu", zone: "South" },
  tamilnadu: { canonical: "Tamil Nadu", zone: "South" },
  ts: { canonical: "Telangana", zone: "South" },
  telangana: { canonical: "Telangana", zone: "South" },
  ka: { canonical: "Karnataka", zone: "South" },
  karnataka: { canonical: "Karnataka", zone: "South" },
  kl: { canonical: "Kerala", zone: "South" },
  kerala: { canonical: "Kerala", zone: "South" },
  mh: { canonical: "Maharashtra", zone: "West" },
  maharashtra: { canonical: "Maharashtra", zone: "West" },
  gj: { canonical: "Gujarat", zone: "West" },
  gujarat: { canonical: "Gujarat", zone: "West" },
  up: { canonical: "Uttar Pradesh", zone: "North" },
  "uttar pradesh": { canonical: "Uttar Pradesh", zone: "North" },
  dl: { canonical: "Delhi", zone: "North" },
  delhi: { canonical: "Delhi", zone: "North" },
  pb: { canonical: "Punjab", zone: "North" },
  punjab: { canonical: "Punjab", zone: "North" },
  wb: { canonical: "West Bengal", zone: "East" },
  "west bengal": { canonical: "West Bengal", zone: "East" },
  od: { canonical: "Odisha", zone: "East" },
  odisha: { canonical: "Odisha", zone: "East" },
  orissa: { canonical: "Odisha", zone: "East" },
  br: { canonical: "Bihar", zone: "East" },
  bihar: { canonical: "Bihar", zone: "East" },
};

const DISTRICT_MAPPINGS: Record<string, string> = {
  konaseema: "Konaseema",
  rjy: "East Godavari (Rajahmundry)",
  rajahmundry: "East Godavari (Rajahmundry)",
  kkd: "Kakinada",
  kakinada: "Kakinada",
  krishna: "Krishna",
  guntur: "Guntur",
  visakhapatnam: "Visakhapatnam",
  vizag: "Visakhapatnam",
  chennai: "Chennai",
  coimbatore: "Coimbatore",
  madurai: "Madurai",
  hyderabad: "Hyderabad",
  secunderabad: "Secunderabad",
  bengaluru: "Bengaluru",
  bangalore: "Bengaluru",
};

const PART_MAPPINGS: Record<string, string> = {
  amp: "Amalapuram",
  amalapuram: "Amalapuram",
  vja: "Vijayawada",
  vijayawada: "Vijayawada",
  hq: "HQ",
  central: "Central",
  north: "North",
  south: "South",
  east: "East",
  west: "West",
};

export function parseGeographicLocation(
  rawLocation?: string | null,
  leader?: { state?: string | null; zone?: string | null; part?: string | null } | null
): GeographicOrigin {
  const cleaned = (rawLocation || "").trim();
  const tokens = cleaned.split(/[\/,]/).map((t) => t.trim()).filter(Boolean);

  let state = "";
  let zone = "";
  let district = "";
  let part = "";

  if (tokens.length >= 1) {
    const sKey = tokens[0].toLowerCase();
    if (STATE_MAPPINGS[sKey]) {
      state = STATE_MAPPINGS[sKey].canonical;
      zone = STATE_MAPPINGS[sKey].zone;
    } else {
      state = tokens[0].charAt(0).toUpperCase() + tokens[0].slice(1);
    }
  }

  if (tokens.length >= 2) {
    const dKey = tokens[1].toLowerCase();
    district = DISTRICT_MAPPINGS[dKey] || (tokens[1].charAt(0).toUpperCase() + tokens[1].slice(1));
  }

  if (tokens.length >= 3) {
    const pKey = tokens[2].toLowerCase();
    part = PART_MAPPINGS[pKey] || (tokens[2].charAt(0).toUpperCase() + tokens[2].slice(1));
  }

  // Fallbacks to user leader geographical assignment
  if (!state && leader?.state && leader.state !== "National Headquarters") {
    const sKey = leader.state.toLowerCase();
    if (STATE_MAPPINGS[sKey]) {
      state = STATE_MAPPINGS[sKey].canonical;
      zone = STATE_MAPPINGS[sKey].zone;
    } else {
      state = leader.state;
    }
  }

  if (!zone) {
    zone = leader?.zone || "South";
  }

  if (!part && leader?.part) {
    part = leader.part;
  }

  return {
    state: state || (leader?.state && leader.state !== "National Headquarters" ? leader.state : "Location Not Assigned"),
    zone: zone || "General Zone",
    district: district || "General District",
    part: part || "General Unit",
  };
}

export const INDIA_STATES_DISTRICTS: Record<string, string[]> = {
  "Andhra Pradesh": [
    "Konaseema",
    "Kakinada",
    "East Godavari (Rajahmundry)",
    "West Godavari (Bhimavaram)",
    "Krishna",
    "NTR (Vijayawada)",
    "Guntur",
    "Bapatla",
    "Palnadu",
    "Prakasam (Ongole)",
    "Visakhapatnam",
    "Anakapalli",
    "Alluri Sitharama Raju",
    "Parvathipuram Manyam",
    "Vizianagaram",
    "Srikakulam",
    "Nellore (SPSR Nellore)",
    "Tirupati",
    "Chittoor",
    "Annamayya",
    "YSR (Kadapa)",
    "Kurnool",
    "Nandyal",
    "Ananthapuramu",
    "Sri Sathya Sai",
  ],
  "Tamil Nadu": [
    "Chennai",
    "Chengalpattu",
    "Coimbatore",
    "Cuddalore",
    "Dharmapuri",
    "Dindigul",
    "Erode",
    "Kallakurichi",
    "Kanchipuram",
    "Kanniyakumari",
    "Karur",
    "Krishnagiri",
    "Madurai",
    "Mayiladuthurai",
    "Nagapattinam",
    "Namakkal",
    "Nilgiris",
    "Perambalur",
    "Pudukkottai",
    "Ramanathapuram",
    "Ranipet",
    "Salem",
    "Sivaganga",
    "Tenkasi",
    "Thanjavur",
    "Theni",
    "Thoothukudi",
    "Tiruchirappalli",
    "Tirunelveli",
    "Tirupathur",
    "Tiruppur",
    "Tiruvallur",
    "Tiruvannamalai",
    "Tiruvarur",
    "Vellore",
    "Viluppuram",
    "Virudhunagar",
  ],
  "Telangana": [
    "Hyderabad",
    "Secunderabad",
    "Rangareddy",
    "Medchal-Malkajgiri",
    "Warangal",
    "Hanamkonda",
    "Karimnagar",
    "Nizamabad",
    "Khammam",
    "Nalgonda",
    "Mahabubnagar",
    "Sangareddy",
    "Siddipet",
    "Suryapet",
    "Jagtial",
    "Kamareddy",
    "Mancherial",
    "Adilabad",
    "Nirmal",
    "Bhadradri Kothagudem",
    "Jayashankar Bhupalpally",
    "Jangaon",
    "Jogulamba Gadwal",
    "Mulugu",
    "Nagarkurnool",
    "Narayanpet",
    "Peddapalli",
    "Rajanna Sircilla",
    "Vikarabad",
    "Wanaparthy",
    "Yadadri Bhuvanagiri",
  ],
  "Karnataka": [
    "Bengaluru",
    "Bengaluru Urban",
    "Bengaluru Rural",
    "Mysuru",
    "Hubballi-Dharwad",
    "Mangaluru",
    "Belagavi",
    "Kalaburagi",
    "Ballari",
    "Davanagere",
    "Shivamogga",
    "Tumakuru",
    "Udupi",
    "Hassan",
    "Mandya",
    "Chikkamagaluru",
    "Kodagu",
    "Bidar",
    "Raichur",
    "Koppal",
    "Gadag",
    "Bagalkot",
    "Vijayapura",
    "Uttara Kannada",
    "Haveri",
    "Chitradurga",
    "Chamarajanagar",
    "Ramanagara",
    "Kolar",
    "Chikkaballapur",
    "Yadgir",
    "Vijayanagara",
  ],
  "Kerala": [
    "Thiruvananthapuram",
    "Ernakulam",
    "Kozhikode",
    "Thrissur",
    "Kollam",
    "Alappuzha",
    "Kannur",
    "Kottayam",
    "Palakkad",
    "Malappuram",
    "Kasaragod",
    "Pathanamthitta",
    "Idukki",
    "Wayanad",
  ],
  "Maharashtra": [
    "Mumbai City",
    "Mumbai Suburban",
    "Pune",
    "Nagpur",
    "Nashik",
    "Thane",
    "Aurangabad (Chhatrapati Sambhajinagar)",
    "Solapur",
    "Amravati",
    "Kolhapur",
    "Navi Mumbai",
    "Jalgaon",
    "Akola",
    "Latur",
    "Dhule",
    "Ahmednagar",
    "Nanded",
    "Satara",
    "Sangli",
    "Chandrapur",
    "Parbhani",
    "Jalna",
    "Beed",
    "Raigad",
    "Ratnagiri",
    "Sindhudurg",
    "Palghar",
    "Osmanabad (Dharashiv)",
    "Nandurbar",
    "Wardha",
    "Bhandara",
    "Gondia",
    "Gadchiroli",
    "Washim",
    "Buldhana",
    "Yavatmal",
  ],
  "Gujarat": [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Bhavnagar",
    "Jamnagar",
    "Gandhinagar",
    "Junagadh",
    "Anand",
    "Navsari",
    "Morbi",
    "Mehsana",
    "Bharuch",
    "Valsad",
    "Kutch",
    "Patan",
  ],
  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur Nagar",
    "Varanasi",
    "Prayagraj",
    "Agra",
    "Meerut",
    "Noida (Gautam Buddha Nagar)",
    "Ghaziabad",
    "Bareilly",
    "Aligarh",
    "Moradabad",
    "Gorakhpur",
    "Ayodhya",
    "Jhansi",
    "Mathura",
  ],
  "Delhi": [
    "Central Delhi",
    "East Delhi",
    "New Delhi",
    "North Delhi",
    "North East Delhi",
    "North West Delhi",
    "Shahdara",
    "South Delhi",
    "South East Delhi",
    "South West Delhi",
    "West Delhi",
  ],
  "Punjab": [
    "Amritsar",
    "Ludhiana",
    "Jalandhar",
    "Patiala",
    "Bathinda",
    "Mohali (SAS Nagar)",
    "Hoshiarpur",
    "Gurdaspur",
    "Firozpur",
    "Pathankot",
  ],
  "West Bengal": [
    "Kolkata",
    "Howrah",
    "North 24 Parganas",
    "South 24 Parganas",
    "Hooghly",
    "Darjeeling",
    "Siliguri",
    "Asansol (Paschim Bardhaman)",
    "Durgapur",
    "Purba Medinipur",
    "Malda",
    "Murshidabad",
  ],
  "Odisha": [
    "Bhubaneswar (Khurda)",
    "Cuttack",
    "Rourkela (Sundargarh)",
    "Puri",
    "Sambalpur",
    "Balasore",
    "Bhadrak",
    "Ganjam",
    "Koraput",
  ],
  "Bihar": [
    "Patna",
    "Gaya",
    "Bhagalpur",
    "Muzaffarpur",
    "Purnia",
    "Darbhanga",
    "Bihar Sharif (Nalanda)",
    "Arrah (Bhojpur)",
    "Begusarai",
  ],
  "Rajasthan": [
    "Jaipur",
    "Jodhpur",
    "Udaipur",
    "Kota",
    "Bikaner",
    "Ajmer",
    "Bhilwara",
    "Alwar",
    "Sikar",
  ],
  "Madhya Pradesh": [
    "Bhopal",
    "Indore",
    "Gwalior",
    "Jabalpur",
    "Ujjain",
    "Sagar",
    "Dewas",
    "Satna",
    "Ratlam",
  ],
};

export function getAvailableStates(): string[] {
  return Object.keys(INDIA_STATES_DISTRICTS).sort();
}

export function getDistrictsForState(state: string): string[] {
  if (!state) return [];
  const normalized = state.trim();
  // Exact or case-insensitive match
  const foundKey = Object.keys(INDIA_STATES_DISTRICTS).find(
    (k) => k.toLowerCase() === normalized.toLowerCase()
  );
  if (foundKey) {
    return INDIA_STATES_DISTRICTS[foundKey];
  }
  return [];
}

export function isValidState(state: string): boolean {
  if (!state) return false;
  const s = state.trim().toLowerCase();
  return Object.keys(INDIA_STATES_DISTRICTS).some((k) => k.toLowerCase() === s);
}

export function isValidDistrict(state: string, district: string): boolean {
  if (!state || !district) return false;
  const districts = getDistrictsForState(state);
  const d = district.trim().toLowerCase();
  return districts.some((item) => item.toLowerCase() === d);
}

export function getZoneForState(state: string): string {
  if (!state) return "Central";
  const s = state.trim().toLowerCase();
  if (STATE_MAPPINGS[s]) {
    return STATE_MAPPINGS[s].zone;
  }
  return "Central";
}
