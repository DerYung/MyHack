/**
 * Seed script for MyHack Firestore — matches firestore.ts schema (snake_case).
 * Run: node scripts/seedFirestore.mjs
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: "AIzaSyDdafH8AVJVA88FaGMAKtidLocw4Vay_5M",
  authDomain: "myhack-bf3ce.firebaseapp.com",
  projectId: "myhack-bf3ce",
  storageBucket: "myhack-bf3ce.firebasestorage.app",
  messagingSenderId: "492465016781",
  appId: "1:492465016781:web:81929fe5004ca2d954fe84",
});
const db = getFirestore(app, 'myhack');

const companies = [
  { uid:'co-001',name:'EcoTrack',description:'AI carbon footprint tracking for SMEs.',sector:'CleanTech',stage:'Seed',region:'Malaysia',budget_needed:250000,budget_breakdown:'Product $100k, Marketing $80k, Ops $70k',market_goals:'Reduce SME carbon by 30% in SEA',status:'ready',ai_score:87,mentor_uid:'m-001' },
  { uid:'co-002',name:'HealthAI',description:'ML-powered personalized nutrition platform.',sector:'HealthTech',stage:'Idea',region:'Malaysia',budget_needed:150000,budget_breakdown:'R&D $90k, Team $40k, Infra $20k',market_goals:'500K users in 2 years',status:'mentoring',ai_score:72,mentor_uid:'m-002' },
  { uid:'co-003',name:'EduConnect',description:'Peer-to-peer global learning marketplace.',sector:'EdTech',stage:'Series A',region:'Singapore',budget_needed:500000,budget_breakdown:'Scaling $200k, Marketing $150k, Content $100k, Ops $50k',market_goals:'1M monthly active learners',status:'ready',ai_score:91,mentor_uid:'m-003' },
  { uid:'co-004',name:'FinFlow',description:'Cash flow prediction for SMEs — 90 day forecast.',sector:'FinTech',stage:'Seed',region:'Malaysia',budget_needed:300000,budget_breakdown:'Engineering $150k, Sales $80k, Compliance $70k',market_goals:'10K SME subscribers',status:'submitted',ai_score:79,mentor_uid:null },
  { uid:'co-005',name:'AgriSense',description:'IoT + satellite precision agriculture for smallholders.',sector:'AgriTech',stage:'Seed',region:'Indonesia',budget_needed:400000,budget_breakdown:'Hardware $150k, Software $120k, Field $130k',market_goals:'Cover 50K hectares',status:'mentoring',ai_score:83,mentor_uid:'m-004' },
  { uid:'co-006',name:'LegalBot',description:'AI contract review — 80% cost reduction for startups.',sector:'LegalTech',stage:'Idea',region:'Malaysia',budget_needed:200000,budget_breakdown:'AI training $80k, Legal $60k, Product $60k',market_goals:'Automate 10K contracts/month',status:'submitted',ai_score:68,mentor_uid:null },
  { uid:'co-007',name:'BuildRight',description:'Construction AI detecting delays before they happen.',sector:'PropTech',stage:'Series A',region:'Malaysia',budget_needed:600000,budget_breakdown:'Engineering $250k, Sales $200k, CS $150k',market_goals:'500 enterprise clients',status:'funded',ai_score:88,mentor_uid:'m-005' },
  { uid:'co-008',name:'NutriChain',description:'Blockchain food traceability — farm to fork.',sector:'FoodTech',stage:'Seed',region:'Thailand',budget_needed:350000,budget_breakdown:'Blockchain $120k, Onboarding $100k, Marketing $130k',market_goals:'Partner with 200 farms',status:'mentoring',ai_score:74,mentor_uid:'m-006' },
  { uid:'co-009',name:'TravelMind',description:'AI travel planner with personality-based itineraries.',sector:'TravelTech',stage:'Idea',region:'Malaysia',budget_needed:180000,budget_breakdown:'AI $70k, Partnerships $60k, Design $50k',market_goals:'100K trip plans generated',status:'submitted',ai_score:65,mentor_uid:null },
  { uid:'co-010',name:'CyberGuard',description:'Behavioral AI cybersecurity for SMEs at 1/10th cost.',sector:'CyberSec',stage:'Series A',region:'Singapore',budget_needed:450000,budget_breakdown:'Engineering $200k, Research $100k, Sales $150k',market_goals:'Protect 5K businesses',status:'ready',ai_score:92,mentor_uid:'m-007' },
  { uid:'co-011',name:'MoodMetrics',description:'Corporate mental wellness via sentiment analysis.',sector:'HRTech',stage:'Pre-seed',region:'Malaysia',budget_needed:220000,budget_breakdown:'AI $90k, Sales $80k, Compliance $50k',market_goals:'50 enterprise deployments',status:'submitted',ai_score:77,mentor_uid:null },
  { uid:'co-012',name:'SolarGrid',description:'P2P renewable energy trading via smart contracts.',sector:'CleanTech',stage:'Series B+',region:'Malaysia',budget_needed:1200000,budget_breakdown:'Grid $500k, Regulatory $200k, Marketing $300k, Ops $200k',market_goals:'Power 10K households',status:'funded',ai_score:95,mentor_uid:'m-001' },
];

const mentors = [
  { uid:'m-001',name:'Sarah Chen',email:'sarah@eco.vc',industries:['CleanTech','GreenTech','Energy'],expertise:['Product Development','Go-to-Market','Sustainability'],region:'Singapore',max_capacity:5,active_count:2,bio:'Ex-VP Product at Tesla Energy. 23+ cleantech startups scaled.',years_experience:15,startups_helped:23,avg_outcome_rating:4.7 },
  { uid:'m-002',name:'Dr. James Wilson',email:'james@healthai.co',industries:['HealthTech','BioTech','MedTech'],expertise:['Healthcare AI','FDA Regulatory','Clinical Trials'],region:'Malaysia',max_capacity:4,active_count:1,bio:'Harvard MD, 3x healthcare AI founder.',years_experience:12,startups_helped:18,avg_outcome_rating:4.5 },
  { uid:'m-003',name:'Maria Rodriguez',email:'maria@edufund.co',industries:['EdTech','E-Learning','SaaS'],expertise:['EdTech Growth','User Acquisition','Community'],region:'Singapore',max_capacity:6,active_count:3,bio:'2 EdTech exits ($80M combined). UNESCO advisor.',years_experience:10,startups_helped:31,avg_outcome_rating:4.8 },
  { uid:'m-004',name:'Raj Patel',email:'raj@agri.io',industries:['AgriTech','IoT','Supply Chain','CleanTech'],expertise:['IoT','Rural Markets','Hardware-Software'],region:'India',max_capacity:4,active_count:1,bio:'Ex-Bosch IoT. Serves 2M+ smallholder farmers.',years_experience:14,startups_helped:19,avg_outcome_rating:4.3 },
  { uid:'m-005',name:'David Ng',email:'david@proptech.sg',industries:['PropTech','B2B SaaS','Construction'],expertise:['Enterprise Sales','PropTech','B2B GTM'],region:'Malaysia',max_capacity:3,active_count:2,bio:'Former CTO of $400M PropTech unicorn.',years_experience:16,startups_helped:14,avg_outcome_rating:4.6 },
  { uid:'m-006',name:'Priya Sharma',email:'priya@supply.co',industries:['FoodTech','Retail','Supply Chain'],expertise:['Supply Chain','Blockchain','FMCG'],region:'India',max_capacity:5,active_count:2,bio:'8 years leading supply chain innovation at Unilever Asia.',years_experience:11,startups_helped:22,avg_outcome_rating:4.4 },
  { uid:'m-007',name:'Alex Kim',email:'alex@cyber.io',industries:['CyberSec','Enterprise','Government'],expertise:['Cybersecurity','Zero Trust','Government Sales'],region:'Singapore',max_capacity:3,active_count:1,bio:'Ex-NSA analyst. Founded threat intel co acquired by Palo Alto.',years_experience:18,startups_helped:12,avg_outcome_rating:4.9 },
  { uid:'m-008',name:'Linda Tan',email:'linda@finreg.sg',industries:['FinTech','Banking','Payments','InsurTech'],expertise:['FinTech Regulation','Banking Partnerships','Licensing'],region:'Singapore',max_capacity:6,active_count:4,bio:'Former MAS regulatory advisor. 40+ FinTech licenses across 8 markets.',years_experience:13,startups_helped:40,avg_outcome_rating:4.2 },
  { uid:'m-009',name:'Carlos Mendez',email:'carlos@deep.vc',industries:['DeepTech','Hardware','Robotics'],expertise:['Deep Tech','Manufacturing','Series A Fundraising'],region:'USA',max_capacity:3,active_count:1,bio:'MIT PhD robotics. Raised $150M+ for hardware startups.',years_experience:20,startups_helped:9,avg_outcome_rating:4.8 },
  { uid:'m-010',name:'Aisha Ibrahim',email:'aisha@hrtech.my',industries:['HRTech','Enterprise SaaS','Wellness'],expertise:['HR Tech','Future of Work','Enterprise Wellness'],region:'Malaysia',max_capacity:4,active_count:2,bio:'Former Fortune 500 CHRO. HR tech enterprise advisor.',years_experience:9,startups_helped:16,avg_outcome_rating:4.1 },
  { uid:'m-011',name:'Tom Harrison',email:'tom@travel.co',industries:['TravelTech','Marketplace','Hospitality'],expertise:['Marketplace Growth','International Expansion','B2C'],region:'Australia',max_capacity:5,active_count:1,bio:'Early Airbnb APAC employee. 0 to 5M MAU.',years_experience:12,startups_helped:27,avg_outcome_rating:4.5 },
];

const funders = [
  { uid:'f-001',name:'GreenVentures Capital',email:'deals@greenvc.com',investment_focus:['CleanTech','GreenTech','Energy'],stage_interest:['Seed','Series A','Series B+'],min_investment:100000,max_investment:2000000,region:'Singapore',bio:'Climate VC, $500M AUM, 3 unicorns.',portfolio:['SolarGrid','EcoTrack'],successful_investments:47 },
  { uid:'f-002',name:'HealthFirst Angels',email:'apply@healthfirst.co',investment_focus:['HealthTech','BioTech','Wellness'],stage_interest:['Idea','Pre-seed','Seed'],min_investment:50000,max_investment:500000,region:'Malaysia',bio:'30+ healthcare exec angel network.',portfolio:[],successful_investments:28 },
  { uid:'f-003',name:'EduFund Ventures',email:'pitch@edufund.vc',investment_focus:['EdTech','E-Learning','HRTech'],stage_interest:['Series A','Series B+'],min_investment:250000,max_investment:5000000,region:'Singapore',bio:'Dedicated EdTech VC. University endowment LPs.',portfolio:['EduConnect'],successful_investments:62 },
  { uid:'f-004',name:'TechCorp Innovation Fund',email:'cvc@techcorp.com',investment_focus:['AI','SaaS','CyberSec','HRTech'],stage_interest:['Seed','Series A','Series B+'],min_investment:200000,max_investment:3000000,region:'USA',bio:'Nasdaq CVC. 50K+ SME distribution network.',portfolio:[],successful_investments:35 },
  { uid:'f-005',name:'Impact Seed Fund',email:'hello@impactseed.org',investment_focus:['CleanTech','HealthTech','EdTech','AgriTech','FoodTech'],stage_interest:['Idea','Pre-seed'],min_investment:75000,max_investment:300000,region:'Malaysia',bio:'Early-stage impact fund. Non-dilutive options available.',portfolio:[],successful_investments:41 },
  { uid:'f-006',name:'SEA Fintech Partners',email:'invest@seafp.vc',investment_focus:['FinTech','Banking','Payments','InsurTech'],stage_interest:['Seed','Series A','Series B+'],min_investment:150000,max_investment:4000000,region:'Singapore',bio:'Specialized FinTech VC across 8 SEA markets.',portfolio:[],successful_investments:53 },
  { uid:'f-007',name:'Agri Innovation Ventures',email:'apply@agrivc.com',investment_focus:['AgriTech','FoodTech','CleanTech','Supply Chain'],stage_interest:['Idea','Pre-seed','Seed'],min_investment:100000,max_investment:1500000,region:'Singapore',bio:'Temasek & World Bank IFC partner. Sustainable food systems.',portfolio:['AgriSense'],successful_investments:38 },
  { uid:'f-008',name:'PropSeed Capital',email:'deals@propseed.co',investment_focus:['PropTech','Construction','Real Estate'],stage_interest:['Seed','Series A'],min_investment:80000,max_investment:600000,region:'Malaysia',bio:'20 property developer angels. Direct project pipeline access.',portfolio:['BuildRight'],successful_investments:19 },
  { uid:'f-009',name:'CyberShield Fund',email:'pitch@cybershield.vc',investment_focus:['CyberSec','Enterprise','DeepTech'],stage_interest:['Series A','Series B+'],min_investment:300000,max_investment:5000000,region:'USA',bio:'Cybersec VC. Former intel chiefs & Fortune 100 CISOs.',portfolio:['CyberGuard'],successful_investments:24 },
  { uid:'f-010',name:'MDEC Digital Grant',email:'grants@mdec.gov.my',investment_focus:['AI','SaaS','FinTech','HealthTech','EdTech','CleanTech'],stage_interest:['Idea','Pre-seed'],min_investment:50000,max_investment:200000,region:'Malaysia',bio:'Non-dilutive gov grant. Milestone-based disbursement.',portfolio:[],successful_investments:200 },
  { uid:'f-011',name:'Deep Asia Ventures',email:'lp@deepasia.vc',investment_focus:['DeepTech','AI','Robotics','Hardware','CleanTech'],stage_interest:['Seed','Series A','Series B+'],min_investment:500000,max_investment:8000000,region:'Singapore',bio:'Sovereign-backed deep tech fund. 10-year horizons.',portfolio:['SolarGrid'],successful_investments:31 },
];

async function seed(name, docs) {
  console.log(`\n📦 Seeding "${name}" (${docs.length})...`);
  for (const d of docs) {
    await setDoc(doc(collection(db, name), d.uid), { ...d, created_at: Date.now(), updated_at: Date.now() });
    console.log(`  ✅ ${d.name}`);
  }
}

async function main() {
  console.log('🌱 MyHack Seed Script (snake_case schema)');
  try {
    await seed('companies', companies);
    await seed('mentors', mentors);
    await seed('funders', funders);
    console.log('\n🎉 Done!');
  } catch (e) { console.error('❌', e.message); process.exit(1); }
  process.exit(0);
}
main();
