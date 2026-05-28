// Massachusetts RMV Service Centers — full-service state branches only
// (not AAA partner sites). Coordinates are approximate; refined when verified
// against the live RMV wait-time XML feed.
//
// `key` is the lowercase city/branch slug used by the official wait-time XML
// (we match these case-insensitively against whatever the API returns).
window.MA_RMV_BRANCHES = [
  { key: 'attleboro',       name: 'Attleboro',         lat: 41.9445, lon: -71.2856, address: '75 Park St, Attleboro, MA' },
  { key: 'boston',          name: 'Boston (Haymarket)',lat: 42.3617, lon: -71.0561, address: '136 Blackstone St, Boston, MA' },
  { key: 'braintree',       name: 'Braintree',         lat: 42.2080, lon: -71.0014, address: '10 Plain St, Braintree, MA' },
  { key: 'brockton',        name: 'Brockton',          lat: 42.0894, lon: -71.0228, address: '490 Forest Ave, Brockton, MA' },
  { key: 'chicopee',        name: 'Chicopee',          lat: 42.1685, lon: -72.5905, address: '1011 Chicopee St, Chicopee, MA' },
  { key: 'danvers',         name: 'Danvers',           lat: 42.5780, lon: -70.9259, address: '100 Independence Way, Danvers, MA' },
  { key: 'easthampton',     name: 'Easthampton',       lat: 42.2659, lon: -72.6687, address: '116 Pleasant St, Easthampton, MA' },
  { key: 'fall river',      name: 'Fall River',        lat: 41.7245, lon: -71.1546, address: '1794 N Main St, Fall River, MA' },
  { key: 'greenfield',      name: 'Greenfield',        lat: 42.5876, lon: -72.5995, address: 'Federal St, Greenfield, MA' },
  { key: 'haverhill',       name: 'Haverhill',         lat: 42.7762, lon: -71.0773, address: 'Haverhill, MA' },
  { key: 'lawrence',        name: 'Lawrence',          lat: 42.6795, lon: -71.1502, address: '73 Winthrop Ave, Lawrence, MA' },
  { key: 'leominster',      name: 'Leominster',        lat: 42.5251, lon: -71.7595, address: '80 Erdman Way, Leominster, MA' },
  { key: 'lowell',          name: 'Lowell',            lat: 42.6334, lon: -71.3162, address: 'Lowell, MA' },
  { key: 'martha\'s vineyard', name: 'Martha\'s Vineyard', lat: 41.4583, lon: -70.6045, address: 'Vineyard Haven, MA' },
  { key: 'milford',         name: 'Milford',           lat: 42.1395, lon: -71.5191, address: 'Milford, MA' },
  { key: 'nantucket',       name: 'Nantucket',         lat: 41.2835, lon: -70.0995, address: 'Nantucket, MA' },
  { key: 'natick',          name: 'Natick',            lat: 42.2935, lon: -71.3464, address: '296 N Main St, Natick, MA' },
  { key: 'new bedford',     name: 'New Bedford',       lat: 41.6362, lon: -70.9342, address: '278 Union St, New Bedford, MA' },
  { key: 'north adams',     name: 'North Adams',       lat: 42.7009, lon: -73.1090, address: 'North Adams, MA' },
  { key: 'pittsfield',      name: 'Pittsfield',        lat: 42.4500, lon: -73.2454, address: '333 East St, Pittsfield, MA' },
  { key: 'plymouth',        name: 'Plymouth',          lat: 41.9712, lon: -70.6700, address: '40 Industrial Park Rd, Plymouth, MA' },
  { key: 'revere',          name: 'Revere',            lat: 42.4084, lon: -71.0140, address: '9c Everett St, Revere, MA' },
  { key: 'roslindale',      name: 'Roslindale',        lat: 42.2856, lon: -71.1268, address: '4210 Washington St, Roslindale, MA' },
  { key: 'south yarmouth',  name: 'South Yarmouth',    lat: 41.6701, lon: -70.1832, address: 'South Yarmouth, MA' },
  { key: 'springfield',     name: 'Springfield',       lat: 42.1098, lon: -72.5912, address: '165 Liberty St, Springfield, MA' },
  { key: 'taunton',         name: 'Taunton',           lat: 41.9001, lon: -71.0892, address: '1 Washington St, Taunton, MA' },
  { key: 'wareham',         name: 'Wareham',           lat: 41.7615, lon: -70.7194, address: 'Wareham, MA' },
  { key: 'wilmington',      name: 'Wilmington',        lat: 42.5468, lon: -71.1738, address: 'Wilmington, MA' },
  { key: 'worcester',       name: 'Worcester',         lat: 42.2733, lon: -71.7860, address: '25 Mountain St E, Worcester, MA' },
];
