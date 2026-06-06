export const MOCK_PRESETS = [
  {
    id: 'three-bedroom',
    name: '标准三居室全屋定制家具 (家具整配套)',
    nameEn: 'Standard Three-Bedroom Bespoke Furniture Set',
    description: '包含大理石餐桌、实木床组、布艺沙发等异形重卡件，测试重底轻顶与防倒置约束。',
    descriptionEn: 'Includes marble dining table, solid wood bed set, fabric sofa, etc. Tests heavy bottom stacking and no-flip constraints.',
    items: [
      { id: '1', sku: '大理石餐桌 (1.8m)', skuEn: 'Marble Dining Table (1.8m)', l: 1800, w: 900, h: 780, qty: 1, weight: 120, stackingGrade: 3, allowSide: false, allowUpsideDown: false, color: '#ef4444' },
      { id: '2', sku: '真皮三人沙发', skuEn: 'Leather 3-Seater Sofa', l: 2200, w: 1000, h: 850, qty: 1, weight: 95, stackingGrade: 2, allowSide: false, allowUpsideDown: false, color: '#f59e0b' },
      { id: '3', sku: '实木双人床头板', skuEn: 'Solid Wood Double Headboard', l: 2000, w: 200, h: 1200, qty: 2, weight: 45, stackingGrade: 3, allowSide: true, allowUpsideDown: false, color: '#10b981' },
      { id: '4', sku: '实木床侧板/龙骨箱', skuEn: 'Solid Wood Bed Rails/Slats Box', l: 2100, w: 350, h: 300, qty: 4, weight: 35, stackingGrade: 3, allowSide: true, allowUpsideDown: true, color: '#3b82f6' },
      { id: '5', sku: '轻奢布艺单人椅', skuEn: 'Luxury Fabric Armchair', l: 750, w: 750, h: 850, qty: 6, weight: 15, stackingGrade: 1, allowSide: true, allowUpsideDown: false, color: '#8b5cf6' },
      { id: '6', sku: '高箱床储物底柜', skuEn: 'Storage Bed Base Cabinet', l: 1000, w: 900, h: 400, qty: 4, weight: 55, stackingGrade: 3, allowSide: false, allowUpsideDown: false, color: '#ec4899' },
      { id: '7', sku: '四门整体衣柜拼装板 (A)', skuEn: '4-Door Wardrobe Assembly Panels (A)', l: 2400, w: 600, h: 150, qty: 6, weight: 40, stackingGrade: 3, allowSide: true, allowUpsideDown: true, color: '#06b6d4' },
      { id: '8', sku: '衣柜拼装板 (B/搁板)', skuEn: 'Wardrobe Assembly Panels (B/Shelves)', l: 1200, w: 600, h: 200, qty: 8, weight: 25, stackingGrade: 2, allowSide: true, allowUpsideDown: true, color: '#14b8a6' },
      { id: '9', sku: '大理石茶几面', skuEn: 'Marble Coffee Table Top', l: 1300, w: 700, h: 100, qty: 1, weight: 50, stackingGrade: 3, allowSide: false, allowUpsideDown: false, color: '#f43f5e' },
      { id: '10', sku: '茶几不锈钢五金脚架', skuEn: 'Coffee Table Stainless Steel Frame', l: 1200, w: 600, h: 400, qty: 1, weight: 20, stackingGrade: 2, allowSide: true, allowUpsideDown: true, color: '#a855f7' },
      { id: '11', sku: '玻璃展示柜门', skuEn: 'Glass Display Cabinet Door', l: 1800, w: 450, h: 80, qty: 4, weight: 18, stackingGrade: 1, allowSide: false, allowUpsideDown: false, color: '#64748b' },
      { id: '12', sku: '软包床头柜', skuEn: 'Upholstered Nightstand', l: 550, w: 450, h: 500, qty: 4, weight: 16, stackingGrade: 2, allowSide: false, allowUpsideDown: false, color: '#0284c7' },
      { id: '13', sku: '高密度填充乳胶床垫', skuEn: 'High-Density Latex Mattress', l: 2000, w: 1800, h: 250, qty: 2, weight: 40, stackingGrade: 2, allowSide: false, allowUpsideDown: false, color: '#e11d48' },
      { id: '14', sku: '软硬结合海绵坐垫箱', skuEn: 'Hybrid Sponge Cushion Box', l: 800, w: 800, h: 450, qty: 4, weight: 12, stackingGrade: 1, allowSide: true, allowUpsideDown: true, color: '#16a34a' }
    ]
  },
  {
    id: 'luxury-villa',
    name: '尊享别墅全硬装+软装定制套装 (大体积大批量)',
    nameEn: 'Luxury Villa Premium Hard & Soft Furniture Set',
    description: '涵盖高档重型硬装木饰面板、多套沙发组合与大量大理石重货，适合测试多货柜排量。',
    descriptionEn: 'Covers premium heavy wood veneer wall panels, multiple sofa sets, and marble slabs. Great for testing multi-container loading.',
    items: [
      { id: 'v1', sku: '高级艺术岩板背景墙', skuEn: 'Premium Art Sintered Stone Accent Wall', l: 2800, w: 1200, h: 80, qty: 3, weight: 160, stackingGrade: 3, allowSide: false, allowUpsideDown: false, color: '#e11d48' },
      { id: 'v2', sku: '欧式硬木雕花双人床头板', skuEn: 'European Hardwood Carved Headboard', l: 2200, w: 300, h: 1500, qty: 3, weight: 80, stackingGrade: 3, allowSide: false, allowUpsideDown: false, color: '#ea580c' },
      { id: 'v3', sku: '实木排骨架大箱', skuEn: 'Solid Wood Slatted Bed Frame Box', l: 2000, w: 1800, h: 200, qty: 3, weight: 50, stackingGrade: 3, allowSide: true, allowUpsideDown: false, color: '#ca8a04' },
      { id: 'v4', sku: '超大家庭影院组合L座沙发', skuEn: 'Cinema Sectional L-Sofa', l: 2600, w: 1100, h: 900, qty: 2, weight: 110, stackingGrade: 1, allowSide: false, allowUpsideDown: false, color: '#16a34a' },
      { id: 'v5', sku: '影院组合单人躺椅', skuEn: 'Theater Sectional Single Recliner', l: 1100, w: 1000, h: 900, qty: 4, weight: 60, stackingGrade: 1, allowSide: false, allowUpsideDown: false, color: '#2563eb' },
      { id: 'v6', sku: '胡桃木八人座西餐桌', skuEn: 'Walnut 8-Seater Dining Table', l: 2400, w: 1100, h: 760, qty: 1, weight: 110, stackingGrade: 3, allowSide: false, allowUpsideDown: false, color: '#4f46e5' },
      { id: 'v7', sku: '高背餐椅', skuEn: 'High-Back Dining Chair', l: 600, w: 550, h: 1050, qty: 12, weight: 12, stackingGrade: 2, allowSide: true, allowUpsideDown: false, color: '#0891b2' },
      { id: 'v8', sku: '全木饰面挂墙板包 (大)', skuEn: 'Full Wood Veneer Wall Panel (L)', l: 2400, w: 800, h: 250, qty: 12, weight: 70, stackingGrade: 3, allowSide: true, allowUpsideDown: true, color: '#0d9488' },
      { id: 'v9', sku: '全木饰面挂墙板包 (小)', skuEn: 'Full Wood Veneer Wall Panel (S)', l: 1200, w: 800, h: 250, qty: 16, weight: 35, stackingGrade: 3, allowSide: true, allowUpsideDown: true, color: '#059669' },
      { id: 'v10', sku: '五层钢化玻璃陈列隔板', skuEn: '5-Tier Tempered Glass Shelf', l: 1100, w: 450, h: 120, qty: 6, weight: 30, stackingGrade: 1, allowSide: false, allowUpsideDown: false, color: '#57534e' },
      { id: 'v11', sku: '别墅挑空大吊灯箱', skuEn: 'Villa Chandelier Box', l: 1500, w: 1500, h: 800, qty: 1, weight: 90, stackingGrade: 1, allowSide: false, allowUpsideDown: false, color: '#db2777' },
      { id: 'v12', sku: '定制实木大玄关柜', skuEn: 'Bespoke Solid Wood Console Cabinet', l: 1600, w: 500, h: 950, qty: 1, weight: 75, stackingGrade: 3, allowSide: false, allowUpsideDown: false, color: '#475569' },
      { id: 'v13', sku: '高档厚乳胶黄麻床垫', skuEn: 'Premium Latex Jute Mattress', l: 2200, w: 2000, h: 300, qty: 3, weight: 55, stackingGrade: 2, allowSide: false, allowUpsideDown: false, color: '#9333ea' }
    ]
  },
  {
    id: 'office-furniture',
    name: '联合办公空间桌椅工程包 (中体积高堆叠)',
    nameEn: 'Co-Working Space Tables & Chairs Project Pack',
    description: '高堆叠属性的办公桌面板与大批量办公网椅，测试堆叠高度与横向紧凑性。',
    descriptionEn: 'Highly stackable office tabletops and a bulk of ergonomic office mesh chairs. Tests stacking height and packing tightness.',
    items: [
      { id: 'o1', sku: '办公桌桌板包 (2张入)', skuEn: 'Office Tabletop Pack (2pcs)', l: 1400, w: 1200, h: 100, qty: 15, weight: 38, stackingGrade: 3, allowSide: true, allowUpsideDown: true, color: '#2563eb' },
      { id: 'o2', sku: '办公桌钢制桌腿脚架', skuEn: 'Office Table Steel Leg Frame', l: 1200, w: 600, h: 700, qty: 15, weight: 22, stackingGrade: 2, allowSide: true, allowUpsideDown: true, color: '#16a34a' },
      { id: 'o3', sku: '工位铝合金屏风隔断', skuEn: 'Workstation Al-Alloy Screen Partition', l: 1400, w: 300, h: 100, qty: 30, weight: 12, stackingGrade: 2, allowSide: true, allowUpsideDown: true, color: '#0891b2' },
      { id: 'o4', sku: '高级人体工学网椅 (箱装)', skuEn: 'Premium Ergonomic Mesh Chair (Boxed)', l: 750, w: 650, h: 650, qty: 30, weight: 18, stackingGrade: 1, allowSide: false, allowUpsideDown: false, color: '#ea580c' },
      { id: 'o5', sku: '三抽移动钢制活动柜', skuEn: '3-Drawer Mobile Steel Cabinet', l: 550, w: 420, h: 600, qty: 30, weight: 15, stackingGrade: 3, allowSide: false, allowUpsideDown: false, color: '#ca8a04' },
      { id: 'o6', sku: '公共区域多人卡座沙发', skuEn: 'Public Area Booth Sofa', l: 1800, w: 800, h: 750, qty: 4, weight: 65, stackingGrade: 2, allowSide: false, allowUpsideDown: false, color: '#db2777' },
      { id: 'o7', sku: '经理胡桃木大班台板', skuEn: 'Manager Walnut Executive Desk Top', l: 2200, w: 1000, h: 120, qty: 2, weight: 55, stackingGrade: 3, allowSide: false, allowUpsideDown: false, color: '#4f46e5' }
    ]
  }
];
