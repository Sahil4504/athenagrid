// Dummy marketplace data: US cities (≈3 per state) + a realistic farm-input catalog
// modelled on FBN's categories. Coordinates are approximate (used only for distance
// ranking). Product images come from a keyword image service, with a UI fallback.

export type City = { c: string; s: string; lat: number; lng: number };

export const US_CITIES: City[] = [
  { c: 'Birmingham', s: 'AL', lat: 33.5186, lng: -86.8104 }, { c: 'Montgomery', s: 'AL', lat: 32.3668, lng: -86.3 }, { c: 'Huntsville', s: 'AL', lat: 34.7304, lng: -86.5861 },
  { c: 'Anchorage', s: 'AK', lat: 61.2181, lng: -149.9003 }, { c: 'Fairbanks', s: 'AK', lat: 64.8378, lng: -147.7164 }, { c: 'Juneau', s: 'AK', lat: 58.3019, lng: -134.4197 },
  { c: 'Phoenix', s: 'AZ', lat: 33.4484, lng: -112.074 }, { c: 'Tucson', s: 'AZ', lat: 32.2226, lng: -110.9747 }, { c: 'Yuma', s: 'AZ', lat: 32.6927, lng: -114.6277 },
  { c: 'Little Rock', s: 'AR', lat: 34.7465, lng: -92.2896 }, { c: 'Fayetteville', s: 'AR', lat: 36.0626, lng: -94.1574 }, { c: 'Jonesboro', s: 'AR', lat: 35.8423, lng: -90.7043 },
  { c: 'Fresno', s: 'CA', lat: 36.7378, lng: -119.7871 }, { c: 'Salinas', s: 'CA', lat: 36.6777, lng: -121.6555 }, { c: 'Bakersfield', s: 'CA', lat: 35.3733, lng: -119.0187 }, { c: 'Sacramento', s: 'CA', lat: 38.5816, lng: -121.4944 },
  { c: 'Denver', s: 'CO', lat: 39.7392, lng: -104.9903 }, { c: 'Greeley', s: 'CO', lat: 40.4233, lng: -104.7091 }, { c: 'Pueblo', s: 'CO', lat: 38.2544, lng: -104.6091 },
  { c: 'Hartford', s: 'CT', lat: 41.7658, lng: -72.6734 }, { c: 'New Haven', s: 'CT', lat: 41.3083, lng: -72.9279 }, { c: 'Storrs', s: 'CT', lat: 41.8084, lng: -72.2495 },
  { c: 'Dover', s: 'DE', lat: 39.1582, lng: -75.5244 }, { c: 'Wilmington', s: 'DE', lat: 39.7391, lng: -75.5398 }, { c: 'Georgetown', s: 'DE', lat: 38.69, lng: -75.3855 },
  { c: 'Orlando', s: 'FL', lat: 28.5383, lng: -81.3792 }, { c: 'Gainesville', s: 'FL', lat: 29.6516, lng: -82.3248 }, { c: 'Immokalee', s: 'FL', lat: 26.4187, lng: -81.4176 },
  { c: 'Atlanta', s: 'GA', lat: 33.749, lng: -84.388 }, { c: 'Tifton', s: 'GA', lat: 31.4505, lng: -83.5085 }, { c: 'Macon', s: 'GA', lat: 32.8407, lng: -83.6324 },
  { c: 'Honolulu', s: 'HI', lat: 21.3069, lng: -157.8583 }, { c: 'Hilo', s: 'HI', lat: 19.7071, lng: -155.0885 }, { c: 'Kahului', s: 'HI', lat: 20.8893, lng: -156.4729 },
  { c: 'Boise', s: 'ID', lat: 43.615, lng: -116.2023 }, { c: 'Idaho Falls', s: 'ID', lat: 43.4917, lng: -112.033 }, { c: 'Twin Falls', s: 'ID', lat: 42.5558, lng: -114.4701 },
  { c: 'Springfield', s: 'IL', lat: 39.7817, lng: -89.6501 }, { c: 'Champaign', s: 'IL', lat: 40.1164, lng: -88.2434 }, { c: 'Bloomington', s: 'IL', lat: 40.4842, lng: -88.9937 },
  { c: 'Indianapolis', s: 'IN', lat: 39.7684, lng: -86.1581 }, { c: 'Lafayette', s: 'IN', lat: 40.4167, lng: -86.8753 }, { c: 'Fort Wayne', s: 'IN', lat: 41.0793, lng: -85.1394 },
  { c: 'Des Moines', s: 'IA', lat: 41.5868, lng: -93.625 }, { c: 'Ames', s: 'IA', lat: 42.0308, lng: -93.6319 }, { c: 'Cedar Rapids', s: 'IA', lat: 41.9779, lng: -91.6656 },
  { c: 'Wichita', s: 'KS', lat: 37.6872, lng: -97.3301 }, { c: 'Salina', s: 'KS', lat: 38.8403, lng: -97.6114 }, { c: 'Garden City', s: 'KS', lat: 37.9717, lng: -100.8727 },
  { c: 'Louisville', s: 'KY', lat: 38.2527, lng: -85.7585 }, { c: 'Lexington', s: 'KY', lat: 38.0406, lng: -84.5037 }, { c: 'Bowling Green', s: 'KY', lat: 36.9685, lng: -86.4808 },
  { c: 'Baton Rouge', s: 'LA', lat: 30.4515, lng: -91.1871 }, { c: 'Lafayette', s: 'LA', lat: 30.2241, lng: -92.0198 }, { c: 'Monroe', s: 'LA', lat: 32.5093, lng: -92.1193 },
  { c: 'Portland', s: 'ME', lat: 43.6591, lng: -70.2568 }, { c: 'Bangor', s: 'ME', lat: 44.8012, lng: -68.7778 }, { c: 'Presque Isle', s: 'ME', lat: 46.6812, lng: -68.0159 },
  { c: 'Baltimore', s: 'MD', lat: 39.2904, lng: -76.6122 }, { c: 'Salisbury', s: 'MD', lat: 38.3607, lng: -75.5994 }, { c: 'Frederick', s: 'MD', lat: 39.4143, lng: -77.4105 },
  { c: 'Worcester', s: 'MA', lat: 42.2626, lng: -71.8023 }, { c: 'Amherst', s: 'MA', lat: 42.3732, lng: -72.5199 }, { c: 'Springfield', s: 'MA', lat: 42.1015, lng: -72.5898 },
  { c: 'Lansing', s: 'MI', lat: 42.7325, lng: -84.5555 }, { c: 'Saginaw', s: 'MI', lat: 43.4195, lng: -83.9508 }, { c: 'Grand Rapids', s: 'MI', lat: 42.9634, lng: -85.6681 },
  { c: 'Rochester', s: 'MN', lat: 44.0121, lng: -92.4802 }, { c: 'Mankato', s: 'MN', lat: 44.1636, lng: -93.9994 }, { c: 'Willmar', s: 'MN', lat: 45.1219, lng: -95.0433 },
  { c: 'Jackson', s: 'MS', lat: 32.2988, lng: -90.1848 }, { c: 'Greenville', s: 'MS', lat: 33.41, lng: -91.0618 }, { c: 'Tupelo', s: 'MS', lat: 34.2576, lng: -88.7034 },
  { c: 'Columbia', s: 'MO', lat: 38.9517, lng: -92.3341 }, { c: 'Springfield', s: 'MO', lat: 37.2089, lng: -93.2923 }, { c: 'St. Joseph', s: 'MO', lat: 39.7675, lng: -94.8467 },
  { c: 'Billings', s: 'MT', lat: 45.7833, lng: -108.5007 }, { c: 'Great Falls', s: 'MT', lat: 47.5053, lng: -111.3008 }, { c: 'Bozeman', s: 'MT', lat: 45.677, lng: -111.0429 },
  { c: 'Lincoln', s: 'NE', lat: 40.8136, lng: -96.7026 }, { c: 'Grand Island', s: 'NE', lat: 40.9264, lng: -98.342 }, { c: 'Kearney', s: 'NE', lat: 40.6994, lng: -99.0817 },
  { c: 'Reno', s: 'NV', lat: 39.5296, lng: -119.8138 }, { c: 'Las Vegas', s: 'NV', lat: 36.1699, lng: -115.1398 }, { c: 'Elko', s: 'NV', lat: 40.8324, lng: -115.7631 },
  { c: 'Concord', s: 'NH', lat: 43.2081, lng: -71.5376 }, { c: 'Manchester', s: 'NH', lat: 42.9956, lng: -71.4548 }, { c: 'Keene', s: 'NH', lat: 42.9337, lng: -72.2781 },
  { c: 'Trenton', s: 'NJ', lat: 40.2171, lng: -74.7429 }, { c: 'Vineland', s: 'NJ', lat: 39.4864, lng: -75.0257 }, { c: 'New Brunswick', s: 'NJ', lat: 40.4862, lng: -74.4518 },
  { c: 'Albuquerque', s: 'NM', lat: 35.0844, lng: -106.6504 }, { c: 'Las Cruces', s: 'NM', lat: 32.3199, lng: -106.7637 }, { c: 'Roswell', s: 'NM', lat: 33.3943, lng: -104.523 },
  { c: 'Syracuse', s: 'NY', lat: 43.0481, lng: -76.1474 }, { c: 'Rochester', s: 'NY', lat: 43.1566, lng: -77.6088 }, { c: 'Batavia', s: 'NY', lat: 42.9981, lng: -78.1875 },
  { c: 'Raleigh', s: 'NC', lat: 35.7796, lng: -78.6382 }, { c: 'Greenville', s: 'NC', lat: 35.6127, lng: -77.3664 }, { c: 'Charlotte', s: 'NC', lat: 35.2271, lng: -80.8431 },
  { c: 'Fargo', s: 'ND', lat: 46.8772, lng: -96.7898 }, { c: 'Bismarck', s: 'ND', lat: 46.8083, lng: -100.7837 }, { c: 'Grand Forks', s: 'ND', lat: 47.9253, lng: -97.0329 },
  { c: 'Columbus', s: 'OH', lat: 39.9612, lng: -82.9988 }, { c: 'Dayton', s: 'OH', lat: 39.7589, lng: -84.1916 }, { c: 'Toledo', s: 'OH', lat: 41.6528, lng: -83.5379 },
  { c: 'Oklahoma City', s: 'OK', lat: 35.4676, lng: -97.5164 }, { c: 'Tulsa', s: 'OK', lat: 36.154, lng: -95.9928 }, { c: 'Enid', s: 'OK', lat: 36.3956, lng: -97.8784 },
  { c: 'Salem', s: 'OR', lat: 44.9429, lng: -123.0351 }, { c: 'Pendleton', s: 'OR', lat: 45.6721, lng: -118.7886 }, { c: 'Medford', s: 'OR', lat: 42.3265, lng: -122.8756 },
  { c: 'Harrisburg', s: 'PA', lat: 40.2732, lng: -76.8867 }, { c: 'Lancaster', s: 'PA', lat: 40.0379, lng: -76.3055 }, { c: 'State College', s: 'PA', lat: 40.7934, lng: -77.86 },
  { c: 'Providence', s: 'RI', lat: 41.824, lng: -71.4128 }, { c: 'Warwick', s: 'RI', lat: 41.7001, lng: -71.4162 }, { c: 'Kingston', s: 'RI', lat: 41.4801, lng: -71.5228 },
  { c: 'Columbia', s: 'SC', lat: 34.0007, lng: -81.0348 }, { c: 'Florence', s: 'SC', lat: 34.1954, lng: -79.7626 }, { c: 'Greenville', s: 'SC', lat: 34.8526, lng: -82.394 },
  { c: 'Sioux Falls', s: 'SD', lat: 43.5446, lng: -96.7311 }, { c: 'Brookings', s: 'SD', lat: 44.3114, lng: -96.7984 }, { c: 'Aberdeen', s: 'SD', lat: 45.4647, lng: -98.4865 },
  { c: 'Nashville', s: 'TN', lat: 36.1627, lng: -86.7816 }, { c: 'Jackson', s: 'TN', lat: 35.6145, lng: -88.8139 }, { c: 'Knoxville', s: 'TN', lat: 35.9606, lng: -83.9207 },
  { c: 'Lubbock', s: 'TX', lat: 33.5779, lng: -101.8552 }, { c: 'Amarillo', s: 'TX', lat: 35.222, lng: -101.8313 }, { c: 'College Station', s: 'TX', lat: 30.628, lng: -96.3344 }, { c: 'Weslaco', s: 'TX', lat: 26.1595, lng: -97.9908 },
  { c: 'Salt Lake City', s: 'UT', lat: 40.7608, lng: -111.891 }, { c: 'Logan', s: 'UT', lat: 41.7355, lng: -111.8344 }, { c: 'St. George', s: 'UT', lat: 37.0965, lng: -113.5684 },
  { c: 'Burlington', s: 'VT', lat: 44.4759, lng: -73.2121 }, { c: 'Montpelier', s: 'VT', lat: 44.2601, lng: -72.5754 }, { c: 'Rutland', s: 'VT', lat: 43.6106, lng: -72.9726 },
  { c: 'Richmond', s: 'VA', lat: 37.5407, lng: -77.436 }, { c: 'Blacksburg', s: 'VA', lat: 37.2296, lng: -80.4139 }, { c: 'Harrisonburg', s: 'VA', lat: 38.4496, lng: -78.8689 },
  { c: 'Yakima', s: 'WA', lat: 46.6021, lng: -120.5059 }, { c: 'Spokane', s: 'WA', lat: 47.6588, lng: -117.426 }, { c: 'Walla Walla', s: 'WA', lat: 46.0646, lng: -118.343 },
  { c: 'Charleston', s: 'WV', lat: 38.3498, lng: -81.6326 }, { c: 'Morgantown', s: 'WV', lat: 39.6295, lng: -79.9559 }, { c: 'Martinsburg', s: 'WV', lat: 39.4562, lng: -77.9639 },
  { c: 'Madison', s: 'WI', lat: 43.0731, lng: -89.4012 }, { c: 'Green Bay', s: 'WI', lat: 44.5133, lng: -88.0133 }, { c: 'Eau Claire', s: 'WI', lat: 44.8113, lng: -91.4985 },
  { c: 'Cheyenne', s: 'WY', lat: 41.14, lng: -104.8202 }, { c: 'Casper', s: 'WY', lat: 42.8666, lng: -106.3131 }, { c: 'Laramie', s: 'WY', lat: 41.3114, lng: -105.5911 },
];

export type Product = {
  name: string; brand: string; category: 'SEEDS' | 'PESTICIDES' | 'FERTILIZER' | 'TOOLS';
  unit: string; price: number; weight: number; img: string;
};

const IMG = (kw: string) => `https://loremflickr.com/320/240/${kw}`;

export const PRODUCTS: Product[] = [
  // Seed & seed treatment
  { name: 'DKC62-08 Corn Seed', brand: 'DEKALB', category: 'SEEDS', unit: 'bag (80k)', price: 265, weight: 22, img: IMG('corn,seed') },
  { name: 'P22T09 Soybean Seed', brand: 'Pioneer', category: 'SEEDS', unit: 'bag', price: 62, weight: 25, img: IMG('soybean,field') },
  { name: 'SG-800 Sorghum Hybrid', brand: 'Seitec', category: 'SEEDS', unit: 'bag', price: 48, weight: 20, img: IMG('sorghum,grain') },
  { name: 'Premium Alfalfa Blend', brand: 'FBN', category: 'SEEDS', unit: 'bag', price: 210, weight: 25, img: IMG('alfalfa,hay') },
  { name: 'Winter Wheat Seed', brand: 'AgriPro', category: 'SEEDS', unit: 'bag', price: 22, weight: 27, img: IMG('wheat,seed') },
  // Crop protection
  { name: 'Roundup PowerMAX 3', brand: 'Bayer', category: 'PESTICIDES', unit: '2.5 gal jug', price: 125, weight: 11, img: IMG('herbicide,sprayer') },
  { name: 'Atrazine 4L', brand: 'Generic', category: 'PESTICIDES', unit: '2.5 gal jug', price: 42, weight: 11, img: IMG('cornfield,spray') },
  { name: 'Warrior II Insecticide', brand: 'Syngenta', category: 'PESTICIDES', unit: 'gallon', price: 185, weight: 4, img: IMG('insecticide,crop') },
  { name: 'Headline AMP Fungicide', brand: 'BASF', category: 'PESTICIDES', unit: '2.5 gal jug', price: 305, weight: 11, img: IMG('fungicide,farm') },
  { name: 'Prowl H2O Herbicide', brand: 'BASF', category: 'PESTICIDES', unit: '2.5 gal jug', price: 68, weight: 11, img: IMG('herbicide,field') },
  { name: 'Class Act Adjuvant', brand: 'WinField', category: 'PESTICIDES', unit: '2.5 gallon', price: 35, weight: 11, img: IMG('agriculture,sprayer') },
  // Crop nutrition / fertilizer
  { name: 'Urea 46-0-0', brand: 'FBN', category: 'FERTILIZER', unit: '50 lb bag', price: 28, weight: 23, img: IMG('fertilizer,granules') },
  { name: '10-34-0 Liquid Starter', brand: 'FBN', category: 'FERTILIZER', unit: 'gallon', price: 6, weight: 5, img: IMG('fertilizer,liquid') },
  { name: 'Potash 0-0-60', brand: 'FBN', category: 'FERTILIZER', unit: '50 lb bag', price: 32, weight: 23, img: IMG('potash,soil') },
  { name: 'Ammonium Sulfate 21-0-0', brand: 'FBN', category: 'FERTILIZER', unit: '50 lb bag', price: 26, weight: 23, img: IMG('fertilizer,farm') },
  { name: 'Farmers First Biostimulant', brand: 'FBN', category: 'FERTILIZER', unit: 'gallon', price: 44, weight: 4, img: IMG('plant,nutrient') },
  { name: 'Pelletized Lime', brand: 'Generic', category: 'FERTILIZER', unit: '40 lb bag', price: 8, weight: 18, img: IMG('soil,lime') },
  // Tools & equipment
  { name: '4-Gallon Backpack Sprayer', brand: 'Chapin', category: 'TOOLS', unit: 'each', price: 89, weight: 5, img: IMG('backpack,sprayer') },
  { name: 'Soil Test Kit (NPK + pH)', brand: 'Luster Leaf', category: 'TOOLS', unit: 'kit', price: 24, weight: 0.5, img: IMG('soil,test') },
  { name: 'Bypass Pruning Shears', brand: 'Fiskars', category: 'TOOLS', unit: 'each', price: 19, weight: 0.4, img: IMG('pruning,shears') },
  { name: 'Drip Irrigation Starter Kit', brand: 'Rain Bird', category: 'TOOLS', unit: 'kit', price: 115, weight: 6, img: IMG('irrigation,drip') },
  { name: 'Galvanized Fencing Wire', brand: 'Generic', category: 'TOOLS', unit: 'roll', price: 58, weight: 15, img: IMG('fence,wire') },
  { name: 'Steel Hand Trowel', brand: 'Corona', category: 'TOOLS', unit: 'each', price: 12, weight: 0.5, img: IMG('garden,trowel') },
];

export const INDUSTRY_SUFFIXES = ['AgriSupply', 'Farm Depot', 'Growers Co-op', 'Ag Center', 'Crop Supply', 'Farm & Ranch'];
