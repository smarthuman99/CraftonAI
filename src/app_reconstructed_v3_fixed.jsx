뿯⾽⨀⨀ഀഀ
 * Crafton AI - Premium Interactive React Prototype Engine਍ ⨀ 䐀甀愀氀ⴀ䘀愀挀椀渀最㨀 ⠀㄀⤀ 䌀氀椀攀渀琀 圀攀戀猀椀琀攀 ☀ 倀漀爀琀愀氀 ⠀㈀⤀ 䤀渀琀攀爀渀愀氀 䈀愀挀欀漀昀昀椀挀攀 ☀ 伀瀀攀渀䌀氀愀眀 䌀漀渀猀漀氀攀ഀഀ
 */਍ഀഀ
import React, { useState, useEffect, useRef } from 'react';਍椀洀瀀漀爀琀 笀 挀爀攀愀琀攀䌀氀椀攀渀琀 紀 昀爀漀洀 ✀䀀猀甀瀀愀戀愀猀攀⼀猀甀瀀愀戀愀猀攀ⴀ樀猀✀㬀ഀഀ
import mockData from './mockData';਍ഀഀ
// Inject into window for backward compatibility with legacy prototype code਍眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀 㴀 笀 挀爀攀愀琀攀䌀氀椀攀渀琀 紀㬀ഀഀ
਍⼀⼀ 䤀渀椀琀椀愀氀椀稀攀 匀甀瀀愀戀愀猀攀 昀爀漀洀 氀漀挀愀氀匀琀漀爀愀最攀ഀഀ
const savedUrl = localStorage.getItem("supabase_url") || "";਍挀漀渀猀琀 猀愀瘀攀搀䬀攀礀 㴀 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开欀攀礀∀⤀ 簀簀 ∀∀㬀ഀഀ
let supabaseClient = null;਍ഀഀ
if (savedUrl && savedKey && window.supabase) {਍  琀爀礀 笀ഀഀ
    supabaseClient = window.supabase.createClient(savedUrl, savedKey);਍  紀 挀愀琀挀栀 ⠀攀爀爀⤀ 笀ഀഀ
    console.error("Supabase initialization error:", err);਍  紀ഀഀ
}਍ഀഀ
const getLogActionEn = (cnText) => {਍  椀昀 ⠀℀挀渀吀攀砀琀⤀ 爀攀琀甀爀渀 ∀∀㬀ഀഀ
  ਍  ⼀⼀ ㄀⸀ 䌀栀攀挀欀 攀砀愀挀琀 洀愀琀挀栀 椀渀 洀漀挀欀䐀愀琀愀⸀挀栀愀渀最攀䰀漀最猀ഀഀ
  const match = mockData.changeLogs.find(cl => cl.action === cnText);਍  椀昀 ⠀洀愀琀挀栀 ☀☀ 洀愀琀挀栀⸀愀挀琀椀漀渀䔀渀⤀ 爀攀琀甀爀渀 洀愀琀挀栀⸀愀挀琀椀漀渀䔀渀㬀ഀഀ
  ਍  ⼀⼀ ㈀⸀ 䌀栀攀挀欀 漀琀栀攀爀 欀渀漀眀渀 攀砀愀挀琀 洀愀琀挀栀攀猀ഀഀ
  const exactTranslations = {਍    ∀붿뿯붿젠ᶓ뿯䦽뿯춽붿뿯붿硒뿯ල嘊OM瀵╂牳뿯붿氶뿯亽붿뿯岽敖붿뿯嶽뿯檽甯뿯冽뿯₽?: "Tech specifications and BOM approved, signed off.",਍    ∀붿뿯붿ᬠ붿붿뿯춽粓䥑硭뿯ල嘊OM瀵╂牳뿯붿氶뿯亽붿뿯岽敖붿뿯嶽뿯檽甯뿯冽뿯₽?: "Tech specifications and BOM approved, signed off.",਍    ∀ᴀ뿯붿池奲뿯붿붿뿯ᮽ뿯ⲽᱬ㥭ⅰ붿붿;뿯붿뿯ᶽ뿯붿池붿䉴붿᭚뿯綽䝜ᅟ㽚붿뿯䎽붿붿뿯⮽⩛뿯碽뿯㾽붿䍛⩏兜뿯붿붿붿붿啦뿯붿붿붿㍾붿啵뿯ኽ붿啖뿯붿硦붿䭾ᵩŽ㭩붿뿯宽뿯厽牳뿯붿붿洿鏂붿뿯₽?: "Site feedback: Cancelled 2 Armchairs & 1 Table due to fitout changes. Auto strike-through recalculation initiated.",਍    ∀䌀刀䤀䈀 㔀 ᔀ뿯붿网붿⅙⼲뿯붿붿뿯綽᭦뿯ㆽ붿붿Ȿ뿯붿붿붿ٰᕪ뿯붿᱑뿯庽붿礰붿붿뿯붿⽝붿䕴붿᱘뿯붿붿붿붿뿯ᦽ䍽刀䤀䈀 㔀 䈀䰀伀䌀䬀䔀䐀ᬀ뿯㾽㨀 ∀䌀刀䤀䈀 㔀 䘀氀愀洀洀愀戀椀氀椀琀礀 吀攀猀琀 䘀愀椀氀攀搀㨀 倀甀爀攀 匀椀氀欀 匀愀琀椀渀 昀椀爀攀ⴀ爀攀琀愀爀搀愀渀琀 挀漀愀琀椀渀最 猀栀爀椀渀欀愀最攀 愀渀搀 搀椀猀挀漀氀漀爀愀琀椀漀渀 爀愀琀攀 漀甀琀 漀昀 琀漀氀攀爀愀渀挀攀 ⠀䌀刀䤀䈀 㔀 䈀䰀伀䌀䬀䔀䐀⤀∀Ⰰഀഀ
    "CRIB 5 붿뿯冽噿뿯妽㈡붿붿堟牸붿氱伀붿版뿯殽闇?0뿯纽뿯掽뿯厽붿╃뿯悽붿붿唲붿圕RIB 5 PASSED붿?: "CRIB 5 Flammability Test Passed: Flame self-extinguished physically within 10 seconds of exposure (CRIB 5 PASSED)",਍    ∀攀뿯붿䝭儰뿯붿孔恟뿯붿뿯붿쵴붿뿯붿듧ⲓ붿᭙뿯㲽偫倀䌀᐀뿯붿䁟붿୴붿붿뿯禽捏쉣붿畮步뿯庽붿붿뿯綽붿뿯붿幾붿㑧붿붿콗붿붿睺뿯붿뿯ᦽㅽ　　─ 䴀䄀吀䌀䠀ᬀ뿯㾽㨀 ∀䘀漀甀爀 攀砀瀀漀爀琀 挀漀洀瀀氀椀愀渀挀攀 搀漀挀甀洀攀渀琀猀 瘀攀爀椀昀椀攀搀 猀甀挀挀攀猀猀昀甀氀氀礀㨀 䤀倀倀䌀 昀甀洀椀最愀琀椀漀渀 挀攀爀琀椀昀椀挀愀琀攀Ⰰ 䌀甀猀琀漀洀猀 搀攀挀氀愀爀愀琀椀漀渀Ⰰ 倀愀挀欀椀渀最 氀椀猀琀猀 洀愀琀挀栀 瀀攀爀昀攀挀琀氀礀 ⠀㄀　　─ 䴀䄀吀䌀䠀⤀∀Ⰰഀഀ
    "闋呯洰뿯璽뿯嚽뿯枽붿堝笇뿯붿뿯撽뿯宽瀹뿯岽뿯暽붿歋HA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51": "Project archive hashed and packaged: SHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51",਍    ∀붿⅙⼲뿯劽뿯溽Ⅲൣ≿ᘲ붿뿯䊽ऄ婻뿯⎽붿뿯ᮽ뿯粽붿붿뿯붿字붿뿯붿灭쉯ᆓ摫᭐뿯䂽⵫㐀㐀㄀　 ⠀㐀붿붿붿뿯붿㵝祼㽩∀㨀 ∀䐀攀琀攀挀琀攀搀 挀爀椀琀椀挀愀氀 渀漀渀ⴀ挀漀洀瀀氀椀愀渀挀攀 漀渀 匀椀氀欀⸀ 匀眀愀瀀瀀攀搀 昀愀戀爀椀挀 琀漀㨀 䰀ⴀ㐀㐀㄀　 ⠀一愀瘀礀 䌀氀愀猀猀椀挀 䰀椀渀攀渀⤀ 眀椀琀栀 漀渀攀 挀氀椀挀欀⸀∀Ⰰഀഀ
    "붿뿯熽뿯垽PDF瑕뿯徽牸鏇붿紝붿ㄨ뿯嚽붿뿯暽붿붿?SMTP 뿯붿典欢缇뿯ソ뿯檽붿?3 瀹붿剰붿戝伐뿯宽뿯犽뿯₽?: "Generated PDF specification sheet, automatically calling SMTP to dispatch RFQs to 3 target factories."਍  紀㬀ഀഀ
  ਍  椀昀 ⠀攀砀愀挀琀吀爀愀渀猀氀愀琀椀漀渀猀嬀挀渀吀攀砀琀崀⤀ 笀ഀഀ
    return exactTranslations[cnText];਍  紀ഀഀ
  ਍  ⼀⼀ ㌀⸀ 䐀礀渀愀洀椀挀 琀攀洀瀀氀愀琀攀猀 ⠀䌀爀椀戀 㔀 伀瘀攀爀爀椀搀攀 愀渀搀 猀甀瀀瀀氀椀攀爀 猀攀氀攀挀琀椀漀渀猀⤀ഀഀ
  if (cnText.includes("뿯涽뿯붿敼붿╂뿯枽붿堣붿붿氭浛뿯붿㈤潰鏂欎붿")) {਍    挀漀渀猀琀 洀愀琀挀栀䘀愀戀爀椀挀 㴀 挀渀吀攀砀琀⸀洀愀琀挀栀⠀⼀윀ຓ㉣졝↕붿붿붿獻⨀⠀尀匀⬀⤀⼀⤀㬀ഀഀ
    const code = matchFabric ? matchFabric[1] : "FAB-02";਍    爀攀琀甀爀渀 怀䈀礀瀀愀猀猀攀搀 䌀爀椀戀 㔀㨀 䌀栀愀渀最攀搀 昀愀戀爀椀挀 琀漀 ␀笀挀漀搀攀紀 ⠀一愀瘀礀 䌀氀愀猀猀椀挀 䰀椀渀攀渀⤀Ⰰ 猀甀挀挀攀猀猀昀甀氀氀礀 漀瘀攀爀爀椀搀椀渀最 最愀琀攀⸀怀㬀ഀഀ
  }਍  ഀഀ
  if (cnText.includes("뿯妽뿯施뿯玽瀹屾뿯垽뿯붿뿯傽渶缁堥뿯₽਍繙恵䕭뿯Ⴝ塏뿯㾽∀⤀⤀ 笀ഀഀ
    const matchSupplier = cnText.match(/鏈뿯₽缁堥뿯₽਍繙恵䕭뿯Ⴝ塏뿯㾽尀猀⨀⠀嬀帀ᬀ뿯붿⭛⤀⼀⤀㬀ഀഀ
    const matchPrice = cnText.match(/붿뿯暽뿯玽鏍稿畾뿯涽뿯箽s*\$?([0-9.]+)/);਍    挀漀渀猀琀 猀一愀洀攀 㴀 洀愀琀挀栀匀甀瀀瀀氀椀攀爀 㼀 洀愀琀挀栀匀甀瀀瀀氀椀攀爀嬀㄀崀 㨀 ∀猀攀氀攀挀琀攀搀 猀甀瀀瀀氀椀攀爀∀㬀ഀഀ
    const sPrice = matchPrice ? matchPrice[1] : "195";਍    爀攀琀甀爀渀 怀匀甀瀀瀀氀椀攀爀 戀椀搀搀椀渀最 昀椀渀愀氀椀稀攀搀⸀ 䘀愀挀琀漀爀礀 猀攀氀攀挀琀攀搀㨀 ␀笀猀一愀洀攀紀⸀ 䰀漀戀戀礀 䄀爀洀挀栀愀椀爀 猀攀琀 琀漀 ␀␀笀猀倀爀椀挀攀紀⼀瀀挀⸀怀㬀ഀഀ
  }਍  ഀഀ
  return cnText; // Fallback਍紀㬀ഀഀ
਍昀甀渀挀琀椀漀渀 䄀瀀瀀⠀⤀ 笀ഀഀ
  const [currentView, setCurrentStageView] = useState("Marketing"); // Views: "Marketing", "Backoffice", "ClientPortal"਍  挀漀渀猀琀 嬀氀愀渀最Ⰰ 猀攀琀䰀愀渀最崀 㴀 甀猀攀匀琀愀琀攀⠀∀䌀渀∀⤀㬀 ⼀⼀ 䰀愀渀最甀愀最攀㨀 ∀䌀渀∀ 漀爀 ∀䔀渀∀ഀഀ
  const [currentStageIndex, setCurrentStageIndex] = useState(0); // S01 to S17਍  挀漀渀猀琀 嬀漀爀搀攀爀Ⰰ 猀攀琀伀爀搀攀爀崀 㴀 甀猀攀匀琀愀琀攀⠀䨀匀伀一⸀瀀愀爀猀攀⠀䨀匀伀一⸀猀琀爀椀渀最椀昀礀⠀洀漀挀欀䐀愀琀愀⸀椀渀椀琀椀愀氀伀爀搀攀爀⤀⤀⤀㬀ഀഀ
  const [logs, setLogs] = useState(JSON.parse(JSON.stringify(mockData.changeLogs)));਍  挀漀渀猀琀 嬀挀栀愀琀䴀攀猀猀愀最攀猀Ⰰ 猀攀琀䌀栀愀琀䴀攀猀猀愀最攀猀崀 㴀 甀猀攀匀琀愀琀攀⠀嬀ഀഀ
    { sender: "client", text: "Hi, need 40 lobby armchairs and 20 club chairs for St Albans lobby. Blue style. Must pass UK fire safety." }਍  崀⤀㬀ഀഀ
  const [inputText, setInputText] = useState("");਍  挀漀渀猀琀 嬀椀猀䈀椀搀搀椀渀最䐀漀渀攀Ⰰ 猀攀琀䤀猀䈀椀搀搀椀渀最䐀漀渀攀崀 㴀 甀猀攀匀琀愀琀攀⠀昀愀氀猀攀⤀㬀ഀഀ
  const [selectedSupplier, setSelectedSupplier] = useState(null);਍  挀漀渀猀琀 嬀昀愀戀爀椀挀䌀漀洀瀀愀琀椀戀椀氀椀琀礀吀攀猀琀Ⰰ 猀攀琀䘀愀戀爀椀挀䌀漀洀瀀愀琀椀戀椀氀椀琀礀吀攀猀琀崀 㴀 甀猀攀匀琀愀琀攀⠀渀甀氀氀⤀㬀 ⼀⼀ 渀甀氀氀Ⰰ ✀瀀愀猀猀攀搀✀Ⰰ ✀戀氀漀挀欀攀搀✀ഀഀ
  const [splitDeliveryActive, setSplitDeliveryActive] = useState(false);਍  挀漀渀猀琀 嬀椀猀䌀爀椀戀㔀䈀氀漀挀欀攀搀Ⰰ 猀攀琀䤀猀䌀爀椀戀㔀䈀氀漀挀欀攀搀崀 㴀 甀猀攀匀琀愀琀攀⠀昀愀氀猀攀⤀㬀ഀഀ
  const terminalEndRef = useRef(null);਍ഀഀ
  // Material Studio Swatch Configurator States਍  挀漀渀猀琀 嬀猀攀氀攀挀琀攀搀䘀愀戀爀椀挀Ⰰ 猀攀琀匀攀氀攀挀琀攀搀䘀愀戀爀椀挀崀 㴀 甀猀攀匀琀愀琀攀⠀∀䘀䄀䈀ⴀ　㈀∀⤀㬀 ⼀⼀ 搀攀昀愀甀氀琀 一愀瘀礀 䌀氀愀猀猀椀挀 䰀椀渀攀渀ഀഀ
  const [selectedLeg, setSelectedLeg] = useState("matte-black"); // default Matte Black Steel਍  挀漀渀猀琀 嬀挀漀渀昀椀最甀爀愀琀漀爀䌀爀椀戀㔀䈀氀漀挀欀攀搀Ⰰ 猀攀琀䌀漀渀昀椀最甀爀愀琀漀爀䌀爀椀戀㔀䈀氀漀挀欀攀搀崀 㴀 甀猀攀匀琀愀琀攀⠀昀愀氀猀攀⤀㬀ഀഀ
਍  ⼀⼀ 䤀渀琀攀爀愀挀琀椀瘀攀 倀氀愀礀最爀漀甀渀搀猀 匀琀愀琀攀 嘀愀爀椀愀戀氀攀猀ഀഀ
  const [signatureApproved, setSignatureApproved] = useState(false);਍  挀漀渀猀琀 嬀挀爀椀戀㔀吀攀猀琀匀琀愀琀甀猀Ⰰ 猀攀琀䌀爀椀戀㔀吀攀猀琀匀琀愀琀甀猀崀 㴀 甀猀攀匀琀愀琀攀⠀∀椀搀氀攀∀⤀㬀 ⼀⼀ ✀椀搀氀攀✀Ⰰ ✀爀甀渀渀椀渀最✀Ⰰ ✀瀀愀猀猀攀搀✀Ⰰ ✀昀愀椀氀攀搀✀ഀഀ
  const [crib5Progress, setCrib5Progress] = useState(0);਍  挀漀渀猀琀 嬀爀昀焀䐀椀猀瀀愀琀挀栀攀搀Ⰰ 猀攀琀刀昀焀䐀椀猀瀀愀琀挀栀攀搀崀 㴀 甀猀攀匀琀愀琀攀⠀昀愀氀猀攀⤀㬀ഀഀ
  const [docAudited, setDocAudited] = useState(false);਍  挀漀渀猀琀 嬀愀爀挀栀椀瘀攀䠀愀猀栀攀搀Ⰰ 猀攀琀䄀爀挀栀椀瘀攀䠀愀猀栀攀搀崀 㴀 甀猀攀匀琀愀琀攀⠀昀愀氀猀攀⤀㬀ഀഀ
  const [showVolumetricSimulation, setShowVolumetricSimulation] = useState(false);਍ഀഀ
਍  ⼀⼀ 㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀ഀഀ
  // CRAFTON AI - LOW SATURATION VECTOR RENDERS & STAGE PLAYGROUNDS਍  ⼀⼀ 㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀㴀ഀഀ
਍  挀漀渀猀琀 爀攀渀搀攀爀䌀栀愀椀爀匀嘀䜀 㴀 ⠀昀愀戀爀椀挀䤀搀Ⰰ 氀攀最䤀搀Ⰰ 愀渀椀洀愀琀攀匀琀礀氀攀 㴀 笀紀⤀ 㴀㸀 笀ഀഀ
    let cushionColor = '#BAC2B9'; // Linen default (FAB-02)਍    椀昀 ⠀昀愀戀爀椀挀䤀搀 㴀㴀㴀 ✀䘀䄀䈀ⴀ　㄀✀⤀ 挀甀猀栀椀漀渀䌀漀氀漀爀 㴀 ✀⌀㠀䌀㤀㤀䄀㐀✀㬀 ⼀⼀ 嘀攀氀瘀攀琀ഀഀ
    if (fabricId === 'FAB-03') cushionColor = '#DFDCD6'; // Silk਍    椀昀 ⠀昀愀戀爀椀挀䤀搀 㴀㴀㴀 ✀䘀䄀䈀ⴀ　㐀✀⤀ 挀甀猀栀椀漀渀䌀漀氀漀爀 㴀 ✀⌀㔀䌀㔀㌀㐀䌀✀㬀 ⼀⼀ 䰀攀愀琀栀攀爀ഀഀ
਍    氀攀琀 氀攀最猀䌀漀氀漀爀 㴀 ✀⌀㄀䌀㄀䈀㄀㠀✀㬀 ⼀⼀ 䈀氀愀挀欀 搀攀昀愀甀氀琀ഀഀ
    if (legId === 'bronze') legsColor = '#A88F80';਍    椀昀 ⠀氀攀最䤀搀 㴀㴀㴀 ✀眀栀椀琀攀ⴀ漀愀欀✀⤀ 氀攀最猀䌀漀氀漀爀 㴀 ✀⌀䐀㈀䌀㤀䈀㄀✀㬀ഀഀ
਍    爀攀琀甀爀渀 ⠀ഀഀ
      <svg viewBox="0 0 200 200" width="100%" height="220" style={{ stroke: '#5C534C', strokeWidth: '1.2', fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round', ...animateStyle }}>਍        笀⼀⨀ 䌀栀愀椀爀 䈀愀挀欀爀攀猀琀 ⨀⼀紀ഀഀ
        <path d="M 60,60 L 140,60 Q 148,60 148,68 L 148,110 L 52,110 L 52,68 Q 52,60 60,60 Z" style={{ fill: cushionColor, transition: 'fill 0.5s' }} />਍        ഀഀ
        {/* Chair Cushion */}਍        㰀爀攀挀琀 砀㴀∀㐀㘀∀ 礀㴀∀㄀㄀　∀ 眀椀搀琀栀㴀∀㄀　㠀∀ 栀攀椀最栀琀㴀∀㈀㐀∀ 爀砀㴀∀㐀∀ 猀琀礀氀攀㴀笀笀 昀椀氀氀㨀 挀甀猀栀椀漀渀䌀漀氀漀爀Ⰰ 猀琀爀漀欀攀圀椀搀琀栀㨀 ✀㄀⸀㐀✀Ⰰ 琀爀愀渀猀椀琀椀漀渀㨀 ✀昀椀氀氀 　⸀㔀猀✀ 紀紀 ⼀㸀ഀഀ
        ਍        笀⼀⨀ 䌀栀愀椀爀 䄀爀洀猀 ⨀⼀紀ഀഀ
        <path d="M 46,104 L 38,104 C 34,104 34,124 34,124 L 46,124 Z" style={{ fill: cushionColor, transition: 'fill 0.5s' }} />਍        㰀瀀愀琀栀 搀㴀∀䴀 ㄀㔀㐀Ⰰ㄀　㐀 䰀 ㄀㘀㈀Ⰰ㄀　㐀 䌀 ㄀㘀㘀Ⰰ㄀　㐀 ㄀㘀㘀Ⰰ㄀㈀㐀 ㄀㘀㘀Ⰰ㄀㈀㐀 䰀 ㄀㔀㐀Ⰰ㄀㈀㐀 娀∀ 猀琀礀氀攀㴀笀笀 昀椀氀氀㨀 挀甀猀栀椀漀渀䌀漀氀漀爀Ⰰ 琀爀愀渀猀椀琀椀漀渀㨀 ✀昀椀氀氀 　⸀㔀猀✀ 紀紀 ⼀㸀ഀഀ
਍        笀⼀⨀ 䌀栀愀椀爀 䰀攀最猀 ⨀⼀紀ഀഀ
        <line x1="56" y1="134" x2="42" y2="176" style={{ stroke: legsColor, strokeWidth: '2.5', transition: 'stroke 0.5s' }} />਍        㰀氀椀渀攀 砀㄀㴀∀㄀㐀㐀∀ 礀㄀㴀∀㄀㌀㐀∀ 砀㈀㴀∀㄀㔀㠀∀ 礀㈀㴀∀㄀㜀㘀∀ 猀琀礀氀攀㴀笀笀 猀琀爀漀欀攀㨀 氀攀最猀䌀漀氀漀爀Ⰰ 猀琀爀漀欀攀圀椀搀琀栀㨀 ✀㈀⸀㔀✀Ⰰ 琀爀愀渀猀椀琀椀漀渀㨀 ✀猀琀爀漀欀攀 　⸀㔀猀✀ 紀紀 ⼀㸀ഀഀ
        <line x1="68" y1="134" x2="72" y2="170" style={{ stroke: legsColor, strokeWidth: '1.8', opacity: 0.7, transition: 'stroke 0.5s' }} />਍        㰀氀椀渀攀 砀㄀㴀∀㄀㌀㈀∀ 礀㄀㴀∀㄀㌀㐀∀ 砀㈀㴀∀㄀㈀㠀∀ 礀㈀㴀∀㄀㜀　∀ 猀琀礀氀攀㴀笀笀 猀琀爀漀欀攀㨀 氀攀最猀䌀漀氀漀爀Ⰰ 猀琀爀漀欀攀圀椀搀琀栀㨀 ✀㄀⸀㠀✀Ⰰ 漀瀀愀挀椀琀礀㨀 　⸀㜀Ⰰ 琀爀愀渀猀椀琀椀漀渀㨀 ✀猀琀爀漀欀攀 　⸀㔀猀✀ 紀紀 ⼀㸀ഀഀ
਍        笀⼀⨀ 匀琀爀甀挀琀甀爀愀氀 挀爀漀猀猀戀愀爀 ⨀⼀紀ഀഀ
        <line x1="42" y1="165" x2="158" y2="165" style={{ stroke: legsColor, strokeWidth: '1.2', transition: 'stroke 0.5s' }} />਍      㰀⼀猀瘀最㸀ഀഀ
    );਍  紀㬀ഀഀ
਍  挀漀渀猀琀 栀愀渀搀氀攀䘀愀戀爀椀挀匀攀氀攀挀琀 㴀 愀猀礀渀挀 ⠀昀愀戀䤀搀⤀ 㴀㸀 笀ഀഀ
    setSelectedFabric(fabId);਍    挀漀渀猀琀 椀猀匀椀氀欀 㴀 昀愀戀䤀搀 㴀㴀㴀 ✀䘀䄀䈀ⴀ　㌀✀㬀ഀഀ
    setConfiguratorCrib5Blocked(isSilk);਍    ഀഀ
    if (dbConnected && order.id) {਍      琀爀礀 笀ഀഀ
        const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀瀀爀漀樀攀挀琀猀∀⤀⸀甀瀀搀愀琀攀⠀笀 ഀഀ
          selected_fabric: fabId,਍          椀猀开挀爀椀戀㔀开戀氀漀挀欀攀搀㨀 椀猀匀椀氀欀Ⰰഀഀ
          fabric_compatibility_test: isSilk ? "blocked" : "passed"਍        紀⤀⸀攀焀⠀∀椀搀∀Ⰰ 漀爀搀攀爀⸀椀搀⤀㬀ഀഀ
      } catch (err) {਍        挀漀渀猀漀氀攀⸀攀爀爀漀爀⠀∀匀甀瀀愀戀愀猀攀 昀愀戀爀椀挀 猀礀渀挀 攀爀爀漀爀㨀∀Ⰰ 攀爀爀⤀㬀ഀഀ
      }਍    紀ഀഀ
  };਍ഀഀ
  const handleLegSelect = async (legId) => {਍    猀攀琀匀攀氀攀挀琀攀搀䰀攀最⠀氀攀最䤀搀⤀㬀ഀഀ
    if (dbConnected && order.id) {਍      琀爀礀 笀ഀഀ
        const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀瀀爀漀樀攀挀琀猀∀⤀⸀甀瀀搀愀琀攀⠀笀 猀攀氀攀挀琀攀搀开氀攀最㨀 氀攀最䤀搀 紀⤀⸀攀焀⠀∀椀搀∀Ⰰ 漀爀搀攀爀⸀椀搀⤀㬀ഀഀ
      } catch (err) {਍        挀漀渀猀漀氀攀⸀攀爀爀漀爀⠀∀匀甀瀀愀戀愀猀攀 氀攀最 猀礀渀挀 攀爀爀漀爀㨀∀Ⰰ 攀爀爀⤀㬀ഀഀ
      }਍    紀ഀഀ
  };਍ഀഀ
  const renderMaterialStudio = () => {਍    挀漀渀猀琀 猀攀氀攀挀琀攀搀䘀愀戀伀戀樀 㴀 洀漀挀欀䐀愀琀愀⸀昀愀戀爀椀挀猀⸀昀椀渀搀⠀昀 㴀㸀 昀⸀椀搀 㴀㴀㴀 猀攀氀攀挀琀攀搀䘀愀戀爀椀挀⤀㬀ഀഀ
    return (਍      㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀洀愀琀攀爀椀愀氀ⴀ猀琀甀搀椀漀ⴀ挀愀爀搀 愀渀椀洀愀琀攀ⴀ昀愀搀攀ⴀ椀渀∀㸀ഀഀ
        <div className="material-studio-headline">਍          붿뿯㚽⁜笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀䌀爀愀昀琀漀渀 䈀㱩汪뿯좽↕붿硧뿯붿繖幖p뿯Ⴝ붿뿯붿繯䅵쥴ႅ杏뿯㾽 㨀 ∀䌀爀愀昀琀漀渀 倀爀攀洀椀甀洀 䴀愀琀攀爀椀愀氀 ☀ 䘀椀渀椀猀栀攀猀 䌀漀渀昀椀最甀爀愀琀漀爀∀紀ഀഀ
        </div>਍        ഀഀ
        <div className="swatch-configurator-box">਍          笀⼀⨀ 䰀攀昀琀 䌀漀氀甀洀渀㨀 䤀渀琀攀爀愀挀琀椀瘀攀 嘀攀挀琀漀爀 䈀氀甀攀瀀爀椀渀琀 ⨀⼀紀ഀഀ
          <div className="blueprint-board" style={{ height: '240px', background: '#F8F6F2' }}>਍            㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀戀氀甀攀瀀爀椀渀琀ⴀ琀椀琀氀攀ⴀ琀愀最∀㸀䈀攀猀瀀漀欀攀 䌀漀渀昀椀最甀爀愀琀漀爀 嘀㄀⸀　㰀⼀猀瀀愀渀㸀ഀഀ
            {renderChairSVG(selectedFabric, selectedLeg, configuratorCrib5Blocked ? { outline: '2px dashed #A68480', outlineOffset: '4px' } : {})}਍            笀挀漀渀昀椀最甀爀愀琀漀爀䌀爀椀戀㔀䈀氀漀挀欀攀搀 ☀☀ ⠀ഀഀ
              <div style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'rgba(166, 132, 128, 0.95)', color: 'white', padding: '0.3rem 0.6rem', fontSize: '0.68rem', letterSpacing: '0.5px', border: '1px solid #FAF9F6', borderRadius: '2px', textTransform: 'uppercase' }}>਍                㼀뿯붿൲⁻䌀刀䤀䈀 㔀 䈀䄀一一䔀䐀ഀഀ
              </div>਍            ⤀紀ഀഀ
            <span className="blueprint-scale-tag">SCALE 1:10</span>਍          㰀⼀搀椀瘀㸀ഀഀ
਍          笀⼀⨀ 刀椀最栀琀 䌀漀氀甀洀渀㨀 䌀栀漀椀挀攀猀 ⨀⼀紀ഀഀ
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>਍            笀⼀⨀ 䘀愀戀爀椀挀 漀瀀琀椀漀渀猀 ⨀⼀紀ഀഀ
            <div>਍              㰀氀愀戀攀氀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀Ⰰ 昀漀渀琀圀攀椀最栀琀㨀 ✀㘀　　✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 琀攀砀琀吀爀愀渀猀昀漀爀洀㨀 ✀甀瀀瀀攀爀挀愀猀攀✀Ⰰ 氀攀琀琀攀爀匀瀀愀挀椀渀最㨀 ✀㄀瀀砀✀ 紀紀㸀ഀഀ
                {lang === "Cn" ? "1. 뿯纽붿伕浣뿯庽붿붿屽뿯宽闈㈡뿯枽搴? : "1. Select Low-Saturation Fabric"}਍              㰀⼀氀愀戀攀氀㸀ഀഀ
              <div className="fabric-swatches-grid" style={{ marginTop: '0.4rem' }}>਍                笀洀漀挀欀䐀愀琀愀⸀昀愀戀爀椀挀猀⸀洀愀瀀⠀昀愀戀 㴀㸀 笀ഀഀ
                  let textureClass = "texture-linen";਍                  椀昀 ⠀昀愀戀⸀椀搀 㴀㴀㴀 ∀䘀䄀䈀ⴀ　㄀∀⤀ 琀攀砀琀甀爀攀䌀氀愀猀猀 㴀 ∀琀攀砀琀甀爀攀ⴀ瘀攀氀瘀攀琀∀㬀ഀഀ
                  if (fab.id === "FAB-03") textureClass = "texture-silk";਍                  椀昀 ⠀昀愀戀⸀椀搀 㴀㴀㴀 ∀䘀䄀䈀ⴀ　㐀∀⤀ 琀攀砀琀甀爀攀䌀氀愀猀猀 㴀 ∀琀攀砀琀甀爀攀ⴀ氀攀愀琀栀攀爀∀㬀ഀഀ
਍                  爀攀琀甀爀渀 ⠀ഀഀ
                    <div ਍                      欀攀礀㴀笀昀愀戀⸀椀搀紀 ഀഀ
                      className={`fabric-card-option ${selectedFabric === fab.id ? 'selected' : ''}`}਍                      漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 栀愀渀搀氀攀䘀愀戀爀椀挀匀攀氀攀挀琀⠀昀愀戀⸀椀搀⤀紀ഀഀ
                      title={lang === "Cn" ? fab.notesCn : fab.notesEn}਍                    㸀ഀഀ
                      <div className={`swatch-preview-circle ${textureClass}`}></div>਍                      㰀搀椀瘀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㘀㈀爀攀洀✀Ⰰ 昀漀渀琀圀攀椀最栀琀㨀 ✀㔀　　✀Ⰰ 眀栀椀琀攀匀瀀愀挀攀㨀 ✀渀漀眀爀愀瀀✀Ⰰ 漀瘀攀爀昀氀漀眀㨀 ✀栀椀搀搀攀渀✀Ⰰ 琀攀砀琀伀瘀攀爀昀氀漀眀㨀 ✀攀氀氀椀瀀猀椀猀✀ 紀紀㸀ഀഀ
                        {lang === "Cn" ? fab.name.split(' (')[0] : fab.name.split(' (')[0]}਍                      㰀⼀搀椀瘀㸀ഀഀ
                    </div>਍                  ⤀㬀ഀഀ
                })}਍              㰀⼀搀椀瘀㸀ഀഀ
            </div>਍ഀഀ
            {/* Leg finish options */}਍            㰀搀椀瘀㸀ഀഀ
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>਍                笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㈀⸀ 붿灙ᥔ屔붿繥⁖⼀ 㔀㵰뿯檽୮䍩뿯炽≯ 㨀 ∀㈀⸀ 䌀栀愀椀爀 䰀攀最 䘀椀渀椀猀栀∀紀ഀഀ
              </label>਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀昀椀渀椀猀栀攀猀ⴀ爀漀眀∀㸀ഀഀ
                <button ਍                  挀氀愀猀猀一愀洀攀㴀笀怀昀椀渀椀猀栀ⴀ挀椀爀挀氀攀ⴀ戀琀渀 ␀笀猀攀氀攀挀琀攀搀䰀攀最 㴀㴀㴀 ✀洀愀琀琀攀ⴀ戀氀愀挀欀✀ 㼀 ✀猀攀氀攀挀琀攀搀✀ 㨀 ✀✀紀怀紀ഀഀ
                  style={{ background: '#1C1B18' }} ਍                  漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 栀愀渀搀氀攀䰀攀最匀攀氀攀挀琀⠀✀洀愀琀琀攀ⴀ戀氀愀挀欀✀⤀紀ഀഀ
                  title="Matte Basalt Black Steel"਍                㸀㰀⼀戀甀琀琀漀渀㸀ഀഀ
                <button ਍                  挀氀愀猀猀一愀洀攀㴀笀怀昀椀渀椀猀栀ⴀ挀椀爀挀氀攀ⴀ戀琀渀 ␀笀猀攀氀攀挀琀攀搀䰀攀最 㴀㴀㴀 ✀戀爀漀渀稀攀✀ 㼀 ✀猀攀氀攀挀琀攀搀✀ 㨀 ✀✀紀怀紀ഀഀ
                  style={{ background: '#A88F80' }} ਍                  漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 栀愀渀搀氀攀䰀攀最匀攀氀攀挀琀⠀✀戀爀漀渀稀攀✀⤀紀ഀഀ
                  title="Brushed Walnut Bronze"਍                㸀㰀⼀戀甀琀琀漀渀㸀ഀഀ
                <button ਍                  挀氀愀猀猀一愀洀攀㴀笀怀昀椀渀椀猀栀ⴀ挀椀爀挀氀攀ⴀ戀琀渀 ␀笀猀攀氀攀挀琀攀搀䰀攀最 㴀㴀㴀 ✀眀栀椀琀攀ⴀ漀愀欀✀ 㼀 ✀猀攀氀攀挀琀攀搀✀ 㨀 ✀✀紀怀紀ഀഀ
                  style={{ background: '#D2C9B1' }} ਍                  漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 栀愀渀搀氀攀䰀攀最匀攀氀攀挀琀⠀✀眀栀椀琀攀ⴀ漀愀欀✀⤀紀ഀഀ
                  title="Natural White Oak Wood"਍                㸀㰀⼀戀甀琀琀漀渀㸀ഀഀ
              </div>਍            㰀⼀搀椀瘀㸀ഀഀ
਍            笀⼀⨀ 匀攀氀攀挀琀攀搀 昀攀攀搀戀愀挀欀 愀渀搀 䌀刀䤀䈀 㔀 瘀愀氀椀搀愀琀椀漀渀 愀氀攀爀琀 ⨀⼀紀ഀഀ
            <div style={{ marginTop: '0.2rem', padding: '0.6rem 0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', fontSize: '0.72rem' }}>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 昀漀渀琀圀攀椀最栀琀㨀 ✀㘀　　✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀✀ 紀紀㸀ഀഀ
                {lang === "Cn" ? `붿뿯붿뿯墽鏉愯唱: ${selectedFabObj.name}` : `Active Swatch: ${selectedFabObj.name}`}਍              㰀⼀搀椀瘀㸀ഀഀ
              <div style={{ color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>਍                笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 猀攀氀攀挀琀攀搀䘀愀戀伀戀樀⸀渀漀琀攀猀䌀渀 㨀 猀攀氀攀挀琀攀搀䘀愀戀伀戀樀⸀渀漀琀攀猀䔀渀紀ഀഀ
              </div>਍              ഀഀ
              {/* Compliance status banner */}਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 愀氀椀最渀䤀琀攀洀猀㨀 ✀挀攀渀琀攀爀✀Ⰰ 最愀瀀㨀 ✀㔀瀀砀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀㘀瀀砀✀Ⰰ 昀漀渀琀圀攀椀最栀琀㨀 ✀㘀　　✀Ⰰ 挀漀氀漀爀㨀 猀攀氀攀挀琀攀搀䘀愀戀伀戀樀⸀挀爀椀戀㔀䌀漀洀瀀愀琀椀戀氀攀 㼀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ爀攀搀⤀✀ 紀紀㸀ഀഀ
                <span className={`stage-badge-dot dot-${selectedFabObj.crib5Compatible ? 'completed' : 'add-log'}`} style={{ width: '6px', height: '6px' }}></span>਍                笀猀攀氀攀挀琀攀搀䘀愀戀伀戀樀⸀挀爀椀戀㔀䌀漀洀瀀愀琀椀戀氀攀 ഀഀ
                  ? (lang === "Cn" ? "붿?뿯纽붿뿯悽붿卞湅 Crib 5 娑堥뿯榽闃붿噧娉뿯暽뿯붿" : "붿?UK Crib 5 Compliance Pass")਍                  㨀 ⠀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀䄀뿯㾽붿䁴뿯붿᭡뿯㚽灬쉯ᆓ붿뿯庽뿯붿뿯ኽ붿붿붿뿯媽뿯㾽䌀爀椀戀 㔀 ऀ붿붿뿯⊽ 㨀 ∀䄀뿯㾽䈀䄀一一䔀䐀㨀 䘀愀椀氀猀 䌀爀椀戀 㔀 刀攀最甀氀愀琀椀漀渀∀⤀紀ഀഀ
              </div>਍            㰀⼀搀椀瘀㸀ഀഀ
          </div>਍        㰀⼀搀椀瘀㸀ഀഀ
      </div>਍    ⤀㬀ഀഀ
  };਍ഀഀ
  const handleStartCrib5Test = () => {਍    猀攀琀䌀爀椀戀㔀吀攀猀琀匀琀愀琀甀猀⠀∀爀甀渀渀椀渀最∀⤀㬀ഀഀ
    setCrib5Progress(0);਍    挀漀渀猀琀 椀渀琀攀爀瘀愀氀 㴀 猀攀琀䤀渀琀攀爀瘀愀氀⠀⠀⤀ 㴀㸀 笀ഀഀ
      setCrib5Progress(prev => {਍        椀昀 ⠀瀀爀攀瘀 㸀㴀 ㄀　　⤀ 笀ഀഀ
          clearInterval(interval);਍          椀昀 ⠀猀攀氀攀挀琀攀搀䘀愀戀爀椀挀 㴀㴀㴀 ∀䘀䄀䈀ⴀ　㌀∀⤀ 笀ഀഀ
            setCrib5TestStatus("failed");਍            愀搀搀䰀漀最⠀∀匀礀猀琀攀洀∀Ⰰ ∀䌀刀䤀䈀 㔀 ᔀ뿯붿网붿⅙⼲뿯붿붿뿯綽᭦뿯ㆽ붿붿Ȿ뿯붿붿붿ٰᕪ뿯붿᱑뿯庽붿礰붿붿뿯붿⽝붿䕴붿᱘뿯붿붿붿붿뿯ᦽ䍽刀䤀䈀 㔀 䈀䰀伀䌀䬀䔀䐀ᬀ뿯㾽Ⰰ ∀䌀刀䤀䈀 㔀 䘀氀愀洀洀愀戀椀氀椀琀礀 吀攀猀琀 䘀愀椀氀攀搀㨀 倀甀爀攀 匀椀氀欀 匀愀琀椀渀 昀椀爀攀ⴀ爀攀琀愀爀搀愀渀琀 挀漀愀琀椀渀最 猀栀爀椀渀欀愀最攀 愀渀搀 搀椀猀挀漀氀漀爀愀琀椀漀渀 爀愀琀攀 漀甀琀 漀昀 琀漀氀攀爀愀渀挀攀 ⠀䌀刀䤀䈀 㔀 䈀䰀伀䌀䬀䔀䐀⤀∀⤀㬀ഀഀ
          } else {਍            猀攀琀䌀爀椀戀㔀吀攀猀琀匀琀愀琀甀猀⠀∀瀀愀猀猀攀搀∀⤀㬀ഀഀ
            addLog("System", "CRIB 5 붿뿯冽噿뿯妽㈡붿붿堟牸붿氱伀붿版뿯殽闇?0뿯纽뿯掽뿯厽붿╃뿯悽붿붿唲붿圕RIB 5 PASSED붿?, "CRIB 5 Flammability Test Passed: Flame self-extinguished physically within 10 seconds of exposure (CRIB 5 PASSED)");਍          紀ഀഀ
          return 100;਍        紀ഀഀ
        return prev + 10;਍      紀⤀㬀ഀഀ
    }, 150);਍  紀㬀ഀഀ
਍  挀漀渀猀琀 栀愀渀搀氀攀䐀漀挀甀洀攀渀琀䄀甀搀椀琀 㴀 ⠀⤀ 㴀㸀 笀ഀഀ
    setDocAudited(true);਍    愀搀搀䰀漀最⠀∀匀礀猀琀攀洀∀Ⰰ ∀攀뿯붿䝭儰뿯붿孔恟뿯붿뿯붿쵴붿뿯붿듧ⲓ붿᭙뿯㲽偫倀䌀᐀뿯붿䁟붿୴붿붿뿯禽捏쉣붿畮步뿯庽붿붿뿯綽붿뿯붿幾붿㑧붿붿콗붿붿睺뿯붿뿯ᦽㅽ　　─ 䴀䄀吀䌀䠀ᬀ뿯㾽Ⰰ ∀䘀漀甀爀 攀砀瀀漀爀琀 挀漀洀瀀氀椀愀渀挀攀 搀漀挀甀洀攀渀琀猀 瘀攀爀椀昀椀攀搀 猀甀挀挀攀猀猀昀甀氀氀礀㨀 䤀倀倀䌀 昀甀洀椀最愀琀椀漀渀 挀攀爀琀椀昀椀挀愀琀攀Ⰰ 䌀甀猀琀漀洀猀 搀攀挀氀愀爀愀琀椀漀渀Ⰰ 倀愀挀欀椀渀最 氀椀猀琀猀 洀愀琀挀栀 瀀攀爀昀攀挀琀氀礀 ⠀㄀　　─ 䴀䄀吀䌀䠀⤀∀⤀㬀ഀഀ
  };਍ഀഀ
  const handleCryptographicArchive = () => {਍    猀攀琀䄀爀挀栀椀瘀攀䠀愀猀栀攀搀⠀琀爀甀攀⤀㬀ഀഀ
    addLog("System", "闋呯洰뿯璽뿯嚽뿯枽붿堝笇뿯붿뿯撽뿯宽瀹뿯岽뿯暽붿歋HA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51", "Project archive hashed and packaged: SHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51");਍  紀㬀ഀഀ
਍  挀漀渀猀琀 爀攀渀搀攀爀䤀渀琀攀爀愀挀琀椀瘀攀倀氀愀礀最爀漀甀渀搀 㴀 ⠀⤀ 㴀㸀 笀ഀഀ
    const stageId = currentStage.id;਍ഀഀ
    // 1. S01, S02, S03, S04: CAD Drafting and Approvals਍    椀昀 ⠀猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀　㄀∀ 簀簀 猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀　㈀∀ 簀簀 猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀　㌀∀ 簀簀 猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀　㐀∀⤀ 笀ഀഀ
      return (਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀 愀渀椀洀愀琀攀ⴀ昀愀搀攀ⴀ椀渀∀ 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀䈀漀琀琀漀洀㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
          <div className="panel-header" style={{ background: 'rgba(124,114,103,0.03)' }}>਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ琀椀琀氀攀∀㸀붿뿯㮽⁤笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿慭뿯붿왚ን湫⁳䌀䄀䐀 붿뿯붿ᬠ붿붿晨뿯ⲽ붿뿯춽粓䥑≭ 㨀 ∀䈀椀氀椀渀最甀愀氀 䌀䄀䐀 吀攀挀栀渀椀挀愀氀 匀瀀攀挀猀∀紀㰀⼀搀椀瘀㸀ഀഀ
            <span className="logo-badge" style={{ color: 'var(--accent-primary)' }}>AUTO-DRAFTED</span>਍          㰀⼀搀椀瘀㸀ഀഀ
          <div className="panel-body" style={{ padding: '1rem' }}>਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀戀氀甀攀瀀爀椀渀琀ⴀ戀漀愀爀搀∀㸀ഀഀ
              <span className="blueprint-title-tag">਍                笀猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀　㄀∀ 㼀 ∀匀　㄀㨀 䤀渀琀愀欀攀 䐀爀愀昀琀∀ 㨀 猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀　㈀∀ 㼀 ∀匀　㈀㨀 䄀琀琀爀椀戀甀琀攀猀 儀甀攀爀礀∀ 㨀 猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀　㌀∀ 㼀 ∀匀　㌀㨀 匀瀀攀挀 刀攀愀搀礀∀ 㨀 ∀匀　㐀㨀 䄀瀀瀀爀漀瘀攀搀 䈀伀䴀∀紀ഀഀ
              </span>਍              ഀഀ
              {/* Dimensions Layout */}਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀漀猀椀琀椀漀渀㨀 ✀愀戀猀漀氀甀琀攀✀Ⰰ 琀漀瀀㨀 ✀㐀　瀀砀✀Ⰰ 氀攀昀琀㨀 ✀㐀㘀瀀砀✀Ⰰ 爀椀最栀琀㨀 ✀㐀㘀瀀砀✀Ⰰ 栀攀椀最栀琀㨀 ✀㄀瀀砀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 漀瀀愀挀椀琀礀㨀 　⸀㔀 紀紀㸀㰀⼀搀椀瘀㸀ഀഀ
              <div style={{ position: 'absolute', top: '35px', left: '46px', width: '1px', height: '10px', background: 'var(--accent-secondary)', opacity: 0.5 }}></div>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀漀猀椀琀椀漀渀㨀 ✀愀戀猀漀氀甀琀攀✀Ⰰ 琀漀瀀㨀 ✀㌀㔀瀀砀✀Ⰰ 爀椀最栀琀㨀 ✀㐀㘀瀀砀✀Ⰰ 眀椀搀琀栀㨀 ✀㄀瀀砀✀Ⰰ 栀攀椀最栀琀㨀 ✀㄀　瀀砀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 漀瀀愀挀椀琀礀㨀 　⸀㔀 紀紀㸀㰀⼀搀椀瘀㸀ഀഀ
              <div style={{ position: 'absolute', top: '22px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: 'var(--text-secondary)', background: '#FAF9F6', padding: '0 4px', fontFamily: 'monospace' }}>W: 650mm 卤5mm</div>਍ഀഀ
              <div style={{ position: 'absolute', top: '60px', right: '25px', bottom: '66px', width: '1px', background: 'var(--accent-secondary)', opacity: 0.5 }}></div>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀漀猀椀琀椀漀渀㨀 ✀愀戀猀漀氀甀琀攀✀Ⰰ 琀漀瀀㨀 ✀㘀　瀀砀✀Ⰰ 爀椀最栀琀㨀 ✀㈀　瀀砀✀Ⰰ 栀攀椀最栀琀㨀 ✀㄀瀀砀✀Ⰰ 眀椀搀琀栀㨀 ✀㄀　瀀砀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 漀瀀愀挀椀琀礀㨀 　⸀㔀 紀紀㸀㰀⼀搀椀瘀㸀ഀഀ
              <div style={{ position: 'absolute', bottom: '66px', right: '20px', height: '1px', width: '10px', background: 'var(--accent-secondary)', opacity: 0.5 }}></div>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀漀猀椀琀椀漀渀㨀 ✀愀戀猀漀氀甀琀攀✀Ⰰ 爀椀最栀琀㨀 ✀㠀瀀砀✀Ⰰ 琀漀瀀㨀 ✀㔀　─✀Ⰰ 琀爀愀渀猀昀漀爀洀㨀 ✀琀爀愀渀猀氀愀琀攀夀⠀ⴀ㔀　─⤀ 爀漀琀愀琀攀⠀㤀　搀攀最⤀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㘀㔀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀⌀䘀䄀䘀㤀䘀㘀✀Ⰰ 瀀愀搀搀椀渀最㨀 ✀　 㐀瀀砀✀Ⰰ 昀漀渀琀䘀愀洀椀氀礀㨀 ✀洀漀渀漀猀瀀愀挀攀✀ 紀紀㸀䠀㨀 㠀㔀　洀洀㰀⼀搀椀瘀㸀ഀഀ
਍              笀爀攀渀搀攀爀䌀栀愀椀爀匀嘀䜀⠀猀攀氀攀挀琀攀搀䘀愀戀爀椀挀Ⰰ 猀攀氀攀挀琀攀搀䰀攀最⤀紀ഀഀ
਍              笀⼀⨀ 䜀氀漀眀椀渀最 䠀漀琀猀瀀漀琀猀 ⨀⼀紀ഀഀ
              <div className="hotspot-marker" style={{ top: '110px', left: '100px' }}>਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀栀漀琀猀瀀漀琀ⴀ琀漀漀氀琀椀瀀∀㸀ഀഀ
                  <strong>{lang === "Cn" ? "搴у뿯宽뿯澽뿯붿뿯厽瑕뿯徽牸" : "Cushion Padding"}</strong><br/>਍                  笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㌀㔀欀最⼀洀붿뿯䊽㩩ᙪね뿯⎽붿붿⥙붿㑓칚붿᭲뿯綽붿䅛剴붿ཀྵ뿯붿뿯붿붿붿붿᭺뿯붿ड़奺뿯㾽　붿뿯ƽ뿯붿붿楀뿯붿붿뿯掽뿯媽娓붿│뿯붿? : "35kg/m뿯붿 high-resilience PU foam wrapped in fire barrier, passes 100k cycles durability."}਍                㰀⼀搀椀瘀㸀ഀഀ
              </div>਍ഀഀ
              <div className="hotspot-marker" style={{ top: '165px', left: '50px' }}>਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀栀漀琀猀瀀漀琀ⴀ琀漀漀氀琀椀瀀∀㸀ഀഀ
                  <strong>{lang === "Cn" ? "뿯妽呰吙뿯宽뿯ソ뿯梽" : "Leg Structure"}</strong><br/>਍                  笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㈀⸀㔀洀洀붿硯⑏偞뿯붿붿붿뿯붿붿붿뿯瞽ᵸ᭽⥴瀱⁯戀愀猀愀氀琀 붿❾ḱ붿♩붿붿뿯붿붿졸붿啮捭뿯冽ᱧ蛥㾒 㨀 ∀㈀⸀㔀洀洀 栀攀愀瘀礀ⴀ最愀甀最攀 挀漀氀搀 猀琀攀攀氀 昀爀愀洀攀Ⰰ 洀愀琀琀攀 䈀愀猀愀氀琀 䈀氀愀挀欀 昀椀渀最攀爀瀀爀椀渀琀ⴀ瀀爀漀漀昀 攀氀攀挀琀爀漀猀琀愀琀椀挀 挀漀愀琀椀渀最⸀∀紀ഀഀ
                </div>਍              㰀⼀搀椀瘀㸀ഀഀ
਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀栀漀琀猀瀀漀琀ⴀ洀愀爀欀攀爀∀ 猀琀礀氀攀㴀笀笀 琀漀瀀㨀 ✀㜀　瀀砀✀Ⰰ 氀攀昀琀㨀 ✀㄀㌀㔀瀀砀✀ 紀紀㸀ഀഀ
                <div className="hotspot-tooltip">਍                  㰀猀琀爀漀渀最㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀저붿ᝲ䱑뿯傽坣뿯碽뿯붿붿붿㽛 㨀 ∀䈀愀挀欀 䄀渀最氀攀∀紀㰀⼀猀琀爀漀渀最㸀㰀戀爀⼀㸀ഀഀ
                  {lang === "Cn" ? "105뿯掽浜洪뿯玽뿯宽뿯ソ붿붿繑붿붿뿯榽奐붿붿붿୐뿯쮽䆓籒붿ⵙᵛ뿯붿뿯붿붿붿붿뿯붿쵫粓㙑剞뿯붿뿯檽⁮搀㉓洀洀 伀뿯䆽붿㼠 㨀 ∀㄀　㔀붿⁣攀爀最漀渀漀洀椀挀 最漀氀搀攀渀 琀椀氀琀⸀ 䘀爀愀洀攀 猀琀爀甀挀琀甀爀愀氀 眀攀氀搀椀渀最 琀漀氀攀爀愀渀挀攀 椀猀 猀琀爀椀挀琀氀礀 甀渀搀攀爀 搀㉓洀洀⸀∀紀ഀഀ
                </div>਍              㰀⼀搀椀瘀㸀ഀഀ
਍              笀⼀⨀ 䄀瀀瀀爀漀瘀攀搀 䤀渀欀 匀椀最渀愀琀甀爀攀 ⠀匀　㐀⤀ ⨀⼀紀ഀഀ
              {(signatureApproved || stageId !== "S04") && (਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀猀椀最渀愀琀甀爀攀ⴀ戀漀砀∀㸀ഀഀ
                  <div className="signature-label">{lang === "Cn" ? "瀵╂뿯墽뿯纽藉뿯悽 / Approved by" : "Review Sign-Off"}</div>਍                  㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀笀怀猀椀最渀愀琀甀爀攀ⴀ昀漀渀琀 ␀笀猀椀最渀愀琀甀爀攀䄀瀀瀀爀漀瘀攀搀 簀簀 猀琀愀最攀䤀搀 ℀㴀㴀 ∀匀　㐀∀ 㼀 ∀猀椀最渀攀搀∀ 㨀 ∀∀紀怀紀㸀䌀栀漀 䌀栀攀渀㰀⼀猀瀀愀渀㸀ഀഀ
                </div>਍              ⤀紀ഀഀ
              ਍              㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀戀氀甀攀瀀爀椀渀琀ⴀ猀挀愀氀攀ⴀ琀愀最∀㸀匀䌀䄀䰀䔀 ㄀㨀㄀㈀ 簀 唀一䤀吀㨀 䴀䴀 簀 吀伀䰀䔀刀䄀一䌀䔀㨀 搀㉓洀洀㰀⼀猀瀀愀渀㸀ഀഀ
            </div>਍ഀഀ
            {stageId === "S04" && !signatureApproved && (਍              㰀戀甀琀琀漀渀 挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ瀀爀攀洀椀甀洀∀ 猀琀礀氀攀㴀笀笀 眀椀搀琀栀㨀 ✀㄀　　─✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀　⸀㠀爀攀洀✀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀挀攀渀琀攀爀✀ 紀紀 漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 笀 猀攀琀匀椀最渀愀琀甀爀攀䄀瀀瀀爀漀瘀攀搀⠀琀爀甀攀⤀㬀 栀愀渀搀氀攀䌀栀漀䄀瀀瀀爀漀瘀愀氀⠀⤀㬀 紀紀㸀ഀഀ
                붿뿯嶽笍 {lang === "Cn" ? "뿯붿戝뿯冽뿯纽붿獚瑕뿯徽牸붿뿯½붿붿뿯岽붿瀛楁뿯施琛? : "Review Specs & Sign-Off Block"}਍              㰀⼀戀甀琀琀漀渀㸀ഀഀ
            )}਍          㰀⼀搀椀瘀㸀ഀഀ
        </div>਍      ⤀㬀ഀഀ
    }਍ഀഀ
    // 2. S05: Crib 5 Test chamber਍    椀昀 ⠀猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀　㔀∀⤀ 笀ഀഀ
      const selectedFabObj = mockData.fabrics.find(f => f.id === selectedFabric);਍      爀攀琀甀爀渀 ⠀ഀഀ
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ栀攀愀搀攀爀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀爀最戀愀⠀㄀㘀㘀Ⰰ ㄀㌀㈀Ⰰ ㄀㈀㠀Ⰰ 　⸀　㌀⤀✀ 紀紀㸀ഀഀ
            <div className="panel-title">뿯붿敟 {lang === "Cn" ? "붿卞湅 Crib 5 娑堥뿯榽붿뿯冽噿闃붿噧娓붿│붿? : "UK Crib 5 Fire Ignition Testing Rig"}</div>਍            㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀氀漀最漀ⴀ戀愀搀最攀∀ 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ爀攀搀⤀✀ 紀紀㸀䌀伀䴀倀䰀䤀䄀一䌀䔀 䜀䄀吀䔀㰀⼀猀瀀愀渀㸀ഀഀ
          </div>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ戀漀搀礀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
            <div className="crib5-rig">਍              笀爀攀渀搀攀爀䌀栀愀椀爀匀嘀䜀⠀猀攀氀攀挀琀攀搀䘀愀戀爀椀挀Ⰰ 猀攀氀攀挀琀攀搀䰀攀最Ⰰ 挀爀椀戀㔀吀攀猀琀匀琀愀琀甀猀 㴀㴀㴀 ∀爀甀渀渀椀渀最∀ 㼀 笀 昀椀氀琀攀爀㨀 ✀戀爀椀最栀琀渀攀猀猀⠀　⸀㤀⤀ 挀漀渀琀爀愀猀琀⠀㄀⸀㄀⤀✀ 紀 㨀 笀紀⤀紀ഀഀ
              ਍              笀⼀⨀ 䘀氀愀洀攀 䔀昀昀攀挀琀 伀瘀攀爀氀愀礀 ⨀⼀紀ഀഀ
              <div className={`flame-effect-layer ${crib5TestStatus === "running" ? "active" : ""}`}>਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀昀氀愀洀攀ⴀ瀀愀爀琀椀挀氀攀∀㸀㰀⼀搀椀瘀㸀ഀഀ
                <div className="flame-inner"></div>਍              㰀⼀搀椀瘀㸀ഀഀ
਍              笀⼀⨀ 䐀椀猀琀爀攀猀猀攀搀 圀愀砀 匀琀愀洀瀀 ⨀⼀紀ഀഀ
              {crib5TestStatus === "passed" && (਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀眀愀砀ⴀ猀琀愀洀瀀ⴀ漀瘀攀爀氀愀礀 猀琀愀洀瀀攀搀 猀琀愀洀瀀ⴀ瀀愀猀猀∀㸀ഀഀ
                  Crib 5 Passed਍                㰀⼀搀椀瘀㸀ഀഀ
              )}਍              笀挀爀椀戀㔀吀攀猀琀匀琀愀琀甀猀 㴀㴀㴀 ∀昀愀椀氀攀搀∀ ☀☀ ⠀ഀഀ
                <div className="wax-stamp-overlay stamped stamp-fail">਍                  䌀爀椀戀 㔀 䈀氀漀挀欀攀搀ഀഀ
                </div>਍              ⤀紀ഀഀ
਍              笀挀爀椀戀㔀吀攀猀琀匀琀愀琀甀猀 㴀㴀㴀 ∀椀搀氀攀∀ ☀☀ ⠀ഀഀ
                <div style={{ position: 'absolute', background: 'rgba(28,27,24,0.7)', color: 'white', padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '2px', textAlign: 'center' }}>਍                  笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿湛⽔뿯좽↕붿㩧 ∀ 㨀 ∀吀愀爀最攀琀 匀眀愀琀挀栀㨀 ∀紀㰀猀琀爀漀渀最㸀笀猀攀氀攀挀琀攀搀䘀愀戀伀戀樀⸀渀愀洀攀紀㰀⼀猀琀爀漀渀最㸀㰀戀爀⼀㸀ഀഀ
                  <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{lang === "Cn" ? "뿯榽뿯炽搳뿯涽嬫뿯枽뿯붿夐뿯垽붿뿯熽뿯媽 10 뿯纽뿯掽ā뿯붿붿伀붿扮噧붿뿯掽붿瑭? : "Click below to initiate 10s flame test"}</span>਍                㰀⼀搀椀瘀㸀ഀഀ
              )}਍            㰀⼀搀椀瘀㸀ഀഀ
਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀昀椀爀攀ⴀ最愀甀最攀ⴀ挀愀爀搀∀㸀ഀഀ
              <div className="fire-gauge-row">਍                㰀猀瀀愀渀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀ᔀ뿯붿网ፖ͚뿯ʽ붿뿯붿붿≛ 㨀 ∀䘀氀愀洀攀 吀攀猀琀 䔀砀瀀漀猀甀爀攀∀紀㰀⼀猀瀀愀渀㸀ഀഀ
                <span style={{ fontFamily: 'monospace' }}>{crib5Progress}%</span>਍              㰀⼀搀椀瘀㸀ഀഀ
              <div className="fire-progress-bar">਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀昀椀爀攀ⴀ瀀爀漀最爀攀猀猀ⴀ昀椀氀氀∀ 猀琀礀氀攀㴀笀笀 眀椀搀琀栀㨀 怀␀笀挀爀椀戀㔀倀爀漀最爀攀猀猀紀─怀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 挀爀椀戀㔀吀攀猀琀匀琀愀琀甀猀 㴀㴀㴀 ∀昀愀椀氀攀搀∀ 㼀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ爀攀搀⤀✀ 㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 紀紀㸀㰀⼀搀椀瘀㸀ഀഀ
              </div>਍ഀഀ
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem' }}>਍                㰀戀甀琀琀漀渀 ഀഀ
                  className="btn-premium" ਍                  猀琀礀氀攀㴀笀笀 昀氀攀砀㨀 ㄀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀挀攀渀琀攀爀✀ 紀紀 ഀഀ
                  onClick={handleStartCrib5Test}਍                  搀椀猀愀戀氀攀搀㴀笀挀爀椀戀㔀吀攀猀琀匀琀愀琀甀猀 㴀㴀㴀 ∀爀甀渀渀椀渀最∀紀ഀഀ
                >਍                  붿뿯붿⁫笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀椀뿯붿ᅵ뿯ួ뿯䎽붿ᕠ뿯붿网쵖붿뿯붿뿯⊽ 㨀 ∀吀爀椀最最攀爀 䌀爀椀戀 㔀 䈀甀爀渀∀紀ഀഀ
                </button>਍                笀挀爀椀戀㔀吀攀猀琀匀琀愀琀甀猀 㴀㴀㴀 ∀昀愀椀氀攀搀∀ ☀☀ ⠀ഀഀ
                  <button ਍                    挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ猀攀挀漀渀搀愀爀礀∀ ഀഀ
                    style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}਍                    漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 笀ഀഀ
                      setSelectedFabric("FAB-02"); // auto replace with safe Linen਍                      猀攀琀䌀爀椀戀㔀吀攀猀琀匀琀愀琀甀猀⠀∀椀搀氀攀∀⤀㬀ഀഀ
                      setCrib5Progress(0);਍                      愀搀搀䰀漀最⠀∀䌀栀漀∀Ⰰ ∀붿⅙⼲뿯劽뿯溽Ⅲൣ≿ᘲ붿뿯䊽ऄ婻뿯⎽붿뿯ᮽ뿯粽붿붿뿯붿字붿뿯붿灭쉯ᆓ摫᭐뿯䂽⵫㐀㐀㄀　 ⠀㐀붿붿붿뿯붿㵝祼㽩∀Ⰰ ∀䐀攀琀攀挀琀攀搀 挀爀椀琀椀挀愀氀 渀漀渀ⴀ挀漀洀瀀氀椀愀渀挀攀 漀渀 匀椀氀欀⸀ 匀眀愀瀀瀀攀搀 昀愀戀爀椀挀 琀漀㨀 䰀ⴀ㐀㐀㄀　 ⠀一愀瘀礀 䌀氀愀猀猀椀挀 䰀椀渀攀渀⤀ 眀椀琀栀 漀渀攀 挀氀椀挀欀⸀∀⤀㬀ഀഀ
                    }}਍                  㸀ഀഀ
                    뿯붿攧 {lang === "Cn" ? "뿯涽뿯₽뿯붿甸뿯檽뿯纽氭浛뿯붿? : "Bypass with Linen"}਍                  㰀⼀戀甀琀琀漀渀㸀ഀഀ
                )}਍              㰀⼀搀椀瘀㸀ഀഀ
            </div>਍          㰀⼀搀椀瘀㸀ഀഀ
        </div>਍      ⤀㬀ഀഀ
    }਍ഀഀ
    // 3. S06, S07: RFQ Dispatched and Multi-Factory Comparisons਍    椀昀 ⠀猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀　㘀∀ 簀簀 猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀　㜀∀⤀ 笀ഀഀ
      return (਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀 愀渀椀洀愀琀攀ⴀ昀愀搀攀ⴀ椀渀∀ 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀䈀漀琀琀漀洀㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
          <div className="panel-header" style={{ background: 'rgba(255,159,67,0.03)' }}>਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ琀椀琀氀攀∀㸀䄀뿯ᮽ൙⁻笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀眀뿯䒽뿯붿噚뿯㾽刀䘀儀 붿뿯碽≑浫⁴倲❑뿯碽붿眠兏뿯䞽뿯㾽 㨀 ∀䄀甀琀漀洀愀琀攀搀 刀䘀儀 䴀愀椀氀攀爀 䐀愀攀洀漀渀∀紀㰀⼀搀椀瘀㸀ഀഀ
          </div>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ戀漀搀礀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀㄀爀攀洀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀⌀䘀㐀䘀㈀䔀䔀✀Ⰰ 戀漀爀搀攀爀㨀 ✀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀✀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㈀瀀砀✀Ⰰ 瀀漀猀椀琀椀漀渀㨀 ✀爀攀氀愀琀椀瘀攀✀ 紀紀㸀ഀഀ
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold' }}>਍                  㰀猀瀀愀渀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀倀䐀䘀 洀⁴倲啑붿硟읲㾓붿佑붿뿯붿≺ 㨀 ∀匀瀀攀挀猀 倀愀挀欀愀最攀 䌀漀洀瀀椀氀攀搀∀紀㰀⼀猀瀀愀渀㸀ഀഀ
                  <span style={{ color: 'var(--accent-primary)', fontSize: '0.7rem' }}>SIZE: 2.4 MB</span>਍                㰀⼀搀椀瘀㸀ഀഀ
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>਍                  笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀쐀붿≒᭫뿯㎽剫䄀䘀吀ⴀ㈀　㈀㘀　㔀ⴀ　㄀ⴀ刀䘀儀开匀瀀攀挀椀昀椀挀愀琀椀漀渀⸀瀀搀昀 ⠀⼀ᕵၘ繭붿붿뿯춽㪓붿砠붿䅛붿붿뿯붿붿붿뿯붿㽙∀ 㨀 ∀䄀琀琀愀挀栀洀攀渀琀㨀 䌀刀䄀䘀吀ⴀ㈀　㈀㘀　㔀ⴀ　㄀ⴀ刀䘀儀开匀瀀攀挀椀昀椀挀愀琀椀漀渀⸀瀀搀昀 ⠀䤀渀挀氀甀搀攀猀 戀椀氀椀渀最甀愀氀 䌀䄀䐀 ☀ 瘀漀氀甀洀攀 氀椀洀椀琀猀⤀∀紀ഀഀ
                </div>਍                ഀഀ
                {rfqDispatched && (਍                  㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀漀猀椀琀椀漀渀㨀 ✀愀戀猀漀氀甀琀攀✀Ⰰ 琀漀瀀㨀 　Ⰰ 氀攀昀琀㨀 　Ⰰ 爀椀最栀琀㨀 　Ⰰ 戀漀琀琀漀洀㨀 　Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀爀最戀愀⠀㈀㔀㔀Ⰰ㈀㔀㔀Ⰰ㈀㔀㔀Ⰰ　⸀㤀㈀⤀✀Ⰰ 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 愀氀椀最渀䤀琀攀洀猀㨀 ✀挀攀渀琀攀爀✀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀挀攀渀琀攀爀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀Ⰰ 昀漀渀琀圀攀椀最栀琀㨀 ✀戀漀氀搀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㠀爀攀洀✀ 紀紀㸀ഀഀ
                    붿?{lang === "Cn" ? "뿯붿典欢뿯宽뿯掽뿯厽뿯붿告뿯妽뿯붿뿯侽細浣뿯涽北뿯붿戦뿯檽뿯붿佹뿯澽붿뿯炽뿯殽瀹붿뿯붿罙붿붿≏붿칛ঘ佺뿯䲽붿붿뿯㾽 㨀 ∀刀䘀儀猀 䐀椀猀瀀愀琀挀栀攀搀 琀漀 ㌀ 倀愀爀琀渀攀爀 䴀椀氀氀猀 瘀椀愀 匀䴀吀倀∀紀ഀഀ
                  </div>਍                ⤀紀ഀഀ
              </div>਍ഀഀ
              {!rfqDispatched ? (਍                㰀戀甀琀琀漀渀 挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ瀀爀攀洀椀甀洀∀ 猀琀礀氀攀㴀笀笀 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀挀攀渀琀攀爀✀ 紀紀 漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 笀 猀攀琀刀昀焀䐀椀猀瀀愀琀挀栀攀搀⠀琀爀甀攀⤀㬀 愀搀搀䰀漀最⠀∀伀瀀攀渀䌀氀愀眀 儀甀漀琀愀琀椀漀渀䄀最攀渀琀∀Ⰰ ∀∀뿯붿붿偗䐀䘀唀붿硟읲榓뿯ᶽ佽뿯⢽붿啖뿯붿Ṧ뿯⊽뿯㾽匀䴀吀倀 붿뿯碽≑ݫ붿붿睪뿯㾽㌀ 㤀㕰뿯炽婒뿯ᶽၢ붿붿붿㼠Ⰰ ∀䜀攀渀攀爀愀琀攀搀 倀䐀䘀 猀瀀攀挀椀昀椀挀愀琀椀漀渀 猀栀攀攀琀Ⰰ 愀甀琀漀洀愀琀椀挀愀氀氀礀 挀愀氀氀椀渀最 匀䴀吀倀 琀漀 搀椀猀瀀愀琀挀栀 刀䘀儀猀 琀漀 ㌀ 琀愀爀最攀琀 昀愀挀琀漀爀椀攀猀⸀∀⤀㬀 紀紀㸀ഀഀ
                  뿯붿摛 {lang === "Cn" ? "붿붿뿯媽缇뿯ソ뿯檽瑭㈠児뿯붿典欢" : "Compile & Dispatch RFQs"}਍                㰀⼀戀甀琀琀漀渀㸀ഀഀ
              ) : (਍                㰀搀椀瘀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 戀漀爀搀攀爀吀漀瀀㨀 ✀㄀瀀砀 搀愀猀栀攀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀✀Ⰰ 瀀愀搀搀椀渀最吀漀瀀㨀 ✀　⸀㠀爀攀洀✀ 紀紀㸀ഀഀ
                  <strong style={{ color: 'var(--text-primary)' }}>{lang === "Cn" ? "뿯宽뿯ソ뿯粽붿뿯嶽뿯붿붿붿伣붿ㄧ뿯媽뿯붿嬶細" : "Factory Mail Feed Daemon:"}</strong><br/>਍                  㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 最愀瀀㨀 ✀㔀瀀砀✀Ⰰ 愀氀椀最渀䤀琀攀洀猀㨀 ✀挀攀渀琀攀爀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀㐀瀀砀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 紀紀㸀ഀഀ
                    <span className="stage-badge-dot dot-completed"></span>਍                    笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀挀붿᝭붿뿯⚽붿㥪붿뿯붿붿㽛⠀붿붿ᙣ붿붿뿯梽䵲뿯碽ぶ坽㨀 ␀㄀㤀㔀⤀∀ 㨀 ∀䘀漀猀栀愀渀 䜀漀氀搀ⴀ匀甀渀 ⠀刀攀琀甀爀渀攀搀 儀甀漀琀攀㨀 圀㨀 ␀㄀㤀㔀⤀∀紀ഀഀ
                  </div>਍                  㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 最愀瀀㨀 ✀㔀瀀砀✀Ⰰ 愀氀椀最渀䤀琀攀洀猀㨀 ✀挀攀渀琀攀爀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀㐀瀀砀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 紀紀㸀ഀഀ
                    <span className="stage-badge-dot dot-completed"></span>਍                    笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀준붿뿯⪽⡞뿯붿붿뿯붿͙붿㤀붿뿯붿⁓⠀붿붿ᙣ붿붿뿯梽䵲뿯碽ぶ坽㨀 ␀㄀㠀㔀⤀∀ 㨀 ∀䐀漀渀最最甀愀渀 刀漀礀愀氀 伀愀欀 ⠀刀攀琀甀爀渀攀搀 儀甀漀琀攀㨀 圀㨀 ␀㄀㠀㔀⤀∀紀ഀഀ
                  </div>਍                  㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 最愀瀀㨀 ✀㔀瀀砀✀Ⰰ 愀氀椀最渀䤀琀攀洀猀㨀 ✀挀攀渀琀攀爀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀㐀瀀砀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 紀紀㸀ഀഀ
                    <span className="stage-badge-dot dot-completed"></span>਍                    笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀쬀붿붿൵붿d硔뿯붿붿㥎붿뿯㎽⁷⠀붿붿ᙣ붿붿뿯梽䵲뿯碽ぶ坽㨀 ␀㈀㌀　⤀∀ 㨀 ∀匀栀甀渀搀攀 䌀氀愀猀猀椀挀 䌀漀洀昀漀爀琀 ⠀刀攀琀甀爀渀攀搀 儀甀漀琀攀㨀 圀㨀 ␀㈀㌀　⤀∀紀ഀഀ
                  </div>਍                㰀⼀搀椀瘀㸀ഀഀ
              )}਍            㰀⼀搀椀瘀㸀ഀഀ
          </div>਍        㰀⼀搀椀瘀㸀ഀഀ
      );਍    紀ഀഀ
਍    ⼀⼀ 㐀⸀ 匀　㠀㨀 䌀栀漀 匀攀氀攀挀琀椀漀渀 匀甀瀀瀀氀椀攀爀 氀愀礀漀甀琀ഀഀ
    if (stageId === "S08") {਍      爀攀琀甀爀渀 ⠀ഀഀ
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ栀攀愀搀攀爀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀爀最戀愀⠀㈀㔀㔀Ⰰ㄀㔀㤀Ⰰ㘀㜀Ⰰ　⸀　㔀⤀✀ 紀紀㸀ഀഀ
            <div className="panel-title" style={{ color: 'var(--accent-orange)' }}>붿栵笍 {lang === "Cn" ? "뿯涽਍붿뿯媽뿯Ჽ붿恽䕭뿯Ⴝ붿붿붿獪뿯붿뿯⺽䵶뿯炽붿쭗㾓 㨀 ∀匀甀瀀瀀氀椀攀爀 䈀椀搀 䴀愀琀爀椀砀 ☀ 䄀䤀 䄀渀愀氀礀猀椀猀∀紀㰀⼀搀椀瘀㸀ഀഀ
          </div>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ戀漀搀礀∀ 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 昀氀攀砀䐀椀爀攀挀琀椀漀渀㨀 ✀挀漀氀甀洀渀✀Ⰰ 最愀瀀㨀 ✀　⸀㠀爀攀洀✀ 紀紀㸀ഀഀ
            {mockData.supplierBids.map((bid, bidx) => (਍              㰀搀椀瘀 ഀഀ
                key={bidx} ਍                猀琀礀氀攀㴀笀笀 ഀഀ
                  padding: '1rem', ਍                  戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㈀瀀砀✀Ⰰ ഀഀ
                  border: selectedSupplier?.name === bid.name ? '1px solid var(--text-primary)' : '1px solid var(--glass-border)', ਍                  戀愀挀欀最爀漀甀渀搀㨀 猀攀氀攀挀琀攀搀匀甀瀀瀀氀椀攀爀㼀⸀渀愀洀攀 㴀㴀㴀 戀椀搀⸀渀愀洀攀 㼀 ✀⌀昀昀昀昀昀昀✀ 㨀 ✀瘀愀爀⠀ⴀⴀ戀最ⴀ瀀爀椀洀愀爀礀⤀✀Ⰰ ഀഀ
                  cursor: 'pointer', ਍                  琀爀愀渀猀椀琀椀漀渀㨀 ✀愀氀氀 　⸀㌀猀✀ ഀഀ
                }} ਍                漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 栀愀渀搀氀攀匀攀氀攀挀琀匀甀瀀瀀氀椀攀爀⠀戀椀搀⤀紀 ഀഀ
                className="glass-card"਍              㸀ഀഀ
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-primary)' }}>਍                  㰀猀瀀愀渀㸀笀戀椀搀⸀渀愀洀攀紀㰀⼀猀瀀愀渀㸀ഀഀ
                  <span style={{ color: 'var(--accent-primary)' }}>${bid.pricePerChair}/chair</span>਍                㰀⼀搀椀瘀㸀ഀഀ
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>਍                  㰀猀瀀愀渀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 怀붿붿愰㩮 ␀笀戀椀搀⸀搀攀氀椀瘀攀爀礀䐀愀礀猀紀 붿붿‰㨀 怀䰀攀愀搀 吀椀洀攀㨀 ␀笀戀椀搀⸀搀攀氀椀瘀攀爀礀䐀愀礀猀紀 䐀愀礀猀怀紀㰀⼀猀瀀愀渀㸀ഀഀ
                  <span>{lang === "Cn" ? `붿堟牸붿? ${bid.qualityScore}` : `QC Score: ${bid.qualityScore}`}</span>਍                  㰀猀瀀愀渀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 怀붿붿㘀뿯㪽 ␀笀戀椀搀⸀爀攀氀椀愀戀椀氀椀琀礀紀怀 㨀 怀刀攀氀椀愀戀椀氀椀琀礀㨀 ␀笀戀椀搀⸀爀攀氀椀愀戀椀氀椀琀礀紀怀紀㰀⼀猀瀀愀渀㸀ഀഀ
                </div>਍                㰀搀椀瘀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㈀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ洀甀琀攀搀⤀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀　⸀㔀爀攀洀✀Ⰰ 戀漀爀搀攀爀吀漀瀀㨀 ✀㄀瀀砀 搀愀猀栀攀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀✀Ⰰ 瀀愀搀搀椀渀最吀漀瀀㨀 ✀　⸀㐀爀攀洀✀ 紀紀㸀ഀഀ
                  AI 뿯宽붿붿: {bid.note}਍                㰀⼀搀椀瘀㸀ഀഀ
              </div>਍            ⤀⤀紀ഀഀ
          </div>਍        㰀⼀搀椀瘀㸀ഀഀ
      );਍    紀ഀഀ
਍    ⼀⼀ 㔀⸀ 匀　㤀Ⰰ 匀㄀　㨀 䘀愀挀琀漀爀礀 儀刀 䰀椀渀欀 ☀ 圀栀愀琀猀䄀瀀瀀 䘀漀氀氀漀眀 甀瀀ഀഀ
    if (stageId === "S09" || stageId === "S10") {਍      爀攀琀甀爀渀 ⠀ഀഀ
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ栀攀愀搀攀爀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀爀最戀愀⠀㄀㈀㐀Ⰰ㄀㄀㐀Ⰰ㄀　㌀Ⰰ　⸀　㌀⤀✀ 紀紀㸀ഀഀ
            <div className="panel-title">뿯붿彮 {lang === "Cn" ? "杌婇뿯枽붿뿯悽牬붿╂뿯枽뿯붿뿯冽뿯Ⓗ붿뿯嚽敓붿㈠뿯붿鏅뿯傽뿯窽뿯붿? : "Factory QR Flow & Realtime Progress"}</div>਍          㰀⼀搀椀瘀㸀ഀഀ
          <div className="panel-body" style={{ padding: '1rem' }}>਍            㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 最愀瀀㨀 ✀㄀爀攀洀✀Ⰰ 愀氀椀最渀䤀琀攀洀猀㨀 ✀挀攀渀琀攀爀✀ 紀紀㸀ഀഀ
              <div style={{ background: '#ffffff', border: '1px solid var(--glass-border)', padding: '0.4rem', borderRadius: '2px' }}>਍                㰀猀瘀最 瘀椀攀眀䈀漀砀㴀∀　 　 ㄀　　 ㄀　　∀ 眀椀搀琀栀㴀∀㠀　∀ 栀攀椀最栀琀㴀∀㠀　∀㸀ഀഀ
                  <rect x="0" y="0" width="100" height="100" fill="#FAF9F6" />਍                  㰀爀攀挀琀 砀㴀∀㄀　∀ 礀㴀∀㄀　∀ 眀椀搀琀栀㴀∀㈀㔀∀ 栀攀椀最栀琀㴀∀㈀㔀∀ 昀椀氀氀㴀∀⌀㄀䌀㄀䈀㄀㠀∀ ⼀㸀ഀഀ
                  <rect x="15" y="15" width="15" height="15" fill="#FAF9F6" />਍                  㰀爀攀挀琀 砀㴀∀㄀㠀∀ 礀㴀∀㄀㠀∀ 眀椀搀琀栀㴀∀㤀∀ 栀攀椀最栀琀㴀∀㤀∀ 昀椀氀氀㴀∀⌀㄀䌀㄀䈀㄀㠀∀ ⼀㸀ഀഀ
                  ਍                  㰀爀攀挀琀 砀㴀∀㘀㔀∀ 礀㴀∀㄀　∀ 眀椀搀琀栀㴀∀㈀㔀∀ 栀攀椀最栀琀㴀∀㈀㔀∀ 昀椀氀氀㴀∀⌀㄀䌀㄀䈀㄀㠀∀ ⼀㸀ഀഀ
                  <rect x="70" y="15" width="15" height="15" fill="#FAF9F6" />਍                  㰀爀攀挀琀 砀㴀∀㜀㌀∀ 礀㴀∀㄀㠀∀ 眀椀搀琀栀㴀∀㤀∀ 栀攀椀最栀琀㴀∀㤀∀ 昀椀氀氀㴀∀⌀㄀䌀㄀䈀㄀㠀∀ ⼀㸀ഀഀ
਍                  㰀爀攀挀琀 砀㴀∀㄀　∀ 礀㴀∀㘀㔀∀ 眀椀搀琀栀㴀∀㈀㔀∀ 栀攀椀最栀琀㴀∀㈀㔀∀ 昀椀氀氀㴀∀⌀㄀䌀㄀䈀㄀㠀∀ ⼀㸀ഀഀ
                  <rect x="15" y="70" width="15" height="15" fill="#FAF9F6" />਍                  㰀爀攀挀琀 砀㴀∀㄀㠀∀ 礀㴀∀㜀㌀∀ 眀椀搀琀栀㴀∀㤀∀ 栀攀椀最栀琀㴀∀㤀∀ 昀椀氀氀㴀∀⌀㄀䌀㄀䈀㄀㠀∀ ⼀㸀ഀഀ
਍                  㰀爀攀挀琀 砀㴀∀㐀㔀∀ 礀㴀∀㐀㔀∀ 眀椀搀琀栀㴀∀㄀　∀ 栀攀椀最栀琀㴀∀㄀　∀ 昀椀氀氀㴀∀⌀㄀䌀㄀䈀㄀㠀∀ ⼀㸀ഀഀ
                  <rect x="55" y="65" width="15" height="10" fill="#1C1B18" />਍                  㰀爀攀挀琀 砀㴀∀㜀㔀∀ 礀㴀∀㜀㔀∀ 眀椀搀琀栀㴀∀㄀㔀∀ 栀攀椀最栀琀㴀∀㄀㔀∀ 昀椀氀氀㴀∀⌀㄀䌀㄀䈀㄀㠀∀ ⼀㸀ഀഀ
                </svg>਍              㰀⼀搀椀瘀㸀ഀഀ
              <div style={{ flex: 1, fontSize: '0.75rem', lineHeight: '1.4' }}>਍                㰀猀琀爀漀渀最 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀✀ 紀紀㸀儀刀㨀 䌀刀䄀䘀吀ⴀ㈀　㈀㘀ⴀ　㄀ⴀ䤀吀䔀䴀　㄀㰀⼀猀琀爀漀渀最㸀㰀戀爀⼀㸀ഀഀ
                <span style={{ color: 'var(--text-secondary)' }}>਍                  笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿붿붿붿붿䤰≬뿯▽붿뿯즽ຓ붿붿뿯붿ᵟ뿯纽硷紝붿存帴瑾뿯垽彇 Supabase 灏뿯嶽噳 3D 뿯纽愭붿붿붿春뿯㖽ᵨ쥽붿붿䱹䝧붿⩧뿯⺽Ὓ晜뿯⮽Ѩ䭹뿯㚽Ὤ붿⍴붿㼠 㨀 ∀圀漀爀欀攀爀猀 猀挀愀渀 琀栀椀猀 琀愀最 琀漀 昀攀琀挀栀 搀攀猀椀最渀 搀爀愀眀椀渀最猀 搀礀渀愀洀椀挀愀氀氀礀 昀爀漀洀 匀甀瀀愀戀愀猀攀⸀ 䴀椀渀椀洀椀稀攀猀 氀愀礀漀甀琀 攀爀爀漀爀猀⸀∀紀ഀഀ
                </span>਍              㰀⼀搀椀瘀㸀ഀഀ
            </div>਍ഀഀ
            <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', fontSize: '0.75rem' }}>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 昀漀渀琀圀攀椀最栀琀㨀 ✀戀漀氀搀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ漀爀愀渀最攀⤀✀ 紀紀㸀ഀഀ
                뿯붿뿯殽 {lang === "Cn" ? "浜뿯ソ湡붿╅붿 15 뿯澽?- 뿯榽뿯冽뿯墽뿯梽ㄩ뿯殽뿯璽붿뿯憽" : "Delivery Warning: 15 Days Remaining"}਍              㰀⼀搀椀瘀㸀ഀഀ
              <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>਍                笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀䄀䤀 붿붿붿睨≴筘❵뿯붿뿯붿붿뿯⚽붿붿붿붿졼䖓뿯붿앛붿ɐ䱻뿯殽뿯炽붿뿯䶽뿯붿붿붿᭛뿯붿붿뿯붿幾붿睶뿯䒽뿯붿彚뿯붿붿⁚圀栀愀琀猀䄀瀀瀀 䰀뿯ν뿯붿뫧⎕붿붿뿯㾽 㨀 ∀䄀䤀 洀漀搀攀氀 搀攀琀攀挀琀攀搀 搀攀氀愀礀猀 漀渀 一愀渀猀栀愀 搀漀挀欀 猀挀栀攀搀甀氀椀渀最⸀ 䄀甀琀漀洀愀琀攀搀 圀栀愀琀猀䄀瀀瀀 椀渀焀甀椀爀礀 椀猀 琀爀椀最最攀爀攀搀⸀∀紀ഀഀ
              </div>਍            㰀⼀搀椀瘀㸀ഀഀ
          </div>਍        㰀⼀搀椀瘀㸀ഀഀ
      );਍    紀ഀഀ
਍    ⼀⼀ 㘀⸀ 匀㄀㄀㨀 䄀䤀 䌀嘀 䤀渀猀瀀攀挀琀椀漀渀ഀഀ
    if (stageId === "S11") {਍      爀攀琀甀爀渀 ⠀ഀഀ
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ栀攀愀搀攀爀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀爀最戀愀⠀㄀㈀㔀Ⰰ ㄀㐀㌀Ⰰ ㄀㈀㌀Ⰰ 　⸀　㔀⤀✀ 紀紀㸀ഀഀ
            <div className="panel-title" style={{ color: 'var(--accent-green)' }}>뿯붿뿯憽붿?{lang === "Cn" ? "AI CV 鏅붿兘붿栫礄붿뿯嚽뿯붿붿╅噸붿堟瘮灏? : "AI CV Photo-to-CAD Overlap Inspection"}</div>਍            㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀氀漀最漀ⴀ戀愀搀最攀∀ 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 紀紀㸀倀䄀匀匀 㤀㠀⸀㈀─㰀⼀猀瀀愀渀㸀ഀഀ
          </div>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ戀漀搀礀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
            <div className="cv-container">਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀挀瘀ⴀ瀀栀漀琀漀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀䤀洀愀最攀㨀 ∀甀爀氀⠀✀栀琀琀瀀猀㨀⼀⼀椀洀愀最攀猀⸀甀渀猀瀀氀愀猀栀⸀挀漀洀⼀瀀栀漀琀漀ⴀ㄀㔀㘀㜀㔀㌀㠀　㤀㘀㘀㌀　ⴀ攀　挀㔀㔀戀搀㘀㌀㜀㐀挀㼀愀甀琀漀㴀昀漀爀洀愀琀☀昀椀琀㴀挀爀漀瀀☀眀㴀㘀　　☀焀㴀㠀　✀⤀∀ 紀紀㸀㰀⼀搀椀瘀㸀ഀഀ
              <div className="cv-overlay-text">LIVE PHOTO: FOSHAN GOLD-SUN ST-01</div>਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀挀瘀ⴀ最爀椀搀ⴀ氀椀渀攀∀㸀㰀⼀搀椀瘀㸀ഀഀ
            </div>਍            㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀猀瀀愀挀攀ⴀ戀攀琀眀攀攀渀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀　⸀㠀爀攀洀✀ 紀紀㸀ഀഀ
              <span>{lang === "Cn" ? "뿯붿뿯厽뿯綽杓붿붿뿯붿붿㑠㽤⠀䌀䄀䐀 伀瘀攀爀氀愀礀⤀㨀 ∀ 㨀 ∀䘀攀愀琀甀爀攀 䴀愀琀挀栀㨀 ∀紀㰀猀琀爀漀渀最 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 紀紀㸀㤀㠀⸀㈀─㰀⼀猀琀爀漀渀最㸀㰀⼀猀瀀愀渀㸀ഀഀ
              <span>{lang === "Cn" ? "뿯妽呰吙椤뿯徽뿯墽鏍告붿: " : "Color Swatch Match: "}<strong style={{ color: 'var(--accent-green)' }}>Matte Black OK</strong></span>਍            㰀⼀搀椀瘀㸀ഀഀ
          </div>਍        㰀⼀搀椀瘀㸀ഀഀ
      );਍    紀ഀഀ
਍    ⼀⼀ 㜀⸀ 匀㄀㈀㨀 嘀漀氀甀洀攀琀爀椀挀 䌀漀渀琀愀椀渀攀爀 瀀愀挀欀椀渀最 ⠀㌀䐀 䌀愀爀最漀⤀ഀഀ
    if (stageId === "S12") {਍      爀攀琀甀爀渀 ⠀ഀഀ
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ栀攀愀搀攀爀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀爀最戀愀⠀㄀㈀㐀Ⰰ㄀㄀㐀Ⰰ㄀　㌀Ⰰ　⸀　㌀⤀✀ 紀紀㸀ഀഀ
            <div className="panel-title">뿯붿摝 {lang === "Cn" ? "闆뿯喽뿯붿뿯纽붿뿯玽뿯纽뿯嶽帓娅뿯冽뿯劽붿栫畻娉? : "3D Volumetric Container Packing Optimizer"}</div>਍          㰀⼀搀椀瘀㸀ഀഀ
          <div className="panel-body" style={{ padding: '1rem' }}>਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀挀甀戀攀ⴀ挀漀渀琀愀椀渀攀爀∀㸀ഀഀ
              <div className="shipping-box-stacked" style={{ width: '130px', height: '110px' }}>਍                䄀爀洀挀栀愀椀爀猀 ⠀㈀㐀 䌀䈀䴀⤀ഀഀ
              </div>਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀猀栀椀瀀瀀椀渀最ⴀ戀漀砀ⴀ猀琀愀挀欀攀搀∀ 猀琀礀氀攀㴀笀笀 眀椀搀琀栀㨀 ✀㠀　瀀砀✀Ⰰ 栀攀椀最栀琀㨀 ✀㄀㄀　瀀砀✀Ⰰ 洀愀爀最椀渀䰀攀昀琀㨀 ✀㔀瀀砀✀ 紀紀㸀ഀഀ
                Club Chairs (16 CBM)਍              㰀⼀搀椀瘀㸀ഀഀ
              <div className="shipping-box-stacked" style={{ width: '40px', height: '70px', marginLeft: '5px', alignSelf: 'flex-end', background: 'rgba(168,143,128,0.2)', borderColor: 'var(--accent-orange)' }}>਍                吀愀戀氀攀猀 ⠀㘀 䌀䈀䴀⤀ഀഀ
              </div>਍            㰀⼀搀椀瘀㸀ഀഀ
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.8rem' }}>਍              㰀猀瀀愀渀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀䄀붿ᩯ붿幾㝓㩰 ∀ 㨀 ∀䌀漀渀琀愀椀渀攀爀 吀礀瀀攀㨀 ∀紀㰀猀琀爀漀渀最 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ挀礀愀渀⤀✀ 紀紀㸀㐀　䜀倀 䌀漀渀琀愀椀渀攀爀㰀⼀猀琀爀漀渀最㸀㰀⼀猀瀀愀渀㸀ഀഀ
              <span>{lang === "Cn" ? "瀹圭뿯붿붿╃敤붿? " : "Space Efficiency: "}<strong style={{ color: 'var(--accent-cyan)' }}>68.6%</strong></span>਍            㰀⼀搀椀瘀㸀ഀഀ
            <button ਍              挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ瀀爀攀洀椀甀洀∀ ഀഀ
              style={{ width: '100%', marginTop: '1rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }} ਍              漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 猀攀琀匀栀漀眀嘀漀氀甀洀攀琀爀椀挀匀椀洀甀氀愀琀椀漀渀⠀琀爀甀攀⤀紀ഀഀ
            >਍              붿뿯㎽⁤笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀开뿯붿붿⁚㌀䐀 붿뿯붿붿붿౭捙뿯붿⹾붿恳붿湡" : "Launch Interactive 3D Packing Simulation"}਍            㰀⼀戀甀琀琀漀渀㸀ഀഀ
          </div>਍        㰀⼀搀椀瘀㸀ഀഀ
      );਍    紀ഀഀ
਍    ⼀⼀ 㠀⸀ 匀㄀㌀㨀 䌀甀猀琀漀洀猀 䐀漀挀甀洀攀渀琀 猀琀愀洀瀀 戀漀愀爀搀ഀഀ
    if (stageId === "S13") {਍      爀攀琀甀爀渀 ⠀ഀഀ
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ栀攀愀搀攀爀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀爀最戀愀⠀㄀㈀㐀Ⰰ㄀㄀㐀Ⰰ㄀　㌀Ⰰ　⸀　㌀⤀✀ 紀紀㸀ഀഀ
            <div className="panel-title">뿯붿搵 {lang === "Cn" ? "붿뿯炽붿붿뿯涽ぇ붿堣뿯붿붿뿯붿뿯璽붿붿뿯媽鏍搁뿯붿" : "Customs Credentials Ledger Verification"}</div>਍            㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀氀漀最漀ⴀ戀愀搀最攀∀ 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ漀爀愀渀最攀⤀✀ 紀紀㸀䌀伀䴀倀䰀䤀䄀一䌀䔀㰀⼀猀瀀愀渀㸀ഀഀ
          </div>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ戀漀搀礀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', position: 'relative' }}>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀　⸀㘀爀攀洀 　⸀㠀爀攀洀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀⌀䘀㐀䘀㈀䔀䔀✀Ⰰ 戀漀爀搀攀爀㨀 ✀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀✀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㈀瀀砀✀Ⰰ 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀猀瀀愀挀攀ⴀ戀攀琀眀攀攀渀✀Ⰰ 愀氀椀最渀䤀琀攀洀猀㨀 ✀挀攀渀琀攀爀✀ 紀紀㸀ഀഀ
                <span style={{ fontSize: '0.75rem' }}>1. {lang === "Cn" ? "瀵붿湪뿯澽ц尪붿?IPPC 붿뿯徽捀뿯璽夋뿯榽" : "IPPC Solid Wood Fumigation"}</span>਍                㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀爀攀洀✀Ⰰ 昀漀渀琀圀攀椀最栀琀㨀 ✀戀漀氀搀✀Ⰰ 挀漀氀漀爀㨀 搀漀挀䄀甀搀椀琀攀搀 㼀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ漀爀愀渀最攀⤀✀ 紀紀㸀ഀഀ
                  {docAudited ? "붿?VERIFIED" : "PENDING"}਍                㰀⼀猀瀀愀渀㸀ഀഀ
              </div>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀　⸀㘀爀攀洀 　⸀㠀爀攀洀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀⌀䘀㐀䘀㈀䔀䔀✀Ⰰ 戀漀爀搀攀爀㨀 ✀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀✀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㈀瀀砀✀Ⰰ 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀猀瀀愀挀攀ⴀ戀攀琀眀攀攀渀✀Ⰰ 愀氀椀最渀䤀琀攀洀猀㨀 ✀挀攀渀琀攀爀✀ 紀紀㸀ഀഀ
                <span style={{ fontSize: '0.75rem' }}>2. {lang === "Cn" ? "뿯붿愬뿯枽뿯붿佽뿯붿뿯纽卞뿯枽搴뿯徽뿯垽铏뿯熽뿯窽붿存뿯₽? : "Bill of Lading Consistency Check"}</span>਍                㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀爀攀洀✀Ⰰ 昀漀渀琀圀攀椀最栀琀㨀 ✀戀漀氀搀✀Ⰰ 挀漀氀漀爀㨀 搀漀挀䄀甀搀椀琀攀搀 㼀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ漀爀愀渀最攀⤀✀ 紀紀㸀ഀഀ
                  {docAudited ? "붿?VERIFIED" : "PENDING"}਍                㰀⼀猀瀀愀渀㸀ഀഀ
              </div>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀　⸀㘀爀攀洀 　⸀㠀爀攀洀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀⌀䘀㐀䘀㈀䔀䔀✀Ⰰ 戀漀爀搀攀爀㨀 ✀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀✀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㈀瀀砀✀Ⰰ 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀猀瀀愀挀攀ⴀ戀攀琀眀攀攀渀✀Ⰰ 愀氀椀最渀䤀琀攀洀猀㨀 ✀挀攀渀琀攀爀✀ 紀紀㸀ഀഀ
                <span style={{ fontSize: '0.75rem' }}>3. {lang === "Cn" ? "娴뿯炽뿯梽붿뿯咽붿붿붿뿯梽붿昏뿯붿鏍搁뿯妽" : "Customs Declaration Matching"}</span>਍                㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀爀攀洀✀Ⰰ 昀漀渀琀圀攀椀最栀琀㨀 ✀戀漀氀搀✀Ⰰ 挀漀氀漀爀㨀 搀漀挀䄀甀搀椀琀攀搀 㼀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ漀爀愀渀最攀⤀✀ 紀紀㸀ഀഀ
                  {docAudited ? "붿?VERIFIED" : "PENDING"}਍                㰀⼀猀瀀愀渀㸀ഀഀ
              </div>਍ഀഀ
              {docAudited && (਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀眀愀砀ⴀ猀琀愀洀瀀ⴀ漀瘀攀爀氀愀礀 猀琀愀洀瀀攀搀 猀琀愀洀瀀ⴀ瀀愀猀猀∀ 猀琀礀氀攀㴀笀笀 琀漀瀀㨀 ✀㌀　瀀砀✀Ⰰ 氀攀昀琀㨀 ✀㄀　　瀀砀✀Ⰰ 稀䤀渀搀攀砀㨀 ㄀　　 紀紀㸀ഀഀ
                  Docs Passed਍                㰀⼀搀椀瘀㸀ഀഀ
              )}਍ഀഀ
              {!docAudited && (਍                㰀戀甀琀琀漀渀 挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ瀀爀攀洀椀甀洀∀ 猀琀礀氀攀㴀笀笀 眀椀搀琀栀㨀 ✀㄀　　─✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀　⸀㐀爀攀洀✀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀挀攀渀琀攀爀✀ 紀紀 漀渀䌀氀椀挀欀㴀笀栀愀渀搀氀攀䐀漀挀甀洀攀渀琀䄀甀搀椀琀紀㸀ഀഀ
                  뿯붿洝붿?{lang === "Cn" ? "붿뿯疽붿붿뿯涽ぇ붿뿯붿뿯璽붿붿뿯媽瀵╄뿯▽" : "Audit Export Documents"}਍                㰀⼀戀甀琀琀漀渀㸀ഀഀ
              )}਍            㰀⼀搀椀瘀㸀ഀഀ
          </div>਍        㰀⼀搀椀瘀㸀ഀഀ
      );਍    紀ഀഀ
਍    ⼀⼀ 㤀⸀ 匀㄀㐀㨀 䴀愀爀椀琀椀洀攀 嘀攀猀猀攀氀 䴀愀瀀ഀഀ
    if (stageId === "S14") {਍      爀攀琀甀爀渀 ⠀ഀഀ
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ栀攀愀搀攀爀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀爀最戀愀⠀㄀㈀㐀Ⰰ㄀㄀㐀Ⰰ㄀　㌀Ⰰ　⸀　㌀⤀✀ 紀紀㸀ഀഀ
            <div className="panel-title">뿯붿뿯宽 {lang === "Cn" ? "뿯璽ㄨ뿯垽붿ㄩ뿯₽뿯施뿯粽뿯璽?(뿯梽붿붿붿뿯咽뿯붿鏅?API)" : "Maersk Maritime API Tracking"}</div>਍          㰀⼀搀椀瘀㸀ഀഀ
          <div className="panel-body" style={{ padding: '0.8rem' }}>਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀洀愀爀椀琀椀洀攀ⴀ洀愀瀀∀㸀ഀഀ
              <svg width="100%" height="100%" viewBox="0 0 400 250">਍                㰀瀀愀琀栀 搀㴀∀䴀㄀　Ⰰ㠀　 䰀㠀　Ⰰ㘀　 䰀㄀㈀　Ⰰ㤀　 䰀㤀　Ⰰ㄀㐀　 䰀㐀　Ⰰ㄀㘀　 娀∀ 昀椀氀氀㴀∀⌀䐀㌀䌀䔀䌀䄀∀ 漀瀀愀挀椀琀礀㴀∀　⸀㐀∀ ⼀㸀ഀഀ
                <path d="M160,50 L200,40 L280,30 L260,80 L290,120 L230,160 Z" fill="#D3CECA" opacity="0.4" />਍                㰀瀀愀琀栀 搀㴀∀䴀㄀㄀　Ⰰ㈀㄀　 䰀㄀㘀　Ⰰ㈀㈀　 䰀㄀㔀　Ⰰ㈀㐀　 娀∀ 昀椀氀氀㴀∀⌀䐀㌀䌀䔀䌀䄀∀ 漀瀀愀挀椀琀礀㴀∀　⸀㐀∀ ⼀㸀ഀഀ
਍                㰀瀀愀琀栀 搀㴀∀䴀㈀㘀　Ⰰ㄀㄀　 䌀㈀㄀　Ⰰ㄀㌀　 ㄀㠀　Ⰰ㄀㠀　 ㄀㔀　Ⰰ㄀㘀　 䌀㄀㌀　Ⰰ㄀㐀　 ㄀　㔀Ⰰ㄀　　 㘀　Ⰰ㘀　∀ 昀椀氀氀㴀∀渀漀渀攀∀ 挀氀愀猀猀一愀洀攀㴀∀漀挀攀愀渀ⴀ瘀攀挀琀漀爀ⴀ瀀愀琀栀∀ ⼀㸀ഀഀ
਍                㰀琀攀砀琀 砀㴀∀㈀㘀㔀∀ 礀㴀∀㄀㄀㐀∀ 昀漀渀琀匀椀稀攀㴀∀㜀∀ 昀椀氀氀㴀∀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀∀ 昀漀渀琀圀攀椀最栀琀㴀∀戀漀氀搀∀㸀一愀渀猀栀愀 倀漀爀琀㰀⼀琀攀砀琀㸀ഀഀ
                <circle cx="260" cy="110" r="3" fill="var(--accent-orange)" />਍ഀഀ
                <text x="45" y="55" fontSize="7" fill="var(--text-primary)" fontWeight="bold">Southampton</text>਍                㰀挀椀爀挀氀攀 挀砀㴀∀㘀　∀ 挀礀㴀∀㘀　∀ 爀㴀∀㌀∀ 昀椀氀氀㴀∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀∀ ⼀㸀ഀഀ
਍                㰀最 琀爀愀渀猀昀漀爀洀㴀∀琀爀愀渀猀氀愀琀攀⠀㄀㘀㈀Ⰰ ㄀㘀　⤀∀㸀ഀഀ
                  <circle cx="0" cy="0" r="4" fill="var(--accent-primary)" />਍                  㰀挀椀爀挀氀攀 挀砀㴀∀　∀ 挀礀㴀∀　∀ 爀㴀∀㠀∀ 昀椀氀氀㴀∀渀漀渀攀∀ 猀琀爀漀欀攀㴀∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ瀀爀椀洀愀爀礀⤀∀ 猀琀爀漀欀攀圀椀搀琀栀㴀∀㄀∀㸀ഀഀ
                    <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite" />਍                    㰀愀渀椀洀愀琀攀 愀琀琀爀椀戀甀琀攀一愀洀攀㴀∀漀瀀愀挀椀琀礀∀ 瘀愀氀甀攀猀㴀∀　⸀㠀㬀　㬀　⸀㠀∀ 搀甀爀㴀∀㈀猀∀ 爀攀瀀攀愀琀䌀漀甀渀琀㴀∀椀渀搀攀昀椀渀椀琀攀∀ ⼀㸀ഀഀ
                  </circle>਍                㰀⼀最㸀ഀഀ
              </svg>਍            㰀⼀搀椀瘀㸀ഀഀ
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>਍              㰀猀瀀愀渀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀　뿯붿붿硘뿯䞽뿯ᆽ뿯掽붿붿㩵 윀붿᭖붿붿뿯亽娌? : "Position: Suez Canal Transit"}</span>਍              㰀猀瀀愀渀㸀䔀吀䄀㨀 㰀猀琀爀漀渀最 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀✀ 紀紀㸀㈀　㈀㘀ⴀ　㘀ⴀ　㠀㰀⼀猀琀爀漀渀最㸀㰀⼀猀瀀愀渀㸀ഀഀ
            </div>਍          㰀⼀搀椀瘀㸀ഀഀ
        </div>਍      ⤀㬀ഀഀ
    }਍ഀഀ
    // 10. S15: Split delivery Accounting ledger਍    椀昀 ⠀猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀㄀㔀∀⤀ 笀ഀഀ
      return (਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀 愀渀椀洀愀琀攀ⴀ昀愀搀攀ⴀ椀渀∀ 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀䈀漀琀琀漀洀㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
          <div className="panel-header" style={{ background: 'rgba(166,132,128,0.03)' }}>਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ琀椀琀氀攀∀ 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ爀攀搀⤀✀ 紀紀㸀붿뿯䂽⁣笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿㍴붿睚뿯䒽뿯붿佚붿붿뿯碽뿯붿붿붿뿯炽붿붿♴猱붿뿯㾽 㨀 ∀匀琀爀椀欀攀ⴀ琀栀爀漀甀最栀 䄀挀挀漀甀渀琀椀渀最 䄀甀搀椀琀∀紀㰀⼀搀椀瘀㸀ഀഀ
          </div>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ戀漀搀礀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 氀椀渀攀䠀攀椀最栀琀㨀 ✀㄀⸀㐀✀ 紀紀㸀ഀഀ
                {lang === "Cn" ? "瀹㈡뿯垽뿯纽붿뿯붿붿뿯悽牬붿ㄦ뿯檽뿯璽婃洿붿屽彇娑?2 뿯붿婃뿯墽뿯붿嬫붿붿?1 뿯宽붿ぇ붿뿯붿뿯嚽뿯붿뿯傽渻瑷堢뿯붿뿯纽卞뿯皽灏뿯嶽彇娑堥爡붿뿯붿㘠뿯ᆽ뿯咽뿯붿붿붿뿯붿붿뿯ᮽ뿯綽붿뿯얽붿⅐佻뿯붿붿붿ؠ붿⭓붿뿯붿筝併붿붿뿯붿뿯㾽 㨀 ∀吀栀攀 猀椀琀攀 爀攀瀀漀爀琀攀搀 氀愀礀漀甀琀 洀漀搀椀昀椀挀愀琀椀漀渀猀⸀ ㈀ 䄀爀洀挀栀愀椀爀猀 愀渀搀 ㄀ 吀愀戀氀攀 愀爀攀 挀愀渀挀攀氀攀搀⸀ 爀攀挀愀猀琀椀渀最 愀挀挀漀甀渀琀猀 甀渀搀攀爀 琀栀攀 猀琀爀椀欀攀ⴀ琀栀爀漀甀最栀 瀀漀氀椀挀礀⸀∀紀ഀഀ
              </div>਍ഀഀ
              {!splitDeliveryActive ? (਍                㰀戀甀琀琀漀渀 挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ瀀爀攀洀椀甀洀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ爀攀搀⤀✀Ⰰ 挀漀氀漀爀㨀 ✀眀栀椀琀攀✀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀挀攀渀琀攀爀✀ 紀紀 漀渀䌀氀椀挀欀㴀笀琀爀椀最最攀爀匀瀀氀椀琀䐀攀氀椀瘀攀爀礀紀㸀ഀഀ
                  붿?{lang === "Cn" ? "붿뿯疽붿붿뿯喽뿯墽붿뿯抽뿯沽붿뿯冽뿯窽뿯붿뿯疽뿯붿" : "Execute Split strike recalculation"}਍                㰀⼀戀甀琀琀漀渀㸀ഀഀ
              ) : (਍                㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀　⸀㠀爀攀洀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀爀最戀愀⠀㄀㈀㔀Ⰰ ㄀㐀㌀Ⰰ ㄀㈀㌀Ⰰ 　⸀　㠀⤀✀Ⰰ 戀漀爀搀攀爀㨀 ✀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㈀瀀砀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀Ⰰ 昀漀渀琀圀攀椀最栀琀㨀 ✀㘀　　✀ 紀紀㸀ഀഀ
                  붿?{lang === "Cn" ? "붿뿯冽뿯窽뿯붿뿯嶽畻뿯붿愬뿯妽붿佸뿯悽붿뿯岽붿椤뿯嶽笡灏?$870붿屽뿯熽娆뿯悽뿯冽붿붿뿯媽鏍搁뿯妽뿯涽뿯붿銆? : "Recalculation Applied: Invoice reduced by $870. Balanced updated."}਍                㰀⼀搀椀瘀㸀ഀഀ
              )}਍            㰀⼀搀椀瘀㸀ഀഀ
          </div>਍        㰀⼀搀椀瘀㸀ഀഀ
      );਍    紀ഀഀ
਍    ⼀⼀ ㄀㄀⸀ 匀㄀㘀Ⰰ 匀㄀㜀㨀 䠀愀渀搀漀瘀攀爀 ☀ 䄀爀挀栀椀瘀攀 䠀愀猀栀ഀഀ
    if (stageId === "S16" || stageId === "S17") {਍      爀攀琀甀爀渀 ⠀ഀഀ
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ栀攀愀搀攀爀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀爀最戀愀⠀㄀㈀㐀Ⰰ㄀㄀㐀Ⰰ㄀　㌀Ⰰ　⸀　㌀⤀✀ 紀紀㸀ഀഀ
            <div className="panel-title">뿯붿敀 {lang === "Cn" ? "瀹਍붿붿䩙扔硳뿯붿ᅖ붿乾ㅱ뿯㖽䑰붿∥ 㨀 ∀匀攀挀甀爀攀 䠀愀渀搀漀瘀攀爀 ☀ 䄀爀挀栀椀瘀攀 䰀漀挀欀∀紀㰀⼀搀椀瘀㸀ഀഀ
          </div>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ戀漀搀礀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀　⸀㠀爀攀洀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀⌀䘀㐀䘀㈀䔀䔀✀Ⰰ 戀漀爀搀攀爀㨀 ✀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀✀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㈀瀀砀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㈀爀攀洀✀ 紀紀㸀ഀഀ
                <strong style={{ color: 'var(--text-primary)' }}>{lang === "Cn" ? "闋呯洰뿯璽夋浉鏂뿯嚽欢붿뿯咽細" : "Project Dossier Compile:"}</strong><br/>਍                㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀ 紀紀㸀ഀഀ
                  {lang === "Cn" ? "붿呭뿯悽뿯涽붿뿯媽闆欒獮瑕뿯徽牸鏇搞뿯₽丆hange Logs 瀵╄뿯▽鏃뿯ソ獙뿯붿丄I 瑕栬뿯붿䙴뿯㾽婼뿯᾽硘붿ࡴ붿稠杏ᕖ뿯붿㝣ᑟ뿯붿䁟恣뿯붿뿯붿붿뿯窽붿歟뿯붿붿뿯붿뿯䆽噒繥붿붿㼠 㨀 ∀䤀渀挀氀甀搀攀猀 䌀䄀䐀 匀瀀攀挀猀Ⰰ 䌀栀愀渀最攀 氀漀最猀Ⰰ 䄀䤀 儀䌀 爀攀瀀漀爀琀猀Ⰰ 䤀倀倀䌀 挀攀爀琀椀昀椀挀愀琀攀猀Ⰰ 愀渀搀 猀椀最渀攀搀 挀氀椀攀渀琀 爀攀挀攀椀瀀琀猀⸀∀紀ഀഀ
                </span>਍              㰀⼀搀椀瘀㸀ഀഀ
਍              笀愀爀挀栀椀瘀攀䠀愀猀栀攀搀 㼀 ⠀ഀഀ
                <div style={{ padding: '0.8rem', background: 'rgba(125,143,123,0.08)', border: '1px solid var(--accent-green)', borderRadius: '2px' }}>਍                  㰀搀椀瘀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㈀爀攀洀✀Ⰰ 昀漀渀琀圀攀椀最栀琀㨀 ✀戀漀氀搀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 紀紀㸀䄀뿯㾽笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀쬀澕ご붿붿汣붿뿯冽ᅧ佶硰붿붿㽙 㨀 ∀䐀漀猀猀椀攀爀 䔀渀挀爀礀瀀琀攀搀 ☀ 䄀爀挀栀椀瘀攀搀∀紀㰀⼀搀椀瘀㸀ഀഀ
                  <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--text-secondary)', marginTop: '4px', wordBreak: 'break-all' }}>਍                    匀䠀䄀ⴀ㈀㔀㘀㨀 㠀昀㔀挀㤀　戀㘀愀㜀搀㄀㠀㜀㈀㄀挀㐀戀㈀攀㜀　攀㄀㜀㘀㌀㄀戀搀㐀昀戀㘀　㈀㤀挀昀㠀攀㄀㄀愀㈀昀㐀㈀㄀㤀戀㄀㘀㜀㔀㈀搀㔀㠀㘀戀㔀㄀ഀഀ
                  </div>਍                㰀⼀搀椀瘀㸀ഀഀ
              ) : (਍                㰀戀甀琀琀漀渀 ഀഀ
                  className="btn-premium" ਍                  猀琀礀氀攀㴀笀笀 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀挀攀渀琀攀爀✀ 紀紀 ഀഀ
                  onClick={handleCryptographicArchive}਍                  搀椀猀愀戀氀攀搀㴀笀猀琀愀最攀䤀搀 ℀㴀㴀 ∀匀㄀㜀∀紀ഀഀ
                >਍                  붿뿯䂽⁥笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㔀붿붿᭶㭰扪붿㹭뿯厽붿뿯ⲽ붿㕙붿ㅕ⽤㽵 㨀 ∀䄀爀挀栀椀瘀攀 ☀ 䰀漀挀欀 䰀攀搀最攀爀 搀漀猀猀椀攀爀∀紀ഀഀ
                </button>਍              ⤀紀ഀഀ
            </div>਍          㰀⼀搀椀瘀㸀ഀഀ
        </div>਍      ⤀㬀ഀഀ
    }਍ഀഀ
    return null;਍  紀㬀ഀഀ
਍  ⼀⼀ 匀甀瀀愀戀愀猀攀 挀漀渀渀攀挀琀椀漀渀 挀漀渀昀椀最甀爀愀琀椀漀渀 猀琀愀琀攀猀ഀഀ
  const [dbUrl, setDbUrl] = useState(savedUrl);਍  挀漀渀猀琀 嬀搀戀䬀攀礀Ⰰ 猀攀琀䐀戀䬀攀礀崀 㴀 甀猀攀匀琀愀琀攀⠀猀愀瘀攀搀䬀攀礀⤀㬀ഀഀ
  const [showDbConfig, setShowDbConfig] = useState(false);਍  挀漀渀猀琀 嬀搀戀䌀漀渀渀攀挀琀攀搀Ⰰ 猀攀琀䐀戀䌀漀渀渀攀挀琀攀搀崀 㴀 甀猀攀匀琀愀琀攀⠀℀℀猀甀瀀愀戀愀猀攀䌀氀椀攀渀琀⤀㬀ഀഀ
  const [dbLoading, setDbLoading] = useState(false);਍  挀漀渀猀琀 嬀搀戀䔀爀爀漀爀Ⰰ 猀攀琀䐀戀䔀爀爀漀爀崀 㴀 甀猀攀匀琀愀琀攀⠀∀∀⤀㬀ഀഀ
਍  挀漀渀猀琀 猀琀愀最攀猀 㴀 洀漀挀欀䐀愀琀愀⸀猀琀愀最攀猀㬀ഀഀ
  const currentStage = stages[currentStageIndex];਍ഀഀ
  // Auto scroll terminal logs਍  甀猀攀䔀昀昀攀挀琀⠀⠀⤀ 㴀㸀 笀ഀഀ
    if (terminalEndRef.current) {਍      琀攀爀洀椀渀愀氀䔀渀搀刀攀昀⸀挀甀爀爀攀渀琀⸀猀挀爀漀氀氀䤀渀琀漀嘀椀攀眀⠀笀 戀攀栀愀瘀椀漀爀㨀 ✀猀洀漀漀琀栀✀ 紀⤀㬀ഀഀ
    }਍  紀Ⰰ 嬀挀甀爀爀攀渀琀匀琀愀最攀䤀渀搀攀砀Ⰰ 挀栀愀琀䴀攀猀猀愀最攀猀崀⤀㬀ഀഀ
਍  ⼀⼀ 䘀攀琀挀栀 爀攀愀氀ⴀ琀椀洀攀 搀愀琀愀 昀爀漀洀 匀甀瀀愀戀愀猀攀 椀昀 挀漀渀渀攀挀琀攀搀ഀഀ
  const fetchSupabaseData = async (shouldThrow = false) => {਍    椀昀 ⠀℀眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀 簀簀 ℀氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开甀爀氀∀⤀ 簀簀 ℀氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开欀攀礀∀⤀⤀ 笀ഀഀ
      setDbConnected(false);਍      爀攀琀甀爀渀㬀ഀഀ
    }਍    ഀഀ
    setDbLoading(true);਍    猀攀琀䐀戀䔀爀爀漀爀⠀∀∀⤀㬀ഀഀ
    ਍    琀爀礀 笀ഀഀ
      const url = localStorage.getItem("supabase_url");਍      挀漀渀猀琀 欀攀礀 㴀 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开欀攀礀∀⤀㬀ഀഀ
      const client = window.supabase.createClient(url, key);਍      ഀഀ
      // 1. Fetch live Project named 'CRAFT-202605-01'਍      挀漀渀猀琀 笀 搀愀琀愀㨀 瀀爀漀樀攀挀琀猀䐀愀琀愀Ⰰ 攀爀爀漀爀㨀 瀀爀漀樀攀挀琀䔀爀爀 紀 㴀 愀眀愀椀琀 挀氀椀攀渀琀ഀഀ
        .from("projects")਍        ⸀猀攀氀攀挀琀⠀∀⨀∀⤀ഀഀ
        .eq("name", "CRAFT-202605-01")਍        ⸀氀椀洀椀琀⠀㄀⤀㬀ഀഀ
        ਍      椀昀 ⠀瀀爀漀樀攀挀琀䔀爀爀⤀ 琀栀爀漀眀 瀀爀漀樀攀挀琀䔀爀爀㬀ഀഀ
      ਍      氀攀琀 搀戀倀爀漀樀攀挀琀 㴀 渀甀氀氀㬀ഀഀ
      let needToSeed = false;਍      ഀഀ
      if (!projectsData || projectsData.length === 0) {਍        渀攀攀搀吀漀匀攀攀搀 㴀 琀爀甀攀㬀ഀഀ
      } else {਍        搀戀倀爀漀樀攀挀琀 㴀 瀀爀漀樀攀挀琀猀䐀愀琀愀嬀　崀㬀ഀഀ
        ਍        ⼀⼀ 刀漀戀甀猀琀渀攀猀猀 椀渀琀攀最爀椀琀礀 挀栀攀挀欀㨀 䔀渀猀甀爀攀 愀氀氀 挀栀椀氀搀 琀愀戀氀攀猀 愀爀攀 愀挀琀甀愀氀氀礀 瀀漀瀀甀氀愀琀攀搀ഀഀ
        const { data: specsCheck, error: specsErr } = await client਍          ⸀昀爀漀洀⠀∀猀瀀攀挀椀昀椀挀愀琀椀漀渀猀∀⤀ഀഀ
          .select("id")਍          ⸀攀焀⠀∀瀀爀漀樀攀挀琀开椀搀∀Ⰰ 搀戀倀爀漀樀攀挀琀⸀椀搀⤀ഀഀ
          .limit(1);਍          ഀഀ
        const { data: paymentsCheck, error: paymentsErr } = await client਍          ⸀昀爀漀洀⠀∀瀀愀礀洀攀渀琀猀∀⤀ഀഀ
          .select("id")਍          ⸀攀焀⠀∀瀀爀漀樀攀挀琀开椀搀∀Ⰰ 搀戀倀爀漀樀攀挀琀⸀椀搀⤀ഀഀ
          .limit(1);਍          ഀഀ
        if (specsErr || paymentsErr || !specsCheck || specsCheck.length === 0 || !paymentsCheck || paymentsCheck.length === 0) {਍          挀漀渀猀漀氀攀⸀氀漀最⠀∀倀爀漀樀攀挀琀 䌀刀䄀䘀吀ⴀ㈀　㈀㘀　㔀ⴀ　㄀ 攀砀椀猀琀猀Ⰰ 戀甀琀 猀瀀攀挀椀昀椀挀愀琀椀漀渀猀 漀爀 瀀愀礀洀攀渀琀猀 愀爀攀 攀洀瀀琀礀⸀ 䐀攀氀攀琀椀渀最 攀砀椀猀琀椀渀最 瀀爀漀樀攀挀琀 琀漀 琀爀椀最最攀爀 挀愀猀挀愀搀攀 愀渀搀 挀氀攀愀渀 爀攀ⴀ猀攀攀搀⸀⸀⸀∀⤀㬀ഀഀ
          await client.from("projects").delete().eq("id", dbProject.id);਍          渀攀攀搀吀漀匀攀攀搀 㴀 琀爀甀攀㬀ഀഀ
          dbProject = null;਍        紀ഀഀ
      }਍      ഀഀ
      if (needToSeed) {਍        挀漀渀猀漀氀攀⸀氀漀最⠀∀刀甀渀渀椀渀最 挀氀椀攀渀琀ⴀ猀椀搀攀 愀甀琀漀ⴀ猀攀攀搀椀渀最⸀⸀⸀∀⤀㬀ഀഀ
        ਍        ⼀⼀ ㄀⸀ 䤀渀猀攀爀琀 搀攀昀愀甀氀琀 瀀爀漀樀攀挀琀ഀഀ
        const { data: newProjData, error: seedProjErr } = await client਍          ⸀昀爀漀洀⠀∀瀀爀漀樀攀挀琀猀∀⤀ഀഀ
          .insert({਍            渀愀洀攀㨀 ∀䌀刀䄀䘀吀ⴀ㈀　㈀㘀　㔀ⴀ　㄀∀Ⰰഀഀ
            client_name: "Client Design Studio (UK)",਍            挀氀椀攀渀琀开挀漀渀琀愀挀琀㨀 ∀匀琀 䄀氀戀愀渀猀Ⰰ 唀䬀∀Ⰰഀഀ
            current_stage: 1,਍            猀攀氀攀挀琀攀搀开昀愀戀爀椀挀㨀 ∀䘀䄀䈀ⴀ　㈀∀Ⰰഀഀ
            selected_leg: "matte-black",਍            昀愀戀爀椀挀开挀漀洀瀀愀琀椀戀椀氀椀琀礀开琀攀猀琀㨀 渀甀氀氀Ⰰഀഀ
            is_crib5_blocked: false,਍            猀攀氀攀挀琀攀搀开猀甀瀀瀀氀椀攀爀㨀 渀甀氀氀Ⰰഀഀ
            split_delivery_active: false਍          紀⤀ഀഀ
          .select();਍          ഀഀ
        if (seedProjErr) throw new Error("Auto-seeding Projects failed: " + seedProjErr.message);਍        ഀഀ
        let insertedProj = (newProjData && newProjData.length > 0) ? newProjData[0] : null;਍        ഀഀ
        // Robust fallback: if insert-select returns empty (common with some RLS/triggers/SDK issues), select explicitly by name਍        椀昀 ⠀℀椀渀猀攀爀琀攀搀倀爀漀樀⤀ 笀ഀഀ
          console.warn("Insert select returned empty, attempting fallback select by name...");਍          挀漀渀猀琀 笀 搀愀琀愀㨀 昀愀氀氀戀愀挀欀䐀愀琀愀Ⰰ 攀爀爀漀爀㨀 昀愀氀氀戀愀挀欀䔀爀爀 紀 㴀 愀眀愀椀琀 挀氀椀攀渀琀ഀഀ
            .from("projects")਍            ⸀猀攀氀攀挀琀⠀∀⨀∀⤀ഀഀ
            .eq("name", "CRAFT-202605-01")਍            ⸀氀椀洀椀琀⠀㄀⤀㬀ഀഀ
            ਍          椀昀 ⠀昀愀氀氀戀愀挀欀䔀爀爀⤀ 笀ഀഀ
            throw new Error("Fallback project retrieval failed: " + fallbackErr.message);਍          紀ഀഀ
          if (fallbackData && fallbackData.length > 0) {਍            椀渀猀攀爀琀攀搀倀爀漀樀 㴀 昀愀氀氀戀愀挀欀䐀愀琀愀嬀　崀㬀ഀഀ
          }਍        紀ഀഀ
        ਍        椀昀 ⠀椀渀猀攀爀琀攀搀倀爀漀樀⤀ 笀ഀഀ
          ਍          ⼀⼀ ㈀⸀ 䤀渀猀攀爀琀 猀琀愀渀搀愀爀搀 猀瀀攀挀椀昀椀挀愀琀椀漀渀猀 氀椀渀欀攀搀 琀漀 琀栀攀 瀀爀漀樀攀挀琀ഀഀ
          const { error: seedSpecsErr } = await client਍            ⸀昀爀漀洀⠀∀猀瀀攀挀椀昀椀挀愀琀椀漀渀猀∀⤀ഀഀ
            .insert([਍              笀ഀഀ
                project_id: insertedProj.id,਍                椀琀攀洀开琀礀瀀攀开挀渀㨀 ∀붿䍯Ḅ붿뿯㖽뿯붿붿㽙Ⰰഀഀ
                item_type_en: "Lobby Armchair",਍                焀甀愀渀琀椀琀礀㨀 㐀　Ⰰഀഀ
                material_cn: "娴뿯岽啗뿯붿뿯澽簹楹?(L-4410)",਍                洀愀琀攀爀椀愀氀开攀渀㨀 ∀一愀瘀礀 䌀氀愀猀猀椀挀 䰀椀渀攀渀 ⠀䰀ⴀ㐀㐀㄀　⤀∀Ⰰഀഀ
                original_unit_price: 210,਍                甀渀椀琀开瀀爀椀挀攀㨀 ㈀㄀　Ⰰഀഀ
                notes_cn: "",਍                渀漀琀攀猀开攀渀㨀 ∀∀ഀഀ
              },਍              笀ഀഀ
                project_id: insertedProj.id,਍                椀琀攀洀开琀礀瀀攀开挀渀㨀 ∀붿孴뿯붿뿯垽뿯붿䥦붿㽙Ⰰഀഀ
                item_type_en: "VIP Club Chair",਍                焀甀愀渀琀椀琀礀㨀 ㈀　Ⰰഀഀ
                material_cn: "붿뿯嚽뿯钃뿯澽笣缁?(V-9082)",਍                洀愀琀攀爀椀愀氀开攀渀㨀 ∀刀漀礀愀氀 嘀攀氀瘀攀琀 ⠀嘀ⴀ㤀　㠀㈀⤀∀Ⰰഀഀ
                original_unit_price: 280,਍                甀渀椀琀开瀀爀椀挀攀㨀 ㈀㠀　Ⰰഀഀ
                notes_cn: "",਍                渀漀琀攀猀开攀渀㨀 ∀∀ഀഀ
              },਍              笀ഀഀ
                project_id: insertedProj.id,਍                椀琀攀洀开琀礀瀀攀开挀渀㨀 ∀㤀Ɒ붿㥗붿橰붿䙯⨄兜뿯㾽Ⰰഀഀ
                item_type_en: "Custom Oak Coffee Table",਍                焀甀愀渀琀椀琀礀㨀 㔀Ⰰഀഀ
                material_cn: "뿯澽╃뿯劽붿뿯붿뿯붿鏈?,਍                洀愀琀攀爀椀愀氀开攀渀㨀 ∀一愀琀甀爀愀氀 匀漀氀椀搀 圀栀椀琀攀 伀愀欀∀Ⰰഀഀ
                original_unit_price: 450,਍                甀渀椀琀开瀀爀椀挀攀㨀 㐀㔀　Ⰰഀഀ
                notes_cn: "",਍                渀漀琀攀猀开攀渀㨀 ∀∀ഀഀ
              }਍            崀⤀㬀ഀഀ
            ਍          椀昀 ⠀猀攀攀搀匀瀀攀挀猀䔀爀爀⤀ 琀栀爀漀眀 渀攀眀 䔀爀爀漀爀⠀∀䄀甀琀漀ⴀ猀攀攀搀椀渀最 匀瀀攀挀椀昀椀挀愀琀椀漀渀猀 昀愀椀氀攀搀㨀 ∀ ⬀ 猀攀攀搀匀瀀攀挀猀䔀爀爀⸀洀攀猀猀愀最攀⤀㬀ഀഀ
          ਍          ⼀⼀ ㌀⸀ 䤀渀猀攀爀琀 猀琀愀渀搀愀爀搀 瀀愀礀洀攀渀琀 洀椀氀攀猀琀漀渀攀猀ഀഀ
          const { error: seedPaymentsErr } = await client਍            ⸀昀爀漀洀⠀∀瀀愀礀洀攀渀琀猀∀⤀ഀഀ
            .insert([਍              笀ഀഀ
                project_id: insertedProj.id,਍                洀椀氀攀猀琀漀渀攀开挀渀㨀 ∀㔀　─ 붿⡨慨㥮㙰繬⁖⠀붿浛뿯붿⥼∀Ⰰഀഀ
                milestone_en: "50% Deposit (Paid)",਍                愀洀漀甀渀琀㨀 ㄀　㐀㔀　Ⰰഀഀ
                status: "Paid",਍                瀀愀礀洀攀渀琀开搀愀琀攀㨀 ∀㈀　㈀㘀ⴀ　㔀ⴀ㈀㔀∀ഀഀ
              },਍              笀ഀഀ
                project_id: insertedProj.id,਍                洀椀氀攀猀琀漀渀攀开挀渀㨀 ∀㐀　─ 儀뿯㾽뿯붿붿彭뿯붿뿯₽⠀저䖓뿯玽붿뿯붿⤠∀Ⰰഀഀ
                milestone_en: "40% Shipping Release (Pending)",਍                愀洀漀甀渀琀㨀 㠀㌀㘀　Ⰰഀഀ
                status: "Pending",਍                瀀愀礀洀攀渀琀开搀愀琀攀㨀 ∀倀攀渀搀椀渀最∀ഀഀ
              },਍              笀ഀഀ
                project_id: insertedProj.id,਍                洀椀氀攀猀琀漀渀攀开挀渀㨀 ∀㄀　─ 尀붿붿佼붿붿뿯₽⠀저䖓뿯玽붿뿯붿⤠∀Ⰰഀഀ
                milestone_en: "10% Handover Balance (Pending)",਍                愀洀漀甀渀琀㨀 ㈀　㤀　Ⰰഀഀ
                status: "Pending",਍                瀀愀礀洀攀渀琀开搀愀琀攀㨀 ∀倀攀渀搀椀渀最∀ഀഀ
              }਍            崀⤀㬀ഀഀ
          if (seedPaymentsErr) throw new Error("Auto-seeding Payments failed: " + seedPaymentsErr.message);਍ഀഀ
          // 4. Insert initial human-AI audit logs਍          挀漀渀猀琀 笀 攀爀爀漀爀㨀 猀攀攀搀䰀漀最猀䔀爀爀 紀 㴀 愀眀愀椀琀 挀氀椀攀渀琀ഀഀ
            .from("agent_logs")਍            ⸀椀渀猀攀爀琀⠀嬀ഀഀ
              {਍                瀀爀漀樀攀挀琀开椀搀㨀 椀渀猀攀爀琀攀搀倀爀漀樀⸀椀搀Ⰰഀഀ
                operator: "OpenClaw",਍                愀挀琀椀漀渀开搀攀猀挀开挀渀㨀 ∀夀䙴뿯㶽조붿坑붿幭뿯㺽佾뿯䖽붿併붿൝붿붿㙕붿붿㝐붿뿯ⲽ붿뿯ᮽ뿯붿붿啖뿯붿卦붿뿯⪽붿睛붿붿絧뿯ಽ붿뿯⊽Ⰰഀഀ
                action_desc_en: "Parsed member portal message and sketch, auto-generated project master draft."਍              紀Ⰰഀഀ
              {਍                瀀爀漀樀攀挀琀开椀搀㨀 椀渀猀攀爀琀攀搀倀爀漀樀⸀椀搀Ⰰഀഀ
                operator: "OpenClaw",਍                愀挀琀椀漀渀开搀攀猀挀开挀渀㨀 ∀眀뿯䒽뿯붿붿뿯㚽붿低뿯䖽붿ᅵ὚՘붿뿯㚽붿婎뿯ᶽ祢듡붿붿形뿯붿붿뿯侽뿯溽⩔뿯ᮽ⹰붿붿뿯ᶽ٢畲뿯垽㑗붿䑯붿뿯宽뿯ソ뿯梽붿屽뿯厽뿯宽?,਍                愀挀琀椀漀渀开搀攀猀挀开攀渀㨀 ∀䄀甀琀漀洀愀琀椀挀愀氀氀礀 昀漀氀氀漀眀攀搀 甀瀀 瘀椀愀 洀攀洀戀攀爀 瀀漀爀琀愀氀 琀漀 焀甀攀爀礀 洀攀琀愀氀 氀攀最猀 挀漀愀琀椀渀最 愀渀搀 琀漀氀攀爀愀渀挀攀⸀∀ഀഀ
              },਍              笀ഀഀ
                project_id: insertedProj.id,਍                漀瀀攀爀愀琀漀爀㨀 ∀伀瀀攀渀䌀氀愀眀∀Ⰰഀഀ
                action_desc_cn: "뿯涽뿯₽뿯붿电敓뿯붿愪붿붿뿯붿뿯枽灏뿯嶽뿯厽瑕뿯徽牸鏇붿紝灏뿯咽뿯붿ၙ㑫㥼ㅰ붿᭎뿯傽㩫 㘀㔀　洀洀Ⰰ 䐀㨀 㘀　　洀洀Ⰰ 䠀㨀 㠀㔀　洀洀∀Ⰰഀഀ
                action_desc_en: "Bilingual specifications generated. Dimensions defined: W: 650mm, D: 600mm, H: 850mm."਍              紀ഀഀ
            ]);਍            ഀഀ
          if (seedLogsErr) throw new Error("Auto-seeding Agent Logs failed: " + seedLogsErr.message);਍          ഀഀ
          // 5. Insert detailed technical agent thought trace logs (for all 17 stages)਍          挀漀渀猀琀 猀攀攀搀吀栀漀甀最栀琀刀漀眀猀 㴀 嬀崀㬀ഀഀ
          Object.entries(mockData.agentThoughtLogs).forEach(([stageId, logList]) => {਍            氀漀最䰀椀猀琀⸀昀漀爀䔀愀挀栀⠀氀椀渀攀 㴀㸀 笀ഀഀ
              seedThoughtRows.push({਍                瀀爀漀樀攀挀琀开椀搀㨀 椀渀猀攀爀琀攀搀倀爀漀樀⸀椀搀Ⰰഀഀ
                stage_id: stageId,਍                爀漀氀攀㨀 氀椀渀攀⸀爀漀氀攀Ⰰഀഀ
                log_text_cn: line.text,਍                氀漀最开琀攀砀琀开攀渀㨀 氀椀渀攀⸀琀攀砀琀䔀渀 簀簀 氀椀渀攀⸀琀攀砀琀ഀഀ
              });਍            紀⤀㬀ഀഀ
          });਍          椀昀 ⠀猀攀攀搀吀栀漀甀最栀琀刀漀眀猀⸀氀攀渀最琀栀 㸀 　⤀ 笀ഀഀ
            const { error: seedThoughtsErr } = await client਍              ⸀昀爀漀洀⠀∀愀最攀渀琀开琀栀漀甀最栀琀开氀漀最猀∀⤀ഀഀ
              .insert(seedThoughtRows);਍            椀昀 ⠀猀攀攀搀吀栀漀甀最栀琀猀䔀爀爀⤀ 琀栀爀漀眀 渀攀眀 䔀爀爀漀爀⠀∀䄀甀琀漀ⴀ猀攀攀搀椀渀最 䄀最攀渀琀 吀栀漀甀最栀琀 䰀漀最猀 昀愀椀氀攀搀㨀 ∀ ⬀ 猀攀攀搀吀栀漀甀最栀琀猀䔀爀爀⸀洀攀猀猀愀最攀⤀㬀ഀഀ
          }਍ഀഀ
          dbProject = insertedProj;਍        紀 攀氀猀攀 笀ഀഀ
          throw new Error("Failed to retrieve auto-seeded project.");਍        紀ഀഀ
      } else {਍        搀戀倀爀漀樀攀挀琀 㴀 瀀爀漀樀攀挀琀猀䐀愀琀愀嬀　崀㬀ഀഀ
      }਍      ഀഀ
      // Load specs, payments, logs and thought logs਍      椀昀 ⠀搀戀倀爀漀樀攀挀琀⤀ 笀ഀഀ
        // 2. Fetch live Specifications਍        挀漀渀猀琀 笀 搀愀琀愀㨀 椀琀攀洀猀䐀愀琀愀Ⰰ 攀爀爀漀爀㨀 椀琀攀洀猀䔀爀爀 紀 㴀 愀眀愀椀琀 挀氀椀攀渀琀ഀഀ
          .from("specifications")਍          ⸀猀攀氀攀挀琀⠀∀⨀∀⤀ഀഀ
          .eq("project_id", dbProject.id);਍          ഀഀ
        if (itemsErr) throw itemsErr;਍        ഀഀ
        // 3. Fetch live Payments Schedule਍        挀漀渀猀琀 笀 搀愀琀愀㨀 瀀愀礀洀攀渀琀猀䐀愀琀愀Ⰰ 攀爀爀漀爀㨀 瀀愀礀洀攀渀琀猀䔀爀爀 紀 㴀 愀眀愀椀琀 挀氀椀攀渀琀ഀഀ
          .from("payments")਍          ⸀猀攀氀攀挀琀⠀∀⨀∀⤀ഀഀ
          .eq("project_id", dbProject.id)਍          ⸀漀爀搀攀爀⠀∀挀爀攀愀琀攀搀开愀琀∀Ⰰ 笀 愀猀挀攀渀搀椀渀最㨀 琀爀甀攀 紀⤀㬀ഀഀ
          ਍        椀昀 ⠀瀀愀礀洀攀渀琀猀䔀爀爀⤀ 琀栀爀漀眀 瀀愀礀洀攀渀琀猀䔀爀爀㬀ഀഀ
਍        ⼀⼀ 㐀⸀ 䘀攀琀挀栀 氀椀瘀攀 䄀最攀渀琀 䰀漀最猀ഀഀ
        const { data: logsData } = await client਍          ⸀昀爀漀洀⠀∀愀最攀渀琀开氀漀最猀∀⤀ഀഀ
          .select("*")਍          ⸀攀焀⠀∀瀀爀漀樀攀挀琀开椀搀∀Ⰰ 搀戀倀爀漀樀攀挀琀⸀椀搀⤀ഀഀ
          .order("created_at", { ascending: false });਍ഀഀ
        // 5. Fetch live Agent Thought Logs਍        挀漀渀猀琀 笀 搀愀琀愀㨀 搀戀吀栀漀甀最栀琀䰀漀最猀Ⰰ 攀爀爀漀爀㨀 琀栀漀甀最栀琀猀䔀爀爀 紀 㴀 愀眀愀椀琀 挀氀椀攀渀琀ഀഀ
          .from("agent_thought_logs")਍          ⸀猀攀氀攀挀琀⠀∀⨀∀⤀ഀഀ
          .eq("project_id", dbProject.id);਍ഀഀ
        if (thoughtsErr) throw thoughtsErr;਍ഀഀ
        // Apply dbThoughtLogs to in-memory mockData.agentThoughtLogs with English healing਍        椀昀 ⠀搀戀吀栀漀甀最栀琀䰀漀最猀 ☀☀ 搀戀吀栀漀甀最栀琀䰀漀最猀⸀氀攀渀最琀栀 㸀 　⤀ 笀ഀഀ
          const newThoughtLogs = {};਍          ഀഀ
          // Sort or group by stage_id, and preserve insertion order਍          挀漀渀猀琀 猀漀爀琀攀搀䐀戀吀栀漀甀最栀琀䰀漀最猀 㴀 嬀⸀⸀⸀搀戀吀栀漀甀最栀琀䰀漀最猀崀⸀猀漀爀琀⠀⠀愀Ⰰ 戀⤀ 㴀㸀 笀ഀഀ
            if (a.stage_id !== b.stage_id) return a.stage_id.localeCompare(b.stage_id);਍            爀攀琀甀爀渀 渀攀眀 䐀愀琀攀⠀愀⸀挀爀攀愀琀攀搀开愀琀 簀簀 　⤀ ⴀ 渀攀眀 䐀愀琀攀⠀戀⸀挀爀攀愀琀攀搀开愀琀 簀簀 　⤀㬀ഀഀ
          });਍ഀഀ
          sortedDbThoughtLogs.forEach(row => {਍            椀昀 ⠀℀渀攀眀吀栀漀甀最栀琀䰀漀最猀嬀爀漀眀⸀猀琀愀最攀开椀搀崀⤀ 笀ഀഀ
              newThoughtLogs[row.stage_id] = [];਍            紀ഀഀ
            ਍            挀漀渀猀琀 挀甀爀爀攀渀琀䤀搀砀 㴀 渀攀眀吀栀漀甀最栀琀䰀漀最猀嬀爀漀眀⸀猀琀愀最攀开椀搀崀⸀氀攀渀最琀栀㬀ഀഀ
            const localLines = mockData.agentThoughtLogs[row.stage_id];਍            挀漀渀猀琀 氀漀挀愀氀䰀椀渀攀 㴀 氀漀挀愀氀䰀椀渀攀猀 㼀 氀漀挀愀氀䰀椀渀攀猀嬀挀甀爀爀攀渀琀䤀搀砀崀 㨀 渀甀氀氀㬀ഀഀ
            ਍            氀攀琀 琀攀砀琀䔀渀 㴀 爀漀眀⸀氀漀最开琀攀砀琀开攀渀 簀簀 爀漀眀⸀氀漀最开琀攀砀琀开挀渀㬀ഀഀ
            // If DB English text is missing or contains Chinese, but we have a clean local English text, use local਍            椀昀 ⠀氀漀挀愀氀䰀椀渀攀 ☀☀ 氀漀挀愀氀䰀椀渀攀⸀琀攀砀琀䔀渀 ☀☀ ⠀℀爀漀眀⸀氀漀最开琀攀砀琀开攀渀 簀簀 爀漀眀⸀氀漀最开琀攀砀琀开攀渀 㴀㴀㴀 爀漀眀⸀氀漀最开琀攀砀琀开挀渀 簀簀 ⼀嬀尀甀㐀攀　　ⴀ尀甀㤀昀愀㔀崀⼀⸀琀攀猀琀⠀爀漀眀⸀氀漀最开琀攀砀琀开攀渀⤀⤀⤀ 笀ഀഀ
              textEn = localLine.textEn;਍            紀ഀഀ
਍            渀攀眀吀栀漀甀最栀琀䰀漀最猀嬀爀漀眀⸀猀琀愀最攀开椀搀崀⸀瀀甀猀栀⠀笀ഀഀ
              role: row.role,਍              琀攀砀琀㨀 爀漀眀⸀氀漀最开琀攀砀琀开挀渀 簀簀 爀漀眀⸀氀漀最开琀攀砀琀开攀渀Ⰰഀഀ
              textEn: textEn਍            紀⤀㬀ഀഀ
          });਍          ഀഀ
          Object.assign(mockData.agentThoughtLogs, newThoughtLogs);਍        紀ഀഀ
਍        挀漀渀猀琀 猀琀愀最攀一甀洀 㴀 搀戀倀爀漀樀攀挀琀⸀挀甀爀爀攀渀琀开猀琀愀最攀 簀簀 ㄀㬀ഀഀ
        const currentStageId = "S" + String(stageNum).padStart(2, "0");਍ഀഀ
        // Sync state variables from the database to React state਍        椀昀 ⠀搀戀倀爀漀樀攀挀琀⸀猀攀氀攀挀琀攀搀开昀愀戀爀椀挀⤀ 猀攀琀匀攀氀攀挀琀攀搀䘀愀戀爀椀挀⠀搀戀倀爀漀樀攀挀琀⸀猀攀氀攀挀琀攀搀开昀愀戀爀椀挀⤀㬀ഀഀ
        if (dbProject.selected_leg) setSelectedLeg(dbProject.selected_leg);਍        椀昀 ⠀搀戀倀爀漀樀攀挀琀⸀昀愀戀爀椀挀开挀漀洀瀀愀琀椀戀椀氀椀琀礀开琀攀猀琀 ℀㴀㴀 甀渀搀攀昀椀渀攀搀⤀ 猀攀琀䘀愀戀爀椀挀䌀漀洀瀀愀琀椀戀椀氀椀琀礀吀攀猀琀⠀搀戀倀爀漀樀攀挀琀⸀昀愀戀爀椀挀开挀漀洀瀀愀琀椀戀椀氀椀琀礀开琀攀猀琀⤀㬀ഀഀ
        if (dbProject.is_crib5_blocked !== undefined) {਍          猀攀琀䤀猀䌀爀椀戀㔀䈀氀漀挀欀攀搀⠀搀戀倀爀漀樀攀挀琀⸀椀猀开挀爀椀戀㔀开戀氀漀挀欀攀搀⤀㬀ഀഀ
          setConfiguratorCrib5Blocked(dbProject.is_crib5_blocked && dbProject.selected_fabric === "FAB-03");਍        紀ഀഀ
        if (dbProject.selected_supplier) setSelectedSupplier(dbProject.selected_supplier);਍        椀昀 ⠀搀戀倀爀漀樀攀挀琀⸀猀瀀氀椀琀开搀攀氀椀瘀攀爀礀开愀挀琀椀瘀攀 ℀㴀㴀 甀渀搀攀昀椀渀攀搀⤀ 猀攀琀匀瀀氀椀琀䐀攀氀椀瘀攀爀礀䄀挀琀椀瘀攀⠀搀戀倀爀漀樀攀挀琀⸀猀瀀氀椀琀开搀攀氀椀瘀攀爀礀开愀挀琀椀瘀攀⤀㬀ഀഀ
਍        ⼀⼀ 䴀愀瀀 瀀爀漀樀攀挀琀 猀栀愀瀀攀 搀礀渀愀洀椀挀愀氀氀礀ഀഀ
        const mappedOrder = {਍          椀搀㨀 搀戀倀爀漀樀攀挀琀⸀椀搀Ⰰഀഀ
          orderId: dbProject.name || "CRAFT-202605-01",਍          挀氀椀攀渀琀一愀洀攀㨀 搀戀倀爀漀樀攀挀琀⸀挀氀椀攀渀琀开渀愀洀攀 簀簀 ∀䌀氀椀攀渀琀 䐀攀猀椀最渀 匀琀甀搀椀漀 ⠀唀䬀⤀∀Ⰰഀഀ
          projectLocation: dbProject.client_contact || "St Albans, UK",਍          挀爀攀愀琀攀搀䐀愀琀攀㨀 搀戀倀爀漀樀攀挀琀⸀挀爀攀愀琀攀搀开愀琀 㼀 搀戀倀爀漀樀攀挀琀⸀挀爀攀愀琀攀搀开愀琀⸀猀瀀氀椀琀⠀∀吀∀⤀嬀　崀 㨀 ∀㈀　㈀㘀ⴀ　㔀ⴀ㈀㔀∀Ⰰഀഀ
          currentStageId: currentStageId,਍          椀琀攀洀猀㨀 ⠀椀琀攀洀猀䐀愀琀愀 ☀☀ 椀琀攀洀猀䐀愀琀愀⸀氀攀渀最琀栀 㸀 　⤀ 㼀 椀琀攀洀猀䐀愀琀愀⸀洀愀瀀⠀椀琀攀洀 㴀㸀 ⠀笀ഀഀ
            id: item.id,਍            琀礀瀀攀䌀渀㨀 椀琀攀洀⸀椀琀攀洀开琀礀瀀攀开挀渀Ⰰഀഀ
            typeEn: item.item_type_en,਍            焀琀礀㨀 椀琀攀洀⸀焀甀愀渀琀椀琀礀Ⰰഀഀ
            materialCn: item.material_cn,਍            洀愀琀攀爀椀愀氀䔀渀㨀 椀琀攀洀⸀洀愀琀攀爀椀愀氀开攀渀Ⰰഀഀ
            originalUnitPrice: Number(item.original_unit_price || 0),਍            甀渀椀琀倀爀椀挀攀㨀 一甀洀戀攀爀⠀椀琀攀洀⸀甀渀椀琀开瀀爀椀挀攀 簀簀 　⤀Ⰰഀഀ
            status: "Active",਍            渀漀琀攀㨀 椀琀攀洀⸀渀漀琀攀猀开挀渀 簀簀 椀琀攀洀⸀渀漀琀攀猀开攀渀 簀簀 ∀∀ഀഀ
          })) : JSON.parse(JSON.stringify(mockData.initialOrder.items)),਍          瀀愀礀洀攀渀琀猀㨀 ⠀瀀愀礀洀攀渀琀猀䐀愀琀愀 ☀☀ 瀀愀礀洀攀渀琀猀䐀愀琀愀⸀氀攀渀最琀栀 㸀 　⤀ 㼀 瀀愀礀洀攀渀琀猀䐀愀琀愀⸀洀愀瀀⠀瀀 㴀㸀 ⠀笀ഀഀ
            id: p.id,਍            洀椀氀攀猀琀漀渀攀㨀 氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 瀀⸀洀椀氀攀猀琀漀渀攀开挀渀 㨀 瀀⸀洀椀氀攀猀琀漀渀攀开攀渀Ⰰഀഀ
            amount: Number(p.amount || 0),਍            搀愀琀攀㨀 瀀⸀瀀愀礀洀攀渀琀开搀愀琀攀Ⰰഀഀ
            status: p.status਍          紀⤀⤀ 㨀 䨀匀伀一⸀瀀愀爀猀攀⠀䨀匀伀一⸀猀琀爀椀渀最椀昀礀⠀洀漀挀欀䐀愀琀愀⸀椀渀椀琀椀愀氀伀爀搀攀爀⸀瀀愀礀洀攀渀琀猀⤀⤀ഀഀ
        };਍        ഀഀ
        setOrder(mappedOrder);਍        猀攀琀䐀戀䌀漀渀渀攀挀琀攀搀⠀琀爀甀攀⤀㬀ഀഀ
        ਍        ⼀⼀ 唀瀀搀愀琀攀 氀漀挀愀氀 猀琀愀最攀 瘀椀攀眀 琀漀 洀愀琀挀栀 匀甀瀀愀戀愀猀攀✀猀 猀琀愀琀甀猀ഀഀ
        const stageIdx = stages.findIndex(s => s.id === currentStageId);਍        椀昀 ⠀猀琀愀最攀䤀搀砀 ℀㴀㴀 ⴀ㄀⤀ 笀ഀഀ
          setCurrentStageIndex(stageIdx);਍        紀ഀഀ
        ਍        椀昀 ⠀氀漀最猀䐀愀琀愀 ☀☀ 氀漀最猀䐀愀琀愀⸀氀攀渀最琀栀 㸀 　⤀ 笀ഀഀ
          setLogs(logsData.map(log => {਍            挀漀渀猀琀 愀挀琀椀漀渀䌀渀 㴀 氀漀最⸀愀挀琀椀漀渀开搀攀猀挀开挀渀 簀簀 氀漀最⸀愀挀琀椀漀渀开搀攀猀挀开攀渀㬀ഀഀ
            let actionEn = log.action_desc_en || log.action_desc_cn;਍            椀昀 ⠀℀愀挀琀椀漀渀䔀渀 簀簀 愀挀琀椀漀渀䔀渀 㴀㴀㴀 愀挀琀椀漀渀䌀渀 簀簀 ⼀嬀尀甀㐀攀　　ⴀ尀甀㤀昀愀㔀崀⼀⸀琀攀猀琀⠀愀挀琀椀漀渀䔀渀⤀⤀ 笀ഀഀ
              actionEn = getLogActionEn(actionCn) || actionEn;਍            紀ഀഀ
            return {਍              琀椀洀攀㨀 氀漀最⸀挀爀攀愀琀攀搀开愀琀 㼀 渀攀眀 䐀愀琀攀⠀氀漀最⸀挀爀攀愀琀攀搀开愀琀⤀⸀琀漀䰀漀挀愀氀攀匀琀爀椀渀最⠀⤀ 㨀 ∀㈀　㈀㘀ⴀ　㔀ⴀ㈀㔀 ㄀　㨀㄀㔀㨀㈀　∀Ⰰഀഀ
              user: log.operator || "OpenClaw",਍              愀挀琀椀漀渀㨀 愀挀琀椀漀渀䌀渀Ⰰഀഀ
              actionEn: actionEn਍            紀㬀ഀഀ
          }));਍        紀ഀഀ
      }਍    紀 挀愀琀挀栀 ⠀攀爀爀⤀ 笀ഀഀ
      console.error("Supabase load error:", err);਍      猀攀琀䐀戀䔀爀爀漀爀⠀攀爀爀⸀洀攀猀猀愀最攀 簀簀 ∀䘀愀椀氀攀搀 琀漀 焀甀攀爀礀⸀ 倀氀攀愀猀攀 瘀攀爀椀昀礀 挀漀渀渀攀挀琀椀漀渀 挀爀攀搀攀渀琀椀愀氀猀⸀∀⤀㬀ഀഀ
      setDbConnected(false);਍      椀昀 ⠀猀栀漀甀氀搀吀栀爀漀眀⤀ 琀栀爀漀眀 攀爀爀㬀ഀഀ
    } finally {਍      猀攀琀䐀戀䰀漀愀搀椀渀最⠀昀愀氀猀攀⤀㬀ഀഀ
    }਍  紀㬀ഀഀ
਍  ⼀⼀ 䰀椀猀琀攀渀 琀漀 瀀漀猀琀䴀攀猀猀愀最攀 昀爀漀洀 挀栀椀氀搀 氀漀愀搀椀渀最ⴀ愀椀ഀഀ
  useEffect(() => {਍    挀漀渀猀琀 栀愀渀搀氀攀䌀栀椀氀搀䴀攀猀猀愀最攀 㴀 ⠀攀⤀ 㴀㸀 笀ഀഀ
      if (e.data && e.data.type === 'CRAFTON_CHILD_LANG_CHANGE') {਍        猀攀琀䰀愀渀最⠀攀⸀搀愀琀愀⸀氀愀渀最⤀㬀 ⼀⼀ ∀䌀渀∀ 漀爀 ∀䔀渀∀ഀഀ
      }਍    紀㬀ഀഀ
    window.addEventListener('message', handleChildMessage);਍    爀攀琀甀爀渀 ⠀⤀ 㴀㸀 眀椀渀搀漀眀⸀爀攀洀漀瘀攀䔀瘀攀渀琀䰀椀猀琀攀渀攀爀⠀✀洀攀猀猀愀最攀✀Ⰰ 栀愀渀搀氀攀䌀栀椀氀搀䴀攀猀猀愀最攀⤀㬀ഀഀ
  }, []);਍ഀഀ
  // Re-fetch when connection variables or language change਍  甀猀攀䔀昀昀攀挀琀⠀⠀⤀ 㴀㸀 笀ഀഀ
    fetchSupabaseData();਍  紀Ⰰ 嬀氀愀渀最崀⤀㬀ഀഀ
਍  ⼀⼀ 匀甀戀猀挀爀椀戀攀 琀漀 爀攀愀氀ⴀ琀椀洀攀 挀栀愀渀最攀猀 漀渀 匀甀瀀愀戀愀猀攀 眀栀攀渀 挀漀渀渀攀挀琀攀搀ഀഀ
  useEffect(() => {਍    椀昀 ⠀℀搀戀䌀漀渀渀攀挀琀攀搀⤀ 爀攀琀甀爀渀㬀ഀഀ
਍    氀攀琀 挀栀愀渀渀攀氀 㴀 渀甀氀氀㬀ഀഀ
    try {਍      挀漀渀猀琀 甀爀氀 㴀 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开甀爀氀∀⤀㬀ഀഀ
      const key = localStorage.getItem("supabase_key");਍      椀昀 ⠀甀爀氀 ☀☀ 欀攀礀 ☀☀ 眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⤀ 笀ഀഀ
        const client = window.supabase.createClient(url, key);਍        ഀഀ
        channel = client਍          ⸀挀栀愀渀渀攀氀⠀∀猀挀栀攀洀愀ⴀ搀戀ⴀ挀栀愀渀最攀猀∀⤀ഀഀ
          .on(਍            ∀瀀漀猀琀最爀攀猀开挀栀愀渀最攀猀∀Ⰰഀഀ
            {਍              攀瘀攀渀琀㨀 ∀⨀∀Ⰰഀഀ
              schema: "public",਍              琀愀戀氀攀㨀 ∀瀀爀漀樀攀挀琀猀∀ഀഀ
            },਍            ⠀瀀愀礀氀漀愀搀⤀ 㴀㸀 笀ഀഀ
              console.log("Realtime Change detected on 'projects':", payload);਍              昀攀琀挀栀匀甀瀀愀戀愀猀攀䐀愀琀愀⠀⤀㬀ഀഀ
            }਍          ⤀ഀഀ
          .on(਍            ∀瀀漀猀琀最爀攀猀开挀栀愀渀最攀猀∀Ⰰഀഀ
            {਍              攀瘀攀渀琀㨀 ∀⨀∀Ⰰഀഀ
              schema: "public",਍              琀愀戀氀攀㨀 ∀猀瀀攀挀椀昀椀挀愀琀椀漀渀猀∀ഀഀ
            },਍            ⠀瀀愀礀氀漀愀搀⤀ 㴀㸀 笀ഀഀ
              console.log("Realtime Change detected on 'specifications':", payload);਍              昀攀琀挀栀匀甀瀀愀戀愀猀攀䐀愀琀愀⠀⤀㬀ഀഀ
            }਍          ⤀ഀഀ
          .on(਍            ∀瀀漀猀琀最爀攀猀开挀栀愀渀最攀猀∀Ⰰഀഀ
            {਍              攀瘀攀渀琀㨀 ∀⨀∀Ⰰഀഀ
              schema: "public",਍              琀愀戀氀攀㨀 ∀瀀愀礀洀攀渀琀猀∀ഀഀ
            },਍            ⠀瀀愀礀氀漀愀搀⤀ 㴀㸀 笀ഀഀ
              console.log("Realtime Change detected on 'payments':", payload);਍              昀攀琀挀栀匀甀瀀愀戀愀猀攀䐀愀琀愀⠀⤀㬀ഀഀ
            }਍          ⤀ഀഀ
          .on(਍            ∀瀀漀猀琀最爀攀猀开挀栀愀渀最攀猀∀Ⰰഀഀ
            {਍              攀瘀攀渀琀㨀 ∀⨀∀Ⰰഀഀ
              schema: "public",਍              琀愀戀氀攀㨀 ∀愀最攀渀琀开氀漀最猀∀ഀഀ
            },਍            ⠀瀀愀礀氀漀愀搀⤀ 㴀㸀 笀ഀഀ
              console.log("Realtime Change detected on 'agent_logs':", payload);਍              昀攀琀挀栀匀甀瀀愀戀愀猀攀䐀愀琀愀⠀⤀㬀ഀഀ
            }਍          ⤀ഀഀ
          .on(਍            ∀瀀漀猀琀最爀攀猀开挀栀愀渀最攀猀∀Ⰰഀഀ
            {਍              攀瘀攀渀琀㨀 ∀⨀∀Ⰰഀഀ
              schema: "public",਍              琀愀戀氀攀㨀 ∀愀最攀渀琀开琀栀漀甀最栀琀开氀漀最猀∀ഀഀ
            },਍            ⠀瀀愀礀氀漀愀搀⤀ 㴀㸀 笀ഀഀ
              console.log("Realtime Change detected on 'agent_thought_logs':", payload);਍              昀攀琀挀栀匀甀瀀愀戀愀猀攀䐀愀琀愀⠀⤀㬀ഀഀ
            }਍          ⤀ഀഀ
          .subscribe((status) => {਍            挀漀渀猀漀氀攀⸀氀漀最⠀∀匀甀瀀愀戀愀猀攀 刀攀愀氀琀椀洀攀 猀甀戀猀挀爀椀瀀琀椀漀渀 猀琀愀琀甀猀㨀∀Ⰰ 猀琀愀琀甀猀⤀㬀ഀഀ
          });਍      紀ഀഀ
    } catch (err) {਍      挀漀渀猀漀氀攀⸀攀爀爀漀爀⠀∀刀攀愀氀琀椀洀攀 猀甀戀猀挀爀椀瀀琀椀漀渀 猀攀琀甀瀀 昀愀椀氀攀搀㨀∀Ⰰ 攀爀爀⤀㬀ഀഀ
    }਍ഀഀ
    return () => {਍      椀昀 ⠀挀栀愀渀渀攀氀 ☀☀ 眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⤀ 笀ഀഀ
        try {਍          挀漀渀猀琀 甀爀氀 㴀 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开甀爀氀∀⤀㬀ഀഀ
          const key = localStorage.getItem("supabase_key");਍          挀漀渀猀琀 挀氀椀攀渀琀 㴀 眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⸀挀爀攀愀琀攀䌀氀椀攀渀琀⠀甀爀氀Ⰰ 欀攀礀⤀㬀ഀഀ
          client.removeChannel(channel);਍          挀漀渀猀漀氀攀⸀氀漀最⠀∀匀甀瀀愀戀愀猀攀 刀攀愀氀琀椀洀攀 猀甀戀猀挀爀椀瀀琀椀漀渀 甀渀猀甀戀猀挀爀椀戀攀搀 猀甀挀挀攀猀猀昀甀氀氀礀⸀∀⤀㬀ഀഀ
        } catch (err) {਍          挀漀渀猀漀氀攀⸀攀爀爀漀爀⠀∀䘀愀椀氀攀搀 琀漀 挀氀攀愀渀 甀瀀 爀攀愀氀琀椀洀攀 挀栀愀渀渀攀氀㨀∀Ⰰ 攀爀爀⤀㬀ഀഀ
        }਍      紀ഀഀ
    };਍  紀Ⰰ 嬀搀戀䌀漀渀渀攀挀琀攀搀崀⤀㬀ഀഀ
਍  ⼀⼀ 䠀愀渀搀氀攀 猀愀瘀椀渀最 愀渀搀 琀攀猀琀椀渀最 匀甀瀀愀戀愀猀攀 挀漀渀昀椀最甀爀愀琀椀漀渀ഀഀ
  const handleSaveDbConfig = async (e) => {਍    攀⸀瀀爀攀瘀攀渀琀䐀攀昀愀甀氀琀⠀⤀㬀ഀഀ
    if (!dbUrl.trim() || !dbKey.trim()) {਍      氀漀挀愀氀匀琀漀爀愀最攀⸀爀攀洀漀瘀攀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开甀爀氀∀⤀㬀ഀഀ
      localStorage.removeItem("supabase_key");਍      猀攀琀䐀戀䌀漀渀渀攀挀琀攀搀⠀昀愀氀猀攀⤀㬀ഀഀ
      setShowDbConfig(false);਍      爀攀琀甀爀渀㬀ഀഀ
    }਍ഀഀ
    setDbLoading(true);਍    猀攀琀䐀戀䔀爀爀漀爀⠀∀∀⤀㬀ഀഀ
਍    琀爀礀 笀ഀഀ
      // Test the client connection਍      挀漀渀猀琀 琀攀猀琀䌀氀椀攀渀琀 㴀 眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⸀挀爀攀愀琀攀䌀氀椀攀渀琀⠀搀戀唀爀氀⸀琀爀椀洀⠀⤀Ⰰ 搀戀䬀攀礀⸀琀爀椀洀⠀⤀⤀㬀ഀഀ
      const { error } = await testClient.from("projects").select("id").limit(1);਍      ഀഀ
      if (error) throw error;਍ഀഀ
      // Persist to localStorage਍      氀漀挀愀氀匀琀漀爀愀最攀⸀猀攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开甀爀氀∀Ⰰ 搀戀唀爀氀⸀琀爀椀洀⠀⤀⤀㬀ഀഀ
      localStorage.setItem("supabase_key", dbKey.trim());਍      ഀഀ
      // Load actual data and execute the auto-seeder, letting errors propagate਍      愀眀愀椀琀 昀攀琀挀栀匀甀瀀愀戀愀猀攀䐀愀琀愀⠀琀爀甀攀⤀㬀ഀഀ
      ਍      ⼀⼀ 伀渀氀礀 猀攀琀 猀甀挀挀攀猀猀 猀琀愀琀甀猀 愀渀搀 挀氀漀猀攀 琀栀攀 搀爀愀眀攀爀 漀渀 挀漀洀瀀氀攀琀攀 猀甀挀挀攀猀猀℀ഀഀ
      setDbConnected(true);਍      猀攀琀匀栀漀眀䐀戀䌀漀渀昀椀最⠀昀愀氀猀攀⤀㬀ഀഀ
    } catch (err) {਍      挀漀渀猀漀氀攀⸀攀爀爀漀爀⠀∀䌀漀渀渀攀挀琀椀漀渀 愀渀搀 猀攀攀搀椀渀最 昀愀椀氀攀搀㨀∀Ⰰ 攀爀爀⤀㬀ഀഀ
      setDbError(err.message || "Connection failed. Please check URL / Anon Key and database tables.");਍      猀攀琀䐀戀䌀漀渀渀攀挀琀攀搀⠀昀愀氀猀攀⤀㬀ഀഀ
    } finally {਍      猀攀琀䐀戀䰀漀愀搀椀渀最⠀昀愀氀猀攀⤀㬀ഀഀ
    }਍  紀㬀ഀഀ
਍  挀漀渀猀琀 栀愀渀搀氀攀䘀漀爀挀攀匀攀攀搀 㴀 愀猀礀渀挀 ⠀⤀ 㴀㸀 笀ഀഀ
    if (!window.supabase) {਍      猀攀琀䐀戀䔀爀爀漀爀⠀∀匀甀瀀愀戀愀猀攀 挀氀椀攀渀琀 椀猀 渀漀琀 氀漀愀搀攀搀 椀渀 眀椀渀搀漀眀⸀∀⤀㬀ഀഀ
      return;਍    紀ഀഀ
    const url = localStorage.getItem("supabase_url");਍    挀漀渀猀琀 欀攀礀 㴀 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开欀攀礀∀⤀㬀ഀഀ
    if (!url || !key) {਍      猀攀琀䐀戀䔀爀爀漀爀⠀∀倀氀攀愀猀攀 猀愀瘀攀 愀 瘀愀氀椀搀 搀愀琀愀戀愀猀攀 挀漀渀渀攀挀琀椀漀渀 昀椀爀猀琀 戀攀昀漀爀攀 猀攀攀搀椀渀最⸀∀⤀㬀ഀഀ
      return;਍    紀ഀഀ
਍    猀攀琀䐀戀䰀漀愀搀椀渀最⠀琀爀甀攀⤀㬀ഀഀ
    setDbError("");਍ഀഀ
    try {਍      挀漀渀猀琀 挀氀椀攀渀琀 㴀 眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⸀挀爀攀愀琀攀䌀氀椀攀渀琀⠀甀爀氀Ⰰ 欀攀礀⤀㬀ഀഀ
      console.log("Force Re-seed: Clearing projects named 'CRAFT-202605-01'...");਍      ഀഀ
      const { error: deleteErr } = await client਍        ⸀昀爀漀洀⠀∀瀀爀漀樀攀挀琀猀∀⤀ഀഀ
        .delete()਍        ⸀攀焀⠀∀渀愀洀攀∀Ⰰ ∀䌀刀䄀䘀吀ⴀ㈀　㈀㘀　㔀ⴀ　㄀∀⤀㬀ഀഀ
        ਍      椀昀 ⠀搀攀氀攀琀攀䔀爀爀⤀ 笀ഀഀ
        console.warn("Delete of projects failed or returned error:", deleteErr);਍      紀ഀഀ
      ਍      挀漀渀猀漀氀攀⸀氀漀最⠀∀刀甀渀渀椀渀最 挀愀猀挀愀搀椀渀最 愀甀琀漀ⴀ猀攀攀搀椀渀最⸀⸀⸀∀⤀㬀ഀഀ
      await fetchSupabaseData(true);਍      猀攀琀䐀戀䌀漀渀渀攀挀琀攀搀⠀琀爀甀攀⤀㬀ഀഀ
      console.log("Force Re-seed completed successfully.");਍    紀 挀愀琀挀栀 ⠀攀爀爀⤀ 笀ഀഀ
      console.error("Force Re-seed failed:", err);਍      猀攀琀䐀戀䔀爀爀漀爀⠀∀䘀漀爀挀攀 刀攀ⴀ猀攀攀搀 昀愀椀氀攀搀㨀 ∀ ⬀ ⠀攀爀爀⸀洀攀猀猀愀最攀 簀簀 攀爀爀⤀⤀㬀ഀഀ
    } finally {਍      猀攀琀䐀戀䰀漀愀搀椀渀最⠀昀愀氀猀攀⤀㬀ഀഀ
    }਍  紀㬀ഀഀ
਍  挀漀渀猀琀 栀愀渀搀氀攀匀琀愀最攀䌀栀愀渀最攀 㴀 愀猀礀渀挀 ⠀椀渀搀攀砀⤀ 㴀㸀 笀ഀഀ
    setCurrentStageIndex(index);਍    ⼀⼀ 匀瀀攀挀椀愀氀 琀爀椀最最攀爀 氀漀最椀挀 戀愀猀攀搀 漀渀 猀琀愀最攀 挀氀椀挀欀猀 琀漀 洀愀欀攀 瀀爀漀琀漀琀礀瀀攀 昀攀攀氀 愀氀椀瘀攀ഀഀ
    if (index === 4) { // Stage 5: Crib 5 Check਍      猀攀琀䘀愀戀爀椀挀䌀漀洀瀀愀琀椀戀椀氀椀琀礀吀攀猀琀⠀∀瀀愀猀猀攀搀∀⤀㬀ഀഀ
      setIsCrib5Blocked(false);਍    紀 攀氀猀攀 椀昀 ⠀椀渀搀攀砀 㴀㴀㴀 㜀⤀ 笀 ⼀⼀ 匀琀愀最攀 㠀㨀 䌀栀漀 䐀攀挀椀猀椀漀渀ഀഀ
      setIsBiddingDone(true);਍    紀 攀氀猀攀 椀昀 ⠀椀渀搀攀砀 㴀㴀㴀 ㄀㐀⤀ 笀 ⼀⼀ 匀琀愀最攀 ㄀㔀㨀 匀瀀氀椀琀 䐀攀氀椀瘀攀爀礀 愀渀搀 匀琀爀椀欀攀 漀甀琀ഀഀ
      triggerSplitDelivery();਍    紀ഀഀ
਍    ⼀⼀ 匀礀渀挀 琀漀 匀甀瀀愀戀愀猀攀 椀昀 挀漀渀渀攀挀琀攀搀ഀഀ
    if (dbConnected && order.id) {਍      琀爀礀 笀ഀഀ
        const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));਍        挀漀渀猀琀 猀琀愀最攀䤀搀 㴀 猀琀愀最攀猀嬀椀渀搀攀砀崀⸀椀搀㬀ഀഀ
        const currentStageInt = parseInt(stageId.substring(1), 10);਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀瀀爀漀樀攀挀琀猀∀⤀⸀甀瀀搀愀琀攀⠀笀 挀甀爀爀攀渀琀开猀琀愀最攀㨀 挀甀爀爀攀渀琀匀琀愀最攀䤀渀琀 紀⤀⸀攀焀⠀∀椀搀∀Ⰰ 漀爀搀攀爀⸀椀搀⤀㬀ഀഀ
      } catch (err) {਍        挀漀渀猀漀氀攀⸀攀爀爀漀爀⠀∀匀甀瀀愀戀愀猀攀 猀琀愀最攀 猀礀渀挀 攀爀爀漀爀㨀∀Ⰰ 攀爀爀⤀㬀ഀഀ
      }਍    紀ഀഀ
  };਍ഀഀ
  const handleLangToggle = () => {਍    猀攀琀䰀愀渀最⠀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀䔀渀∀ 㨀 ∀䌀渀∀⤀㬀ഀഀ
  };਍ഀഀ
  // Simulating user typing in chat window਍  挀漀渀猀琀 栀愀渀搀氀攀匀攀渀搀䴀攀猀猀愀最攀 㴀 愀猀礀渀挀 ⠀⤀ 㴀㸀 笀ഀഀ
    if (!inputText.trim()) return;਍    挀漀渀猀琀 渀攀眀䴀猀最 㴀 笀 猀攀渀搀攀爀㨀 ∀挀氀椀攀渀琀∀Ⰰ 琀攀砀琀㨀 椀渀瀀甀琀吀攀砀琀 紀㬀ഀഀ
    setChatMessages([...chatMessages, newMsg]);਍    猀攀琀䤀渀瀀甀琀吀攀砀琀⠀∀∀⤀㬀ഀഀ
਍    ⼀⼀ 䄀䤀 愀甀琀漀洀愀琀攀搀 爀攀瀀氀礀 猀椀洀甀氀愀琀攀ഀഀ
    setTimeout(async () => {਍      氀攀琀 爀攀瀀氀礀吀攀砀琀 㴀 ∀∀㬀ഀഀ
      if (lang === "Cn") {਍        爀攀瀀氀礀吀攀砀琀 㴀 ∀붿뿯ⲽ灠攀渀䌀氀愀眀 씀㾓뿯墽呑뿯䎽붿붿뿯㾽 붿뿯붿뿯붿᭗뿯禽붿붿䕙뿯檽붿붿䝑 匀甀瀀愀戀愀猀攀 붿뿯䢽䅲㑝붿⹤붿뿯붿䵝⡐뿯붿㙒붿붿붿㼠㬀ഀഀ
      } else {਍        爀攀瀀氀礀吀攀砀琀 㴀 ∀嬀伀瀀攀渀䌀氀愀眀 䄀䤀 䄀猀猀椀猀琀愀渀琀崀㨀 刀攀挀攀椀瘀攀搀℀ 䤀 愀洀 瀀甀氀氀椀渀最 搀愀琀愀 昀爀漀洀 匀甀瀀愀戀愀猀攀 琀漀 洀愀琀挀栀 礀漀甀爀 搀攀猀椀最渀 爀攀焀甀攀猀琀⸀∀㬀ഀഀ
      }਍ഀഀ
      if (inputText.toLowerCase().includes("silk") || inputText.toLowerCase().includes("뿯涽뿯澽桓")) {਍        ⼀⼀ 吀爀椀最最攀爀 戀氀漀挀欀椀渀最 猀挀攀渀愀爀椀漀℀ഀഀ
        setFabricCompatibilityTest("blocked");਍        猀攀琀䤀猀䌀爀椀戀㔀䈀氀漀挀欀攀搀⠀琀爀甀攀⤀㬀ഀഀ
        if (lang === "Cn") {਍          爀攀瀀氀礀吀攀砀琀 㴀 ∀㼀뿯붿൲붿뿯ⲽ붿奠붿ὒ뛡㾓⼀ 䈀䄀一一䔀䐀붿뿯㾽 붿붿㐠⩚붿붿뿯⦽붿ဠ붿ఠ摙╥뿯붿붿붿붿卯ɨ붿붿붿붿붿붿敚뿯㾽⠀䌀爀椀戀 㔀⤀ 쌀ⲕ뿯½썏撕뿯枽奖붿繒붿祾᭏뿯侽붿⍕Ż䱿填᭾絴붿᭛䉰뿯붿ཀྵ뿯붿뿯墽幭붿⥐뿯ẽ뿯붿ᥕ籽Ɑ붿뿯瞽뿯붿᝿붿뿯붿ढ़붿붿౿奻뿯㾽붿᭘뿯ࢽ붿붿祐뿯垽뿯붿붿睑뿯䒽뿯붿붿뿯㶽뿯붿붿뿯碽繏붿뿯붿붿뿯잽墓㉛붿灭뿯㦽祼㽩⠀䰀椀渀攀渀⤀ 붿뿯⮽붿붿㽴⠀䰀攀愀琀栀攀爀⤀ᬀ뿯㾽㬀ഀഀ
        } else {਍          爀攀瀀氀礀吀攀砀琀 㴀 ∀㼀뿯붿൲⁻嬀䌀伀䴀倀䰀䤀䄀一䌀䔀 䄀䰀䔀刀吀 ⼀ 䈀䄀一一䔀䐀崀㨀 夀漀甀 猀攀氀攀挀琀攀搀 倀甀爀攀 匀椀氀欀 匀愀琀椀渀⸀ 唀䬀 䌀爀椀戀 㔀 昀椀爀攀 挀漀搀攀猀 瀀爀漀栀椀戀椀琀 昀氀愀洀攀 挀漀愀琀椀渀最 漀渀 搀攀氀椀挀愀琀攀 猀椀氀欀猀 ⠀挀愀甀猀攀猀 攀砀琀爀攀洀攀 猀栀爀椀渀欀愀最攀 ☀ 搀椀猀挀漀氀漀爀愀琀椀漀渀⤀⸀ 伀爀搀攀爀 栀愀猀 戀攀攀渀 䈀䰀伀䌀䬀䔀䐀⸀ 倀氀攀愀猀攀 猀攀氀攀挀琀 䰀椀渀攀渀 漀爀 䰀攀愀琀栀攀爀℀∀㬀ഀഀ
        }਍        ⼀⼀ 䘀漀爀挀攀 瀀爀漀挀攀猀猀 猀琀愀最攀 琀漀 匀　㔀 昀漀爀 搀攀洀漀渀猀琀爀愀琀椀漀渀ഀഀ
        setCurrentStageIndex(4); ਍        ഀഀ
        if (dbConnected && order.id) {਍          琀爀礀 笀ഀഀ
            const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));਍            愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀瀀爀漀樀攀挀琀猀∀⤀⸀甀瀀搀愀琀攀⠀笀 ഀഀ
              current_stage: 5,਍              猀攀氀攀挀琀攀搀开昀愀戀爀椀挀㨀 ∀䘀䄀䈀ⴀ　㌀∀Ⰰഀഀ
              is_crib5_blocked: true,਍              昀愀戀爀椀挀开挀漀洀瀀愀琀椀戀椀氀椀琀礀开琀攀猀琀㨀 ∀戀氀漀挀欀攀搀∀ഀഀ
            }).eq("id", order.id);਍          紀 挀愀琀挀栀 ⠀攀爀爀⤀ 笀ഀഀ
            console.error("Supabase silk block update error:", err);਍          紀ഀഀ
        }਍      紀ഀഀ
਍      猀攀琀䌀栀愀琀䴀攀猀猀愀最攀猀⠀瀀爀攀瘀 㴀㸀 嬀⸀⸀⸀瀀爀攀瘀Ⰰ 笀 猀攀渀搀攀爀㨀 ∀愀最攀渀琀∀Ⰰ 琀攀砀琀㨀 爀攀瀀氀礀吀攀砀琀 紀崀⤀㬀ഀഀ
    }, 1200);਍  紀㬀ഀഀ
਍  ⼀⼀ 匀椀洀甀氀愀琀攀 䌀栀漀✀猀 爀攀瘀椀攀眀 挀栀攀挀欀ⴀ漀昀昀 椀渀 匀　㐀ഀഀ
  const handleChoApproval = async () => {਍    挀漀渀猀琀 渀攀砀琀䤀渀搀攀砀 㴀 挀甀爀爀攀渀琀匀琀愀最攀䤀渀搀攀砀 ⬀ ㄀㬀ഀഀ
    setCurrentStageIndex(nextIndex);਍     愀搀搀䰀漀最⠀∀䌀栀漀∀Ⰰ ∀붿뿯붿젠ᶓ뿯䦽뿯춽붿뿯붿硒뿯ල嘊OM瀵╂牳뿯붿氶뿯亽붿뿯岽敖붿뿯嶽뿯檽甯뿯冽뿯₽?, "Technical specifications and BOM approved, signature released.");਍ഀഀ
    if (dbConnected && order.id) {਍      琀爀礀 笀ഀഀ
        const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));਍        挀漀渀猀琀 渀攀砀琀匀琀愀最攀䤀搀 㴀 猀琀愀最攀猀嬀渀攀砀琀䤀渀搀攀砀崀⸀椀搀㬀ഀഀ
        const nextStageInt = parseInt(nextStageId.substring(1), 10);਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀瀀爀漀樀攀挀琀猀∀⤀⸀甀瀀搀愀琀攀⠀笀 挀甀爀爀攀渀琀开猀琀愀最攀㨀 渀攀砀琀匀琀愀最攀䤀渀琀 紀⤀⸀攀焀⠀∀椀搀∀Ⰰ 漀爀搀攀爀⸀椀搀⤀㬀ഀഀ
        await client.from("agent_logs").insert({਍          瀀爀漀樀攀挀琀开椀搀㨀 漀爀搀攀爀⸀椀搀Ⰰഀഀ
          operator: "Cho",਍          愀挀琀椀漀渀开搀攀猀挀开挀渀㨀 ∀붿뿯붿젠ᶓ뿯䦽뿯춽붿뿯붿硒뿯ල嘊OM瀵╂牳뿯붿氶뿯亽붿뿯岽敖붿뿯嶽뿯檽甯뿯冽뿯₽?,਍          愀挀琀椀漀渀开搀攀猀挀开攀渀㨀 ∀吀攀挀栀 猀瀀攀挀椀昀椀挀愀琀椀漀渀猀 愀渀搀 䈀伀䴀 愀瀀瀀爀漀瘀攀搀Ⰰ 猀椀最渀攀搀 漀昀昀⸀∀ഀഀ
        });਍      紀 挀愀琀挀栀 ⠀攀爀爀⤀ 笀ഀഀ
        console.error("Supabase update error:", err);਍      紀ഀഀ
    }਍  紀㬀ഀഀ
਍  ⼀⼀ 匀椀洀甀氀愀琀攀 䌀爀椀戀 㔀 伀瘀攀爀爀椀搀攀 琀漀 戀礀瀀愀猀猀 戀氀漀挀欀ഀഀ
  const handleBypassCrib5 = async (fabricCode) => {਍    猀攀琀䘀愀戀爀椀挀䌀漀洀瀀愀琀椀戀椀氀椀琀礀吀攀猀琀⠀∀瀀愀猀猀攀搀∀⤀㬀ഀഀ
    setIsCrib5Blocked(false);਍    猀攀琀䌀甀爀爀攀渀琀匀琀愀最攀䤀渀搀攀砀⠀㔀⤀㬀 ⼀⼀ 䴀漀瘀攀 琀漀 渀攀砀琀 猀琀愀最攀 匀　㘀ഀഀ
    addLog("Cho", `뿯涽뿯붿敼붿╂뿯枽붿堣붿붿氭浛뿯붿㈤潰鏂欎붿 ${fabricCode} (娴뿯岽啗뿯붿뿯澽簹楹?붿屾뿯垽붿뿯熽뿯₽氳繃 Crib 5 瀹਍붿붿뿯㶽뿯붿쉗➕붿蛦붿ⱏ 怀䴀漀搀椀昀椀攀搀 洀愀琀攀爀椀愀氀 挀漀洀瀀氀椀愀渀挀攀㨀 匀眀愀瀀瀀攀搀 昀愀戀爀椀挀 琀漀 ␀笀昀愀戀爀椀挀䌀漀搀攀紀 ⠀一愀瘀礀 䌀氀愀猀猀椀挀 䰀椀渀攀渀⤀Ⰰ 猀甀挀挀攀猀猀昀甀氀氀礀 瀀愀猀猀椀渀最 琀栀攀 䌀爀椀戀 㔀 猀愀昀攀琀礀 挀漀洀瀀氀椀愀渀挀攀 最愀琀攀⸀怀⤀㬀ഀഀ
਍    椀昀 ⠀搀戀䌀漀渀渀攀挀琀攀搀 ☀☀ 漀爀搀攀爀⸀椀搀⤀ 笀ഀഀ
      try {਍        挀漀渀猀琀 挀氀椀攀渀琀 㴀 眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⸀挀爀攀愀琀攀䌀氀椀攀渀琀⠀氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开甀爀氀∀⤀Ⰰ 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开欀攀礀∀⤀⤀㬀ഀഀ
        await client.from("projects").update({ ਍          挀甀爀爀攀渀琀开猀琀愀最攀㨀 㘀Ⰰഀഀ
          selected_fabric: "FAB-02",਍          椀猀开挀爀椀戀㔀开戀氀漀挀欀攀搀㨀 昀愀氀猀攀Ⰰഀഀ
          fabric_compatibility_test: "passed"਍        紀⤀⸀攀焀⠀∀椀搀∀Ⰰ 漀爀搀攀爀⸀椀搀⤀㬀ഀഀ
        await client.from("agent_logs").insert({਍          瀀爀漀樀攀挀琀开椀搀㨀 漀爀搀攀爀⸀椀搀Ⰰഀഀ
          operator: "Cho",਍          愀挀琀椀漀渀开搀攀猀挀开挀渀㨀 怀붿붿뿯粽ᝥ뿯䊽붿婧뿯⎽䥘뿯ᮽ뿯ⶽ孬붿뿯Ⓗ瀲쉯ຓὫ뿯₽␀笀昀愀戀爀椀挀䌀漀搀攀紀 ⠀㐀붿坜붿뿯붿㥯祼㽩ᬀ뿯纽붿呗뿯붿붿㌠䍬⁾䌀爀椀戀 㔀 㤀൰夊뿯厽뿯붿붿뿯垽闂ㄧ뿯銆뿯侽,਍          愀挀琀椀漀渀开搀攀猀挀开攀渀㨀 怀䈀礀瀀愀猀猀攀搀 䌀爀椀戀 㔀㨀 䌀栀愀渀最攀搀 昀愀戀爀椀挀 琀漀 ␀笀昀愀戀爀椀挀䌀漀搀攀紀 ⠀一愀瘀礀 䌀氀愀猀猀椀挀 䰀椀渀攀渀⤀Ⰰ 猀甀挀挀攀猀猀昀甀氀氀礀 漀瘀攀爀爀椀搀椀渀最 最愀琀攀⸀怀ഀഀ
        });਍      紀 挀愀琀挀栀 ⠀攀爀爀⤀ 笀ഀഀ
        console.error("Supabase update error:", err);਍      紀ഀഀ
    }਍  紀㬀ഀഀ
਍  ⼀⼀ 匀椀洀甀氀愀琀攀 䌀栀漀 瀀椀挀欀椀渀最 䘀漀猀栀愀渀 䜀漀氀搀ⴀ匀甀渀 椀渀 匀　㠀ഀഀ
  const handleSelectSupplier = async (supplier) => {਍    猀攀琀匀攀氀攀挀琀攀搀匀甀瀀瀀氀椀攀爀⠀猀甀瀀瀀氀椀攀爀⤀㬀ഀഀ
    setIsBiddingDone(true);਍    ഀഀ
    // Update Master order values਍    挀漀渀猀琀 甀瀀搀愀琀攀搀䤀琀攀洀猀 㴀 漀爀搀攀爀⸀椀琀攀洀猀⸀洀愀瀀⠀椀琀攀洀 㴀㸀 笀ഀഀ
      if (item.typeEn === "Lobby Armchair" || item.typeEn === "VIP Club Chair") {਍        爀攀琀甀爀渀 笀 ⸀⸀⸀椀琀攀洀Ⰰ 甀渀椀琀倀爀椀挀攀㨀 猀甀瀀瀀氀椀攀爀⸀瀀爀椀挀攀倀攀爀䌀栀愀椀爀 紀㬀ഀഀ
      }਍      爀攀琀甀爀渀 椀琀攀洀㬀ഀഀ
    });਍ഀഀ
    const updatedPayments = order.payments.map(payment => {਍      椀昀 ⠀瀀愀礀洀攀渀琀⸀洀椀氀攀猀琀漀渀攀⸀椀渀挀氀甀搀攀猀⠀∀㔀　─∀⤀⤀ 笀ഀഀ
        return { ...payment, amount: 9350 }; // Simulated price recalculation਍      紀ഀഀ
      return payment;਍    紀⤀㬀ഀഀ
਍    猀攀琀伀爀搀攀爀⠀瀀爀攀瘀 㴀㸀 ⠀笀 ⸀⸀⸀瀀爀攀瘀Ⰰ 椀琀攀洀猀㨀 甀瀀搀愀琀攀搀䤀琀攀洀猀Ⰰ 瀀愀礀洀攀渀琀猀㨀 甀瀀搀愀琀攀搀倀愀礀洀攀渀琀猀 紀⤀⤀㬀ഀഀ
    addLog("Cho", `뿯妽뿯施뿯玽瀹屾뿯垽뿯붿뿯傽渶缁堥뿯₽਍繙恵䕭뿯Ⴝ塏뿯㾽 ␀笀猀甀瀀瀀氀椀攀爀⸀渀愀洀攀紀ᬀ뿯綽䝜欰뿯붿붿붿뿯⮽⩛뿯垽뿯붿붿쵳㾓繺붿㽭␀␀笀猀甀瀀瀀氀椀攀爀⸀瀀爀椀挀攀倀攀爀䌀栀愀椀爀紀⼀붿뿯㾽붿붿ⱏ 怀䈀椀搀搀椀渀最 挀漀洀瀀氀攀琀攀搀⸀ 匀攀氀攀挀琀攀搀 昀椀渀愀氀 猀甀瀀瀀氀椀攀爀㨀 ␀笀猀甀瀀瀀氀椀攀爀⸀渀愀洀攀紀⸀ 䰀漀戀戀礀 愀爀洀挀栀愀椀爀 甀渀椀琀 瀀爀椀挀攀 愀瀀瀀爀漀瘀攀搀 愀琀 ␀␀笀猀甀瀀瀀氀椀攀爀⸀瀀爀椀挀攀倀攀爀䌀栀愀椀爀紀⼀瀀挀⸀怀⤀㬀ഀഀ
    setCurrentStageIndex(8); // Move to production stage S09਍ഀഀ
    if (dbConnected && order.id) {਍      琀爀礀 笀ഀഀ
        const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀瀀爀漀樀攀挀琀猀∀⤀⸀甀瀀搀愀琀攀⠀笀 ഀഀ
          current_stage: 9,਍          猀攀氀攀挀琀攀搀开猀甀瀀瀀氀椀攀爀㨀 猀甀瀀瀀氀椀攀爀ഀഀ
        }).eq("id", order.id);਍        ഀഀ
        // Update specifications in database਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀猀瀀攀挀椀昀椀挀愀琀椀漀渀猀∀⤀ഀഀ
          .update({ unit_price: supplier.pricePerChair })਍          ⸀攀焀⠀∀瀀爀漀樀攀挀琀开椀搀∀Ⰰ 漀爀搀攀爀⸀椀搀⤀ഀഀ
          .in("item_type_en", ["Lobby Armchair", "VIP Club Chair"]);਍ഀഀ
        // Update relational payments schedule in database਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀瀀愀礀洀攀渀琀猀∀⤀⸀甀瀀搀愀琀攀⠀笀 愀洀漀甀渀琀㨀 㤀㌀㔀　 紀⤀⸀攀焀⠀∀瀀爀漀樀攀挀琀开椀搀∀Ⰰ 漀爀搀攀爀⸀椀搀⤀⸀椀氀椀欀攀⠀∀洀椀氀攀猀琀漀渀攀开攀渀∀Ⰰ ∀─㔀　─ 䐀攀瀀漀猀椀琀─∀⤀㬀ഀഀ
        await client.from("payments").update({ amount: 7480 }).eq("project_id", order.id).ilike("milestone_en", "%40% Shipping%");਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀瀀愀礀洀攀渀琀猀∀⤀⸀甀瀀搀愀琀攀⠀笀 愀洀漀甀渀琀㨀 ㄀㠀㜀　 紀⤀⸀攀焀⠀∀瀀爀漀樀攀挀琀开椀搀∀Ⰰ 漀爀搀攀爀⸀椀搀⤀⸀椀氀椀欀攀⠀∀洀椀氀攀猀琀漀渀攀开攀渀∀Ⰰ ∀─㄀　─ 䠀愀渀搀漀瘀攀爀─∀⤀㬀ഀഀ
਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀愀最攀渀琀开氀漀最猀∀⤀⸀椀渀猀攀爀琀⠀笀ഀഀ
          project_id: order.id,਍          漀瀀攀爀愀琀漀爀㨀 ∀䌀栀漀∀Ⰰഀഀ
          action_desc_cn: `뿯妽뿯施뿯玽瀹屾뿯垽뿯붿뿯傽渶缁堥뿯₽਍繙恵䕭뿯Ⴝ塏뿯㾽 ␀笀猀甀瀀瀀氀椀攀爀⸀渀愀洀攀紀ᬀ뿯綽䝜欰뿯붿붿붿뿯⮽⩛뿯垽뿯붿붿쵳㾓繺붿㽭␀␀笀猀甀瀀瀀氀椀攀爀⸀瀀爀椀挀攀倀攀爀䌀栀愀椀爀紀⼀붿뿯㾽붿붿ⱏഀഀ
          action_desc_en: `Supplier bidding finalized. Factory selected: ${supplier.name}. Lobby Armchair set to $${supplier.pricePerChair}/pc.`਍        紀⤀㬀ഀഀ
      } catch (err) {਍        挀漀渀猀漀氀攀⸀攀爀爀漀爀⠀∀匀甀瀀愀戀愀猀攀 甀瀀搀愀琀攀 攀爀爀漀爀㨀∀Ⰰ 攀爀爀⤀㬀ഀഀ
      }਍    紀ഀഀ
  };਍ഀഀ
  // Simulate Client Split Delivery and Strike out (S15)਍  挀漀渀猀琀 琀爀椀最最攀爀匀瀀氀椀琀䐀攀氀椀瘀攀爀礀 㴀 愀猀礀渀挀 ⠀⤀ 㴀㸀 笀ഀഀ
    setSplitDeliveryActive(true);਍    挀漀渀猀琀 甀瀀搀愀琀攀搀䤀琀攀洀猀 㴀 漀爀搀攀爀⸀椀琀攀洀猀⸀洀愀瀀⠀椀琀攀洀 㴀㸀 笀ഀഀ
      if (item.typeEn === "Lobby Armchair") {਍        爀攀琀甀爀渀 笀 ⸀⸀⸀椀琀攀洀Ⰰ 焀琀礀㨀 ㌀㠀Ⰰ 渀漀琀攀㨀 ∀붿붿붿ፖ㽚 ㌀㠀 붿뿯㾽⼀ 㼀뿯붿൲⁻夀뿯⢽붿㩹 ㈀ 붿뿯㾽⠀ᰀ뿯羽붿剮뿯붿붿쵖Ɠ≤⥥∀ 紀㬀ഀഀ
      }਍      椀昀 ⠀椀琀攀洀⸀琀礀瀀攀䔀渀 㴀㴀㴀 ∀䌀甀猀琀漀洀 伀愀欀 䌀漀昀昀攀攀 吀愀戀氀攀∀⤀ 笀ഀഀ
        return { ...item, qty: 4, note: "뿯宽뿯掽뿯垽娓? 4 뿯宽?/ 붿뿯犽笍 붿栨뿯禽: 1 뿯宽?(뿯璽㈠뿯妽뿯宽뿯枽뿯₽뿯₽娆?" };਍      紀ഀഀ
      return item;਍    紀⤀㬀ഀഀ
਍    挀漀渀猀琀 甀瀀搀愀琀攀搀倀愀礀洀攀渀琀猀 㴀 嬀ഀഀ
      { milestone: "50% Deposit (뿯宽붿뿯粽)", amount: 10450, date: "2026-05-25", status: "Paid" },਍      笀 洀椀氀攀猀琀漀渀攀㨀 ∀㐀　─ 匀栀椀瀀瀀椀渀最 刀攀氀攀愀猀攀 ⠀儀뿯㾽뿯붿붿彭뿯붿뿯⦽∀Ⰰ 愀洀漀甀渀琀㨀 㜀㠀㘀　Ⰰ 搀愀琀攀㨀 ∀㈀　㈀㘀ⴀ　㔀ⴀ㈀㔀∀Ⰰ 猀琀愀琀甀猀㨀 ∀倀愀椀搀∀ 紀Ⰰഀഀ
      { milestone: "10% Recalculated Balance (灏뿯炽뿯붿붿뿯掽뿯嚽뿯붿뿯嶽畻)", amount: 470, date: "Pending", status: "Pending" }਍    崀㬀ഀഀ
਍    猀攀琀伀爀搀攀爀⠀瀀爀攀瘀 㴀㸀 ⠀笀 ⸀⸀⸀瀀爀攀瘀Ⰰ 椀琀攀洀猀㨀 甀瀀搀愀琀攀搀䤀琀攀洀猀Ⰰ 瀀愀礀洀攀渀琀猀㨀 甀瀀搀愀琀攀搀倀愀礀洀攀渀琀猀 紀⤀⤀㬀ഀഀ
    addLog("Client", "붿뿯悽牬붿뿯嶽뿯붿붿氬洜瀹㈡뿯垽뿯纽붿뿯붿붿뿯悽牬뿯璽婂뿯媽붿屽彇娑?뿯붿婃뿯墽뿯붿嬫붿붿?뿯宽佃尪붿뿯犽뿯₽뿯傽뿯暽붿뿯暽뿯妽뿯纽氳뿯疽붿欒뿯嚽붿뿯暽噸뿯纽楋紝椁樻뿯붿붿獓붿뿯஽뿯㾽쉭ⲓ뿯붿㼠Ⰰ ∀伀渀ⴀ猀椀琀攀 昀攀攀搀戀愀挀欀㨀 䐀甀攀 琀漀 猀椀琀攀 挀栀愀渀最攀猀Ⰰ ㈀ 愀爀洀挀栀愀椀爀猀 愀渀搀 ㄀ 挀漀昀昀攀攀 琀愀戀氀攀 眀攀爀攀 挀愀渀挀攀氀攀搀⸀ 䤀渀椀琀椀愀琀攀搀 愀甀琀漀洀愀琀椀挀 猀琀爀椀欀攀ⴀ琀栀爀漀甀最栀 昀椀渀愀渀挀椀愀氀 爀攀挀愀氀挀甀氀愀琀椀漀渀㬀 爀攀洀愀椀渀椀渀最 戀愀氀愀渀挀攀 甀瀀搀愀琀攀搀⸀∀⤀㬀ഀഀ
਍    椀昀 ⠀搀戀䌀漀渀渀攀挀琀攀搀 ☀☀ 漀爀搀攀爀⸀椀搀⤀ 笀ഀഀ
      try {਍        挀漀渀猀琀 挀氀椀攀渀琀 㴀 眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⸀挀爀攀愀琀攀䌀氀椀攀渀琀⠀氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开甀爀氀∀⤀Ⰰ 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开欀攀礀∀⤀⤀㬀ഀഀ
        await client.from("projects").update({ split_delivery_active: true }).eq("id", order.id);਍        ഀഀ
        // Update specifications quantities and notes in database਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀猀瀀攀挀椀昀椀挀愀琀椀漀渀猀∀⤀ഀഀ
          .update({ ਍            焀甀愀渀琀椀琀礀㨀 ㌀㠀Ⰰ ഀഀ
            notes_cn: "뿯宽뿯掽뿯嚽娓? 38 뿯붿?/ 붿뿯犽笍 붿栨뿯禽: 2 뿯붿?(붿板뿯溽붿뿯掽뿯嚽鏍搁攢)",਍            渀漀琀攀猀开攀渀㨀 ∀匀栀椀瀀瀀攀搀㨀 ㌀㠀 瀀挀猀 ⼀ 㼀뿯붿൲⁻䌀愀渀挀攀氀氀攀搀㨀 ㈀ 瀀挀猀 ⠀猀椀琀攀 猀琀爀椀欀攀ⴀ琀栀爀漀甀最栀⤀∀ഀഀ
          })਍          ⸀攀焀⠀∀瀀爀漀樀攀挀琀开椀搀∀Ⰰ 漀爀搀攀爀⸀椀搀⤀ഀഀ
          .eq("item_type_en", "Lobby Armchair");਍          ഀഀ
        await client.from("specifications")਍          ⸀甀瀀搀愀琀攀⠀笀 ഀഀ
            quantity: 4, ਍            渀漀琀攀猀开挀渀㨀 ∀붿붿붿ፗ㽚 㐀 붿㽛⼀ 㼀뿯붿൲⁻夀뿯⢽붿㩹 ㄀ 붿㽛⠀붿⁴붿붿붿붿붿ؠ㽚∀Ⰰഀഀ
            notes_en: "Arrived: 4 pcs / 붿뿯犽笍 Cancelled: 1 pc (refunded)"਍          紀⤀ഀഀ
          .eq("project_id", order.id)਍          ⸀攀焀⠀∀椀琀攀洀开琀礀瀀攀开攀渀∀Ⰰ ∀䌀甀猀琀漀洀 伀愀欀 䌀漀昀昀攀攀 吀愀戀氀攀∀⤀㬀ഀഀ
਍        ⼀⼀ 刀攀挀愀氀挀甀氀愀琀攀 瀀愀礀洀攀渀琀猀 搀椀爀攀挀琀氀礀 椀渀 琀栀攀 搀愀琀愀戀愀猀攀ഀഀ
        await client.from("payments").update({ amount: 10450, status: "Paid", payment_date: "2026-05-25" }).eq("project_id", order.id).ilike("milestone_en", "%50% Deposit%");਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀瀀愀礀洀攀渀琀猀∀⤀⸀甀瀀搀愀琀攀⠀笀 愀洀漀甀渀琀㨀 㜀㠀㘀　Ⰰ 猀琀愀琀甀猀㨀 ∀倀愀椀搀∀Ⰰ 瀀愀礀洀攀渀琀开搀愀琀攀㨀 ∀㈀　㈀㘀ⴀ　㔀ⴀ㈀㔀∀ 紀⤀⸀攀焀⠀∀瀀爀漀樀攀挀琀开椀搀∀Ⰰ 漀爀搀攀爀⸀椀搀⤀⸀椀氀椀欀攀⠀∀洀椀氀攀猀琀漀渀攀开攀渀∀Ⰰ ∀─㐀　─ 匀栀椀瀀瀀椀渀最─∀⤀㬀ഀഀ
        await client.from("payments").update({ ਍          洀椀氀攀猀琀漀渀攀开挀渀㨀 ∀㄀　─ 伀붿붿뿯劽뿯붿붿붿뿯붿筝⁵⠀저䖓뿯玽붿뿯붿⤠∀Ⰰഀഀ
          milestone_en: "10% Recalculated Balance (Pending)",਍          愀洀漀甀渀琀㨀 㐀㜀　Ⰰഀഀ
          status: "Pending"਍        紀⤀⸀攀焀⠀∀瀀爀漀樀攀挀琀开椀搀∀Ⰰ 漀爀搀攀爀⸀椀搀⤀⸀椀氀椀欀攀⠀∀洀椀氀攀猀琀漀渀攀开攀渀∀Ⰰ ∀─㄀　─ 䠀愀渀搀漀瘀攀爀─∀⤀㬀ഀഀ
਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀愀最攀渀琀开氀漀最猀∀⤀⸀椀渀猀攀爀琀⠀笀ഀഀ
          project_id: order.id,਍          漀瀀攀爀愀琀漀爀㨀 ∀䌀氀椀攀渀琀∀Ⰰഀഀ
          action_desc_cn: "붿뿯悽牬붿뿯嶽뿯붿붿氬洜瀹㈡뿯垽뿯纽붿뿯붿붿뿯悽牬뿯璽婂뿯媽붿屽彇娑?뿯붿婃뿯墽뿯붿嬫붿붿?뿯宽佃尪붿뿯犽뿯₽뿯傽뿯暽붿뿯暽뿯妽뿯纽氳뿯疽붿欒뿯嚽붿뿯暽噸뿯纽楋紝椁樻뿯붿붿獓붿뿯஽뿯㾽쉭ⲓ뿯붿㼠Ⰰഀഀ
          action_desc_en: "Site feedback: Cancelled 2 Armchairs & 1 Table due to fitout changes. Auto strike-through recalculation initiated."਍        紀⤀㬀ഀഀ
      } catch (err) {਍        挀漀渀猀漀氀攀⸀攀爀爀漀爀⠀∀匀甀瀀愀戀愀猀攀 甀瀀搀愀琀攀 攀爀爀漀爀㨀∀Ⰰ 攀爀爀⤀㬀ഀഀ
      }਍    紀ഀഀ
  };਍ഀഀ
  const addLog = (user, actionCn, actionEn) => {਍    挀漀渀猀琀 琀椀洀攀 㴀 渀攀眀 䐀愀琀攀⠀⤀⸀琀漀䰀漀挀愀氀攀吀椀洀攀匀琀爀椀渀最⠀⤀㬀ഀഀ
    setLogs(prev => [{ ਍      琀椀洀攀㨀 怀㈀　㈀㘀ⴀ　㔀ⴀ㈀㔀 ␀笀琀椀洀攀紀怀Ⰰ ഀഀ
      user, ਍      愀挀琀椀漀渀㨀 愀挀琀椀漀渀䌀渀Ⰰ ഀഀ
      actionEn: actionEn || actionCn ਍    紀Ⰰ ⸀⸀⸀瀀爀攀瘀崀⤀㬀ഀഀ
  };਍ഀഀ
  // Calculate order total਍  挀漀渀猀琀 最攀琀伀爀搀攀爀吀漀琀愀氀 㴀 ⠀⤀ 㴀㸀 笀ഀഀ
    return order.items.reduce((acc, item) => acc + (item.unitPrice * item.qty), 0);਍  紀㬀ഀഀ
਍  爀攀琀甀爀渀 ⠀ഀഀ
    <div>਍      笀⼀⨀ 匀甀瀀愀戀愀猀攀 䌀漀渀渀攀挀琀椀漀渀 䐀爀愀眀攀爀 ⨀⼀紀ഀഀ
      {showDbConfig && (਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀愀渀椀洀愀琀攀ⴀ昀愀搀攀ⴀ椀渀∀ 猀琀礀氀攀㴀笀笀ഀഀ
          background: "#FFFFFF",਍          戀漀爀搀攀爀䈀漀琀琀漀洀㨀 ∀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀∀Ⰰഀഀ
          padding: "2.5rem 2rem",਍          瀀漀猀椀琀椀漀渀㨀 ∀爀攀氀愀琀椀瘀攀∀Ⰰഀഀ
          zIndex: 1000,਍          戀漀砀匀栀愀搀漀眀㨀 ∀　 ㄀　瀀砀 ㌀　瀀砀 爀最戀愀⠀㈀㠀Ⰰ㈀㜀Ⰰ㈀㐀Ⰰ　⸀　㔀⤀∀ഀഀ
        }}>਍          㰀搀椀瘀 猀琀礀氀攀㴀笀笀 洀愀砀圀椀搀琀栀㨀 ∀㠀　　瀀砀∀Ⰰ 洀愀爀最椀渀㨀 ∀　 愀甀琀漀∀ 紀紀㸀ഀഀ
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>਍              㰀栀㌀ 猀琀礀氀攀㴀笀笀 昀漀渀琀䘀愀洀椀氀礀㨀 ∀瘀愀爀⠀ⴀⴀ昀漀渀琀ⴀ琀攀挀栀⤀∀Ⰰ 挀漀氀漀爀㨀 ∀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀∀Ⰰ 洀愀爀最椀渀㨀 　 紀紀㸀ഀഀ
                뿯붿攲 Supabase 瀵붿뿯檽뿯붿告摎搴뿯붿䘠뿯㒽⁞⠀䰀椀瘀攀 䐀愀琀愀戀愀猀攀 匀礀渀挀⤀ഀഀ
              </h3>਍              㰀戀甀琀琀漀渀 ഀഀ
                onClick={() => setShowDbConfig(false)}਍                猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ∀渀漀渀攀∀Ⰰ 戀漀爀搀攀爀㨀 ∀渀漀渀攀∀Ⰰ 挀漀氀漀爀㨀 ∀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀∀Ⰰ 挀甀爀猀漀爀㨀 ∀瀀漀椀渀琀攀爀∀Ⰰ 昀漀渀琀匀椀稀攀㨀 ∀㄀⸀㈀爀攀洀∀ 紀紀ഀഀ
              >਍                䄀뿯㾽              㰀⼀戀甀琀琀漀渀㸀ഀഀ
            </div>਍            ഀഀ
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: "1.6" }}>਍              笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ ഀഀ
                ? "뿯붿붿帴붿版偍붿?Supabase 瀵붿뿯檽闆뿯厽뿯暽뿯붿氬韩붿뿯傽뿯붿뿯纽卞뿯皽붿存帴뿯宽?projects, specifications 붿?agent_logs 뿯붿告摎琛ㄤ붿뿯璽뿯₽붿栧뿯抽瀵붿뿯檽瀵뿯붿뿯厽뿯붿告摎뿯붿뿯傽뿯붿鏋뿯溽뿯枽뿯붿嬶紝灏뿯嚽뿯劽闆呴뿯檽뿯纽氬뿯垽鏈붿湴뿯妽℃摤뿯붿告摎뿯붿?਍                㨀 ∀䌀漀渀渀攀挀琀 琀漀 礀漀甀爀 氀椀瘀攀 匀甀瀀愀戀愀猀攀 挀氀漀甀搀 搀愀琀愀戀愀猀攀⸀ 吀栀攀 瀀爀漀琀漀琀礀瀀攀 眀椀氀氀 搀礀渀愀洀椀挀愀氀氀礀 爀攀愀搀 愀渀搀 眀爀椀琀攀 爀攀挀漀爀搀猀 琀漀 礀漀甀爀 瀀爀漀樀攀挀琀猀Ⰰ 猀瀀攀挀椀昀椀挀愀琀椀漀渀猀Ⰰ 愀渀搀 愀最攀渀琀开氀漀最猀 琀愀戀氀攀猀⸀ 䘀愀氀氀猀 戀愀挀欀 琀漀 氀漀挀愀氀 洀漀挀欀甀瀀 搀愀琀愀 椀昀 搀椀猀挀漀渀渀攀挀琀攀搀⸀∀紀ഀഀ
            </p>਍ഀഀ
            <form onSubmit={handleSaveDbConfig} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ∀昀氀攀砀∀Ⰰ 昀氀攀砀䐀椀爀攀挀琀椀漀渀㨀 ∀挀漀氀甀洀渀∀Ⰰ 最愀瀀㨀 ∀　⸀㐀爀攀洀∀ 紀紀㸀ഀഀ
                <label style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontFamily: "var(--font-tech)", letterSpacing: "1px" }}>SUPABASE PROJECT URL</label>਍                㰀椀渀瀀甀琀 ഀഀ
                  type="text" ਍                  挀氀愀猀猀一愀洀攀㴀∀挀栀愀琀ⴀ椀渀瀀甀琀∀ ഀഀ
                  placeholder="https://your-project-id.supabase.co" ਍                  瘀愀氀甀攀㴀笀搀戀唀爀氀紀 ഀഀ
                  onChange={(e) => setDbUrl(e.target.value)}਍                  猀琀礀氀攀㴀笀笀 眀椀搀琀栀㨀 ∀㄀　　─∀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ∀⌀䘀䘀䘀䘀䘀䘀∀Ⰰ 瀀愀搀搀椀渀最㨀 ∀　⸀㘀爀攀洀∀Ⰰ 戀漀爀搀攀爀㨀 ∀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀∀Ⰰ 挀漀氀漀爀㨀 ∀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀∀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ∀㈀瀀砀∀ 紀紀ഀഀ
                />਍              㰀⼀搀椀瘀㸀ഀഀ
਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ∀昀氀攀砀∀Ⰰ 昀氀攀砀䐀椀爀攀挀琀椀漀渀㨀 ∀挀漀氀甀洀渀∀Ⰰ 最愀瀀㨀 ∀　⸀㐀爀攀洀∀ 紀紀㸀ഀഀ
                <label style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontFamily: "var(--font-tech)", letterSpacing: "1px" }}>SUPABASE ANON KEY</label>਍                㰀椀渀瀀甀琀 ഀഀ
                  type="password" ਍                  挀氀愀猀猀一愀洀攀㴀∀挀栀愀琀ⴀ椀渀瀀甀琀∀ ഀഀ
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." ਍                  瘀愀氀甀攀㴀笀搀戀䬀攀礀紀 ഀഀ
                  onChange={(e) => setDbKey(e.target.value)}਍                  猀琀礀氀攀㴀笀笀 眀椀搀琀栀㨀 ∀㄀　　─∀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ∀⌀䘀䘀䘀䘀䘀䘀∀Ⰰ 瀀愀搀搀椀渀最㨀 ∀　⸀㘀爀攀洀∀Ⰰ 戀漀爀搀攀爀㨀 ∀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀∀Ⰰ 挀漀氀漀爀㨀 ∀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀∀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ∀㈀瀀砀∀ 紀紀ഀഀ
                />਍              㰀⼀搀椀瘀㸀ഀഀ
਍              笀搀戀䔀爀爀漀爀 ☀☀ ⠀ഀഀ
                <div style={{ color: "var(--accent-red)", fontSize: "0.8rem", background: "rgba(255, 76, 76, 0.08)", padding: "0.8rem", borderRadius: "6px", border: "1px solid var(--accent-red)", fontFamily: "var(--font-tech)" }}>਍                  㼀뿯붿൲⁻䔀刀刀伀刀㨀 笀搀戀䔀爀爀漀爀紀ഀഀ
                </div>਍              ⤀紀ഀഀ
਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ∀昀氀攀砀∀Ⰰ 最愀瀀㨀 ∀㄀爀攀洀∀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ∀　⸀㔀爀攀洀∀ 紀紀㸀ഀഀ
                <button type="submit" className="btn-premium" disabled={dbLoading} style={{ padding: "0.6rem 1.5rem" }}>਍                  笀搀戀䰀漀愀搀椀渀最 㼀 ∀吀攀猀琀椀渀最⸀⸀⸀∀ 㨀 ∀匀愀瘀攀 ☀ 匀礀渀挀 䰀椀瘀攀 䐀愀琀愀戀愀猀攀∀紀ഀഀ
                </button>਍                笀搀戀䌀漀渀渀攀挀琀攀搀 ☀☀ ⠀ഀഀ
                  <>਍                    㰀戀甀琀琀漀渀 ഀഀ
                      type="button" ਍                      挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ瀀爀攀洀椀甀洀∀ ഀഀ
                      style={{ ਍                        戀愀挀欀最爀漀甀渀搀㨀 ∀氀椀渀攀愀爀ⴀ最爀愀搀椀攀渀琀⠀㄀㌀㔀搀攀最Ⰰ 瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ漀爀愀渀最攀⤀ 　─Ⰰ ⌀䈀㠀㠀㌀㘀䌀 ㄀　　─⤀∀Ⰰ ഀഀ
                        borderColor: "transparent",਍                        挀漀氀漀爀㨀 ∀眀栀椀琀攀∀Ⰰ ഀഀ
                        padding: "0.6rem 1.5rem" ਍                      紀紀ഀഀ
                      onClick={handleForceSeed}਍                      搀椀猀愀戀氀攀搀㴀笀搀戀䰀漀愀搀椀渀最紀ഀഀ
                    >਍                      笀搀戀䰀漀愀搀椀渀最 㼀 ⠀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀케붿붿붿㽭⸀⸀∀ 㨀 ∀倀爀漀挀攀猀猀椀渀最⸀⸀⸀∀⤀ 㨀 ⠀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㼀뿯ֽദ⁻붿붿붿붿뿯붿붿붿뿯悽뿯붿붿뿯䪽乔≤ 㨀 ∀㼀뿯ֽദ⁻䘀漀爀挀攀 刀攀ⴀ匀攀攀搀 䐀愀琀愀戀愀猀攀∀⤀紀ഀഀ
                    </button>਍                    㰀戀甀琀琀漀渀 ഀഀ
                      type="button" ਍                      挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ猀攀挀漀渀搀愀爀礀∀ ഀഀ
                      style={{ borderColor: "var(--accent-red)", color: "var(--accent-red)", padding: "0.6rem 1.5rem" }}਍                      漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 笀ഀഀ
                        setDbUrl("");਍                        猀攀琀䐀戀䬀攀礀⠀∀∀⤀㬀ഀഀ
                        localStorage.removeItem("supabase_url");਍                        氀漀挀愀氀匀琀漀爀愀最攀⸀爀攀洀漀瘀攀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开欀攀礀∀⤀㬀ഀഀ
                        setDbConnected(false);਍                        猀攀琀伀爀搀攀爀⠀䨀匀伀一⸀瀀愀爀猀攀⠀䨀匀伀一⸀猀琀爀椀渀最椀昀礀⠀洀漀挀欀䐀愀琀愀⸀椀渀椀琀椀愀氀伀爀搀攀爀⤀⤀⤀㬀ഀഀ
                        setLogs(JSON.parse(JSON.stringify(mockData.changeLogs)));਍                        猀攀琀䌀甀爀爀攀渀琀匀琀愀最攀䤀渀搀攀砀⠀　⤀㬀ഀഀ
                      }}਍                    㸀ഀഀ
                      Disconnect਍                    㰀⼀戀甀琀琀漀渀㸀ഀഀ
                  </>਍                ⤀紀ഀഀ
              </div>਍            㰀⼀昀漀爀洀㸀ഀഀ
          </div>਍        㰀⼀搀椀瘀㸀ഀഀ
      )}਍ഀഀ
      {/* Navbar Header */}਍      㰀渀愀瘀 挀氀愀猀猀一愀洀攀㴀∀渀愀瘀戀愀爀∀㸀ഀഀ
        <div className="logo-container">਍          㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀氀漀最漀ⴀ氀漀最漀∀㸀䌀刀䄀䘀吀伀一 䄀䤀㰀⼀猀瀀愀渀㸀ഀഀ
        </div>਍ഀഀ
        <div className="nav-links">਍          㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀笀怀渀愀瘀ⴀ氀椀渀欀 ␀笀挀甀爀爀攀渀琀嘀椀攀眀 㴀㴀㴀 ∀䴀愀爀欀攀琀椀渀最∀ 㼀 ∀愀挀琀椀瘀攀∀ 㨀 ∀∀紀怀紀 漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 猀攀琀䌀甀爀爀攀渀琀匀琀愀最攀嘀椀攀眀⠀∀䴀愀爀欀攀琀椀渀最∀⤀紀㸀ഀഀ
            {lang === "Cn" ? "浼佷笟瀹樼뿯綽" : "Homepage"}਍          㰀⼀猀瀀愀渀㸀ഀഀ
          <span className={`nav-link ${currentView === "ClientPortal" ? "active" : ""}`} onClick={() => setCurrentStageView("ClientPortal")}>਍            笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㤀ⅰ붿籗Ɑ붿붿幭뿯㺽≾ 㨀 ∀䌀氀椀攀渀琀 倀漀爀琀愀氀∀紀ഀഀ
          </span>਍          㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀笀怀渀愀瘀ⴀ氀椀渀欀 ␀笀挀甀爀爀攀渀琀嘀椀攀眀 㴀㴀㴀 ∀䈀愀挀欀漀昀昀椀挀攀∀ 㼀 ∀愀挀琀椀瘀攀∀ 㨀 ∀∀紀怀紀 漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 猀攀琀䌀甀爀爀攀渀琀匀琀愀最攀嘀椀攀眀⠀∀䈀愀挀欀漀昀昀椀挀攀∀⤀紀㸀ഀഀ
            {lang === "Cn" ? "붿呯뿯綽뿯붿у뿯垽붿?(Cho/瀹㈡뿯垽)" : "Backoffice (Cho/Client)"}਍          㰀⼀猀瀀愀渀㸀ഀഀ
        </div>਍ഀഀ
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>਍          笀⼀⨀ 匀甀瀀愀戀愀猀攀 匀琀愀琀甀猀 䈀甀琀琀漀渀 ⨀⼀紀ഀഀ
          <button ਍            挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ猀攀挀漀渀搀愀爀礀∀ ഀഀ
            style={{ ਍              戀漀爀搀攀爀䌀漀氀漀爀㨀 搀戀䌀漀渀渀攀挀琀攀搀 㼀 ∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀∀ 㨀 ∀爀最戀愀⠀㈀㔀㔀Ⰰ㈀㔀㔀Ⰰ㈀㔀㔀Ⰰ　⸀㄀⤀∀Ⰰ ഀഀ
              color: dbConnected ? "var(--accent-green)" : "var(--text-secondary)",਍              搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰഀഀ
              alignItems: 'center',਍              最愀瀀㨀 ✀　⸀㔀爀攀洀✀Ⰰഀഀ
              fontSize: '0.8rem',਍              瀀愀搀搀椀渀最㨀 ✀　⸀㐀爀攀洀 　⸀㠀爀攀洀✀ഀഀ
            }}਍            漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 猀攀琀匀栀漀眀䐀戀䌀漀渀昀椀最⠀℀猀栀漀眀䐀戀䌀漀渀昀椀最⤀紀ഀഀ
          >਍            㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀笀怀猀琀愀最攀ⴀ戀愀搀最攀ⴀ搀漀琀 搀漀琀ⴀ␀笀搀戀䌀漀渀渀攀挀琀攀搀 㼀 ✀愀椀✀ 㨀 ✀最愀琀攀✀紀怀紀 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀㨀 　Ⰰ 眀椀搀琀栀㨀 ✀㠀瀀砀✀Ⰰ 栀攀椀最栀琀㨀 ✀㠀瀀砀✀Ⰰ 搀椀猀瀀氀愀礀㨀 ✀椀渀氀椀渀攀ⴀ戀氀漀挀欀✀ 紀紀㸀㰀⼀猀瀀愀渀㸀ഀഀ
            {dbConnected ? "Supabase Connected" : "Connect Supabase"}਍          㰀⼀戀甀琀琀漀渀㸀ഀഀ
਍          㰀戀甀琀琀漀渀 挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ猀攀挀漀渀搀愀爀礀∀ 漀渀䌀氀椀挀欀㴀笀栀愀渀搀氀攀䰀愀渀最吀漀最最氀攀紀㸀ഀഀ
            뿯붿뿯宽 {lang === "Cn" ? "English" : "뿯纽뿯侽뿯玽뿯涽붿≧紀ഀഀ
          </button>਍          㰀戀甀琀琀漀渀 挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ瀀爀攀洀椀甀洀∀ 漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 猀攀琀䌀甀爀爀攀渀琀匀琀愀最攀嘀椀攀眀⠀∀䌀氀椀攀渀琀倀漀爀琀愀氀∀⤀紀㸀ഀഀ
            {lang === "Cn" ? "붿뿯綽 / 娉ㄥ唽" : "Sign In"}਍          㰀⼀戀甀琀琀漀渀㸀ഀഀ
        </div>਍      㰀⼀渀愀瘀㸀ഀഀ
਍      笀搀戀䔀爀爀漀爀 ☀☀ ℀搀戀䌀漀渀渀攀挀琀攀搀 ☀☀ ⠀ഀഀ
        <div className="animate-fade-in" style={{਍          戀愀挀欀最爀漀甀渀搀㨀 ∀爀最戀愀⠀㄀㘀㘀Ⰰ ㄀㌀㈀Ⰰ ㄀㈀㠀Ⰰ 　⸀㤀㔀⤀∀Ⰰഀഀ
          color: "#ffffff",਍          瀀愀搀搀椀渀最㨀 ∀㄀爀攀洀 ㈀爀攀洀∀Ⰰഀഀ
          display: "flex",਍          樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ∀猀瀀愀挀攀ⴀ戀攀琀眀攀攀渀∀Ⰰഀഀ
          alignItems: "center",਍          昀漀渀琀匀椀稀攀㨀 ∀　⸀㠀㔀爀攀洀∀Ⰰഀഀ
          fontFamily: "var(--font-tech)",਍          戀漀爀搀攀爀䈀漀琀琀漀洀㨀 ∀㄀瀀砀 猀漀氀椀搀 ⌀䘀䄀䘀㤀䘀㘀∀Ⰰഀഀ
          gap: "1.5rem",਍          稀䤀渀搀攀砀㨀 㤀㤀㤀Ⰰഀഀ
          position: "relative"਍        紀紀㸀ഀഀ
          <div>਍            㼀뿯붿൲⁻㰀猀琀爀漀渀最㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀匀甀瀀愀戀愀猀攀 娀뿯纽Ṝ뿯₽⼀ 붿뿯悽뿯붿붿뿯ᶽ뿯ν뿯₽⠀匀攀攀搀椀渀最 䔀爀爀漀爀⤀㨀∀ 㨀 ∀匀甀瀀愀戀愀猀攀 匀礀渀挀 ⼀ 匀攀攀搀椀渀最 䔀爀爀漀爀㨀∀紀㰀⼀猀琀爀漀渀最㸀 笀搀戀䔀爀爀漀爀紀ഀഀ
          </div>਍          㰀戀甀琀琀漀渀 ഀഀ
            style={{਍              戀愀挀欀最爀漀甀渀搀㨀 ∀爀最戀愀⠀㈀㔀㔀Ⰰ ㈀㔀㔀Ⰰ ㈀㔀㔀Ⰰ 　⸀㄀㔀⤀∀Ⰰഀഀ
              border: "1px solid #ffffff",਍              挀漀氀漀爀㨀 ∀⌀昀昀昀昀昀昀∀Ⰰഀഀ
              padding: "0.4rem 1rem",਍              戀漀爀搀攀爀刀愀搀椀甀猀㨀 ∀㈀瀀砀∀Ⰰഀഀ
              cursor: "pointer",਍              昀漀渀琀匀椀稀攀㨀 ∀　⸀㜀㔀爀攀洀∀Ⰰഀഀ
              textTransform: "uppercase",਍              氀攀琀琀攀爀匀瀀愀挀椀渀最㨀 ∀㄀瀀砀∀ഀഀ
            }}਍            漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 猀攀琀匀栀漀眀䐀戀䌀漀渀昀椀最⠀琀爀甀攀⤀紀ഀഀ
          >਍            笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿붿㍰붿뿯붿慣붿뿯붿붿⁵⼀ 吀爀漀甀戀氀攀猀栀漀漀琀∀ 㨀 ∀吀爀漀甀戀氀攀猀栀漀漀琀 䌀漀渀昀椀最∀紀ഀഀ
          </button>਍        㰀⼀搀椀瘀㸀ഀഀ
      )}਍ഀഀ
      {/* VIEW 1: Web Marketing Portal */}਍      笀挀甀爀爀攀渀琀嘀椀攀眀 㴀㴀㴀 ∀䴀愀爀欀攀琀椀渀最∀ ☀☀ ⠀ഀഀ
        <div className="animate-fade-in" style={{ paddingBottom: "4rem" }}>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀漀爀琀愀氀ⴀ栀攀爀漀∀㸀ഀഀ
            <h1>਍              笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀䈀㭩ɪ㤰Ɒ붿㥗붿뿯붿᭓뿯䦽䥛 붿ⵯ붿獪뿯ኽ붿佽뿯⢽붿呖뿯⢽붿屺䍭붿뿯妽뿯㾽 㨀 ∀䠀椀最栀ⴀ䔀渀搀 䈀攀猀瀀漀欀攀 䘀甀爀渀椀琀甀爀攀Ⰰ 䐀爀椀瘀攀渀 戀礀 䄀甀琀漀渀漀洀漀甀猀 䴀甀氀琀椀ⴀ䄀最攀渀琀 圀漀爀欀昀氀漀眀猀⸀∀紀ഀഀ
            </h1>਍            㰀瀀㸀ഀഀ
              {lang === "Cn" ਍                㼀 ∀䌀爀愀昀琀漀渀 䄀䤀 㤀붿붿㕽쑰㒉筞뿯庽坓⁭䌀爀椀戀 㔀 ᄀ╚붿쵩붿潖붿뿯붿붿붿뿯▽樱籮Ɑ붿붿幭뿯㺽䡾붿붿⡓뿯붿붿붿붿繥創뿯ᖽ㙘붿붿㝐붿側硣뗡ⲓ붿뿯ᮽ뿯綽붿졗붿Ġᵿ붿붿뿯붿ᵑ䅽䤀 圀뿯붿붿붿側硣蛡碒붿睓뿯䒽뿯붿붿浴뿯玽뿯妽뿯施뿯玽뿯붿丆V瑙뿯喽붿붿뿯붿붿붿붿뿯붿붿붿붿붿뿯ᮽ뿯붿붿Ⱐ붿썓붿붿붿뿯㾽 ഀഀ
                : "Crafton AI bridges the gap between premium design and factory floor. Integrating UK Crib 5 flame codes, dual-language BOM generation, automatic pricing bids, and Computer Vision inspections."}਍            㰀⼀瀀㸀ഀഀ
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>਍              㰀戀甀琀琀漀渀 挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ瀀爀攀洀椀甀洀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀　⸀㠀爀攀洀 ㈀爀攀洀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀㄀爀攀洀✀ 紀紀 漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 猀攀琀䌀甀爀爀攀渀琀匀琀愀最攀嘀椀攀眀⠀∀䌀氀椀攀渀琀倀漀爀琀愀氀∀⤀紀㸀ഀഀ
                {lang === "Cn" ? "娉ㄥ唽뿯붿愪붿浼氬뿯憽 붿?AI뿯붿਍❙≤ 㨀 ∀䨀漀椀渀 䴀攀洀戀攀爀猀栀椀瀀 ☀ 䐀攀猀椀最渀 眀椀琀栀 䄀䤀∀紀ഀഀ
              </button>਍              㰀戀甀琀琀漀渀 挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ猀攀挀漀渀搀愀爀礀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀　⸀㠀爀攀洀 ㈀爀攀洀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀㄀爀攀洀✀ 紀紀 漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 猀攀琀䌀甀爀爀攀渀琀匀琀愀最攀嘀椀攀眀⠀∀䈀愀挀欀漀昀昀椀挀攀∀⤀紀㸀ഀഀ
                {lang === "Cn" ? "杩뿯涽뿯厽붿呴儴 17 闃붿뿯붿붿�⊑ 㨀 ∀匀椀洀甀氀愀琀攀 ㄀㜀ⴀ匀琀愀最攀 吀爀愀挀欀攀爀∀紀ഀഀ
              </button>਍            㰀⼀搀椀瘀㸀ഀഀ
          </div>਍ഀഀ
          {/* Integration: Material Studio Configurator */}਍          㰀搀椀瘀 猀琀礀氀攀㴀笀笀 洀愀砀圀椀搀琀栀㨀 ✀㄀㈀　　瀀砀✀Ⰰ 洀愀爀最椀渀㨀 ✀　 愀甀琀漀 ㌀爀攀洀 愀甀琀漀✀Ⰰ 瀀愀搀搀椀渀最㨀 ✀　 ㈀爀攀洀✀ 紀紀㸀ഀഀ
            {renderMaterialStudio()}਍          㰀⼀搀椀瘀㸀ഀഀ
਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀漀爀琀愀氀ⴀ昀攀愀琀甀爀攀猀ⴀ最爀椀搀∀㸀ഀഀ
            <div className="glass-card feature-box">਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀昀攀愀琀甀爀攀ⴀ椀挀漀渀∀㸀붿뿯ᶽᑭ뿯㾽⼀搀椀瘀㸀ഀഀ
              <div className="feature-title">{lang === "Cn" ? "Crib 5 붿붿뿯妽娑堥뿯榽뿯붿붿뿯垽" : "Crib 5 Anti-Fire Hard Gate"}</div>਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀昀攀愀琀甀爀攀ⴀ搀攀猀挀∀㸀ഀഀ
                {lang === "Cn" ਍                  㼀 ∀붿摾뿯붿㥼붿ɰ붿붿붿뿯붿붿붿붿뿯禽橏⡮뿯붿뿯ڽᕪ뿯붿붿奠붿붿붿뿯붿뿯ㆽ붿뿯붿붿붿붿湝붿뿯窽붿Ṙ뿯붿붿ཀྵ뿯붿뿯붿幹붿붿붿松붿졼↕붿붿붿붿⩛橛붿浴뿯玽붿뿯嶽孩瀛楁뿯媽뿯붿붿紝鏉뿯溽뿯粽붿瑰ぇ뿯璽ц繍뿯纽뿯犽뿯悽뿯붿? ਍                  㨀 ∀䄀甀琀漀洀愀琀椀挀 洀愀琀攀爀椀愀氀 挀栀攀挀欀 愀最愀椀渀猀琀 䈀爀椀琀椀猀栀 昀椀爀攀 搀愀琀愀戀愀猀攀猀⸀ 䐀攀氀椀挀愀琀攀 昀愀戀爀椀挀猀 ⠀氀椀欀攀 猀椀氀欀⤀ 琀栀愀琀 猀栀爀椀渀欀 甀渀搀攀爀 昀氀愀洀攀 挀漀愀琀椀渀最 愀爀攀 昀氀愀最最攀搀 愀渀搀 戀氀漀挀欀攀搀 戀攀昀漀爀攀 瀀爀漀搀甀挀琀椀漀渀⸀∀紀ഀഀ
              </div>਍            㰀⼀搀椀瘀㸀ഀഀ
਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀 昀攀愀琀甀爀攀ⴀ戀漀砀∀㸀ഀഀ
              <div className="feature-icon">뿯붿뿯憽붿?/div>਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀昀攀愀琀甀爀攀ⴀ琀椀琀氀攀∀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀䄀䤀 夀붿乕뿯璽ㄦ뿯閲뿯嶽뿯悽뿯妽뿯施뿯붿" : "AI CV Inspection"}</div>਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀昀攀愀琀甀爀攀ⴀ搀攀猀挀∀㸀ഀഀ
                {lang === "Cn" ਍                  㼀 ∀刀뿯䎽搥붿Ѵ뿯箽졵㾓뿯䮽뿯妽᭴ᥙ佽瀀攀渀䌀嘀ᬀ뿯ᮽᵙ睽뿯䒽뿯붿余붿ၕ塏뿯붿⅐썶붿붿ፚ뿯䊽ఄ塻뿯붿偱뿯₽䌀䄀䐀 붿側硣뿯施뿯枽൒焊뿯붿뿯嶽뿯悽뿯妽뿯施뿯붿붿뿯岽噾灞뿯炽붿붿氶뿯붿붿뿯掽뿯亽뿯붿欍뿯₽佸昂瀵歌뿯禽뿯宽뿯붿紝붿뿯咽뿯嶽붿뿯嶽뿯嚽붿ㄦ뿯媽뿯붿붿뿯妽뿯璽붿뿯₽? ਍                  㨀 ∀唀琀椀氀椀稀椀渀最 䌀漀洀瀀甀琀攀爀 嘀椀猀椀漀渀 琀漀 漀瘀攀爀氀愀瀀 眀漀爀欀攀爀 猀椀琀攀 瀀栀漀琀漀最爀愀瀀栀猀 眀椀琀栀 爀愀眀 䌀䄀䐀 搀爀愀眀椀渀最猀⸀ 䐀攀琀攀挀琀椀渀最 挀漀氀漀爀 漀爀 愀渀最氀攀 搀椀猀挀爀攀瀀愀渀挀椀攀猀 戀攀昀漀爀攀 挀愀爀最漀 氀攀愀瘀攀猀 琀栀攀 昀愀挀琀漀爀礀 昀氀漀漀爀⸀∀紀ഀഀ
              </div>਍            㰀⼀搀椀瘀㸀ഀഀ
਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀 昀攀愀琀甀爀攀ⴀ戀漀砀∀㸀ഀഀ
              <div className="feature-icon">뿯붿붿</div>਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀昀攀愀琀甀爀攀ⴀ琀椀琀氀攀∀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀伀瀀攀渀䌀氀愀眀 씀㾓뿯墽捑붿붿呖뿯⢽붿坺뿯㾽 㨀 ∀伀瀀攀渀䌀氀愀眀 䐀愀攀洀漀渀 䘀漀氀氀漀眀ⴀ甀瀀∀紀㰀⼀搀椀瘀㸀ഀഀ
              <div className="feature-desc">਍                笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ ഀഀ
                  ? "鏃뿯犽渶붿뿯嶽붿浜뿯咽伐뿯纽뿯붿銆?4 灏뿯徽椂뿯붿뿯傽뿯溽 AI 붿붿뿯妽缁欏伐붿뿯傽彂뿯붿?WhatsApp 뿯涽붿䱧뿯½뿯厽붿խᴦ붿붿塱붿♴붿뿯Ꮍ뿯䶽ᴄ᡽뿯㖽뿯붿砠䙏썝붿뿯ᚽ偭뿯ᦽᵫ䍽栀漀 씀붿ɟ붿뿯纽㙜佞뿯▽ⰱ붿뿯㾽 ഀഀ
                  : "No manual nagging. The OpenClaw Daemon queries production states from Supabase, automatically messaging factories in Chinese on WhatsApp to fetch updates."}਍              㰀⼀搀椀瘀㸀ഀഀ
            </div>਍          㰀⼀搀椀瘀㸀ഀഀ
        </div>਍      ⤀紀ഀഀ
਍      笀⼀⨀ 嘀䤀䔀圀 ㈀㨀 䌀氀椀攀渀琀 倀漀爀琀愀氀 ⠀䴀攀洀戀攀爀 䌀攀渀琀攀爀⤀ ⨀⼀紀ഀഀ
      {currentView === "ClientPortal" && (਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀愀渀椀洀愀琀攀ⴀ昀愀搀攀ⴀ椀渀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ∀㈀爀攀洀∀Ⰰ 洀愀砀圀椀搀琀栀㨀 ∀㄀㈀　　瀀砀∀Ⰰ 洀愀爀最椀渀㨀 ∀　 愀甀琀漀∀ 紀紀㸀ഀഀ
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>਍            㰀搀椀瘀㸀ഀഀ
              <h2 style={{ fontFamily: "var(--font-tech)", color: "var(--accent-cyan)" }}>਍                笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㤀ⅰ붿붿붿塤籷Ɑ붿붿뿯䎽붿婗뿯붿瑞≟ 㨀 ∀䌀䰀䤀䔀一吀 䴀䔀䴀䈀䔀刀 䌀䔀一吀䔀刀∀紀ഀഀ
              </h2>਍              㰀瀀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㠀㔀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ∀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀∀ 紀紀㸀ഀഀ
                ID: {order.clientName} | {lang === "Cn" ? "瀹਍붿붿䍾붿᭗뿯䮽畫瀀愀戀愀猀攀 䄀甀琀栀 붿붿붿㕙㽰 㨀 ∀匀攀挀甀爀椀琀礀㨀 匀甀瀀愀戀愀猀攀 䄀甀琀栀 刀䰀匀 䜀甀愀爀搀攀搀∀紀ഀഀ
              </p>਍            㰀⼀搀椀瘀㸀ഀഀ
            <div style={{ background: "rgba(124, 114, 103, 0.08)", padding: '0.5rem 1rem', borderRadius: '2px', border: "1px solid var(--glass-border)", fontSize: '0.85rem' }}>਍              笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀　뿯붿붿晘뿯⦽붿붿祥뿯垽뿯붿붿붿뿯㾽 ∀ 㨀 ∀伀爀搀攀爀 吀爀愀挀欀椀渀最㨀 ∀紀ഀഀ
              <strong style={{ color: "var(--accent-primary)", fontFamily: "var(--font-tech)", fontWeight: "bold" }}>{currentStage.id} - {lang === "Cn" ? currentStage.nameCn : currentStage.nameEn}</strong>਍            㰀⼀搀椀瘀㸀ഀഀ
          </div>਍ഀഀ
          <div className="dashboard-panels">਍            笀⼀⨀ 䰀攀昀琀 䌀漀氀甀洀渀㨀 䴀攀洀戀攀爀 伀爀搀攀爀 䐀愀猀栀戀漀愀爀搀 ⨀⼀紀ഀഀ
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>਍              笀爀攀渀搀攀爀䴀愀琀攀爀椀愀氀匀琀甀搀椀漀⠀⤀紀ഀഀ
              <div className="glass-card">਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ栀攀愀搀攀爀∀㸀ഀഀ
                  <div className="panel-title">뿯붿摝 {lang === "Cn" ? "붿ㄥ崟瀹氬뿯垽瑙뿯劽牸뿯涽뿯庽繘搴? : "Bespoke Items & Specs"}</div>਍                  㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㠀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀∀Ⰰ 昀漀渀琀䘀愀洀椀氀礀㨀 ∀瘀愀爀⠀ⴀⴀ昀漀渀琀ⴀ琀攀挀栀⤀∀ 紀紀㸀ഀഀ
                    Total: ${getOrderTotal().toLocaleString()}਍                  㰀⼀猀瀀愀渀㸀ഀഀ
                </div>਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ戀漀搀礀∀㸀ഀഀ
                  <table className="order-table">਍                    㰀琀栀攀愀搀㸀ഀഀ
                      <tr>਍                        㰀琀栀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀␀⵩し붿붿瀷" : "Item"}</th>਍                        㰀琀栀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿뿯㒽穏≖ 㨀 ∀儀琀礀∀紀㰀⼀琀栀㸀ഀഀ
                        <th>{lang === "Cn" ? "뿯梽뿯劽뿯₽夋潗뿯璽? : "Material Specs"}</th>਍                        㰀琀栀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀圀뿯붿붿≳ 㨀 ∀倀爀椀挀攀∀紀㰀⼀琀栀㸀ഀഀ
                        <th>{lang === "Cn" ? "灏뿯徽붿" : "Subtotal"}</th>਍                      㰀⼀琀爀㸀ഀഀ
                    </thead>਍                    㰀琀戀漀搀礀㸀ഀഀ
                      {order.items.map(item => (਍                        㰀琀爀 欀攀礀㴀笀椀琀攀洀⸀椀搀紀 挀氀愀猀猀一愀洀攀㴀笀猀瀀氀椀琀䐀攀氀椀瘀攀爀礀䄀挀琀椀瘀攀 ☀☀ ⠀椀琀攀洀⸀焀琀礀 㴀㴀㴀 ㌀㠀 簀簀 椀琀攀洀⸀焀琀礀 㴀㴀㴀 㐀⤀ 㼀 ∀猀琀爀椀欀攀ⴀ爀漀眀∀ 㨀 ∀∀紀㸀ഀഀ
                          <td style={{ fontWeight: '500' }}>਍                            笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 椀琀攀洀⸀琀礀瀀攀䌀渀 㨀 椀琀攀洀⸀琀礀瀀攀䔀渀紀ഀഀ
                          </td>਍                          㰀琀搀㸀ഀഀ
                            {splitDeliveryActive && item.id === "ITEM-01" ? (਍                              㰀猀瀀愀渀㸀㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 琀攀砀琀䐀攀挀漀爀愀琀椀漀渀㨀 ✀氀椀渀攀ⴀ琀栀爀漀甀最栀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ爀攀搀⤀✀ 紀紀㸀㐀　㰀⼀猀瀀愀渀㸀 㰀猀琀爀漀渀最 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 紀紀㸀㌀㠀㰀⼀猀琀爀漀渀最㸀㰀⼀猀瀀愀渀㸀ഀഀ
                            ) : splitDeliveryActive && item.id === "ITEM-03" ? (਍                              㰀猀瀀愀渀㸀㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 琀攀砀琀䐀攀挀漀爀愀琀椀漀渀㨀 ✀氀椀渀攀ⴀ琀栀爀漀甀最栀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ爀攀搀⤀✀ 紀紀㸀㔀㰀⼀猀瀀愀渀㸀 㰀猀琀爀漀渀最 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 紀紀㸀㐀㰀⼀猀琀爀漀渀最㸀㰀⼀猀瀀愀渀㸀ഀഀ
                            ) : (਍                              椀琀攀洀⸀焀琀礀ഀഀ
                            )}਍                          㰀⼀琀搀㸀ഀഀ
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>਍                            笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 椀琀攀洀⸀洀愀琀攀爀椀愀氀䌀渀 㨀 椀琀攀洀⸀洀愀琀攀爀椀愀氀䔀渀紀ഀഀ
                            {item.note && <div style={{ color: 'var(--accent-orange)', fontSize: '0.75rem', marginTop: '3px' }}>{item.note}</div>}਍                          㰀⼀琀搀㸀ഀഀ
                          <td>${item.unitPrice}</td>਍                          㰀琀搀 猀琀礀氀攀㴀笀笀 昀漀渀琀圀攀椀最栀琀㨀 ✀戀漀氀搀✀ 紀紀㸀␀笀⠀椀琀攀洀⸀甀渀椀琀倀爀椀挀攀 ⨀ 椀琀攀洀⸀焀琀礀⤀⸀琀漀䰀漀挀愀氀攀匀琀爀椀渀最⠀⤀紀㰀⼀琀搀㸀ഀഀ
                        </tr>਍                      ⤀⤀紀ഀഀ
                    </tbody>਍                  㰀⼀琀愀戀氀攀㸀ഀഀ
                </div>਍              㰀⼀搀椀瘀㸀ഀഀ
਍              笀⼀⨀ 匀琀攀瀀 戀愀爀 椀渀猀椀搀攀 洀攀洀戀攀爀 瀀漀爀琀愀氀 ⨀⼀紀ഀഀ
              <div className="glass-card" style={{ padding: '1.2rem' }}>਍                㰀栀㐀 猀琀礀氀攀㴀笀笀 昀漀渀琀䘀愀洀椀氀礀㨀 ✀瘀愀爀⠀ⴀⴀ昀漀渀琀ⴀ琀攀挀栀⤀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㠀㔀爀攀洀✀Ⰰ 洀愀爀最椀渀䈀漀琀琀漀洀㨀 ✀㄀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ挀礀愀渀⤀✀ 紀紀㸀ഀഀ
                  뿯붿搷 {lang === "Cn" ? "17 闃붿뿯붿붿堕뿯₽뿯犽笌붿堣붿杩뿯涽뿯宽鏉? : "17-Stage Production & Compliance Journey"}਍                㰀⼀栀㐀㸀ഀഀ
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(17, 1fr)', gap: '4px', height: '10px', background: 'var(--bg-tertiary)', borderRadius: '5px', overflow: 'hidden' }}>਍                  笀猀琀愀最攀猀⸀洀愀瀀⠀⠀猀琀Ⰰ 猀椀搀砀⤀ 㴀㸀 笀ഀഀ
                    let bg = "var(--bg-tertiary)";਍                    椀昀 ⠀猀椀搀砀 㰀 挀甀爀爀攀渀琀匀琀愀最攀䤀渀搀攀砀⤀ 戀最 㴀 ∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀∀㬀ഀഀ
                    if (sidx === currentStageIndex) bg = "var(--accent-cyan)";਍                    爀攀琀甀爀渀 ⠀ഀഀ
                      <div key={st.id} title={`${st.id} - ${lang === "Cn" ? st.nameCn : st.nameEn}`} style={{ background: bg, transition: 'background 0.3s' }}></div>਍                    ⤀㬀ഀഀ
                  })}਍                㰀⼀搀椀瘀㸀ഀഀ
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>਍                  㰀猀瀀愀渀㸀匀　㄀ 䤀渀琀愀欀攀㰀⼀猀瀀愀渀㸀ഀഀ
                  <span>S05 Crib5 Gate</span>਍                  㰀猀瀀愀渀㸀匀㄀㄀ 䄀䤀 䌀嘀 䜀愀琀攀㰀⼀猀瀀愀渀㸀ഀഀ
                  <span>S17 Complete</span>਍                㰀⼀搀椀瘀㸀ഀഀ
              </div>਍            㰀⼀搀椀瘀㸀ഀഀ
਍            笀⼀⨀ 刀椀最栀琀 䌀漀氀甀洀渀㨀 伀瀀攀渀䌀氀愀眀 圀攀戀 挀栀愀琀 昀漀爀 洀攀洀戀攀爀 琀漀 琀愀氀欀 搀椀爀攀挀琀氀礀 琀漀 䄀䤀 䄀最攀渀琀 ⨀⼀紀ഀഀ
            <div className="glass-card">਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ栀攀愀搀攀爀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ∀爀最戀愀⠀㄀㈀㐀Ⰰ ㄀㄀㐀Ⰰ ㄀　㌀Ⰰ 　⸀　㐀⤀∀ 紀紀㸀ഀഀ
                <div className="panel-title">਍                  㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀猀琀愀最攀ⴀ戀愀搀最攀ⴀ搀漀琀 搀漀琀ⴀ愀椀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ瀀爀椀洀愀爀礀⤀∀ 紀紀㸀㰀⼀猀瀀愀渀㸀ഀഀ
                  {lang === "Cn" ? "뿯涽?Crafton AI 뿯붿਍❙呤뿯䊽붿㕘䕰㵸≶ 㨀 ∀䐀攀猀椀最渀 ☀ 匀眀愀琀挀栀 䄀最攀渀琀 ⠀伀瀀攀渀䌀氀愀眀⤀∀紀ഀഀ
                </div>਍                㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀氀漀最漀ⴀ戀愀搀最攀∀㸀䰀椀瘀攀 䌀栀愀琀㰀⼀猀瀀愀渀㸀ഀഀ
              </div>਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ戀漀搀礀 挀栀愀琀ⴀ眀椀渀搀漀眀∀㸀ഀഀ
                <div className="chat-messages">਍                  笀挀栀愀琀䴀攀猀猀愀最攀猀⸀洀愀瀀⠀⠀洀猀最Ⰰ 洀椀搀砀⤀ 㴀㸀 ⠀ഀഀ
                    <div key={midx} className={`chat-bubble ${msg.sender === "client" ? "bubble-client" : "bubble-agent"}`}>਍                      笀洀猀最⸀琀攀砀琀紀ഀഀ
                    </div>਍                  ⤀⤀紀ഀഀ
                </div>਍                ഀഀ
                {/* Simulated SWATCH selectors for easier demoing */}਍                㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀　⸀㠀爀攀洀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀瘀愀爀⠀ⴀⴀ戀最ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 戀漀爀搀攀爀吀漀瀀㨀 ✀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀✀Ⰰ 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 最愀瀀㨀 ✀　⸀㔀爀攀洀✀Ⰰ 昀氀攀砀圀爀愀瀀㨀 ✀眀爀愀瀀✀ 紀紀㸀ഀഀ
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '100%' }}>਍                    笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀䜀뿯붿뿯亽붿뿯ල夊搧闈㈡뿯枽娴嬭瘯붿堢偣붿뿯䊽붿뿯禽ŏ붿뿯붿붿뿯㒽㙚ᩛ᭽뿯㾽 㨀 ∀䘀愀戀爀椀挀 猀眀愀琀挀栀攀猀 猀栀漀爀琀挀甀琀 ⠀挀氀椀挀欀 琀漀 猀椀洀甀氀愀琀攀⤀㨀∀紀ഀഀ
                  </span>਍                  㰀戀甀琀琀漀渀 挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ猀攀挀漀渀搀愀爀礀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀　⸀㈀爀攀洀 　⸀㔀爀攀洀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀爀攀洀✀ 紀紀 漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 笀 猀攀琀䤀渀瀀甀琀吀攀砀琀⠀∀䤀 眀愀渀琀 琀漀 挀栀攀挀欀 䘀䄀䈀ⴀ　㄀ 刀漀礀愀氀 嘀攀氀瘀攀琀 ⠀⠀뿯붿붿菡붿⍯Ż㽿 挀漀洀瀀愀琀椀戀椀氀椀琀礀∀⤀㬀 猀攀琀吀椀洀攀漀甀琀⠀栀愀渀搀氀攀匀攀渀搀䴀攀猀猀愀最攀Ⰰ ㄀　　⤀㬀 紀紀㸀ഀഀ
                    Royal Velvet (Crib 5 Ok)਍                  㰀⼀戀甀琀琀漀渀㸀ഀഀ
                  <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderColor: 'var(--accent-red)' }} onClick={() => { setInputText("I select FAB-03 Pure Silk Satin (뿯纽붿笣缁뿯咽紟)"); setTimeout(handleSendMessage, 100); }}>਍                    倀甀爀攀 匀椀氀欀 匀愀琀椀渀 ⠀㼀뿯붿൲⁻圀䤀䰀䰀 䈀䰀伀䌀䬀⤀ഀഀ
                  </button>਍                㰀⼀搀椀瘀㸀ഀഀ
਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀挀栀愀琀ⴀ椀渀瀀甀琀ⴀ愀爀攀愀∀㸀ഀഀ
                  <input type="text" className="chat-input" placeholder={lang === "Cn" ? "붿?AI 뿯璽㈤뿯梽뿯붿栧彉鏇뿯撽潰鏂?.." : "Ask AI Swatch or check codes..."} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />਍                  㰀戀甀琀琀漀渀 挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ瀀爀攀洀椀甀洀∀ 漀渀䌀氀椀挀欀㴀笀栀愀渀搀氀攀匀攀渀搀䴀攀猀猀愀最攀紀㸀匀攀渀搀㰀⼀戀甀琀琀漀渀㸀ഀഀ
                </div>਍              㰀⼀搀椀瘀㸀ഀഀ
            </div>਍          㰀⼀搀椀瘀㸀ഀഀ
        </div>਍      ⤀紀ഀഀ
਍      笀⼀⨀ 嘀䤀䔀圀 ㌀㨀 䤀渀琀攀爀渀愀氀 䈀愀挀欀漀昀昀椀挀攀 ⠀䌀栀漀 ⼀ 䌀氀椀攀渀琀 嘀椀攀眀⤀ ⨀⼀紀ഀഀ
      {currentView === "Backoffice" && (਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀搀愀猀栀戀漀愀爀搀ⴀ最爀椀搀 愀渀椀洀愀琀攀ⴀ昀愀搀攀ⴀ椀渀∀㸀ഀഀ
          {/* Sidebar Left: 17 Stages Controller */}਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀猀椀搀攀戀愀爀∀㸀ഀഀ
            <h3 className="sidebar-title">਍              笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㄀㜀쌀㖕뿯붿뿯侽뿯⚽붿썪ᖓ붿幨㽧 㨀 ∀㄀㜀ⴀ匀琀愀最攀 䌀漀渀琀爀漀氀 䌀攀渀琀攀爀∀紀ഀഀ
            </h3>਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀猀琀愀最攀ⴀ琀椀洀攀氀椀渀攀ⴀ瘀攀爀琀椀挀愀氀∀㸀ഀഀ
              {stages.map((st, idx) => {਍                氀攀琀 猀琀愀琀甀猀䌀氀愀猀猀 㴀 ∀∀㬀ഀഀ
                if (idx < currentStageIndex) statusClass = "completed";਍                椀昀 ⠀椀搀砀 㴀㴀㴀 挀甀爀爀攀渀琀匀琀愀最攀䤀渀搀攀砀⤀ 猀琀愀琀甀猀䌀氀愀猀猀 㴀 ∀愀挀琀椀瘀攀∀㬀ഀഀ
਍                爀攀琀甀爀渀 ⠀ഀഀ
                  <div key={st.id} className={`stage-item ${statusClass}`} onClick={() => handleStageChange(idx)}>਍                    㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀笀怀猀琀愀最攀ⴀ戀愀搀最攀ⴀ搀漀琀 搀漀琀ⴀ␀笀猀琀⸀琀礀瀀攀⸀琀漀䰀漀眀攀爀䌀愀猀攀⠀⤀紀怀紀㸀㰀⼀猀瀀愀渀㸀ഀഀ
                    <div className="stage-info">਍                      㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀猀琀愀最攀ⴀ椀搀∀㸀匀吀䄀䜀䔀 笀猀琀⸀椀搀紀 ⠀笀猀琀⸀琀礀瀀攀紀⤀㰀⼀搀椀瘀㸀ഀഀ
                      <div className="stage-name">{lang === "Cn" ? st.nameCn : st.nameEn}</div>਍                    㰀⼀搀椀瘀㸀ഀഀ
                  </div>਍                ⤀㬀ഀഀ
              })}਍            㰀⼀搀椀瘀㸀ഀഀ
          </div>਍ഀഀ
          {/* Right Main Admin Area */}਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀洀愀椀渀ⴀ挀漀渀琀攀渀琀∀㸀ഀഀ
            {/* Top Phase Header */}਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀 瀀栀愀猀攀ⴀ瀀爀漀最爀攀猀猀ⴀ戀愀渀渀攀爀∀㸀ഀഀ
              <div>਍                㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀氀漀最漀ⴀ戀愀搀最攀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ∀爀最戀愀⠀㄀㈀㐀Ⰰ ㄀㄀㐀Ⰰ ㄀　㌀Ⰰ 　⸀　㠀⤀∀Ⰰ 挀漀氀漀爀㨀 ∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ瀀爀椀洀愀爀礀⤀∀ 紀紀㸀ഀഀ
                  {currentStage.phase}਍                㰀⼀猀瀀愀渀㸀ഀഀ
                <h2 style={{ fontFamily: "var(--font-tech)", marginTop: "0.5rem" }}>਍                  匀琀愀最攀 笀挀甀爀爀攀渀琀匀琀愀最攀⸀椀搀紀㨀 笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 挀甀爀爀攀渀琀匀琀愀最攀⸀渀愀洀攀䌀渀 㨀 挀甀爀爀攀渀琀匀琀愀最攀⸀渀愀洀攀䔀渀紀ഀഀ
                </h2>਍                㰀瀀 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ∀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀∀Ⰰ 昀漀渀琀匀椀稀攀㨀 ∀　⸀㠀㔀爀攀洀∀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ∀　⸀㈀爀攀洀∀ 紀紀㸀ഀഀ
                  {lang === "Cn" ? currentStage.descCn : currentStage.descEn}਍                㰀⼀瀀㸀ഀഀ
              </div>਍ഀഀ
              {/* Render Simulation Interactivity depending on current active stage */}਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀䰀攀昀琀㨀 ✀愀甀琀漀✀ 紀紀㸀ഀഀ
                {currentStage.id === "S04" && (਍                  㰀戀甀琀琀漀渀 挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ瀀爀攀洀椀甀洀∀ 漀渀䌀氀椀挀欀㴀笀栀愀渀搀氀攀䌀栀漀䄀瀀瀀爀漀瘀愀氀紀㸀ഀഀ
                    붿뿯嶽笍 {lang === "Cn" ? "뿯붿瑰噯瑙뿯劽牸뿯涽붿笌BOM (Human H1)" : "Approve Tech BOM (Human H1)"}਍                  㰀⼀戀甀琀琀漀渀㸀ഀഀ
                )}਍ഀഀ
                {currentStage.id === "S05" && isCrib5Blocked && (਍                  㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 昀氀攀砀䐀椀爀攀挀琀椀漀渀㨀 ✀挀漀氀甀洀渀✀Ⰰ 最愀瀀㨀 ✀　⸀㔀爀攀洀✀Ⰰ 愀氀椀最渀䤀琀攀洀猀㨀 ✀昀氀攀砀ⴀ攀渀搀✀ 紀紀㸀ഀഀ
                    <span style={{ color: 'var(--accent-red)', fontSize: '0.8rem', fontWeight: 'bold' }}>붿뿯犽笍 CRIB 5 BLOCK INTERCEPTED (Crib 5 뿯宽뿯咽뿯垽뿯붿붿뿯垽뿯涽?</span>਍                    㰀戀甀琀琀漀渀 挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ瀀爀攀洀椀甀洀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ漀爀愀渀最攀⤀✀Ⰰ 挀漀氀漀爀㨀 ✀眀栀椀琀攀✀ 紀紀 漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 栀愀渀搀氀攀䈀礀瀀愀猀猀䌀爀椀戀㔀⠀∀一愀瘀礀 䌀氀愀猀猀椀挀 䰀椀渀攀渀∀⤀紀㸀ഀഀ
                      뿯붿攧 {lang === "Cn" ? "뿯宽뿯咽뿯垽闄뿯嶽뿯붿뿯涽붿뿯붿붿圕rib 5闈㈡뿯枽" : "Bypass block: Change to Navy Linen"}਍                    㰀⼀戀甀琀琀漀渀㸀ഀഀ
                  </div>਍                ⤀紀ഀഀ
਍                笀挀甀爀爀攀渀琀匀琀愀最攀⸀椀搀 㴀㴀㴀 ∀匀　㠀∀ ☀☀ ⠀ഀഀ
                  <span style={{ color: 'var(--accent-orange)', fontSize: '0.85rem', fontWeight: 'bold' }}>਍                    붿뿯붿⁡笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿붿橜奮뿯䖽癑붿뿯஽붿ᩚ붿㉭彼뿯붿Օ坻뿯㾽 㨀 ∀匀攀氀攀挀琀 猀甀瀀瀀氀椀攀爀 漀渀 琀栀攀 爀椀最栀琀 挀漀氀甀洀渀∀紀ഀഀ
                  </span>਍                ⤀紀ഀഀ
਍                笀挀甀爀爀攀渀琀匀琀愀最攀⸀椀搀 㴀㴀㴀 ∀匀㄀㔀∀ ☀☀ ℀猀瀀氀椀琀䐀攀氀椀瘀攀爀礀䄀挀琀椀瘀攀 ☀☀ ⠀ഀഀ
                  <button className="btn-premium" style={{ background: 'var(--accent-red)', color: 'white' }} onClick={triggerSplitDelivery}>਍                    㼀뿯㾽笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㤀ⅰ붿붿뿯ⲽ붿읖墓籛᭥뿯ⶽ붿᭘絴붿붿뿯ᮽ뿯⚽恬㽭붿呐뿯㎽붿붿๾獣붿뿯붿∠ 㨀 ∀䔀砀攀挀甀琀攀 匀瀀氀椀琀 䐀攀氀椀瘀攀爀礀 匀琀爀椀欀攀ⴀ琀栀爀漀甀最栀∀紀ഀഀ
                  </button>਍                ⤀紀ഀഀ
਍                笀挀甀爀爀攀渀琀匀琀愀最攀⸀椀搀 ℀㴀㴀 ∀匀　㐀∀ ☀☀ 挀甀爀爀攀渀琀匀琀愀最攀⸀椀搀 ℀㴀㴀 ∀匀　㠀∀ ☀☀ ⠀℀椀猀䌀爀椀戀㔀䈀氀漀挀欀攀搀⤀ ☀☀ ⠀ഀഀ
                  <button className="btn-secondary" onClick={() => handleStageChange(Math.min(currentStageIndex + 1, 16))}>਍                    笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿⥭붿붿㽙⠀붿͙붿㑚絚䙏⥭∀ 㨀 ∀一攀砀琀 匀椀洀甀氀愀琀椀漀渀 匀琀愀最攀 䌀뿯㾽紀ഀഀ
                  </button>਍                ⤀紀ഀഀ
              </div>਍            㰀⼀搀椀瘀㸀ഀഀ
਍            笀⼀⨀ 䄀搀洀椀渀 䌀攀渀琀攀爀 匀瀀氀椀琀 倀愀渀攀氀猀 ⨀⼀紀ഀഀ
            <div className="dashboard-panels">਍              笀⼀⨀ 䰀攀昀琀 䌀漀氀甀洀渀㨀 匀栀愀爀攀搀 䴀愀猀琀攀爀 匀栀攀攀琀 ⠀䴀攀洀漀爀礀 䈀愀猀攀⤀ ⨀⼀紀ഀഀ
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀∀㸀ഀഀ
                  <div className="panel-header">਍                    㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ琀椀琀氀攀∀㸀붿뿯㖽⁤匀甀瀀愀戀愀猀攀 伀뿯붿鎗붿붿붿뿯붿뿯ㆽ⁼⠀䴀愀猀琀攀爀 匀栀攀攀琀⤀㰀⼀搀椀瘀㸀ഀഀ
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {order.orderId}</span>਍                  㰀⼀搀椀瘀㸀ഀഀ
                  <div className="panel-body" style={{ padding: '1.5rem 0' }}>਍                    㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀琀愀戀氀攀ⴀ挀漀渀琀愀椀渀攀爀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀　 ㄀⸀㔀爀攀洀✀ 紀紀㸀ഀഀ
                      <table className="order-table" style={{ minWidth: '650px' }}>਍                        㰀琀栀攀愀搀㸀ഀഀ
                          <tr>਍                            㰀琀栀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀␀⵩し붿붿瀷" : "Item"}</th>਍                            㰀琀栀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿뿯㒽穏≖ 㨀 ∀儀琀礀∀紀㰀⼀琀栀㸀ഀഀ
                            <th>{lang === "Cn" ? "鏉愯뿯嶽瑙뿯劽牸 (붿뿯岽뿯붿)" : "Bilingual Material"}</th>਍                            㰀琀栀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀娀뿯ᶽ붿坠뿯붿붿≳ 㨀 ∀唀渀椀琀 倀爀椀挀攀∀紀㰀⼀琀栀㸀ഀഀ
                            <th>{lang === "Cn" ? "灏뿯徽붿" : "Subtotal"}</th>਍                          㰀⼀琀爀㸀ഀഀ
                        </thead>਍                        㰀琀戀漀搀礀㸀ഀഀ
                          {order.items.map(item => (਍                            㰀琀爀 欀攀礀㴀笀椀琀攀洀⸀椀搀紀㸀ഀഀ
                              <td style={{ fontWeight: '600' }}>਍                                笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 椀琀攀洀⸀琀礀瀀攀䌀渀 㨀 椀琀攀洀⸀琀礀瀀攀䔀渀紀ഀഀ
                              </td>਍                              㰀琀搀㸀ഀഀ
                                {splitDeliveryActive && item.id === "ITEM-01" ? (਍                                  㰀猀瀀愀渀㸀㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 琀攀砀琀䐀攀挀漀爀愀琀椀漀渀㨀 ✀氀椀渀攀ⴀ琀栀爀漀甀最栀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ爀攀搀⤀✀ 紀紀㸀㐀　㰀⼀猀瀀愀渀㸀 䌀뿯㾽㰀猀琀爀漀渀最 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 紀紀㸀㌀㠀㰀⼀猀琀爀漀渀最㸀㰀⼀猀瀀愀渀㸀ഀഀ
                                ) : splitDeliveryActive && item.id === "ITEM-03" ? (਍                                  㰀猀瀀愀渀㸀㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 琀攀砀琀䐀攀挀漀爀愀琀椀漀渀㨀 ✀氀椀渀攀ⴀ琀栀爀漀甀最栀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ爀攀搀⤀✀ 紀紀㸀㔀㰀⼀猀瀀愀渀㸀 䌀뿯㾽㰀猀琀爀漀渀最 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 紀紀㸀㐀㰀⼀猀琀爀漀渀最㸀㰀⼀猀瀀愀渀㸀ഀഀ
                                ) : (਍                                  椀琀攀洀⸀焀琀礀ഀഀ
                                )}਍                              㰀⼀琀搀㸀ഀഀ
                              <td style={{ fontSize: '0.8rem' }}>਍                                㰀搀椀瘀 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ挀礀愀渀⤀✀ 紀紀㸀笀椀琀攀洀⸀洀愀琀攀爀椀愀氀䔀渀紀㰀⼀搀椀瘀㸀ഀഀ
                                <div style={{ color: 'var(--text-secondary)' }}>{item.materialCn}</div>਍                                笀椀琀攀洀⸀渀漀琀攀 ☀☀ 㰀搀椀瘀 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ漀爀愀渀最攀⤀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀㌀瀀砀✀ 紀紀㸀笀椀琀攀洀⸀渀漀琀攀紀㰀⼀搀椀瘀㸀紀ഀഀ
                              </td>਍                              㰀琀搀㸀ഀഀ
                                {selectedSupplier ? (਍                                  㰀猀瀀愀渀㸀㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 琀攀砀琀䐀攀挀漀爀愀琀椀漀渀㨀 ✀氀椀渀攀ⴀ琀栀爀漀甀最栀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ洀甀琀攀搀⤀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀ 紀紀㸀␀笀椀琀攀洀⸀漀爀椀最椀渀愀氀唀渀椀琀倀爀椀挀攀紀㰀⼀猀瀀愀渀㸀 ␀笀椀琀攀洀⸀甀渀椀琀倀爀椀挀攀紀㰀⼀猀瀀愀渀㸀ഀഀ
                                ) : (਍                                  怀␀␀笀椀琀攀洀⸀甀渀椀琀倀爀椀挀攀紀怀ഀഀ
                                )}਍                              㰀⼀琀搀㸀ഀഀ
                              <td style={{ fontWeight: 'bold' }}>${(item.unitPrice * item.qty).toLocaleString()}</td>਍                            㰀⼀琀爀㸀ഀഀ
                          ))}਍                        㰀⼀琀戀漀搀礀㸀ഀഀ
                      </table>਍                    㰀⼀搀椀瘀㸀ഀഀ
਍                    笀⼀⨀ 刀攀挀愀氀挀甀氀愀琀攀搀 倀愀礀洀攀渀琀猀 愀琀 戀漀琀琀漀洀 漀昀 䴀愀猀琀攀爀 匀栀攀攀琀 ⨀⼀紀ഀഀ
                    <div className="payments-grid" style={{ padding: '0 1.5rem' }}>਍                      笀漀爀搀攀爀⸀瀀愀礀洀攀渀琀猀⸀洀愀瀀⠀⠀瀀Ⰰ 瀀椀搀砀⤀ 㴀㸀 ⠀ഀഀ
                        <div key={pidx} style={{ background: 'var(--bg-secondary)', padding: '0.8rem 0.6rem', borderRadius: '2px', border: '1px solid var(--glass-border)' }}>਍                          㰀搀椀瘀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ洀甀琀攀搀⤀✀ 紀紀㸀笀瀀⸀洀椀氀攀猀琀漀渀攀紀㰀⼀搀椀瘀㸀ഀഀ
                          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: p.status === "Paid" ? "var(--accent-green)" : "var(--accent-orange)", marginTop: '3px' }}>਍                            ␀笀瀀⸀愀洀漀甀渀琀⸀琀漀䰀漀挀愀氀攀匀琀爀椀渀最⠀⤀紀 ⠀笀瀀⸀猀琀愀琀甀猀 㴀㴀㴀 ∀倀愀椀搀∀ 㼀 ⠀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿浛뿯붿≼ 㨀 ∀倀愀椀搀∀⤀ 㨀 ⠀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀저䖓뿯玽붿뿯붿∠ 㨀 ∀倀攀渀搀椀渀最∀⤀紀⤀ഀഀ
                          </div>਍                        㰀⼀搀椀瘀㸀ഀഀ
                      ))}਍                    㰀⼀搀椀瘀㸀ഀഀ
                  </div>਍                㰀⼀搀椀瘀㸀ഀഀ
਍                笀⼀⨀ 䌀栀愀渀最攀 吀爀愀挀欀攀爀 䰀漀最 倀愀渀攀氀 ⨀⼀紀ഀഀ
                <div className="glass-card">਍                  㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ栀攀愀搀攀爀∀㸀ഀഀ
                    <div className="panel-title">਍                      笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿뿯ᶽᑭ뿯㾽夀뿯㮽㽪㥭붿砀뿯쎽붿吰⁾⠀䌀栀愀渀最攀 吀爀愀挀欀攀爀 䰀漀最⤀∀ 㨀 ∀붿뿯ᶽᑭ뿯㾽䌀栀愀渀最攀 吀爀愀挀欀攀爀 䰀漀最∀紀ഀഀ
                    </div>਍                  㰀⼀搀椀瘀㸀ഀഀ
                  <div className="panel-body" style={{ maxHeight: '180px', overflowY: 'auto' }}>਍                    笀氀漀最猀⸀洀愀瀀⠀⠀氀漀最Ⰰ 氀椀搀砀⤀ 㴀㸀 笀ഀഀ
                      const displayAction = lang === "Cn" ਍                        㼀 氀漀最⸀愀挀琀椀漀渀 ഀഀ
                        : (log.actionEn && !/[\u4e00-\u9fa5]/.test(log.actionEn) ਍                            㼀 氀漀最⸀愀挀琀椀漀渀䔀渀 ഀഀ
                            : (getLogActionEn(log.action) || log.actionEn || log.action));਍                      爀攀琀甀爀渀 ⠀ഀഀ
                        <div key={lidx} className="log-item">਍                          㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀氀漀最ⴀ琀椀洀攀∀㸀笀氀漀最⸀琀椀洀攀紀㰀⼀猀瀀愀渀㸀ഀഀ
                          <span className="log-user">{log.user}:</span>਍                          㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀ 紀紀㸀ഀഀ
                            {displayAction}਍                          㰀⼀猀瀀愀渀㸀ഀഀ
                        </div>਍                      ⤀㬀ഀഀ
                    })}਍                  㰀⼀搀椀瘀㸀ഀഀ
                </div>਍              㰀⼀搀椀瘀㸀ഀഀ
਍              笀⼀⨀ 刀椀最栀琀 䌀漀氀甀洀渀㨀 䄀䤀 伀瀀攀渀䌀氀愀眀 䌀漀爀攀 吀栀漀甀最栀琀 䌀漀渀猀漀氀攀 ⨀⼀紀ഀഀ
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>਍                ഀഀ
                {/* Integration: 17-Stage Stateful Visual Playground */}਍                笀爀攀渀搀攀爀䤀渀琀攀爀愀挀琀椀瘀攀倀氀愀礀最爀漀甀渀搀⠀⤀紀ഀഀ
਍                笀⼀⨀ 䐀攀昀愀甀氀琀 伀瀀攀渀䌀氀愀眀 吀栀椀渀欀椀渀最 䰀漀最猀 吀攀爀洀椀渀愀氀 ⨀⼀紀ഀഀ
                <div className="glass-card">਍                  㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ栀攀愀搀攀爀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ∀爀最戀愀⠀㄀㈀㐀Ⰰ ㄀㄀㐀Ⰰ ㄀　㌀Ⰰ 　⸀　㌀⤀∀ 紀紀㸀ഀഀ
                    <div className="panel-title">਍                      㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀猀琀愀最攀ⴀ戀愀搀最攀ⴀ搀漀琀 搀漀琀ⴀ愀椀∀ 猀琀礀氀攀㴀笀笀 愀渀椀洀愀琀椀漀渀㨀 ∀猀挀愀渀䔀昀昀攀挀琀 ㈀猀 椀渀昀椀渀椀琀攀 愀氀琀攀爀渀愀琀攀∀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ瀀爀椀洀愀爀礀⤀∀ 紀紀㸀㰀⼀猀瀀愀渀㸀ഀഀ
                      {lang === "Cn" ? "OpenClaw 鏅붿兘浣뿯撽뿯₽뿯澽뿯₽뿯冽뿯庽杩规帶붿뿯붿彴 (Thought-Process Terminal)" : "OpenClaw Thought-Process Terminal"}਍                    㰀⼀搀椀瘀㸀ഀഀ
                  </div>਍                  㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ戀漀搀礀∀㸀ഀഀ
                    <div className="terminal-console">਍                      笀洀漀挀欀䐀愀琀愀⸀愀最攀渀琀吀栀漀甀最栀琀䰀漀最猀嬀挀甀爀爀攀渀琀匀琀愀最攀⸀椀搀崀 㼀 ⠀ഀഀ
                        mockData.agentThoughtLogs[currentStage.id].map((tlog, tidx) => {਍                          挀漀渀猀琀 爀漀氀攀䰀愀戀攀氀 㴀 氀愀渀最 㴀㴀㴀 ∀䌀渀∀ഀഀ
                            ? (tlog.role === "thought" ? "뿯붿怉I THOUGHT뿯붿? : tlog.role === "action" ? "뿯붿怉CTION CALL뿯붿? : tlog.role === "observation" ? "뿯붿怬BSERVATION뿯붿? : "뿯붿怱YSTEM뿯붿?)਍                            㨀 ⠀琀氀漀最⸀爀漀氀攀 㴀㴀㴀 ∀琀栀漀甀最栀琀∀ 㼀 ∀嬀䄀䤀 吀䠀伀唀䜀䠀吀崀 ∀ 㨀 琀氀漀最⸀爀漀氀攀 㴀㴀㴀 ∀愀挀琀椀漀渀∀ 㼀 ∀嬀䄀䌀吀䤀伀一 䌀䄀䰀䰀崀 ∀ 㨀 琀氀漀最⸀爀漀氀攀 㴀㴀㴀 ∀漀戀猀攀爀瘀愀琀椀漀渀∀ 㼀 ∀嬀伀䈀匀䔀刀嘀䄀吀䤀伀一崀 ∀ 㨀 ∀嬀匀夀匀吀䔀䴀崀 ∀⤀㬀ഀഀ
                          return (਍                            㰀搀椀瘀 欀攀礀㴀笀琀椀搀砀紀 挀氀愀猀猀一愀洀攀㴀笀怀琀攀爀洀椀渀愀氀ⴀ氀椀渀攀 氀椀渀攀ⴀ␀笀琀氀漀最⸀爀漀氀攀紀怀紀㸀ഀഀ
                              <span>&gt; {roleLabel}</span>਍                              笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 琀氀漀最⸀琀攀砀琀 㨀 ⠀琀氀漀最⸀琀攀砀琀䔀渀 簀簀 琀氀漀最⸀琀攀砀琀⤀紀ഀഀ
                            </div>਍                          ⤀㬀ഀഀ
                        })਍                      ⤀ 㨀 ⠀ഀഀ
                        <div className="terminal-line line-system">਍                          ☀最琀㬀 笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ ഀഀ
                            ? "뿯붿怱YSTEM뿯붿慜penClaw Daemon v2.1 뿯붿뿯傽뿯溽뿯宽呭뿯憽뿯붿뿯傽뿯綽붿뿯嶽樁娈뿯垽湭缁戝畾뿯涽뿯붿睙뿯䒽뿯붿噙뿯⚽扨呣뿯붿붿붿᱐뿯暽뿯➽̱婭뿯㾽匀甀瀀愀戀愀猀攀 圀攀戀栀漀漀欀 夀䁴뿯䊽붿뿯㾽 ഀഀ
                            : "[SYSTEM] OpenClaw Daemon v2.1 Standby. No active automated task is bound to the current stage. Listening for Supabase Webhook triggers."}਍                        㰀⼀搀椀瘀㸀ഀഀ
                      )}਍                      㰀搀椀瘀 爀攀昀㴀笀琀攀爀洀椀渀愀氀䔀渀搀刀攀昀紀㸀㰀⼀搀椀瘀㸀ഀഀ
                    </div>਍                    㰀搀椀瘀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ洀甀琀攀搀⤀✀Ⰰ 琀攀砀琀䄀氀椀最渀㨀 ✀爀椀最栀琀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀　⸀㔀爀攀洀✀ 紀紀㸀ഀഀ
                      {lang === "Cn" ? "붿붿簬 OpenClaw / Supabase 浜嬩欢붿뿯施뿯妽鏋붿瀯" : "Powered by OpenClaw & Supabase Event Architecture"}਍                    㰀⼀搀椀瘀㸀ഀഀ
                  </div>਍                㰀⼀搀椀瘀㸀ഀഀ
              </div>਍            㰀⼀搀椀瘀㸀ഀഀ
          </div>਍        㰀⼀搀椀瘀㸀ഀഀ
      )}਍ഀഀ
      {/* High-End Glassmorphism Volumetric 3D Packing Simulation Modal */}਍      笀猀栀漀眀嘀漀氀甀洀攀琀爀椀挀匀椀洀甀氀愀琀椀漀渀 ☀☀ ⠀ഀഀ
        <div className="volumetric-modal-overlay">਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瘀漀氀甀洀攀琀爀椀挀ⴀ洀漀搀愀氀ⴀ挀愀爀搀∀㸀ഀഀ
            {/* Modal Header */}਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瘀漀氀甀洀攀琀爀椀挀ⴀ洀漀搀愀氀ⴀ栀攀愀搀攀爀∀㸀ഀഀ
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>਍                㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀㄀⸀㐀爀攀洀✀ 紀紀㸀붿뿯嶽㱤⼀猀瀀愀渀㸀ഀഀ
                <div>਍                  㰀栀㌀ 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀㨀 　Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀㄀⸀㄀爀攀洀✀Ⰰ 昀漀渀琀䘀愀洀椀氀礀㨀 ✀瘀愀爀⠀ⴀⴀ昀漀渀琀ⴀ琀攀挀栀⤀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀✀Ⰰ 昀漀渀琀圀攀椀最栀琀㨀 ✀㘀　　✀Ⰰ 氀攀琀琀攀爀匀瀀愀挀椀渀最㨀 ✀　⸀㔀瀀砀✀ 紀紀㸀ഀഀ
                    {lang === "Cn" ? "3D 闆뿯喽뿯붿뿯纽뿯붿帓娅뿯冽뿯劽붿栦붿붿뿯熽ā붿?(Live Volumetric Packing Simulation)" : "3D Volumetric Container Packing Simulation Console"}਍                  㰀⼀栀㌀㸀ഀഀ
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>਍                    笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿䕙뿯檽붿뿯ⶽᅛ뿯슽㾓䈀氀甀攀栀漀猀琀 嘀倀匀 저붿붿捙뿯붿뿯ソㅽ㈀㤀⸀㄀㈀㄀⸀㤀㠀⸀㄀㠀㔀 簀 㔀㵰뿯붿붿౭捙뿯Ꮍ붿䭓硱뿯붿≖⑲뿯䒽筚ॵ㽚 㨀 ∀䰀椀瘀攀 攀砀攀挀甀琀椀渀最 漀渀 䈀氀甀攀栀漀猀琀 嘀倀匀㨀 ㄀㈀㤀⸀㄀㈀㄀⸀㤀㠀⸀㄀㠀㔀 簀 刀攀愀氀琀椀洀攀 圀攀戀䜀䰀 刀攀渀搀攀爀 ☀ 䠀攀甀爀椀猀琀椀挀猀∀紀ഀഀ
                  </p>਍                㰀⼀搀椀瘀㸀ഀഀ
              </div>਍              ഀഀ
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>਍                笀⼀⨀ 伀瀀攀渀 椀渀 一攀眀 吀愀戀 䈀甀琀琀漀渀 ⨀⼀紀ഀഀ
                <button ਍                  漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 眀椀渀搀漀眀⸀漀瀀攀渀⠀怀⼀氀漀愀搀椀渀最ⴀ愀椀⼀㼀氀愀渀最㴀␀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀挀渀∀ 㨀 ∀攀渀∀紀怀Ⰰ ✀开戀氀愀渀欀✀⤀紀ഀഀ
                  style={{਍                    戀愀挀欀最爀漀甀渀搀㨀 ✀渀漀渀攀✀Ⰰഀഀ
                    border: '1px solid var(--text-primary)',਍                    挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀✀Ⰰഀഀ
                    padding: '0.4rem 0.8rem',਍                    昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀Ⰰഀഀ
                    fontFamily: 'var(--font-tech)',਍                    挀甀爀猀漀爀㨀 ✀瀀漀椀渀琀攀爀✀Ⰰഀഀ
                    display: 'flex',਍                    愀氀椀最渀䤀琀攀洀猀㨀 ✀挀攀渀琀攀爀✀Ⰰഀഀ
                    gap: '5px',਍                    戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㈀瀀砀✀Ⰰഀഀ
                    transition: 'all 0.2s',਍                  紀紀ഀഀ
                  onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--text-primary)'; e.target.style.color = '#ffffff'; }}਍                  漀渀䴀漀甀猀攀䰀攀愀瘀攀㴀笀⠀攀⤀ 㴀㸀 笀 攀⸀琀愀爀最攀琀⸀猀琀礀氀攀⸀戀愀挀欀最爀漀甀渀搀䌀漀氀漀爀 㴀 ✀琀爀愀渀猀瀀愀爀攀渀琀✀㬀 攀⸀琀愀爀最攀琀⸀猀琀礀氀攀⸀挀漀氀漀爀 㴀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀✀㬀 紀紀ഀഀ
                >਍                  㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㠀㔀爀攀洀✀ 紀紀㸀⬀뿯㾽⼀猀瀀愀渀㸀 笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀昀뿯⚽붿剧뿯붿᱕붿幭뿯붿幓붿붿᭎㽴 㨀 ∀伀瀀攀渀 䘀甀氀氀猀挀爀攀攀渀 椀渀 一攀眀 吀愀戀∀紀ഀഀ
                </button>਍ഀഀ
                {/* Close Button */}਍                㰀戀甀琀琀漀渀 ഀഀ
                  onClick={() => setShowVolumetricSimulation(false)}਍                  猀琀礀氀攀㴀笀笀ഀഀ
                    background: 'none',਍                    戀漀爀搀攀爀㨀 ✀渀漀渀攀✀Ⰰഀഀ
                    color: 'var(--text-primary)',਍                    挀甀爀猀漀爀㨀 ✀瀀漀椀渀琀攀爀✀Ⰰഀഀ
                    fontSize: '1.4rem',਍                    搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰഀഀ
                    alignItems: 'center',਍                    樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀挀攀渀琀攀爀✀Ⰰഀഀ
                    width: '32px',਍                    栀攀椀最栀琀㨀 ✀㌀㈀瀀砀✀Ⰰഀഀ
                    borderRadius: '50%',਍                    琀爀愀渀猀椀琀椀漀渀㨀 ✀戀愀挀欀最爀漀甀渀搀ⴀ挀漀氀漀爀 　⸀㈀猀✀Ⰰഀഀ
                    lineHeight: '1'਍                  紀紀ഀഀ
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(28,27,24,0.08)'}਍                  漀渀䴀漀甀猀攀䰀攀愀瘀攀㴀笀⠀攀⤀ 㴀㸀 攀⸀琀愀爀最攀琀⸀猀琀礀氀攀⸀戀愀挀欀最爀漀甀渀搀䌀漀氀漀爀 㴀 ✀琀爀愀渀猀瀀愀爀攀渀琀✀紀ഀഀ
                >਍                  䄀뿯㾽                㰀⼀戀甀琀琀漀渀㸀ഀഀ
              </div>਍            㰀⼀搀椀瘀㸀ഀഀ
਍            笀⼀⨀ 䴀漀搀愀氀 䈀漀搀礀 ⼀ 䤀昀爀愀洀攀 䌀漀渀琀愀椀渀攀爀 ⠀倀攀爀昀攀挀琀 ㄀　　─ 䠀攀椀最栀琀 䘀椀氀氀⤀ ⨀⼀紀ഀഀ
            <div className="volumetric-modal-body">਍              㰀椀昀爀愀洀攀 ഀഀ
                src={`/loading-ai/?lang=${lang === "Cn" ? "cn" : "en"}`} ਍                猀琀礀氀攀㴀笀笀ഀഀ
                  width: '100%',਍                  栀攀椀最栀琀㨀 ✀㄀　　─✀Ⰰഀഀ
                  flex: 1,਍                  戀漀爀搀攀爀㨀 ✀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀✀Ⰰഀഀ
                  background: '#FFFFFF',਍                  戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㈀瀀砀✀Ⰰഀഀ
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)',਍                  搀椀猀瀀氀愀礀㨀 ✀戀氀漀挀欀✀ഀഀ
                }}਍                琀椀琀氀攀㴀∀㌀䐀 䰀漀愀搀椀渀最 䄀䤀 匀椀洀甀氀愀琀椀漀渀∀ഀഀ
              />਍            㰀⼀搀椀瘀㸀ഀഀ
਍            笀⼀⨀ 䴀漀搀愀氀 䘀漀漀琀攀爀 ⨀⼀紀ഀഀ
            <div className="volumetric-modal-footer">਍              㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㈀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀ 紀紀㸀ഀഀ
                {lang === "Cn" ? "뿯붿挕 뿯붿愮ず붿氭뿯粽뿯榽뿯犽뿯疽杓붿彲뿯纽뿯붿啥ⱴ坨뿯ᮽ뿯纽붿捛붿佟붿뿯宽뿯犽썟ⶓ붿붿♴붿᭳뿯纽붿奛뿯붿䥢붿뿯⢽㩨奭뿯᪽ꧢ붿ཾ붿뿯妽붿붿㼠 㨀 ∀붿뿯ᖽ⁣䌀漀渀琀爀漀氀猀㨀 匀挀爀漀氀氀 眀栀攀攀氀 琀漀 稀漀漀洀Ⰰ 氀攀昀琀 挀氀椀挀欀 ☀ 搀爀愀最 琀漀 爀漀琀愀琀攀Ⰰ 爀椀最栀琀 挀氀椀挀欀 琀漀 瀀愀渀⸀∀紀ഀഀ
              </span>਍              㰀戀甀琀琀漀渀 ഀഀ
                className="btn-premium" ਍                猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀　⸀㔀爀攀洀 ㄀⸀㔀爀攀洀✀ 紀紀ഀഀ
                onClick={() => setShowVolumetricSimulation(false)}਍              㸀ഀഀ
                {lang === "Cn" ? "闂뿯溽뿯枽뿯涽뿯纽帶붿? : "Close Simulation"}਍              㰀⼀戀甀琀琀漀渀㸀ഀഀ
            </div>਍          㰀⼀搀椀瘀㸀ഀഀ
        </div>਍      ⤀紀ഀഀ
    </div>਍  ⤀㬀ഀഀ
}਍ഀഀ
export default App;਍�