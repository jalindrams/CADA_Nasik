/* ------------------------------------------------------------------
   Prototype configuration + sample cardholder records.

   Context: RFP "Selection of Agency for Smart Card Printing and QR Code
   Based Augmented Mixed Reality Advertising Platform"
   (Transport Commissioner Office / Dharmaveer Anand Dighe Saheb
   Maharashtra Passenger Vehicle Drivers Welfare Board, Ref 3/2026).

   EVERY RECORD BELOW IS FICTITIOUS AND EXISTS ONLY FOR DEMONSTRATION.
------------------------------------------------------------------- */

var ORG = {
  board: "Dharmaveer Anand Dighe Saheb",
  name: "Maharashtra Passenger Vehicle Drivers Welfare Board",
  shortName: "MPVDWB",
  parent: "Transport Commissioner Office, Government of Maharashtra",
  subtitle: "Driver Smart Identity & Welfare Card",
  cardSeries: "MPVDWB / SMART ID / SERIES A",
  helpline: "1800-000-0000 (demo helpline)",
  verifyHost: "verify.mpvdwb.demo",
  rfpRef: "RFP Ref. 3/2026 - Tender ID 2026_TCO_1334840_1"
};

var VEHICLE_TYPES = [
  "Auto Rickshaw", "Taxi (Kaali-Peeli)", "App-based Cab", "School Bus",
  "Tourist Vehicle", "Goods Carrier (LCV)", "Private Bus"
];
var RTO_OFFICES = [
  "MH-04 Thane", "MH-01 Mumbai (Central)", "MH-03 Mumbai (East)",
  "MH-05 Kalyan", "MH-12 Pune", "MH-43 Navi Mumbai", "MH-48 Vasai"
];
var LICENCE_CLASSES = [
  "LMV - Transport", "HMV - Passenger (Transport)", "HGMV - Transport", "MCWG + LMV-TR"
];
var WELFARE_SCHEMES = [
  "Accident insurance cover", "Term life cover", "Children's scholarship",
  "Medical assistance", "Retirement benefit fund"
];

/* Advertising campaigns used by the AR / MR experience (revenue module). */
var AD_CAMPAIGNS = [
  { id: "C-101", brand: "SafeDrive Tyres", headline: "Monsoon tyre check - 20% off",
    body: "Free tread inspection at 140 partner garages across Thane and Mumbai.", colour: "#e8871e",
    cta: "Book a free check" },
  { id: "C-102", brand: "Sahyadri Co-op Bank", headline: "Vehicle loan at 8.4% for card holders",
    body: "Pre-approved offers for drivers holding a valid Welfare Board smart card.", colour: "#0f9b8e",
    cta: "Check eligibility" },
  { id: "C-103", brand: "Arogya Plus Clinics", headline: "Free annual health check-up",
    body: "Welfare Board tie-up: full driver health screening at nil cost.", colour: "#2e78c7",
    cta: "Find nearest clinic" },
  { id: "C-104", brand: "FuelKart", headline: "Re 1 per litre cashback",
    body: "Scan the card at partner pumps to auto-apply the driver cashback.", colour: "#8e44ad",
    cta: "View partner pumps" }
];

/* status: "active" | "suspended" | "revoked"   ("expired" is derived from validTo) */
var SEED_HOLDERS = [
  {
    id: "H001", emergencyNameMr: "सुनीता पवार", standMr: "ठाणे स्टेशन पूर्व स्टँड", nameMr: "रमेश गोपाळ पवार", addressMr: "खोली १२, श्रमिक चाळ, वागळे इस्टेट, ठाणे (प.) ४००६०४", unionMr: "धर्मवीर आनंद दिघे साहेब महाराष्ट्र प्रवासी वाहतूक चालक कल्याणकारी मंडळ", regNo: "MPVDWB/TH/2024/000181", badgeNo: "BDG/TH/44192",
    name: "Ramesh Gopal Pawar", vehicleType: "Auto Rickshaw", vehicleNo: "MH-04 CT 7741",
    rto: "MH-04 Thane", union: "Dharmaveer Anand Dighe Saheb Maharashtra Pravasi Vahatuk Chalak Kalyankari Mandal",
    dob: "1982-04-17", gender: "Male", bloodGroup: "B+", mobile: "+91 98200 11221",
    address: "Room 12, Shramik Chawl, Wagle Estate, Thane (W) 400604",
    licenceNo: "MH04 20190004411", licenceClass: "LMV - Transport", licenceValidTo: "2029-04-16",
    permitNo: "TH/PER/2019/8841", stand: "Thane Station East Stand",
    memberSince: "2015-06-02", issuedOn: "2024-05-12", validTo: "2029-05-11",
    schemes: ["Accident insurance cover", "Term life cover", "Children's scholarship"],
    status: "active", emergencyName: "Sunita Pawar", emergencyPhone: "+91 98200 11890",
    token: "MPV8FQ2M4XD", campaign: "C-101"
  },
  {
    id: "H002", emergencyNameMr: "अनिल देशमुख", standMr: "ॲग्रीगेटर ताफा – ठाणे", nameMr: "संध्या अनिल देशमुख", addressMr: "बी-९, वृंदावन सोसायटी, माजिवडा, ठाणे (प.) ४००६०१", unionMr: "महाराष्ट्र कॅब चालक महासंघ", regNo: "MPVDWB/TH/2024/000342", badgeNo: "BDG/TH/51008",
    name: "Sandhya Anil Deshmukh", vehicleType: "App-based Cab", vehicleNo: "MH-04 EQ 2290",
    rto: "MH-04 Thane", union: "Maharashtra Cab Chalak Mahasangh",
    dob: "1990-11-03", gender: "Female", bloodGroup: "O+", mobile: "+91 99220 43317",
    address: "B-9, Vrindavan Society, Majiwada, Thane (W) 400601",
    licenceNo: "MH04 20160443129", licenceClass: "LMV - Transport", licenceValidTo: "2030-02-11",
    permitNo: "TH/PER/2021/1174", stand: "Aggregator fleet - Thane cluster",
    memberSince: "2018-01-20", issuedOn: "2024-08-01", validTo: "2029-07-31",
    schemes: ["Accident insurance cover", "Medical assistance"],
    status: "active", emergencyName: "Anil Deshmukh", emergencyPhone: "+91 99220 43001",
    token: "MPV5TJ9P1LK", campaign: "C-102"
  },
  {
    id: "H003", emergencyNameMr: "नफीसा शेख", standMr: "सरस्वती विद्यालय मार्ग", nameMr: "इक्बाल हुसेन शेख", addressMr: "घर १८, कोपरी कॉलनी, ठाणे (पू.) ४००६०३", unionMr: "ठाणे स्कूल बस मालक व चालक संघटना", regNo: "MPVDWB/TH/2021/000097", badgeNo: "BDG/TH/33874",
    name: "Iqbal Hussain Shaikh", vehicleType: "School Bus", vehicleNo: "MH-04 GV 1188",
    rto: "MH-04 Thane", union: "Thane School Bus Owners & Drivers Association",
    dob: "1978-02-25", gender: "Male", bloodGroup: "A+", mobile: "+91 94220 77510",
    address: "House 18, Kopri Colony, Thane (E) 400603",
    licenceNo: "MH04 20150887421", licenceClass: "HMV - Passenger (Transport)", licenceValidTo: "2026-10-31",
    permitNo: "TH/PER/2018/5520", stand: "Saraswati Vidyalaya route",
    memberSince: "2012-09-14", issuedOn: "2021-11-01", validTo: "2026-10-05",
    schemes: ["Accident insurance cover", "Children's scholarship"],
    status: "active", emergencyName: "Nafisa Shaikh", emergencyPhone: "+91 94220 77009",
    token: "MPV3WD7Z8QN", campaign: "C-103"
  },
  {
    id: "H004", emergencyNameMr: "सरिता काळे", standMr: "दादर टीटी स्टँड", nameMr: "विलास मनोहर काळे", addressMr: "चाळ ४, खोली २२, लालबाग, मुंबई ४०००१२", unionMr: "मुंबई टॅक्सीमेन्स युनियन", regNo: "MPVDWB/MU/2019/000512", badgeNo: "BDG/MU/21140",
    name: "Vilas Manohar Kale", vehicleType: "Taxi (Kaali-Peeli)", vehicleNo: "MH-01 TA 4416",
    rto: "MH-01 Mumbai (Central)", union: "Mumbai Taximen's Union",
    dob: "1975-07-09", gender: "Male", bloodGroup: "AB+", mobile: "+91 97640 22188",
    address: "Chawl 4, Room 22, Lalbaug, Mumbai 400012",
    licenceNo: "MH01 20130551190", licenceClass: "LMV - Transport", licenceValidTo: "2025-12-31",
    permitNo: "MU/PER/2015/9903", stand: "Dadar TT Stand",
    memberSince: "2009-03-11", issuedOn: "2019-12-01", validTo: "2024-11-30",
    schemes: ["Accident insurance cover"],
    status: "active", emergencyName: "Sarita Kale", emergencyPhone: "+91 97640 22991",
    token: "MPV6KM1V5RB", campaign: "C-101"
  },
  {
    id: "H005", emergencyNameMr: "मंदा जाधव", standMr: "कल्याण पर्यटक थांबा ३", nameMr: "प्रकाश दत्तात्रय जाधव", addressMr: "साई कृपा, खडकपाडा, कल्याण (प.) ४२१३०१", unionMr: "कोकण पर्यटक वाहन चालक संघ", regNo: "MPVDWB/KL/2023/000226", badgeNo: "BDG/KL/47523",
    name: "Prakash Dattatray Jadhav", vehicleType: "Tourist Vehicle", vehicleNo: "MH-05 BH 9032",
    rto: "MH-05 Kalyan", union: "Konkan Tourist Vehicle Chalak Sangh",
    dob: "1986-01-30", gender: "Male", bloodGroup: "B-", mobile: "+91 90110 65402",
    address: "Sai Krupa, Khadakpada, Kalyan (W) 421301",
    licenceNo: "MH05 20170443298", licenceClass: "HMV - Passenger (Transport)", licenceValidTo: "2027-08-20",
    permitNo: "KL/PER/2020/3318", stand: "Kalyan Tourist Bay 3",
    memberSince: "2016-07-05", issuedOn: "2023-09-15", validTo: "2028-09-14",
    schemes: ["Accident insurance cover", "Retirement benefit fund"],
    status: "suspended", suspendReason: "Card reported lost on 02-Sep-2026 - replacement under issue (demo record)",
    emergencyName: "Manda Jadhav", emergencyPhone: "+91 90110 65777",
    token: "MPV2NH4C7YT", campaign: "C-104"
  },
  {
    id: "H006", emergencyNameMr: "सुभाष पाटील", standMr: "ॲग्रीगेटर ताफा – वाशी", nameMr: "आरती सुभाष पाटील", addressMr: "प्लॉट २१, सेक्टर १४, वाशी, नवी मुंबई ४००७०३", unionMr: "महाराष्ट्र महिला चालक संघटना", regNo: "MPVDWB/NM/2025/000073", badgeNo: "BDG/NM/60219",
    name: "Aarti Subhash Patil", vehicleType: "App-based Cab", vehicleNo: "MH-43 CJ 5507",
    rto: "MH-43 Navi Mumbai", union: "Maharashtra Mahila Chalak Sanghatana",
    dob: "1993-06-12", gender: "Female", bloodGroup: "O-", mobile: "+91 93710 88245",
    address: "Plot 21, Sector 14, Vashi, Navi Mumbai 400703",
    licenceNo: "MH43 20180229004", licenceClass: "LMV - Transport", licenceValidTo: "2029-11-05",
    permitNo: "NM/PER/2022/7741", stand: "Aggregator fleet - Vashi cluster",
    memberSince: "2020-02-19", issuedOn: "2025-03-01", validTo: "2030-02-28",
    schemes: ["Accident insurance cover", "Medical assistance", "Term life cover"],
    status: "active", emergencyName: "Subhash Patil", emergencyPhone: "+91 93710 88001",
    token: "MPV9XB6L3GA", campaign: "C-103"
  },
  {
    id: "H007", emergencyNameMr: "रेखा सावंत", standMr: "कासारवडवली वाहतूक नगर", nameMr: "नितीन भास्कर सावंत", addressMr: "घोडबंदर रोड, कासारवडवली, ठाणे (प.) ४००६१५", unionMr: "ठाणे मालवाहतूक चालक संघ", regNo: "MPVDWB/TH/2025/000904", badgeNo: "BDG/TH/61887",
    name: "Nitin Bhaskar Sawant", vehicleType: "Goods Carrier (LCV)", vehicleNo: "MH-04 JK 2214",
    rto: "MH-04 Thane", union: "Thane Goods Transport Chalak Sangh",
    dob: "1988-09-21", gender: "Male", bloodGroup: "A-", mobile: "+91 98670 30452",
    address: "Ghodbunder Road, Kasarvadavali, Thane (W) 400615",
    licenceNo: "MH04 20160338721", licenceClass: "HGMV - Transport", licenceValidTo: "2028-03-14",
    permitNo: "TH/PER/2023/4402", stand: "Kasarvadavali transport nagar",
    memberSince: "2017-11-26", issuedOn: "2025-06-10", validTo: "2030-06-09",
    schemes: ["Accident insurance cover", "Retirement benefit fund"],
    status: "active", emergencyName: "Rekha Sawant", emergencyPhone: "+91 98670 30990",
    token: "MPV4PG8R2WC", campaign: "C-104"
  },
  {
    id: "H008", emergencyNameMr: "वैशाली मोरे", standMr: "ठाणे – पुणे शटल सेवा", nameMr: "किरण लक्ष्मण मोरे", addressMr: "बी-४०२, सह्याद्री रेसिडेन्सी, पाचपाखाडी, ठाणे (प.) ४००६०२", unionMr: "ठाणे खासगी बस चालक संघटना", regNo: "MPVDWB/TH/2026/001120", badgeNo: "BDG/TH/64410",
    name: "Kiran Laxman More", vehicleType: "Private Bus", vehicleNo: "MH-04 FT 8890",
    rto: "MH-04 Thane", union: "Thane Private Bus Operators Association",
    dob: "1980-12-05", gender: "Male", bloodGroup: "B+", mobile: "+91 95520 17743",
    address: "B-402, Sahyadri Residency, Panchpakhadi, Thane (W) 400602",
    licenceNo: "MH04 20140229910", licenceClass: "HMV - Passenger (Transport)", licenceValidTo: "2029-01-09",
    permitNo: "TH/PER/2024/1902", stand: "Thane - Pune shuttle service",
    memberSince: "2011-04-03", issuedOn: "2026-02-18", validTo: "2031-02-17",
    schemes: ["Accident insurance cover", "Term life cover", "Medical assistance"],
    status: "active", emergencyName: "Vaishali More", emergencyPhone: "+91 95520 17009",
    token: "MPV7DQ5S9FE", campaign: "C-102"
  }
];

/* Documents shown on the digital profile (same set for every demo holder). */
var DEMO_DOCUMENTS = [
  { icon: "DL", label: "Driving licence", meta: "Verified against RTO record (simulated)" },
  { icon: "BD", label: "Badge / driver authorisation", meta: "Verified by RTO Thane" },
  { icon: "PM", label: "Vehicle permit & fitness", meta: "Valid - next review on renewal" },
  { icon: "MD", label: "Medical fitness certificate", meta: "Valid - annual review" },
  { icon: "WF", label: "Welfare Board membership record", meta: "Active member, contributions up to date" }
];

/* AR / MR overlay panels shown after a card scan. */
var AR_PANELS = [
  { title: "Identity overlay", body: "Name, registration number and live card status float beside the physical card." },
  { title: "Welfare entitlements", body: "Active schemes, claim status and helpline, read straight off the card." },
  { title: "Vehicle & permit", body: "Vehicle number, permit validity and RTO of registration." },
  { title: "Sponsored panel", body: "The monetisable slot - brand campaign served against this card series." }
];
