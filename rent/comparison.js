const LISTING = {
  mls: 'N14079858',
  previousRent: 3650,
  rent: 3550,
  checked: '2026-11-13',
  source: 'https://www.realtor.ca/real-estate/30403962/9051-yonge-street-richmond-hill-langstaff',
};

const COMPARABLES = [
  {
    mls: 'N13867108', address: '75 Selkirk Dr', rent: 3400,
    specs: 'Langstaff · 3 房 / 3 卫 / 2 车位 · 1,500–2,000 ft²',
    note: '同区、同为三层，挂牌面积更大，少一间卫浴。不带家具。',
    source: 'https://property.ca/richmond-hill/75-selkirk-drive-richmond-hill',
  },
  {
    mls: 'N13794496', address: '168 Observatory Lane', rent: 3000,
    specs: 'Observatory · 3+1 房 / 3 卫 / 2 车位 · 1,100–1,500 ft²',
    note: '房数和挂牌面积区间相同，少一间卫浴。水电气及热水罐由租客承担。',
    source: 'https://www.realtor.ca/real-estate/30290548/168-observatory-lane-richmond-hill-observatory',
  },
  {
    mls: 'N13656816', address: '62 Baffin Crt', rent: 3000, leased: true,
    specs: 'Langstaff · 3+1 房 / 4 卫 / 2 车位 · 1,100–1,500 ft²',
    note: '同区、同格局，11 月 9 日已出租，可参考成交租金。',
    source: 'https://thecanadianhome.com/listing/leased/ontario/richmond-hill',
  },
];

function mlsNumber(property) {
  return String(property.mls || '').trim().toUpperCase();
}

export function displayedCosts(property) {
  const {rent, total} = property;
  if (mlsNumber(property) !== LISTING.mls || Number(rent) !== LISTING.previousRent) return {rent, total};
  const difference = LISTING.previousRent - LISTING.rent;
  return {rent: LISTING.rent, total: Number(total) >= LISTING.previousRent ? Number(total) - difference : total};
}

export function rentalComparison(property, properties, money) {
  if (mlsNumber(property) !== LISTING.mls) return '';
  const {rent, previousRent, checked, source} = LISTING;
  const cards = COMPARABLES.map(comp => {
    const detail = properties.find(p => mlsNumber(p) === comp.mls);
    const address = detail ? `<a href="#/house/${encodeURIComponent(detail.id)}">${comp.address}</a>` : comp.address;
    return `<article class="rent-comp-card">
      <h3>${address}</h3>
      <p>${comp.specs}</p>
      <p class="rent-comp-price">${money(comp.rent)} / 月 <small>${comp.leased ? '已出租 · 成交价' : '挂牌价'}</small></p>
      <p>9051 Yonge 月租差额 <strong>+${money(rent - comp.rent)}</strong></p>
      <p>${comp.note}</p>
      <a href="${comp.source}" target="_blank" rel="noopener noreferrer">查看来源<span class="rent-comp-sr">（${comp.address}）</span></a>
    </article>`;
  });
  return `<section class="rent-comparison" aria-labelledby="rent-comparison-title">
    <div class="rent-comp-hero">
      <h2 id="rent-comparison-title">附近联排对比</h2>
      <p class="rent-comp-price">${money(rent)} / 月 <small>挂牌价 · CAD</small></p>
      <p>从 ${money(previousRent)} 降了 ${money(previousRent - rent)} / 月 · ${checked}</p>
      <p>Langstaff · 三层全家具联排 · 3+1 房 / 4 卫 / 2 车位 · 1,100–1,500 ft²</p>
      <a href="${source}" target="_blank" rel="noopener noreferrer">查看 9051 Yonge 挂牌</a>
    </div>
    <div class="rent-comp-grid">${cards.join('')}</div>
    <p class="rent-comp-note">想压低月租，先看 75 Selkirk 或 168 Observatory。看中 9051 Yonge 的家具和第 4 个卫生间，可用 62 Baffin 的成交做议价参考，先确认家具清单、水电气和热水罐费用。总成本沿用清单原费用估算。</p>
  </section>`;
}
