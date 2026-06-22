뿯붿/**਍ ⨀ 䌀爀愀昀琀漀渀 䄀䤀 ⴀ 倀爀攀洀椀甀洀 䤀渀琀攀爀愀挀琀椀瘀攀 刀攀愀挀琀 倀爀漀琀漀琀礀瀀攀 䔀渀最椀渀攀ഀഀ
 * Dual-Facing: (1) Client Website & Portal (2) Internal Backoffice & OpenClaw Console਍ ⨀⼀ഀഀ
਍椀洀瀀漀爀琀 刀攀愀挀琀Ⰰ 笀 甀猀攀匀琀愀琀攀Ⰰ 甀猀攀䔀昀昀攀挀琀Ⰰ 甀猀攀刀攀昀 紀 昀爀漀洀 ✀爀攀愀挀琀✀㬀ഀഀ
import { createClient } from '@supabase/supabase-js';਍椀洀瀀漀爀琀 洀漀挀欀䐀愀琀愀 昀爀漀洀 ✀⸀⼀洀漀挀欀䐀愀琀愀✀㬀ഀഀ
਍⼀⼀ 䤀渀樀攀挀琀 椀渀琀漀 眀椀渀搀漀眀 昀漀爀 戀愀挀欀眀愀爀搀 挀漀洀瀀愀琀椀戀椀氀椀琀礀 眀椀琀栀 氀攀最愀挀礀 瀀爀漀琀漀琀礀瀀攀 挀漀搀攀ഀഀ
window.supabase = { createClient };਍ഀഀ
// Initialize Supabase from localStorage਍挀漀渀猀琀 猀愀瘀攀搀唀爀氀 㴀 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开甀爀氀∀⤀ 簀簀 ∀∀㬀ഀഀ
const savedKey = localStorage.getItem("supabase_key") || "";਍氀攀琀 猀甀瀀愀戀愀猀攀䌀氀椀攀渀琀 㴀 渀甀氀氀㬀ഀഀ
਍椀昀 ⠀猀愀瘀攀搀唀爀氀 ☀☀ 猀愀瘀攀搀䬀攀礀 ☀☀ 眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⤀ 笀ഀഀ
  try {਍    猀甀瀀愀戀愀猀攀䌀氀椀攀渀琀 㴀 眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⸀挀爀攀愀琀攀䌀氀椀攀渀琀⠀猀愀瘀攀搀唀爀氀Ⰰ 猀愀瘀攀搀䬀攀礀⤀㬀ഀഀ
  } catch (err) {਍    挀漀渀猀漀氀攀⸀攀爀爀漀爀⠀∀匀甀瀀愀戀愀猀攀 椀渀椀琀椀愀氀椀稀愀琀椀漀渀 攀爀爀漀爀㨀∀Ⰰ 攀爀爀⤀㬀ഀഀ
  }਍紀ഀഀ
਍挀漀渀猀琀 最攀琀䰀漀最䄀挀琀椀漀渀䔀渀 㴀 ⠀挀渀吀攀砀琀⤀ 㴀㸀 笀ഀഀ
  if (!cnText) return "";਍  ഀഀ
  // 1. Check exact match in mockData.changeLogs਍  挀漀渀猀琀 洀愀琀挀栀 㴀 洀漀挀欀䐀愀琀愀⸀挀栀愀渀最攀䰀漀最猀⸀昀椀渀搀⠀挀氀 㴀㸀 挀氀⸀愀挀琀椀漀渀 㴀㴀㴀 挀渀吀攀砀琀⤀㬀ഀഀ
  if (match && match.actionEn) return match.actionEn;਍  ഀഀ
  // 2. Check other known exact matches਍  挀漀渀猀琀 攀砀愀挀琀吀爀愀渀猀氀愀琀椀漀渀猀 㴀 笀ഀഀ
    "뿯붿뿯₽鏈붿붿鏍뿯붿뿯劽붿਍佖䴀㔀䉰猥붿뿯㚽붿᭎뿯붿噜婥뿯붿붿⽪붿붿㼠㨀 ∀吀攀挀栀 猀瀀攀挀椀昀椀挀愀琀椀漀渀猀 愀渀搀 䈀伀䴀 愀瀀瀀爀漀瘀攀搀Ⰰ 猀椀最渀攀搀 漀昀昀⸀∀Ⰰഀഀ
    "뿯붿뿯₽琛뿯撽뿯붿鏍兼浉붿਍佖䴀㔀䉰猥붿뿯㚽붿᭎뿯붿噜婥뿯붿붿⽪붿붿㼠㨀 ∀吀攀挀栀 猀瀀攀挀椀昀椀挀愀琀椀漀渀猀 愀渀搀 䈀伀䴀 愀瀀瀀爀漀瘀攀搀Ⰰ 猀椀最渀攀搀 漀昀昀⸀∀Ⰰഀഀ
    "붿뿯悽牬붿뿯嶽뿯붿붿氬洜瀹㈡뿯垽뿯纽붿뿯붿붿뿯悽牬뿯璽婂뿯媽붿屽彇娑?뿯붿婃뿯墽뿯붿嬫붿붿?뿯宽佃尪붿뿯犽뿯₽뿯傽뿯暽붿뿯暽뿯妽뿯纽氳뿯疽붿欒뿯嚽붿뿯暽噸뿯纽楋紝椁樻뿯붿붿獓붿뿯஽뿯㾽쉭ⲓ뿯붿㼠㨀 ∀匀椀琀攀 昀攀攀搀戀愀挀欀㨀 䌀愀渀挀攀氀氀攀搀 ㈀ 䄀爀洀挀栀愀椀爀猀 ☀ ㄀ 吀愀戀氀攀 搀甀攀 琀漀 昀椀琀漀甀琀 挀栀愀渀最攀猀⸀ 䄀甀琀漀 猀琀爀椀欀攀ⴀ琀栀爀漀甀最栀 爀攀挀愀氀挀甀氀愀琀椀漀渀 椀渀椀琀椀愀琀攀搀⸀∀Ⰰഀഀ
    "CRIB 5 붿뿯冽噿뿯妽㈡붿뿯澽뿯붿晽붿氱뿯碽뿯纽붿뿯皽뿯纽뿯炽樆붿뿯冽붿灞뿯ソ敹뿯纽뿯붿뿯嶽/뿯璽婅뿯墽붿뿯嚽뿯禽뿯宽뿯붿紙CRIB 5 BLOCKED붿?: "CRIB 5 Flammability Test Failed: Pure Silk Satin fire-retardant coating shrinkage and discoloration rate out of tolerance (CRIB 5 BLOCKED)",਍    ∀䌀刀䤀䈀 㔀 ᔀ뿯붿网붿⅙⼲뿯媽뿯᾽硘᭲뿯ㆽl቏뿯䢽붿읫㾕　붿붿붿ᝓ뿯䎽붿睠뿯䚽뿯㊽᭕뿯ᖽ剗䤀䈀 㔀 倀䄀匀匀䔀䐀ᬀ뿯㾽㨀 ∀䌀刀䤀䈀 㔀 䘀氀愀洀洀愀戀椀氀椀琀礀 吀攀猀琀 倀愀猀猀攀搀㨀 䘀氀愀洀攀 猀攀氀昀ⴀ攀砀琀椀渀最甀椀猀栀攀搀 瀀栀礀猀椀挀愀氀氀礀 眀椀琀栀椀渀 ㄀　 猀攀挀漀渀搀猀 漀昀 攀砀瀀漀猀甀爀攀 ⠀䌀刀䤀䈀 㔀 倀䄀匀匀䔀䐀⤀∀Ⰰഀഀ
    "붿뿯涽ぇ붿뿯咽彛붿뿯붿뿯璽鏍뿯붿뿯鎴愬뿯妽붿欼PPC붿뿯徽捀뿯璽夋뿯榽뿯붿佹捣闂뿯溽敵붿卞뿯枽뿯붿佽뿯붿뿯纽卞뿯枽搴뿯徽뿯垽铏뿯熽뿯窽붿뿯붿紙100% MATCH붿?: "Four export compliance documents verified successfully: IPPC fumigation certificate, Customs declaration, Packing lists match perfectly (100% MATCH)",਍    ∀쬀澕ご붿붿붿嵧뿯ᶽݘ붿뿯붿붿㥛붿붿᭦뿯䮽䡫䄀ⴀ㈀㔀㘀㨀 㠀昀㔀挀㤀　戀㘀愀㜀搀㄀㠀㜀㈀㄀挀㐀戀㈀攀㜀　攀㄀㜀㘀㌀㄀戀搀㐀昀戀㘀　㈀㤀挀昀㠀攀㄀㄀愀㈀昀㐀㈀㄀㤀戀㄀㘀㜀㔀㈀搀㔀㠀㘀戀㔀㄀∀㨀 ∀倀爀漀樀攀挀琀 愀爀挀栀椀瘀攀 栀愀猀栀攀搀 愀渀搀 瀀愀挀欀愀最攀搀㨀 匀䠀䄀ⴀ㈀㔀㘀㨀 㠀昀㔀挀㤀　戀㘀愀㜀搀㄀㠀㜀㈀㄀挀㐀戀㈀攀㜀　攀㄀㜀㘀㌀㄀戀搀㐀昀戀㘀　㈀㤀挀昀㠀攀㄀㄀愀㈀昀㐀㈀㄀㤀戀㄀㘀㜀㔀㈀搀㔀㠀㘀戀㔀㄀∀Ⰰഀഀ
    "뿯妽㈡붿붿扮挡缍㈢‖뿯붿т笉붿堣뿯붿붿屼뿯窽뿯붿뿯垽浛뿯붿뿯涽潰鏂欑偤붿歀-4410 (娴뿯疽뿯粽뿯붿뿯嶽簽楹?": "Detected critical non-compliance on Silk. Swapped fabric to: L-4410 (Navy Classic Linen) with one click.",਍    ∀∀뿯붿붿偗䐀䘀唀붿硟읲榓뿯ᶽ佽뿯⢽붿啖뿯붿Ṧ뿯⊽뿯㾽匀䴀吀倀 붿뿯碽≑ݫ붿붿睪뿯㾽㌀ 㤀㕰뿯炽婒뿯ᶽၢ붿붿붿㼠㨀 ∀䜀攀渀攀爀愀琀攀搀 倀䐀䘀 猀瀀攀挀椀昀椀挀愀琀椀漀渀 猀栀攀攀琀Ⰰ 愀甀琀漀洀愀琀椀挀愀氀氀礀 挀愀氀氀椀渀最 匀䴀吀倀 琀漀 搀椀猀瀀愀琀挀栀 刀䘀儀猀 琀漀 ㌀ 琀愀爀最攀琀 昀愀挀琀漀爀椀攀猀⸀∀ഀഀ
  };਍  ഀഀ
  if (exactTranslations[cnText]) {਍    爀攀琀甀爀渀 攀砀愀挀琀吀爀愀渀猀氀愀琀椀漀渀猀嬀挀渀吀攀砀琀崀㬀ഀഀ
  }਍  ഀഀ
  // 3. Dynamic templates (Crib 5 Override and supplier selections)਍  椀昀 ⠀挀渀吀攀砀琀⸀椀渀挀氀甀搀攀猀⠀∀붿붿뿯粽ᝥ뿯䊽붿婧뿯⎽䥘뿯ᮽ뿯ⶽ孬붿뿯Ⓗ瀲쉯ຓὫ뿯⊽⤀⤀ 笀ഀഀ
    const matchFabric = cnText.match(/鏇挎崲闈㈡뿯枽뿯涽뿯箽s*(\S+)/);਍    挀漀渀猀琀 挀漀搀攀 㴀 洀愀琀挀栀䘀愀戀爀椀挀 㼀 洀愀琀挀栀䘀愀戀爀椀挀嬀㄀崀 㨀 ∀䘀䄀䈀ⴀ　㈀∀㬀ഀഀ
    return `Bypassed Crib 5: Changed fabric to ${code} (Navy Classic Linen), successfully overriding gate.`;਍  紀ഀഀ
  ਍  椀昀 ⠀挀渀吀攀砀琀⸀椀渀挀氀甀搀攀猀⠀∀붿붿붿㥳繰붿붿뿯붿㙐Ů╿붿ഠ夊畾浠붿伐붿?")) {਍    挀漀渀猀琀 洀愀琀挀栀匀甀瀀瀀氀椀攀爀 㴀 挀渀吀攀砀琀⸀洀愀琀挀栀⠀⼀저붿Ġ╿붿ഠ夊畾浠붿伐붿?\s*([^붿뿯宽+)/);਍    挀漀渀猀琀 洀愀琀挀栀倀爀椀挀攀 㴀 挀渀吀攀砀琀⸀洀愀琀挀栀⠀⼀圀뿯붿붿쵳㾓繺붿붿獻⨀尀␀㼀⠀嬀　ⴀ㤀⸀崀⬀⤀⼀⤀㬀ഀഀ
    const sName = matchSupplier ? matchSupplier[1] : "selected supplier";਍    挀漀渀猀琀 猀倀爀椀挀攀 㴀 洀愀琀挀栀倀爀椀挀攀 㼀 洀愀琀挀栀倀爀椀挀攀嬀㄀崀 㨀 ∀㄀㤀㔀∀㬀ഀഀ
    return `Supplier bidding finalized. Factory selected: ${sName}. Lobby Armchair set to $${sPrice}/pc.`;਍  紀ഀഀ
  ਍  爀攀琀甀爀渀 挀渀吀攀砀琀㬀 ⼀⼀ 䘀愀氀氀戀愀挀欀ഀഀ
};਍ഀഀ
function App() {਍  挀漀渀猀琀 嬀挀甀爀爀攀渀琀嘀椀攀眀Ⰰ 猀攀琀䌀甀爀爀攀渀琀匀琀愀最攀嘀椀攀眀崀 㴀 甀猀攀匀琀愀琀攀⠀∀䴀愀爀欀攀琀椀渀最∀⤀㬀 ⼀⼀ 嘀椀攀眀猀㨀 ∀䴀愀爀欀攀琀椀渀最∀Ⰰ ∀䈀愀挀欀漀昀昀椀挀攀∀Ⰰ ∀䌀氀椀攀渀琀倀漀爀琀愀氀∀ഀഀ
  const [lang, setLang] = useState("Cn"); // Language: "Cn" or "En"਍  挀漀渀猀琀 嬀挀甀爀爀攀渀琀匀琀愀最攀䤀渀搀攀砀Ⰰ 猀攀琀䌀甀爀爀攀渀琀匀琀愀最攀䤀渀搀攀砀崀 㴀 甀猀攀匀琀愀琀攀⠀　⤀㬀 ⼀⼀ 匀　㄀ 琀漀 匀㄀㜀ഀഀ
  const [order, setOrder] = useState(JSON.parse(JSON.stringify(mockData.initialOrder)));਍  挀漀渀猀琀 嬀氀漀最猀Ⰰ 猀攀琀䰀漀最猀崀 㴀 甀猀攀匀琀愀琀攀⠀䨀匀伀一⸀瀀愀爀猀攀⠀䨀匀伀一⸀猀琀爀椀渀最椀昀礀⠀洀漀挀欀䐀愀琀愀⸀挀栀愀渀最攀䰀漀最猀⤀⤀⤀㬀ഀഀ
  const [chatMessages, setChatMessages] = useState([਍    笀 猀攀渀搀攀爀㨀 ∀挀氀椀攀渀琀∀Ⰰ 琀攀砀琀㨀 ∀䠀椀Ⰰ 渀攀攀搀 㐀　 氀漀戀戀礀 愀爀洀挀栀愀椀爀猀 愀渀搀 ㈀　 挀氀甀戀 挀栀愀椀爀猀 昀漀爀 匀琀 䄀氀戀愀渀猀 氀漀戀戀礀⸀ 䈀氀甀攀 猀琀礀氀攀⸀ 䴀甀猀琀 瀀愀猀猀 唀䬀 昀椀爀攀 猀愀昀攀琀礀⸀∀ 紀ഀഀ
  ]);਍  挀漀渀猀琀 嬀椀渀瀀甀琀吀攀砀琀Ⰰ 猀攀琀䤀渀瀀甀琀吀攀砀琀崀 㴀 甀猀攀匀琀愀琀攀⠀∀∀⤀㬀ഀഀ
  const [isBiddingDone, setIsBiddingDone] = useState(false);਍  挀漀渀猀琀 嬀猀攀氀攀挀琀攀搀匀甀瀀瀀氀椀攀爀Ⰰ 猀攀琀匀攀氀攀挀琀攀搀匀甀瀀瀀氀椀攀爀崀 㴀 甀猀攀匀琀愀琀攀⠀渀甀氀氀⤀㬀ഀഀ
  const [fabricCompatibilityTest, setFabricCompatibilityTest] = useState(null); // null, 'passed', 'blocked'਍  挀漀渀猀琀 嬀猀瀀氀椀琀䐀攀氀椀瘀攀爀礀䄀挀琀椀瘀攀Ⰰ 猀攀琀匀瀀氀椀琀䐀攀氀椀瘀攀爀礀䄀挀琀椀瘀攀崀 㴀 甀猀攀匀琀愀琀攀⠀昀愀氀猀攀⤀㬀ഀഀ
  const [isCrib5Blocked, setIsCrib5Blocked] = useState(false);਍  挀漀渀猀琀 琀攀爀洀椀渀愀氀䔀渀搀刀攀昀 㴀 甀猀攀刀攀昀⠀渀甀氀氀⤀㬀ഀഀ
਍  ⼀⼀ 䴀愀琀攀爀椀愀氀 匀琀甀搀椀漀 匀眀愀琀挀栀 䌀漀渀昀椀最甀爀愀琀漀爀 匀琀愀琀攀猀ഀഀ
  const [selectedFabric, setSelectedFabric] = useState("FAB-02"); // default Navy Classic Linen਍  挀漀渀猀琀 嬀猀攀氀攀挀琀攀搀䰀攀最Ⰰ 猀攀琀匀攀氀攀挀琀攀搀䰀攀最崀 㴀 甀猀攀匀琀愀琀攀⠀∀洀愀琀琀攀ⴀ戀氀愀挀欀∀⤀㬀 ⼀⼀ 搀攀昀愀甀氀琀 䴀愀琀琀攀 䈀氀愀挀欀 匀琀攀攀氀ഀഀ
  const [configuratorCrib5Blocked, setConfiguratorCrib5Blocked] = useState(false);਍ഀഀ
  // Interactive Playgrounds State Variables਍  挀漀渀猀琀 嬀猀椀最渀愀琀甀爀攀䄀瀀瀀爀漀瘀攀搀Ⰰ 猀攀琀匀椀最渀愀琀甀爀攀䄀瀀瀀爀漀瘀攀搀崀 㴀 甀猀攀匀琀愀琀攀⠀昀愀氀猀攀⤀㬀ഀഀ
  const [crib5TestStatus, setCrib5TestStatus] = useState("idle"); // 'idle', 'running', 'passed', 'failed'਍  挀漀渀猀琀 嬀挀爀椀戀㔀倀爀漀最爀攀猀猀Ⰰ 猀攀琀䌀爀椀戀㔀倀爀漀最爀攀猀猀崀 㴀 甀猀攀匀琀愀琀攀⠀　⤀㬀ഀഀ
  const [rfqDispatched, setRfqDispatched] = useState(false);਍  挀漀渀猀琀 嬀搀漀挀䄀甀搀椀琀攀搀Ⰰ 猀攀琀䐀漀挀䄀甀搀椀琀攀搀崀 㴀 甀猀攀匀琀愀琀攀⠀昀愀氀猀攀⤀㬀ഀഀ
  const [archiveHashed, setArchiveHashed] = useState(false);਍  挀漀渀猀琀 嬀猀栀漀眀嘀漀氀甀洀攀琀爀椀挀匀椀洀甀氀愀琀椀漀渀Ⰰ 猀攀琀匀栀漀眀嘀漀氀甀洀攀琀爀椀挀匀椀洀甀氀愀琀椀漀渀崀 㴀 甀猀攀匀琀愀琀攀⠀昀愀氀猀攀⤀㬀ഀഀ
਍ഀഀ
  // =====================================================================਍  ⼀⼀ 䌀刀䄀䘀吀伀一 䄀䤀 ⴀ 䰀伀圀 匀䄀吀唀刀䄀吀䤀伀一 嘀䔀䌀吀伀刀 刀䔀一䐀䔀刀匀 ☀ 匀吀䄀䜀䔀 倀䰀䄀夀䜀刀伀唀一䐀匀ഀഀ
  // =====================================================================਍ഀഀ
  const renderChairSVG = (fabricId, legId, animateStyle = {}) => {਍    氀攀琀 挀甀猀栀椀漀渀䌀漀氀漀爀 㴀 ✀⌀䈀䄀䌀㈀䈀㤀✀㬀 ⼀⼀ 䰀椀渀攀渀 搀攀昀愀甀氀琀 ⠀䘀䄀䈀ⴀ　㈀⤀ഀഀ
    if (fabricId === 'FAB-01') cushionColor = '#8C99A4'; // Velvet਍    椀昀 ⠀昀愀戀爀椀挀䤀搀 㴀㴀㴀 ✀䘀䄀䈀ⴀ　㌀✀⤀ 挀甀猀栀椀漀渀䌀漀氀漀爀 㴀 ✀⌀䐀䘀䐀䌀䐀㘀✀㬀 ⼀⼀ 匀椀氀欀ഀഀ
    if (fabricId === 'FAB-04') cushionColor = '#5C534C'; // Leather਍ഀഀ
    let legsColor = '#1C1B18'; // Black default਍    椀昀 ⠀氀攀最䤀搀 㴀㴀㴀 ✀戀爀漀渀稀攀✀⤀ 氀攀最猀䌀漀氀漀爀 㴀 ✀⌀䄀㠀㠀䘀㠀　✀㬀ഀഀ
    if (legId === 'white-oak') legsColor = '#D2C9B1';਍ഀഀ
    return (਍      㰀猀瘀最 瘀椀攀眀䈀漀砀㴀∀　 　 ㈀　　 ㈀　　∀ 眀椀搀琀栀㴀∀㄀　　─∀ 栀攀椀最栀琀㴀∀㈀㈀　∀ 猀琀礀氀攀㴀笀笀 猀琀爀漀欀攀㨀 ✀⌀㔀䌀㔀㌀㐀䌀✀Ⰰ 猀琀爀漀欀攀圀椀搀琀栀㨀 ✀㄀⸀㈀✀Ⰰ 昀椀氀氀㨀 ✀渀漀渀攀✀Ⰰ 猀琀爀漀欀攀䰀椀渀攀挀愀瀀㨀 ✀爀漀甀渀搀✀Ⰰ 猀琀爀漀欀攀䰀椀渀攀樀漀椀渀㨀 ✀爀漀甀渀搀✀Ⰰ ⸀⸀⸀愀渀椀洀愀琀攀匀琀礀氀攀 紀紀㸀ഀഀ
        {/* Chair Backrest */}਍        㰀瀀愀琀栀 搀㴀∀䴀 㘀　Ⰰ㘀　 䰀 ㄀㐀　Ⰰ㘀　 儀 ㄀㐀㠀Ⰰ㘀　 ㄀㐀㠀Ⰰ㘀㠀 䰀 ㄀㐀㠀Ⰰ㄀㄀　 䰀 㔀㈀Ⰰ㄀㄀　 䰀 㔀㈀Ⰰ㘀㠀 儀 㔀㈀Ⰰ㘀　 㘀　Ⰰ㘀　 娀∀ 猀琀礀氀攀㴀笀笀 昀椀氀氀㨀 挀甀猀栀椀漀渀䌀漀氀漀爀Ⰰ 琀爀愀渀猀椀琀椀漀渀㨀 ✀昀椀氀氀 　⸀㔀猀✀ 紀紀 ⼀㸀ഀഀ
        ਍        笀⼀⨀ 䌀栀愀椀爀 䌀甀猀栀椀漀渀 ⨀⼀紀ഀഀ
        <rect x="46" y="110" width="108" height="24" rx="4" style={{ fill: cushionColor, strokeWidth: '1.4', transition: 'fill 0.5s' }} />਍        ഀഀ
        {/* Chair Arms */}਍        㰀瀀愀琀栀 搀㴀∀䴀 㐀㘀Ⰰ㄀　㐀 䰀 ㌀㠀Ⰰ㄀　㐀 䌀 ㌀㐀Ⰰ㄀　㐀 ㌀㐀Ⰰ㄀㈀㐀 ㌀㐀Ⰰ㄀㈀㐀 䰀 㐀㘀Ⰰ㄀㈀㐀 娀∀ 猀琀礀氀攀㴀笀笀 昀椀氀氀㨀 挀甀猀栀椀漀渀䌀漀氀漀爀Ⰰ 琀爀愀渀猀椀琀椀漀渀㨀 ✀昀椀氀氀 　⸀㔀猀✀ 紀紀 ⼀㸀ഀഀ
        <path d="M 154,104 L 162,104 C 166,104 166,124 166,124 L 154,124 Z" style={{ fill: cushionColor, transition: 'fill 0.5s' }} />਍ഀഀ
        {/* Chair Legs */}਍        㰀氀椀渀攀 砀㄀㴀∀㔀㘀∀ 礀㄀㴀∀㄀㌀㐀∀ 砀㈀㴀∀㐀㈀∀ 礀㈀㴀∀㄀㜀㘀∀ 猀琀礀氀攀㴀笀笀 猀琀爀漀欀攀㨀 氀攀最猀䌀漀氀漀爀Ⰰ 猀琀爀漀欀攀圀椀搀琀栀㨀 ✀㈀⸀㔀✀Ⰰ 琀爀愀渀猀椀琀椀漀渀㨀 ✀猀琀爀漀欀攀 　⸀㔀猀✀ 紀紀 ⼀㸀ഀഀ
        <line x1="144" y1="134" x2="158" y2="176" style={{ stroke: legsColor, strokeWidth: '2.5', transition: 'stroke 0.5s' }} />਍        㰀氀椀渀攀 砀㄀㴀∀㘀㠀∀ 礀㄀㴀∀㄀㌀㐀∀ 砀㈀㴀∀㜀㈀∀ 礀㈀㴀∀㄀㜀　∀ 猀琀礀氀攀㴀笀笀 猀琀爀漀欀攀㨀 氀攀最猀䌀漀氀漀爀Ⰰ 猀琀爀漀欀攀圀椀搀琀栀㨀 ✀㄀⸀㠀✀Ⰰ 漀瀀愀挀椀琀礀㨀 　⸀㜀Ⰰ 琀爀愀渀猀椀琀椀漀渀㨀 ✀猀琀爀漀欀攀 　⸀㔀猀✀ 紀紀 ⼀㸀ഀഀ
        <line x1="132" y1="134" x2="128" y2="170" style={{ stroke: legsColor, strokeWidth: '1.8', opacity: 0.7, transition: 'stroke 0.5s' }} />਍ഀഀ
        {/* Structural crossbar */}਍        㰀氀椀渀攀 砀㄀㴀∀㐀㈀∀ 礀㄀㴀∀㄀㘀㔀∀ 砀㈀㴀∀㄀㔀㠀∀ 礀㈀㴀∀㄀㘀㔀∀ 猀琀礀氀攀㴀笀笀 猀琀爀漀欀攀㨀 氀攀最猀䌀漀氀漀爀Ⰰ 猀琀爀漀欀攀圀椀搀琀栀㨀 ✀㄀⸀㈀✀Ⰰ 琀爀愀渀猀椀琀椀漀渀㨀 ✀猀琀爀漀欀攀 　⸀㔀猀✀ 紀紀 ⼀㸀ഀഀ
      </svg>਍    ⤀㬀ഀഀ
  };਍ഀഀ
  const handleFabricSelect = async (fabId) => {਍    猀攀琀匀攀氀攀挀琀攀搀䘀愀戀爀椀挀⠀昀愀戀䤀搀⤀㬀ഀഀ
    const isSilk = fabId === 'FAB-03';਍    猀攀琀䌀漀渀昀椀最甀爀愀琀漀爀䌀爀椀戀㔀䈀氀漀挀欀攀搀⠀椀猀匀椀氀欀⤀㬀ഀഀ
    ਍    椀昀 ⠀搀戀䌀漀渀渀攀挀琀攀搀 ☀☀ 漀爀搀攀爀⸀椀搀⤀ 笀ഀഀ
      try {਍        挀漀渀猀琀 挀氀椀攀渀琀 㴀 眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⸀挀爀攀愀琀攀䌀氀椀攀渀琀⠀氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开甀爀氀∀⤀Ⰰ 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开欀攀礀∀⤀⤀㬀ഀഀ
        await client.from("projects").update({ ਍          猀攀氀攀挀琀攀搀开昀愀戀爀椀挀㨀 昀愀戀䤀搀Ⰰഀഀ
          is_crib5_blocked: isSilk,਍          昀愀戀爀椀挀开挀漀洀瀀愀琀椀戀椀氀椀琀礀开琀攀猀琀㨀 椀猀匀椀氀欀 㼀 ∀戀氀漀挀欀攀搀∀ 㨀 ∀瀀愀猀猀攀搀∀ഀഀ
        }).eq("id", order.id);਍      紀 挀愀琀挀栀 ⠀攀爀爀⤀ 笀ഀഀ
        console.error("Supabase fabric sync error:", err);਍      紀ഀഀ
    }਍  紀㬀ഀഀ
਍  挀漀渀猀琀 栀愀渀搀氀攀䰀攀最匀攀氀攀挀琀 㴀 愀猀礀渀挀 ⠀氀攀最䤀搀⤀ 㴀㸀 笀ഀഀ
    setSelectedLeg(legId);਍    椀昀 ⠀搀戀䌀漀渀渀攀挀琀攀搀 ☀☀ 漀爀搀攀爀⸀椀搀⤀ 笀ഀഀ
      try {਍        挀漀渀猀琀 挀氀椀攀渀琀 㴀 眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⸀挀爀攀愀琀攀䌀氀椀攀渀琀⠀氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开甀爀氀∀⤀Ⰰ 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开欀攀礀∀⤀⤀㬀ഀഀ
        await client.from("projects").update({ selected_leg: legId }).eq("id", order.id);਍      紀 挀愀琀挀栀 ⠀攀爀爀⤀ 笀ഀഀ
        console.error("Supabase leg sync error:", err);਍      紀ഀഀ
    }਍  紀㬀ഀഀ
਍  挀漀渀猀琀 爀攀渀搀攀爀䴀愀琀攀爀椀愀氀匀琀甀搀椀漀 㴀 ⠀⤀ 㴀㸀 笀ഀഀ
    const selectedFabObj = mockData.fabrics.find(f => f.id === selectedFabric);਍    爀攀琀甀爀渀 ⠀ഀഀ
      <div className="material-studio-card animate-fade-in">਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀洀愀琀攀爀椀愀氀ⴀ猀琀甀搀椀漀ⴀ栀攀愀搀氀椀渀攀∀㸀ഀഀ
          뿯붿尶 {lang === "Cn" ? "Crafton 楂樼붿闈㈡뿯枽붿뿯嚽噾灞붿伐뿯붿뿯澽畾瑁藉伐붿? : "Crafton Premium Material & Finishes Configurator"}਍        㰀⼀搀椀瘀㸀ഀഀ
        ਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀猀眀愀琀挀栀ⴀ挀漀渀昀椀最甀爀愀琀漀爀ⴀ戀漀砀∀㸀ഀഀ
          {/* Left Column: Interactive Vector Blueprint */}਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀戀氀甀攀瀀爀椀渀琀ⴀ戀漀愀爀搀∀ 猀琀礀氀攀㴀笀笀 栀攀椀最栀琀㨀 ✀㈀㐀　瀀砀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀⌀䘀㠀䘀㘀䘀㈀✀ 紀紀㸀ഀഀ
            <span className="blueprint-title-tag">Bespoke Configurator V1.0</span>਍            笀爀攀渀搀攀爀䌀栀愀椀爀匀嘀䜀⠀猀攀氀攀挀琀攀搀䘀愀戀爀椀挀Ⰰ 猀攀氀攀挀琀攀搀䰀攀最Ⰰ 挀漀渀昀椀最甀爀愀琀漀爀䌀爀椀戀㔀䈀氀漀挀欀攀搀 㼀 笀 漀甀琀氀椀渀攀㨀 ✀㈀瀀砀 搀愀猀栀攀搀 ⌀䄀㘀㠀㐀㠀　✀Ⰰ 漀甀琀氀椀渀攀伀昀昀猀攀琀㨀 ✀㐀瀀砀✀ 紀 㨀 笀紀⤀紀ഀഀ
            {configuratorCrib5Blocked && (਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀漀猀椀琀椀漀渀㨀 ✀愀戀猀漀氀甀琀攀✀Ⰰ 戀漀琀琀漀洀㨀 ✀㄀㔀瀀砀✀Ⰰ 氀攀昀琀㨀 ✀㄀㔀瀀砀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀爀最戀愀⠀㄀㘀㘀Ⰰ ㄀㌀㈀Ⰰ ㄀㈀㠀Ⰰ 　⸀㤀㔀⤀✀Ⰰ 挀漀氀漀爀㨀 ✀眀栀椀琀攀✀Ⰰ 瀀愀搀搀椀渀最㨀 ✀　⸀㌀爀攀洀 　⸀㘀爀攀洀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㘀㠀爀攀洀✀Ⰰ 氀攀琀琀攀爀匀瀀愀挀椀渀最㨀 ✀　⸀㔀瀀砀✀Ⰰ 戀漀爀搀攀爀㨀 ✀㄀瀀砀 猀漀氀椀搀 ⌀䘀䄀䘀㤀䘀㘀✀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㈀瀀砀✀Ⰰ 琀攀砀琀吀爀愀渀猀昀漀爀洀㨀 ✀甀瀀瀀攀爀挀愀猀攀✀ 紀紀㸀ഀഀ
                붿뿯犽笍 CRIB 5 BANNED਍              㰀⼀搀椀瘀㸀ഀഀ
            )}਍            㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀戀氀甀攀瀀爀椀渀琀ⴀ猀挀愀氀攀ⴀ琀愀最∀㸀匀䌀䄀䰀䔀 ㄀㨀㄀　㰀⼀猀瀀愀渀㸀ഀഀ
          </div>਍ഀഀ
          {/* Right Column: Choices */}਍          㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 昀氀攀砀䐀椀爀攀挀琀椀漀渀㨀 ✀挀漀氀甀洀渀✀Ⰰ 最愀瀀㨀 ✀㄀⸀㈀爀攀洀✀ 紀紀㸀ഀഀ
            {/* Fabric options */}਍            㰀搀椀瘀㸀ഀഀ
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>਍                笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㄀⸀ 붿䍾뿯ᖽ捏붿ᵞ뿯岽뿯綽붿졛↕붿㑧㽤 㨀 ∀㄀⸀ 匀攀氀攀挀琀 䰀漀眀ⴀ匀愀琀甀爀愀琀椀漀渀 䘀愀戀爀椀挀∀紀ഀഀ
              </label>਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀昀愀戀爀椀挀ⴀ猀眀愀琀挀栀攀猀ⴀ最爀椀搀∀ 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀吀漀瀀㨀 ✀　⸀㐀爀攀洀✀ 紀紀㸀ഀഀ
                {mockData.fabrics.map(fab => {਍                  氀攀琀 琀攀砀琀甀爀攀䌀氀愀猀猀 㴀 ∀琀攀砀琀甀爀攀ⴀ氀椀渀攀渀∀㬀ഀഀ
                  if (fab.id === "FAB-01") textureClass = "texture-velvet";਍                  椀昀 ⠀昀愀戀⸀椀搀 㴀㴀㴀 ∀䘀䄀䈀ⴀ　㌀∀⤀ 琀攀砀琀甀爀攀䌀氀愀猀猀 㴀 ∀琀攀砀琀甀爀攀ⴀ猀椀氀欀∀㬀ഀഀ
                  if (fab.id === "FAB-04") textureClass = "texture-leather";਍ഀഀ
                  return (਍                    㰀搀椀瘀 ഀഀ
                      key={fab.id} ਍                      挀氀愀猀猀一愀洀攀㴀笀怀昀愀戀爀椀挀ⴀ挀愀爀搀ⴀ漀瀀琀椀漀渀 ␀笀猀攀氀攀挀琀攀搀䘀愀戀爀椀挀 㴀㴀㴀 昀愀戀⸀椀搀 㼀 ✀猀攀氀攀挀琀攀搀✀ 㨀 ✀✀紀怀紀ഀഀ
                      onClick={() => handleFabricSelect(fab.id)}਍                      琀椀琀氀攀㴀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 昀愀戀⸀渀漀琀攀猀䌀渀 㨀 昀愀戀⸀渀漀琀攀猀䔀渀紀ഀഀ
                    >਍                      㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀笀怀猀眀愀琀挀栀ⴀ瀀爀攀瘀椀攀眀ⴀ挀椀爀挀氀攀 ␀笀琀攀砀琀甀爀攀䌀氀愀猀猀紀怀紀㸀㰀⼀搀椀瘀㸀ഀഀ
                      <div style={{ fontSize: '0.62rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>਍                        笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 昀愀戀⸀渀愀洀攀⸀猀瀀氀椀琀⠀✀ ⠀✀⤀嬀　崀 㨀 昀愀戀⸀渀愀洀攀⸀猀瀀氀椀琀⠀✀ ⠀✀⤀嬀　崀紀ഀഀ
                      </div>਍                    㰀⼀搀椀瘀㸀ഀഀ
                  );਍                紀⤀紀ഀഀ
              </div>਍            㰀⼀搀椀瘀㸀ഀഀ
਍            笀⼀⨀ 䰀攀最 昀椀渀椀猀栀 漀瀀琀椀漀渀猀 ⨀⼀紀ഀഀ
            <div>਍              㰀氀愀戀攀氀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀Ⰰ 昀漀渀琀圀攀椀最栀琀㨀 ✀㘀　　✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 琀攀砀琀吀爀愀渀猀昀漀爀洀㨀 ✀甀瀀瀀攀爀挀愀猀攀✀Ⰰ 氀攀琀琀攀爀匀瀀愀挀椀渀最㨀 ✀㄀瀀砀✀ 紀紀㸀ഀഀ
                {lang === "Cn" ? "2. 뿯妽呰吙浜뿯施噾 / 瀵붿湪椋붿潰" : "2. Chair Leg Finish"}਍              㰀⼀氀愀戀攀氀㸀ഀഀ
              <div className="finishes-row">਍                㰀戀甀琀琀漀渀 ഀഀ
                  className={`finish-circle-btn ${selectedLeg === 'matte-black' ? 'selected' : ''}`}਍                  猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀⌀㄀䌀㄀䈀㄀㠀✀ 紀紀 ഀഀ
                  onClick={() => handleLegSelect('matte-black')}਍                  琀椀琀氀攀㴀∀䴀愀琀琀攀 䈀愀猀愀氀琀 䈀氀愀挀欀 匀琀攀攀氀∀ഀഀ
                ></button>਍                㰀戀甀琀琀漀渀 ഀഀ
                  className={`finish-circle-btn ${selectedLeg === 'bronze' ? 'selected' : ''}`}਍                  猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀⌀䄀㠀㠀䘀㠀　✀ 紀紀 ഀഀ
                  onClick={() => handleLegSelect('bronze')}਍                  琀椀琀氀攀㴀∀䈀爀甀猀栀攀搀 圀愀氀渀甀琀 䈀爀漀渀稀攀∀ഀഀ
                ></button>਍                㰀戀甀琀琀漀渀 ഀഀ
                  className={`finish-circle-btn ${selectedLeg === 'white-oak' ? 'selected' : ''}`}਍                  猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀⌀䐀㈀䌀㤀䈀㄀✀ 紀紀 ഀഀ
                  onClick={() => handleLegSelect('white-oak')}਍                  琀椀琀氀攀㴀∀一愀琀甀爀愀氀 圀栀椀琀攀 伀愀欀 圀漀漀搀∀ഀഀ
                ></button>਍              㰀⼀搀椀瘀㸀ഀഀ
            </div>਍ഀഀ
            {/* Selected feedback and CRIB 5 validation alert */}਍            㰀搀椀瘀 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀吀漀瀀㨀 ✀　⸀㈀爀攀洀✀Ⰰ 瀀愀搀搀椀渀最㨀 ✀　⸀㘀爀攀洀 　⸀㠀爀攀洀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀⌀䘀㐀䘀㈀䔀䔀✀Ⰰ 戀漀爀搀攀爀㨀 ✀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀✀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㈀瀀砀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㈀爀攀洀✀ 紀紀㸀ഀഀ
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>਍                笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 怀⌀뿯붿뿯붿쥘⾓ㅡ㩕 ␀笀猀攀氀攀挀琀攀搀䘀愀戀伀戀樀⸀渀愀洀攀紀怀 㨀 怀䄀挀琀椀瘀攀 匀眀愀琀挀栀㨀 ␀笀猀攀氀攀挀琀攀搀䘀愀戀伀戀樀⸀渀愀洀攀紀怀紀ഀഀ
              </div>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀㈀瀀砀✀Ⰰ 氀椀渀攀䠀攀椀最栀琀㨀 ✀㄀⸀㐀✀ 紀紀㸀ഀഀ
                {lang === "Cn" ? selectedFabObj.notesCn : selectedFabObj.notesEn}਍              㰀⼀搀椀瘀㸀ഀഀ
              ਍              笀⼀⨀ 䌀漀洀瀀氀椀愀渀挀攀 猀琀愀琀甀猀 戀愀渀渀攀爀 ⨀⼀紀ഀഀ
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', fontWeight: '600', color: selectedFabObj.crib5Compatible ? 'var(--accent-green)' : 'var(--accent-red)' }}>਍                㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀笀怀猀琀愀最攀ⴀ戀愀搀最攀ⴀ搀漀琀 搀漀琀ⴀ␀笀猀攀氀攀挀琀攀搀䘀愀戀伀戀樀⸀挀爀椀戀㔀䌀漀洀瀀愀琀椀戀氀攀 㼀 ✀挀漀洀瀀氀攀琀攀搀✀ 㨀 ✀愀搀搀ⴀ氀漀最✀紀怀紀 猀琀礀氀攀㴀笀笀 眀椀搀琀栀㨀 ✀㘀瀀砀✀Ⰰ 栀攀椀最栀琀㨀 ✀㘀瀀砀✀ 紀紀㸀㰀⼀猀瀀愀渀㸀ഀഀ
                {selectedFabObj.crib5Compatible ਍                  㼀 ⠀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀䄀뿯㾽붿䁾뿯붿筠뿯庽䕓⁮䌀爀椀戀 㔀 ᄀ╚붿썩撕뿯枽ॖ붿붿뿯⊽ 㨀 ∀䄀뿯㾽唀䬀 䌀爀椀戀 㔀 䌀漀洀瀀氀椀愀渀挀攀 倀愀猀猀∀⤀ഀഀ
                  : (lang === "Cn" ? "붿?뿯璽붿뿯憽붿氶潰鏂欑뿯붿붿뿯붿紒뿯涽뿯嶽뿯붿붿?Crib 5 娉뿯暽뿯붿" : "붿?BANNED: Fails Crib 5 Regulation")}਍              㰀⼀搀椀瘀㸀ഀഀ
            </div>਍          㰀⼀搀椀瘀㸀ഀഀ
        </div>਍      㰀⼀搀椀瘀㸀ഀഀ
    );਍  紀㬀ഀഀ
਍  挀漀渀猀琀 栀愀渀搀氀攀匀琀愀爀琀䌀爀椀戀㔀吀攀猀琀 㴀 ⠀⤀ 㴀㸀 笀ഀഀ
    setCrib5TestStatus("running");਍    猀攀琀䌀爀椀戀㔀倀爀漀最爀攀猀猀⠀　⤀㬀ഀഀ
    const interval = setInterval(() => {਍      猀攀琀䌀爀椀戀㔀倀爀漀最爀攀猀猀⠀瀀爀攀瘀 㴀㸀 笀ഀഀ
        if (prev >= 100) {਍          挀氀攀愀爀䤀渀琀攀爀瘀愀氀⠀椀渀琀攀爀瘀愀氀⤀㬀ഀഀ
          if (selectedFabric === "FAB-03") {਍            猀攀琀䌀爀椀戀㔀吀攀猀琀匀琀愀琀甀猀⠀∀昀愀椀氀攀搀∀⤀㬀ഀഀ
            addLog("System", "CRIB 5 붿뿯冽噿뿯妽㈡붿뿯澽뿯붿晽붿氱뿯碽뿯纽붿뿯皽뿯纽뿯炽樆붿뿯冽붿灞뿯ソ敹뿯纽뿯붿뿯嶽/뿯璽婅뿯墽붿뿯嚽뿯禽뿯宽뿯붿紙CRIB 5 BLOCKED붿?, "CRIB 5 Flammability Test Failed: Pure Silk Satin fire-retardant coating shrinkage and discoloration rate out of tolerance (CRIB 5 BLOCKED)");਍          紀 攀氀猀攀 笀ഀഀ
            setCrib5TestStatus("passed");਍            愀搀搀䰀漀最⠀∀匀礀猀琀攀洀∀Ⰰ ∀䌀刀䤀䈀 㔀 ᔀ뿯붿网붿⅙⼲뿯媽뿯᾽硘᭲뿯ㆽl቏뿯䢽붿읫㾕　붿붿붿ᝓ뿯䎽붿睠뿯䚽뿯㊽᭕뿯ᖽ剗䤀䈀 㔀 倀䄀匀匀䔀䐀ᬀ뿯㾽Ⰰ ∀䌀刀䤀䈀 㔀 䘀氀愀洀洀愀戀椀氀椀琀礀 吀攀猀琀 倀愀猀猀攀搀㨀 䘀氀愀洀攀 猀攀氀昀ⴀ攀砀琀椀渀最甀椀猀栀攀搀 瀀栀礀猀椀挀愀氀氀礀 眀椀琀栀椀渀 ㄀　 猀攀挀漀渀搀猀 漀昀 攀砀瀀漀猀甀爀攀 ⠀䌀刀䤀䈀 㔀 倀䄀匀匀䔀䐀⤀∀⤀㬀ഀഀ
          }਍          爀攀琀甀爀渀 ㄀　　㬀ഀഀ
        }਍        爀攀琀甀爀渀 瀀爀攀瘀 ⬀ ㄀　㬀ഀഀ
      });਍    紀Ⰰ ㄀㔀　⤀㬀ഀഀ
  };਍ഀഀ
  const handleDocumentAudit = () => {਍    猀攀琀䐀漀挀䄀甀搀椀琀攀搀⠀琀爀甀攀⤀㬀ഀഀ
    addLog("System", "붿뿯涽ぇ붿뿯咽彛붿뿯붿뿯璽鏍뿯붿뿯鎴愬뿯妽붿欼PPC붿뿯徽捀뿯璽夋뿯榽뿯붿佹捣闂뿯溽敵붿卞뿯枽뿯붿佽뿯붿뿯纽卞뿯枽搴뿯徽뿯垽铏뿯熽뿯窽붿뿯붿紙100% MATCH붿?, "Four export compliance documents verified successfully: IPPC fumigation certificate, Customs declaration, Packing lists match perfectly (100% MATCH)");਍  紀㬀ഀഀ
਍  挀漀渀猀琀 栀愀渀搀氀攀䌀爀礀瀀琀漀最爀愀瀀栀椀挀䄀爀挀栀椀瘀攀 㴀 ⠀⤀ 㴀㸀 笀ഀഀ
    setArchiveHashed(true);਍    愀搀搀䰀漀最⠀∀匀礀猀琀攀洀∀Ⰰ ∀쬀澕ご붿붿붿嵧뿯ᶽݘ붿뿯붿붿㥛붿붿᭦뿯䮽䡫䄀ⴀ㈀㔀㘀㨀 㠀昀㔀挀㤀　戀㘀愀㜀搀㄀㠀㜀㈀㄀挀㐀戀㈀攀㜀　攀㄀㜀㘀㌀㄀戀搀㐀昀戀㘀　㈀㤀挀昀㠀攀㄀㄀愀㈀昀㐀㈀㄀㤀戀㄀㘀㜀㔀㈀搀㔀㠀㘀戀㔀㄀∀Ⰰ ∀倀爀漀樀攀挀琀 愀爀挀栀椀瘀攀 栀愀猀栀攀搀 愀渀搀 瀀愀挀欀愀最攀搀㨀 匀䠀䄀ⴀ㈀㔀㘀㨀 㠀昀㔀挀㤀　戀㘀愀㜀搀㄀㠀㜀㈀㄀挀㐀戀㈀攀㜀　攀㄀㜀㘀㌀㄀戀搀㐀昀戀㘀　㈀㤀挀昀㠀攀㄀㄀愀㈀昀㐀㈀㄀㤀戀㄀㘀㜀㔀㈀搀㔀㠀㘀戀㔀㄀∀⤀㬀ഀഀ
  };਍ഀഀ
  const renderInteractivePlayground = () => {਍    挀漀渀猀琀 猀琀愀最攀䤀搀 㴀 挀甀爀爀攀渀琀匀琀愀最攀⸀椀搀㬀ഀഀ
਍    ⼀⼀ ㄀⸀ 匀　㄀Ⰰ 匀　㈀Ⰰ 匀　㌀Ⰰ 匀　㐀㨀 䌀䄀䐀 䐀爀愀昀琀椀渀最 愀渀搀 䄀瀀瀀爀漀瘀愀氀猀ഀഀ
    if (stageId === "S01" || stageId === "S02" || stageId === "S03" || stageId === "S04") {਍      爀攀琀甀爀渀 ⠀ഀഀ
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ栀攀愀搀攀爀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀爀最戀愀⠀㄀㈀㐀Ⰰ㄀㄀㐀Ⰰ㄀　㌀Ⰰ　⸀　㌀⤀✀ 紀紀㸀ഀഀ
            <div className="panel-title">뿯붿搻 {lang === "Cn" ? "뿯涽붿뿯媽闆欒獮 CAD 뿯붿뿯₽琛뿯撽뿯梽붿栬뿯붿鏍兼浉" : "Bilingual CAD Technical Specs"}</div>਍            㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀氀漀最漀ⴀ戀愀搀最攀∀ 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ瀀爀椀洀愀爀礀⤀✀ 紀紀㸀䄀唀吀伀ⴀ䐀刀䄀䘀吀䔀䐀㰀⼀猀瀀愀渀㸀ഀഀ
          </div>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ戀漀搀礀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
            <div className="blueprint-board">਍              㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀戀氀甀攀瀀爀椀渀琀ⴀ琀椀琀氀攀ⴀ琀愀最∀㸀ഀഀ
                {stageId === "S01" ? "S01: Intake Draft" : stageId === "S02" ? "S02: Attributes Query" : stageId === "S03" ? "S03: Spec Ready" : "S04: Approved BOM"}਍              㰀⼀猀瀀愀渀㸀ഀഀ
              ਍              笀⼀⨀ 䐀椀洀攀渀猀椀漀渀猀 䰀愀礀漀甀琀 ⨀⼀紀ഀഀ
              <div style={{ position: 'absolute', top: '40px', left: '46px', right: '46px', height: '1px', background: 'var(--accent-secondary)', opacity: 0.5 }}></div>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀漀猀椀琀椀漀渀㨀 ✀愀戀猀漀氀甀琀攀✀Ⰰ 琀漀瀀㨀 ✀㌀㔀瀀砀✀Ⰰ 氀攀昀琀㨀 ✀㐀㘀瀀砀✀Ⰰ 眀椀搀琀栀㨀 ✀㄀瀀砀✀Ⰰ 栀攀椀最栀琀㨀 ✀㄀　瀀砀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 漀瀀愀挀椀琀礀㨀 　⸀㔀 紀紀㸀㰀⼀搀椀瘀㸀ഀഀ
              <div style={{ position: 'absolute', top: '35px', right: '46px', width: '1px', height: '10px', background: 'var(--accent-secondary)', opacity: 0.5 }}></div>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀漀猀椀琀椀漀渀㨀 ✀愀戀猀漀氀甀琀攀✀Ⰰ 琀漀瀀㨀 ✀㈀㈀瀀砀✀Ⰰ 氀攀昀琀㨀 ✀㔀　─✀Ⰰ 琀爀愀渀猀昀漀爀洀㨀 ✀琀爀愀渀猀氀愀琀攀堀⠀ⴀ㔀　─⤀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㘀㔀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀⌀䘀䄀䘀㤀䘀㘀✀Ⰰ 瀀愀搀搀椀渀最㨀 ✀　 㐀瀀砀✀Ⰰ 昀漀渀琀䘀愀洀椀氀礀㨀 ✀洀漀渀漀猀瀀愀挀攀✀ 紀紀㸀圀㨀 㘀㔀　洀洀 搀㕓洀洀㰀⼀搀椀瘀㸀ഀഀ
਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀漀猀椀琀椀漀渀㨀 ✀愀戀猀漀氀甀琀攀✀Ⰰ 琀漀瀀㨀 ✀㘀　瀀砀✀Ⰰ 爀椀最栀琀㨀 ✀㈀㔀瀀砀✀Ⰰ 戀漀琀琀漀洀㨀 ✀㘀㘀瀀砀✀Ⰰ 眀椀搀琀栀㨀 ✀㄀瀀砀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 漀瀀愀挀椀琀礀㨀 　⸀㔀 紀紀㸀㰀⼀搀椀瘀㸀ഀഀ
              <div style={{ position: 'absolute', top: '60px', right: '20px', height: '1px', width: '10px', background: 'var(--accent-secondary)', opacity: 0.5 }}></div>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀漀猀椀琀椀漀渀㨀 ✀愀戀猀漀氀甀琀攀✀Ⰰ 戀漀琀琀漀洀㨀 ✀㘀㘀瀀砀✀Ⰰ 爀椀最栀琀㨀 ✀㈀　瀀砀✀Ⰰ 栀攀椀最栀琀㨀 ✀㄀瀀砀✀Ⰰ 眀椀搀琀栀㨀 ✀㄀　瀀砀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 漀瀀愀挀椀琀礀㨀 　⸀㔀 紀紀㸀㰀⼀搀椀瘀㸀ഀഀ
              <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', fontSize: '0.65rem', color: 'var(--text-secondary)', background: '#FAF9F6', padding: '0 4px', fontFamily: 'monospace' }}>H: 850mm</div>਍ഀഀ
              {renderChairSVG(selectedFabric, selectedLeg)}਍ഀഀ
              {/* Glowing Hotspots */}਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀栀漀琀猀瀀漀琀ⴀ洀愀爀欀攀爀∀ 猀琀礀氀攀㴀笀笀 琀漀瀀㨀 ✀㄀㄀　瀀砀✀Ⰰ 氀攀昀琀㨀 ✀㄀　　瀀砀✀ 紀紀㸀ഀഀ
                <div className="hotspot-tooltip">਍                  㰀猀琀爀漀渀最㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㐀䍤붿붿붿뿯붿啓붿硟≲ 㨀 ∀䌀甀猀栀椀漀渀 倀愀搀搀椀渀最∀紀㰀⼀猀琀爀漀渀最㸀㰀戀爀⼀㸀ഀഀ
                  {lang === "Cn" ? "35kg/m뿯붿楂樺洖붿堣뿯亽뿯妽ㄩ뿯厽娴风뿯犽붿屽뿯宽瑁归뿯榽붿뿯붿뿯劽뿯纽뿯咽뿯窽붿뿯岽稉붿?0뿯붿붿뿯妽뿯䂽붿뿯Ⓗ뿯붿붿ፚ͚뿯ʽ붿뿯㾽 㨀 ∀㌀㔀欀最⼀洀붿뿯₽栀椀最栀ⴀ爀攀猀椀氀椀攀渀挀攀 倀唀 昀漀愀洀 眀爀愀瀀瀀攀搀 椀渀 昀椀爀攀 戀愀爀爀椀攀爀Ⰰ 瀀愀猀猀攀猀 ㄀　　欀 挀礀挀氀攀猀 搀甀爀愀戀椀氀椀琀礀⸀∀紀ഀഀ
                </div>਍              㰀⼀搀椀瘀㸀ഀഀ
਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀栀漀琀猀瀀漀琀ⴀ洀愀爀欀攀爀∀ 猀琀礀氀攀㴀笀笀 琀漀瀀㨀 ✀㄀㘀㔀瀀砀✀Ⰰ 氀攀昀琀㨀 ✀㔀　瀀砀✀ 紀紀㸀ഀഀ
                <div className="hotspot-tooltip">਍                  㰀猀琀爀漀渀最㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿灙ᥔ붿붿붿≨ 㨀 ∀䰀攀最 匀琀爀甀挀琀甀爀攀∀紀㰀⼀猀琀爀漀渀最㸀㰀戀爀⼀㸀ഀഀ
                  {lang === "Cn" ? "2.5mm뿯澽佸帤붿뿯疽뿯粽뿯붿뿯嶽뿯Ⓗ뿯붿硷紝琛ㄩ潰 basalt 뿯纽ㄧ爞뿯榽戦뿯榽뿯붿뿯嚽뿯碽闈뿯溽浕붿村銆? : "2.5mm heavy-gauge cold steel frame, matte Basalt Black fingerprint-proof electrostatic coating."}਍                㰀⼀搀椀瘀㸀ഀഀ
              </div>਍ഀഀ
              <div className="hotspot-marker" style={{ top: '70px', left: '135px' }}>਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀栀漀琀猀瀀漀琀ⴀ琀漀漀氀琀椀瀀∀㸀ഀഀ
                  <strong>{lang === "Cn" ? "闈뿯犽儗붿捐붿붿뿯嚽뿯厽뿯宽? : "Back Angle"}</strong><br/>਍                  笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㄀　㔀붿屣⩭붿붿붿㄰뿯榽뿯冽噾뿯宽뿯붿偩瑙뿯掽뿯₽뿯傽붿鏋剁祼뿯妽嬭붿뿯붿뿯犽뿯厽뿯宽뿯붿뿯殽鏍兼帶붿뿯붿湪 卤2mm 붿с뿯₽? : "105뿯掽 ergonomic golden tilt. Frame structural welding tolerance is strictly under 卤2mm."}਍                㰀⼀搀椀瘀㸀ഀഀ
              </div>਍ഀഀ
              {/* Approved Ink Signature (S04) */}਍              笀⠀猀椀最渀愀琀甀爀攀䄀瀀瀀爀漀瘀攀搀 簀簀 猀琀愀最攀䤀搀 ℀㴀㴀 ∀匀　㐀∀⤀ ☀☀ ⠀ഀഀ
                <div className="signature-box">਍                  㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀猀椀最渀愀琀甀爀攀ⴀ氀愀戀攀氀∀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㔀䉰붿붿쥾붿⁠⼀ 䄀瀀瀀爀漀瘀攀搀 戀礀∀ 㨀 ∀刀攀瘀椀攀眀 匀椀最渀ⴀ伀昀昀∀紀㰀⼀搀椀瘀㸀ഀഀ
                  <span className={`signature-font ${signatureApproved || stageId !== "S04" ? "signed" : ""}`}>Cho Chen</span>਍                㰀⼀搀椀瘀㸀ഀഀ
              )}਍              ഀഀ
              <span className="blueprint-scale-tag">SCALE 1:12 | UNIT: MM | TOLERANCE: 卤2mm</span>਍            㰀⼀搀椀瘀㸀ഀഀ
਍            笀猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀　㐀∀ ☀☀ ℀猀椀最渀愀琀甀爀攀䄀瀀瀀爀漀瘀攀搀 ☀☀ ⠀ഀഀ
              <button className="btn-premium" style={{ width: '100%', marginTop: '0.8rem', justifyContent: 'center' }} onClick={() => { setSignatureApproved(true); handleChoApproval(); }}>਍                䄀뿯붿൝⁻笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿뿯ᶽ붿붿㽾뿯媽啳붿硟ቲ뿯붿̀뿯ᮽ뿯붿㝜뿯ᮽ䅰붿᭥㽴 㨀 ∀刀攀瘀椀攀眀 匀瀀攀挀猀 ☀ 匀椀最渀ⴀ伀昀昀 䈀氀漀挀欀∀紀ഀഀ
              </button>਍            ⤀紀ഀഀ
          </div>਍        㰀⼀搀椀瘀㸀ഀഀ
      );਍    紀ഀഀ
਍    ⼀⼀ ㈀⸀ 匀　㔀㨀 䌀爀椀戀 㔀 吀攀猀琀 挀栀愀洀戀攀爀ഀഀ
    if (stageId === "S05") {਍      挀漀渀猀琀 猀攀氀攀挀琀攀搀䘀愀戀伀戀樀 㴀 洀漀挀欀䐀愀琀愀⸀昀愀戀爀椀挀猀⸀昀椀渀搀⠀昀 㴀㸀 昀⸀椀搀 㴀㴀㴀 猀攀氀攀挀琀攀搀䘀愀戀爀椀挀⤀㬀ഀഀ
      return (਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀 愀渀椀洀愀琀攀ⴀ昀愀搀攀ⴀ椀渀∀ 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀䈀漀琀琀漀洀㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
          <div className="panel-header" style={{ background: 'rgba(166, 132, 128, 0.03)' }}>਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ琀椀琀氀攀∀㸀붿뿯徽⁥笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀笀뿯庽䕓⁮䌀爀椀戀 㔀 ᄀ╚붿ᕩ뿯붿网썖撕뿯枽ፖ͚뿯ʽ礥뿯㾽 㨀 ∀唀䬀 䌀爀椀戀 㔀 䘀椀爀攀 䤀最渀椀琀椀漀渀 吀攀猀琀椀渀最 刀椀最∀紀㰀⼀搀椀瘀㸀ഀഀ
            <span className="logo-badge" style={{ color: 'var(--accent-red)' }}>COMPLIANCE GATE</span>਍          㰀⼀搀椀瘀㸀ഀഀ
          <div className="panel-body" style={{ padding: '1rem' }}>਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀挀爀椀戀㔀ⴀ爀椀最∀㸀ഀഀ
              {renderChairSVG(selectedFabric, selectedLeg, crib5TestStatus === "running" ? { filter: 'brightness(0.9) contrast(1.1)' } : {})}਍              ഀഀ
              {/* Flame Effect Overlay */}਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀笀怀昀氀愀洀攀ⴀ攀昀昀攀挀琀ⴀ氀愀礀攀爀 ␀笀挀爀椀戀㔀吀攀猀琀匀琀愀琀甀猀 㴀㴀㴀 ∀爀甀渀渀椀渀最∀ 㼀 ∀愀挀琀椀瘀攀∀ 㨀 ∀∀紀怀紀㸀ഀഀ
                <div className="flame-particle"></div>਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀昀氀愀洀攀ⴀ椀渀渀攀爀∀㸀㰀⼀搀椀瘀㸀ഀഀ
              </div>਍ഀഀ
              {/* Distressed Wax Stamp */}਍              笀挀爀椀戀㔀吀攀猀琀匀琀愀琀甀猀 㴀㴀㴀 ∀瀀愀猀猀攀搀∀ ☀☀ ⠀ഀഀ
                <div className="wax-stamp-overlay stamped stamp-pass">਍                  䌀爀椀戀 㔀 倀愀猀猀攀搀ഀഀ
                </div>਍              ⤀紀ഀഀ
              {crib5TestStatus === "failed" && (਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀眀愀砀ⴀ猀琀愀洀瀀ⴀ漀瘀攀爀氀愀礀 猀琀愀洀瀀攀搀 猀琀愀洀瀀ⴀ昀愀椀氀∀㸀ഀഀ
                  Crib 5 Blocked਍                㰀⼀搀椀瘀㸀ഀഀ
              )}਍ഀഀ
              {crib5TestStatus === "idle" && (਍                㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀漀猀椀琀椀漀渀㨀 ✀愀戀猀漀氀甀琀攀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀爀最戀愀⠀㈀㠀Ⰰ㈀㜀Ⰰ㈀㐀Ⰰ　⸀㜀⤀✀Ⰰ 挀漀氀漀爀㨀 ✀眀栀椀琀攀✀Ⰰ 瀀愀搀搀椀渀最㨀 ✀　⸀㔀爀攀洀 ㄀爀攀洀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㈀瀀砀✀Ⰰ 琀攀砀琀䄀氀椀最渀㨀 ✀挀攀渀琀攀爀✀ 紀紀㸀ഀഀ
                  {lang === "Cn" ? "뿯宽呮붿闈㈡뿯枽: " : "Target Swatch: "}<strong>{selectedFabObj.name}</strong><br/>਍                  㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㘀㔀爀攀洀✀Ⰰ 漀瀀愀挀椀琀礀㨀 　⸀㠀 紀紀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿붿㍰붿⭭붿붿뿯Ⴝ붿彗뿯붿붿⁚㄀　 붿붿ţ붿뿯ʽ뿯½቏뿯溽杢ᕖ뿯붿⽣뿯涽㽴 㨀 ∀䌀氀椀挀欀 戀攀氀漀眀 琀漀 椀渀椀琀椀愀琀攀 ㄀　猀 昀氀愀洀攀 琀攀猀琀∀紀㰀⼀猀瀀愀渀㸀ഀഀ
                </div>਍              ⤀紀ഀഀ
            </div>਍ഀഀ
            <div className="fire-gauge-card">਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀昀椀爀攀ⴀ最愀甀最攀ⴀ爀漀眀∀㸀ഀഀ
                <span>{lang === "Cn" ? "붿뿯冽噿娓붿│뿯붿뿯掽뿯宽" : "Flame Test Exposure"}</span>਍                㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 昀漀渀琀䘀愀洀椀氀礀㨀 ✀洀漀渀漀猀瀀愀挀攀✀ 紀紀㸀笀挀爀椀戀㔀倀爀漀最爀攀猀猀紀─㰀⼀猀瀀愀渀㸀ഀഀ
              </div>਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀昀椀爀攀ⴀ瀀爀漀最爀攀猀猀ⴀ戀愀爀∀㸀ഀഀ
                <div className="fire-progress-fill" style={{ width: `${crib5Progress}%`, background: crib5TestStatus === "failed" ? 'var(--accent-red)' : 'var(--accent-green)' }}></div>਍              㰀⼀搀椀瘀㸀ഀഀ
਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 最愀瀀㨀 ✀　⸀㘀爀攀洀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀　⸀㠀爀攀洀✀ 紀紀㸀ഀഀ
                <button ਍                  挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ瀀爀攀洀椀甀洀∀ ഀഀ
                  style={{ flex: 1, justifyContent: 'center' }} ਍                  漀渀䌀氀椀挀欀㴀笀栀愀渀搀氀攀匀琀愀爀琀䌀爀椀戀㔀吀攀猀琀紀ഀഀ
                  disabled={crib5TestStatus === "running"}਍                㸀ഀഀ
                  뿯붿뿯殽 {lang === "Cn" ? "붿뿯疽붿붿╃뿯悽붿뿯冽噿鏍뿯붿뿯붿" : "Trigger Crib 5 Burn"}਍                㰀⼀戀甀琀琀漀渀㸀ഀഀ
                {crib5TestStatus === "failed" && (਍                  㰀戀甀琀琀漀渀 ഀഀ
                    className="btn-secondary" ਍                    猀琀礀氀攀㴀笀笀 戀漀爀搀攀爀䌀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 紀紀ഀഀ
                    onClick={() => {਍                      猀攀琀匀攀氀攀挀琀攀搀䘀愀戀爀椀挀⠀∀䘀䄀䈀ⴀ　㈀∀⤀㬀 ⼀⼀ 愀甀琀漀 爀攀瀀氀愀挀攀 眀椀琀栀 猀愀昀攀 䰀椀渀攀渀ഀഀ
                      setCrib5TestStatus("idle");਍                      猀攀琀䌀爀椀戀㔀倀爀漀最爀攀猀猀⠀　⤀㬀ഀഀ
                      addLog("Cho", "뿯妽㈡붿붿扮挡缍㈢‖뿯붿т笉붿堣뿯붿붿屼뿯窽뿯붿뿯垽浛뿯붿뿯涽潰鏂欑偤붿歀-4410 (娴뿯疽뿯粽뿯붿뿯嶽簽楹?", "Detected critical non-compliance on Silk. Swapped fabric to: L-4410 (Navy Classic Linen) with one click.");਍                    紀紀ഀഀ
                  >਍                    붿뿯➽⁥笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿붿붿뿯㢽붿붿⵾孬붿뿯㾽 㨀 ∀䈀礀瀀愀猀猀 眀椀琀栀 䰀椀渀攀渀∀紀ഀഀ
                  </button>਍                ⤀紀ഀഀ
              </div>਍            㰀⼀搀椀瘀㸀ഀഀ
          </div>਍        㰀⼀搀椀瘀㸀ഀഀ
      );਍    紀ഀഀ
਍    ⼀⼀ ㌀⸀ 匀　㘀Ⰰ 匀　㜀㨀 刀䘀儀 䐀椀猀瀀愀琀挀栀攀搀 愀渀搀 䴀甀氀琀椀ⴀ䘀愀挀琀漀爀礀 䌀漀洀瀀愀爀椀猀漀渀猀ഀഀ
    if (stageId === "S06" || stageId === "S07") {਍      爀攀琀甀爀渀 ⠀ഀഀ
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ栀攀愀搀攀爀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀爀最戀愀⠀㈀㔀㔀Ⰰ㄀㔀㤀Ⰰ㘀㜀Ⰰ　⸀　㌀⤀✀ 紀紀㸀ഀഀ
            <div className="panel-title">붿夛笍 {lang === "Cn" ? "붿붿뿯媽붿?RFQ 뿯붿典欢瑭㈠児붿奸뿯₽佷붿붿? : "Automated RFQ Mailer Daemon"}</div>਍          㰀⼀搀椀瘀㸀ഀഀ
          <div className="panel-body" style={{ padding: '1rem' }}>਍            㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 昀氀攀砀䐀椀爀攀挀琀椀漀渀㨀 ✀挀漀氀甀洀渀✀Ⰰ 最愀瀀㨀 ✀　⸀㠀爀攀洀✀ 紀紀㸀ഀഀ
              <div style={{ padding: '1rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', position: 'relative' }}>਍                㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀猀瀀愀挀攀ⴀ戀攀琀眀攀攀渀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㠀爀攀洀✀Ⰰ 昀漀渀琀圀攀椀最栀琀㨀 ✀戀漀氀搀✀ 紀紀㸀ഀഀ
                  <span>{lang === "Cn" ? "PDF 瑭㈠児瑕뿯徽牸鏇稿뿯冽灏뿯붿뿯窽" : "Specs Package Compiled"}</span>਍                  㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ瀀爀椀洀愀爀礀⤀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀爀攀洀✀ 紀紀㸀匀䤀娀䔀㨀 ㈀⸀㐀 䴀䈀㰀⼀猀瀀愀渀㸀ഀഀ
                </div>਍                㰀搀椀瘀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㈀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀㐀瀀砀✀ 紀紀㸀ഀഀ
                  {lang === "Cn" ? "闄뿯劽欢붿欳RAFT-202605-01-RFQ_Specification.pdf (甯堕洐瑾뿯炽뿯붿鏍笺뿯₽佸뿯宽瑁뿯澽뿯붿뿯纽뿯嶽뿯붿뿯妽?" : "Attachment: CRAFT-202605-01-RFQ_Specification.pdf (Includes bilingual CAD & volume limits)"}਍                㰀⼀搀椀瘀㸀ഀഀ
                ਍                笀爀昀焀䐀椀猀瀀愀琀挀栀攀搀 ☀☀ ⠀ഀഀ
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '0.8rem' }}>਍                    䄀뿯㾽笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿뿯碽≑붿붿붿붿뿯䪽붿붿뿯붿く捽붿᝭붿뿯⚽붿붿뿯禽붿繯뿯붿붿㥫㕰뿯붿뿯妽广뿯₽뿯侽爢뿯宽风稉붿歌뿯垽뿯붿? : "RFQs Dispatched to 3 Partner Mills via SMTP"}਍                  㰀⼀搀椀瘀㸀ഀഀ
                )}਍              㰀⼀搀椀瘀㸀ഀഀ
਍              笀℀爀昀焀䐀椀猀瀀愀琀挀栀攀搀 㼀 ⠀ഀഀ
                <button className="btn-premium" style={{ justifyContent: 'center' }} onClick={() => { setRfqDispatched(true); addLog("OpenClaw QuotationAgent", "붿뿯熽뿯垽PDF瑕뿯徽牸鏇붿紝붿ㄨ뿯嚽붿뿯暽붿붿?SMTP 뿯붿典欢缇뿯ソ뿯檽붿?3 瀹붿剰붿戝伐뿯宽뿯犽뿯₽?, "Generated PDF specification sheet, automatically calling SMTP to dispatch RFQs to 3 target factories."); }}>਍                  붿뿯宽⁤笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀眀뿯䒽뿯붿ݚ붿붿浪⁴倲붿뿯碽≑≫ 㨀 ∀䌀漀洀瀀椀氀攀 ☀ 䐀椀猀瀀愀琀挀栀 刀䘀儀猀∀紀ഀഀ
                </button>਍              ⤀ 㨀 ⠀ഀഀ
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px dashed var(--glass-border)', paddingTop: '0.8rem' }}>਍                  㰀猀琀爀漀渀最 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀✀ 紀紀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿붿붿奼뿯붿붿뿯⦽뿯䢽뿯⎽捏뿯➽붿붿뿯㚽せ≽ 㨀 ∀䘀愀挀琀漀爀礀 䴀愀椀氀 䘀攀攀搀 䐀愀攀洀漀渀㨀∀紀㰀⼀猀琀爀漀渀最㸀㰀戀爀⼀㸀ഀഀ
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: '4px', color: 'var(--accent-green)' }}>਍                    㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀猀琀愀最攀ⴀ戀愀搀最攀ⴀ搀漀琀 搀漀琀ⴀ挀漀洀瀀氀攀琀攀搀∀㸀㰀⼀猀瀀愀渀㸀ഀഀ
                    {lang === "Cn" ? "浣뿯涽北뿯붿戦뿯檽瀹뿯붿뿯厽뿯宽?(뿯宽뿯掽洖뿯澽뿯붿牨붿癸細W: $195)" : "Foshan Gold-Sun (Returned Quote: W: $195)"}਍                  㰀⼀搀椀瘀㸀ഀഀ
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: '4px', color: 'var(--accent-green)' }}>਍                    㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀猀琀愀最攀ⴀ戀愀搀最攀ⴀ搀漀琀 搀漀琀ⴀ挀漀洀瀀氀攀琀攀搀∀㸀㰀⼀猀瀀愀渀㸀ഀഀ
                    {lang === "Cn" ? "鏉뿯붿帪붿뿯嚽뿯붿뿯妽℃뿯½瀹뿯붿뿯厽 (뿯宽뿯掽洖뿯澽뿯붿牨붿癸細W: $185)" : "Dongguan Royal Oak (Returned Quote: W: $185)"}਍                  㰀⼀搀椀瘀㸀ഀഀ
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: '4px', color: 'var(--accent-green)' }}>਍                    㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀猀琀愀最攀ⴀ戀愀搀最攀ⴀ搀漀琀 搀漀琀ⴀ挀漀洀瀀氀攀琀攀搀∀㸀㰀⼀猀瀀愀渀㸀ഀഀ
                    {lang === "Cn" ? "闋뿯喽뿯疽缍뿯撽吀붿뿯掽뿯亽瀹뿯붿眳 (뿯宽뿯掽洖뿯澽뿯붿牨붿癸細W: $230)" : "Shunde Classic Comfort (Returned Quote: W: $230)"}਍                  㰀⼀搀椀瘀㸀ഀഀ
                </div>਍              ⤀紀ഀഀ
            </div>਍          㰀⼀搀椀瘀㸀ഀഀ
        </div>਍      ⤀㬀ഀഀ
    }਍ഀഀ
    // 4. S08: Cho Selection Supplier layout਍    椀昀 ⠀猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀　㠀∀⤀ 笀ഀഀ
      return (਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀 愀渀椀洀愀琀攀ⴀ昀愀搀攀ⴀ椀渀∀ 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀䈀漀琀琀漀洀㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
          <div className="panel-header" style={{ background: 'rgba(255,159,67,0.05)' }}>਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ琀椀琀氀攀∀ 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ漀爀愀渀最攀⤀✀ 紀紀㸀㼀뿯㖽൨⁻笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿൭夊뿯붿붿堜뿯綽浠붿伐뿯宽뿯犽뿯檽붿뿯붿瘮붿瑰뿯垽鏋? : "Supplier Bid Matrix & AI Analysis"}</div>਍          㰀⼀搀椀瘀㸀ഀഀ
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>਍            笀洀漀挀欀䐀愀琀愀⸀猀甀瀀瀀氀椀攀爀䈀椀搀猀⸀洀愀瀀⠀⠀戀椀搀Ⰰ 戀椀搀砀⤀ 㴀㸀 ⠀ഀഀ
              <div ਍                欀攀礀㴀笀戀椀搀砀紀 ഀഀ
                style={{ ਍                  瀀愀搀搀椀渀最㨀 ✀㄀爀攀洀✀Ⰰ ഀഀ
                  borderRadius: '2px', ਍                  戀漀爀搀攀爀㨀 猀攀氀攀挀琀攀搀匀甀瀀瀀氀椀攀爀㼀⸀渀愀洀攀 㴀㴀㴀 戀椀搀⸀渀愀洀攀 㼀 ✀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀✀ 㨀 ✀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀✀Ⰰ ഀഀ
                  background: selectedSupplier?.name === bid.name ? '#ffffff' : 'var(--bg-primary)', ਍                  挀甀爀猀漀爀㨀 ✀瀀漀椀渀琀攀爀✀Ⰰ ഀഀ
                  transition: 'all 0.3s' ਍                紀紀 ഀഀ
                onClick={() => handleSelectSupplier(bid)} ਍                挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀∀ഀഀ
              >਍                㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀猀瀀愀挀攀ⴀ戀攀琀眀攀攀渀✀Ⰰ 昀漀渀琀圀攀椀最栀琀㨀 ✀戀漀氀搀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㠀㔀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀✀ 紀紀㸀ഀഀ
                  <span>{bid.name}</span>਍                  㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ瀀爀椀洀愀爀礀⤀✀ 紀紀㸀␀笀戀椀搀⸀瀀爀椀挀攀倀攀爀䌀栀愀椀爀紀⼀挀栀愀椀爀㰀⼀猀瀀愀渀㸀ഀഀ
                </div>਍                㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 最愀瀀㨀 ✀㄀爀攀洀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀　⸀㐀爀攀洀✀ 紀紀㸀ഀഀ
                  <span>{lang === "Cn" ? `뿯宽뿯ソ湡: ${bid.deliveryDays} 뿯澽뿯ソ : `Lead Time: ${bid.deliveryDays} Days`}</span>਍                  㰀猀瀀愀渀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 怀娀뿯᾽硘ᱲ뿯㾽 ␀笀戀椀搀⸀焀甀愀氀椀琀礀匀挀漀爀攀紀怀 㨀 怀儀䌀 匀挀漀爀攀㨀 ␀笀戀椀搀⸀焀甀愀氀椀琀礀匀挀漀爀攀紀怀紀㰀⼀猀瀀愀渀㸀ഀഀ
                  <span>{lang === "Cn" ? `뿯涽뿯½붿: ${bid.reliability}` : `Reliability: ${bid.reliability}`}</span>਍                㰀⼀搀椀瘀㸀ഀഀ
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', borderTop: '1px dashed var(--glass-border)', paddingTop: '0.4rem' }}>਍                  䄀䤀 붿㽛뿯⦽뿯㪽 笀戀椀搀⸀渀漀琀攀紀ഀഀ
                </div>਍              㰀⼀搀椀瘀㸀ഀഀ
            ))}਍          㰀⼀搀椀瘀㸀ഀഀ
        </div>਍      ⤀㬀ഀഀ
    }਍ഀഀ
    // 5. S09, S10: Factory QR Link & WhatsApp Follow up਍    椀昀 ⠀猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀　㤀∀ 簀簀 猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀㄀　∀⤀ 笀ഀഀ
      return (਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀 愀渀椀洀愀琀攀ⴀ昀愀搀攀ⴀ椀渀∀ 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀䈀漀琀琀漀洀㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
          <div className="panel-header" style={{ background: 'rgba(124,114,103,0.03)' }}>਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ琀椀琀氀攀∀㸀붿뿯溽 笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀䰀䝧붿ᵧ뿯붿池ᝲ뿯䊽붿붿뿯붿붿砤뿯붿卖≥뿯₽붿뿯얽붿붿붿뿯㾽 㨀 ∀䘀愀挀琀漀爀礀 儀刀 䘀氀漀眀 ☀ 刀攀愀氀琀椀洀攀 倀爀漀最爀攀猀猀∀紀㰀⼀搀椀瘀㸀ഀഀ
          </div>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ戀漀搀礀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀⌀昀昀昀昀昀昀✀Ⰰ 戀漀爀搀攀爀㨀 ✀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀✀Ⰰ 瀀愀搀搀椀渀最㨀 ✀　⸀㐀爀攀洀✀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㈀瀀砀✀ 紀紀㸀ഀഀ
                <svg viewBox="0 0 100 100" width="80" height="80">਍                  㰀爀攀挀琀 砀㴀∀　∀ 礀㴀∀　∀ 眀椀搀琀栀㴀∀㄀　　∀ 栀攀椀最栀琀㴀∀㄀　　∀ 昀椀氀氀㴀∀⌀䘀䄀䘀㤀䘀㘀∀ ⼀㸀ഀഀ
                  <rect x="10" y="10" width="25" height="25" fill="#1C1B18" />਍                  㰀爀攀挀琀 砀㴀∀㄀㔀∀ 礀㴀∀㄀㔀∀ 眀椀搀琀栀㴀∀㄀㔀∀ 栀攀椀最栀琀㴀∀㄀㔀∀ 昀椀氀氀㴀∀⌀䘀䄀䘀㤀䘀㘀∀ ⼀㸀ഀഀ
                  <rect x="18" y="18" width="9" height="9" fill="#1C1B18" />਍                  ഀഀ
                  <rect x="65" y="10" width="25" height="25" fill="#1C1B18" />਍                  㰀爀攀挀琀 砀㴀∀㜀　∀ 礀㴀∀㄀㔀∀ 眀椀搀琀栀㴀∀㄀㔀∀ 栀攀椀最栀琀㴀∀㄀㔀∀ 昀椀氀氀㴀∀⌀䘀䄀䘀㤀䘀㘀∀ ⼀㸀ഀഀ
                  <rect x="73" y="18" width="9" height="9" fill="#1C1B18" />਍ഀഀ
                  <rect x="10" y="65" width="25" height="25" fill="#1C1B18" />਍                  㰀爀攀挀琀 砀㴀∀㄀㔀∀ 礀㴀∀㜀　∀ 眀椀搀琀栀㴀∀㄀㔀∀ 栀攀椀最栀琀㴀∀㄀㔀∀ 昀椀氀氀㴀∀⌀䘀䄀䘀㤀䘀㘀∀ ⼀㸀ഀഀ
                  <rect x="18" y="73" width="9" height="9" fill="#1C1B18" />਍ഀഀ
                  <rect x="45" y="45" width="10" height="10" fill="#1C1B18" />਍                  㰀爀攀挀琀 砀㴀∀㔀㔀∀ 礀㴀∀㘀㔀∀ 眀椀搀琀栀㴀∀㄀㔀∀ 栀攀椀最栀琀㴀∀㄀　∀ 昀椀氀氀㴀∀⌀㄀䌀㄀䈀㄀㠀∀ ⼀㸀ഀഀ
                  <rect x="75" y="75" width="15" height="15" fill="#1C1B18" />਍                㰀⼀猀瘀最㸀ഀഀ
              </div>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 昀氀攀砀㨀 ㄀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀Ⰰ 氀椀渀攀䠀攀椀最栀琀㨀 ✀㄀⸀㐀✀ 紀紀㸀ഀഀ
                <strong style={{ color: 'var(--text-primary)' }}>QR: CRAFT-2026-01-ITEM01</strong><br/>਍                㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀ 紀紀㸀ഀഀ
                  {lang === "Cn" ? "뿯宽뿯ソ뿯粽뿯宽뿯ソ汉붿ㄥ뿯붿鏉挎뿯嶽뿯붿뿯徽붿睾ᵸ⥽뿯墽㑛繞붿䝗 匀甀瀀愀戀愀猀攀 伀붿獝⁖㌀䐀 붿⵾偡뿯宽뿯ソ뿯▽붿栵紝鏉뿯溽뿯禽杌婇뿯枽붿嬮尟붿栫礄붿氶尟뿯璽ㄣ뿯₽? : "Workers scan this tag to fetch design drawings dynamically from Supabase. Minimizes layout errors."}਍                㰀⼀猀瀀愀渀㸀ഀഀ
              </div>਍            㰀⼀搀椀瘀㸀ഀഀ
਍            㰀搀椀瘀 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀吀漀瀀㨀 ✀㄀爀攀洀✀Ⰰ 瀀愀搀搀椀渀最㨀 ✀　⸀㠀爀攀洀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀⌀䘀㐀䘀㈀䔀䔀✀Ⰰ 戀漀爀搀攀爀㨀 ✀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀✀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㈀瀀砀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀ 紀紀㸀ഀഀ
              <div style={{ fontWeight: 'bold', color: 'var(--accent-orange)' }}>਍                붿뿯붿⁫笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀尀붿愰卮뿯䖽㴥뿯₽㄀㔀 붿㽯ⴀ 붿붿붿붿⥨붿붿䁴뿯붿≡ 㨀 ∀䐀攀氀椀瘀攀爀礀 圀愀爀渀椀渀最㨀 ㄀㔀 䐀愀礀猀 刀攀洀愀椀渀椀渀最∀紀ഀഀ
              </div>਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀㈀瀀砀✀ 紀紀㸀ഀഀ
                {lang === "Cn" ? "AI 뿯妽뿯徽뿯梽瑷堢畻붿뿯붿뿯徽뿯붿戦뿯檽뿯宽뿯ソ뿯粽鏈붿뿯宽鏅뿯傽笂붿붿湰뿯붿붿뿯₽뿯掽뿯宽붿뿯岽뿯붿뿯纽卞뿯皽붿붿뿯媽붿뿯熽뿯媽 WhatsApp 붿붿뿯閺堣뿯瞽뿯붿? : "AI model detected delays on Nansha dock scheduling. Automated WhatsApp inquiry is triggered."}਍              㰀⼀搀椀瘀㸀ഀഀ
            </div>਍          㰀⼀搀椀瘀㸀ഀഀ
        </div>਍      ⤀㬀ഀഀ
    }਍ഀഀ
    // 6. S11: AI CV Inspection਍    椀昀 ⠀猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀㄀㄀∀⤀ 笀ഀഀ
      return (਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀 愀渀椀洀愀琀攀ⴀ昀愀搀攀ⴀ椀渀∀ 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀䈀漀琀琀漀洀㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
          <div className="panel-header" style={{ background: 'rgba(125, 143, 123, 0.05)' }}>਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ琀椀琀氀攀∀ 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 紀紀㸀붿뿯붿ᑡ뿯㾽笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀䄀䤀 䌀嘀 씀㾓뿯墽晑뿯⮽Ѩ硹뿯붿붿뿯ួ뿯䖽砥婖뿯᾽⹘佶㽰 㨀 ∀䄀䤀 䌀嘀 倀栀漀琀漀ⴀ琀漀ⴀ䌀䄀䐀 伀瘀攀爀氀愀瀀 䤀渀猀瀀攀挀琀椀漀渀∀紀㰀⼀搀椀瘀㸀ഀഀ
            <span className="logo-badge" style={{ color: 'var(--accent-green)' }}>PASS 98.2%</span>਍          㰀⼀搀椀瘀㸀ഀഀ
          <div className="panel-body" style={{ padding: '1rem' }}>਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀挀瘀ⴀ挀漀渀琀愀椀渀攀爀∀㸀ഀഀ
              <div className="cv-photo" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80')" }}></div>਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀挀瘀ⴀ漀瘀攀爀氀愀礀ⴀ琀攀砀琀∀㸀䰀䤀嘀䔀 倀䠀伀吀伀㨀 䘀伀匀䠀䄀一 䜀伀䰀䐀ⴀ匀唀一 匀吀ⴀ　㄀㰀⼀搀椀瘀㸀ഀഀ
              <div className="cv-grid-line"></div>਍            㰀⼀搀椀瘀㸀ഀഀ
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.8rem' }}>਍              㰀猀瀀愀渀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿뿯붿붿卽䑧뿯粽뿯붿뿯嶽뿯悽搴?(CAD Overlay): " : "Feature Match: "}<strong style={{ color: 'var(--accent-green)' }}>98.2%</strong></span>਍              㰀猀瀀愀渀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿灙ᥔ⑔붿붿쵘䪓Ŕ뿯㪽 ∀ 㨀 ∀䌀漀氀漀爀 匀眀愀琀挀栀 䴀愀琀挀栀㨀 ∀紀㰀猀琀爀漀渀最 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀ 紀紀㸀䴀愀琀琀攀 䈀氀愀挀欀 伀䬀㰀⼀猀琀爀漀渀最㸀㰀⼀猀瀀愀渀㸀ഀഀ
            </div>਍          㰀⼀搀椀瘀㸀ഀഀ
        </div>਍      ⤀㬀ഀഀ
    }਍ഀഀ
    // 7. S12: Volumetric Container packing (3D Cargo)਍    椀昀 ⠀猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀㄀㈀∀⤀ 笀ഀഀ
      return (਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀 愀渀椀洀愀琀攀ⴀ昀愀搀攀ⴀ椀渀∀ 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀䈀漀琀琀漀洀㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
          <div className="panel-header" style={{ background: 'rgba(124,114,103,0.03)' }}>਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ琀椀琀氀攀∀㸀붿뿯嶽⁤笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀였붿붿뿯붿䵾뿯붿붿붿፝՞붿붿噒뿯⮽筨ॵ㽚 㨀 ∀㌀䐀 嘀漀氀甀洀攀琀爀椀挀 䌀漀渀琀愀椀渀攀爀 倀愀挀欀椀渀最 伀瀀琀椀洀椀稀攀爀∀紀㰀⼀搀椀瘀㸀ഀഀ
          </div>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ戀漀搀礀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
            <div className="cube-container">਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀猀栀椀瀀瀀椀渀最ⴀ戀漀砀ⴀ猀琀愀挀欀攀搀∀ 猀琀礀氀攀㴀笀笀 眀椀搀琀栀㨀 ✀㄀㌀　瀀砀✀Ⰰ 栀攀椀最栀琀㨀 ✀㄀㄀　瀀砀✀ 紀紀㸀ഀഀ
                Armchairs (24 CBM)਍              㰀⼀搀椀瘀㸀ഀഀ
              <div className="shipping-box-stacked" style={{ width: '80px', height: '110px', marginLeft: '5px' }}>਍                䌀氀甀戀 䌀栀愀椀爀猀 ⠀㄀㘀 䌀䈀䴀⤀ഀഀ
              </div>਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀猀栀椀瀀瀀椀渀最ⴀ戀漀砀ⴀ猀琀愀挀欀攀搀∀ 猀琀礀氀攀㴀笀笀 眀椀搀琀栀㨀 ✀㐀　瀀砀✀Ⰰ 栀攀椀最栀琀㨀 ✀㜀　瀀砀✀Ⰰ 洀愀爀最椀渀䰀攀昀琀㨀 ✀㔀瀀砀✀Ⰰ 愀氀椀最渀匀攀氀昀㨀 ✀昀氀攀砀ⴀ攀渀搀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀爀最戀愀⠀㄀㘀㠀Ⰰ㄀㐀㌀Ⰰ㄀㈀㠀Ⰰ　⸀㈀⤀✀Ⰰ 戀漀爀搀攀爀䌀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ漀爀愀渀最攀⤀✀ 紀紀㸀ഀഀ
                Tables (6 CBM)਍              㰀⼀搀椀瘀㸀ഀഀ
            </div>਍            㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀猀瀀愀挀攀ⴀ戀攀琀眀攀攀渀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀　⸀㠀爀攀洀✀ 紀紀㸀ഀഀ
              <span>{lang === "Cn" ? "瑁뿯澽級뿯纽卞瀷: " : "Container Type: "}<strong style={{ color: 'var(--accent-cyan)' }}>40GP Container</strong></span>਍              㰀猀瀀愀渀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㤀⵰붿뿯劽뿯䎽搥ᱥ뿯㾽 ∀ 㨀 ∀匀瀀愀挀攀 䔀昀昀椀挀椀攀渀挀礀㨀 ∀紀㰀猀琀爀漀渀最 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ挀礀愀渀⤀✀ 紀紀㸀㘀㠀⸀㘀─㰀⼀猀琀爀漀渀最㸀㰀⼀猀瀀愀渀㸀ഀഀ
            </div>਍            㰀戀甀琀琀漀渀 ഀഀ
              className="btn-premium" ਍              猀琀礀氀攀㴀笀笀 眀椀搀琀栀㨀 ✀㄀　　─✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀㄀爀攀洀✀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀挀攀渀琀攀爀✀Ⰰ 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 愀氀椀最渀䤀琀攀洀猀㨀 ✀挀攀渀琀攀爀✀Ⰰ 最愀瀀㨀 ✀㠀瀀砀✀ 紀紀 ഀഀ
              onClick={() => setShowVolumetricSimulation(true)}਍            㸀ഀഀ
              뿯붿搳 {lang === "Cn" ? "붿뿯熽뿯媽 3D 뿯붿뿯掽뿯玽뿯涽夌붿뿯纽嬮뿯玽浠뿯憽≮ 㨀 ∀䰀愀甀渀挀栀 䤀渀琀攀爀愀挀琀椀瘀攀 ㌀䐀 倀愀挀欀椀渀最 匀椀洀甀氀愀琀椀漀渀∀紀ഀഀ
            </button>਍          㰀⼀搀椀瘀㸀ഀഀ
        </div>਍      ⤀㬀ഀഀ
    }਍ഀഀ
    // 8. S13: Customs Document stamp board਍    椀昀 ⠀猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀㄀㌀∀⤀ 笀ഀഀ
      return (਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀 愀渀椀洀愀琀攀ⴀ昀愀搀攀ⴀ椀渀∀ 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀䈀漀琀琀漀洀㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
          <div className="panel-header" style={{ background: 'rgba(124,114,103,0.03)' }}>਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ琀椀琀氀攀∀㸀붿뿯㖽⁤笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀儀뿯붿偰뿯施뿯붿䝭娰뿯⎽붿뿯悽뿯붿뿯붿睴뿯䒽뿯붿쵚Ɠ붿뿯⊽ 㨀 ∀䌀甀猀琀漀洀猀 䌀爀攀搀攀渀琀椀愀氀猀 䰀攀搀最攀爀 嘀攀爀椀昀椀挀愀琀椀漀渀∀紀㰀⼀搀椀瘀㸀ഀഀ
            <span className="logo-badge" style={{ color: 'var(--accent-orange)' }}>COMPLIANCE</span>਍          㰀⼀搀椀瘀㸀ഀഀ
          <div className="panel-body" style={{ padding: '1rem' }}>਍            㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 昀氀攀砀䐀椀爀攀挀琀椀漀渀㨀 ✀挀漀氀甀洀渀✀Ⰰ 最愀瀀㨀 ✀　⸀㘀爀攀洀✀Ⰰ 瀀漀猀椀琀椀漀渀㨀 ✀爀攀氀愀琀椀瘀攀✀ 紀紀㸀ഀഀ
              <div style={{ padding: '0.6rem 0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>਍                㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀ 紀紀㸀㄀⸀ 笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㔀㵰뿯檽붿䙯⨄兜뿯㾽䤀倀倀䌀 ᐀뿯붿䁟붿୴붿≩ 㨀 ∀䤀倀倀䌀 匀漀氀椀搀 圀漀漀搀 䘀甀洀椀最愀琀椀漀渀∀紀㰀⼀猀瀀愀渀㸀ഀഀ
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: docAudited ? 'var(--accent-green)' : 'var(--accent-orange)' }}>਍                  笀搀漀挀䄀甀搀椀琀攀搀 㼀 ∀䄀뿯㾽嘀䔀刀䤀䘀䤀䔀䐀∀ 㨀 ∀倀䔀一䐀䤀一䜀∀紀ഀഀ
                </span>਍              㰀⼀搀椀瘀㸀ഀഀ
              <div style={{ padding: '0.6rem 0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>਍                㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀ 紀紀㸀㈀⸀ 笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿뿯ⲽ붿붿뿯綽붿뿯붿幾붿㑧붿붿콗붿붿睺뿯墽붿㼠 㨀 ∀䈀椀氀氀 漀昀 䰀愀搀椀渀最 䌀漀渀猀椀猀琀攀渀挀礀 䌀栀攀挀欀∀紀㰀⼀猀瀀愀渀㸀ഀഀ
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: docAudited ? 'var(--accent-green)' : 'var(--accent-orange)' }}>਍                  笀搀漀挀䄀甀搀椀琀攀搀 㼀 ∀䄀뿯㾽嘀䔀刀䤀䘀䤀䔀䐀∀ 㨀 ∀倀䔀一䐀䤀一䜀∀紀ഀഀ
                </span>਍              㰀⼀搀椀瘀㸀ഀഀ
              <div style={{ padding: '0.6rem 0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>਍                㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀ 紀紀㸀㌀⸀ 笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㐀붿붿全뿯붿桔뿯殽뿯䶽뿯붿❨뿯྽붿뿯춽Ɠ붿≙ 㨀 ∀䌀甀猀琀漀洀猀 䐀攀挀氀愀爀愀琀椀漀渀 䴀愀琀挀栀椀渀最∀紀㰀⼀猀瀀愀渀㸀ഀഀ
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: docAudited ? 'var(--accent-green)' : 'var(--accent-orange)' }}>਍                  笀搀漀挀䄀甀搀椀琀攀搀 㼀 ∀䄀뿯㾽嘀䔀刀䤀䘀䤀䔀䐀∀ 㨀 ∀倀䔀一䐀䤀一䜀∀紀ഀഀ
                </span>਍              㰀⼀搀椀瘀㸀ഀഀ
਍              笀搀漀挀䄀甀搀椀琀攀搀 ☀☀ ⠀ഀഀ
                <div className="wax-stamp-overlay stamped stamp-pass" style={{ top: '30px', left: '100px', zIndex: 100 }}>਍                  䐀漀挀猀 倀愀猀猀攀搀ഀഀ
                </div>਍              ⤀紀ഀഀ
਍              笀℀搀漀挀䄀甀搀椀琀攀搀 ☀☀ ⠀ഀഀ
                <button className="btn-premium" style={{ width: '100%', marginTop: '0.4rem', justifyContent: 'center' }} onClick={handleDocumentAudit}>਍                  붿뿯ᶽᑭ뿯㾽笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀椀뿯붿ᅵ뿯施뿯붿䝭怰뿯붿뿯붿睴뿯䒽뿯붿㕚䑰붿∥ 㨀 ∀䄀甀搀椀琀 䔀砀瀀漀爀琀 䐀漀挀甀洀攀渀琀猀∀紀ഀഀ
                </button>਍              ⤀紀ഀഀ
            </div>਍          㰀⼀搀椀瘀㸀ഀഀ
        </div>਍      ⤀㬀ഀഀ
    }਍ഀഀ
    // 9. S14: Maritime Vessel Map਍    椀昀 ⠀猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀㄀㐀∀⤀ 笀ഀഀ
      return (਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀 愀渀椀洀愀琀攀ⴀ昀愀搀攀ⴀ椀渀∀ 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀䈀漀琀琀漀洀㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
          <div className="panel-header" style={{ background: 'rgba(124,114,103,0.03)' }}>਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ琀椀琀氀攀∀㸀붿뿯붿⁛笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿⡴붿晗뿯⦽붿붿붿붿㽴⠀붿h뿯஽뿯榽뿯붿붿뿯얽㾓䄀倀䤀⤀∀ 㨀 ∀䴀愀攀爀猀欀 䴀愀爀椀琀椀洀攀 䄀倀䤀 吀爀愀挀欀椀渀最∀紀㰀⼀搀椀瘀㸀ഀഀ
          </div>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ戀漀搀礀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀　⸀㠀爀攀洀✀ 紀紀㸀ഀഀ
            <div className="maritime-map">਍              㰀猀瘀最 眀椀搀琀栀㴀∀㄀　　─∀ 栀攀椀最栀琀㴀∀㄀　　─∀ 瘀椀攀眀䈀漀砀㴀∀　 　 㐀　　 ㈀㔀　∀㸀ഀഀ
                <path d="M10,80 L80,60 L120,90 L90,140 L40,160 Z" fill="#D3CECA" opacity="0.4" />਍                㰀瀀愀琀栀 搀㴀∀䴀㄀㘀　Ⰰ㔀　 䰀㈀　　Ⰰ㐀　 䰀㈀㠀　Ⰰ㌀　 䰀㈀㘀　Ⰰ㠀　 䰀㈀㤀　Ⰰ㄀㈀　 䰀㈀㌀　Ⰰ㄀㘀　 娀∀ 昀椀氀氀㴀∀⌀䐀㌀䌀䔀䌀䄀∀ 漀瀀愀挀椀琀礀㴀∀　⸀㐀∀ ⼀㸀ഀഀ
                <path d="M110,210 L160,220 L150,240 Z" fill="#D3CECA" opacity="0.4" />਍ഀഀ
                <path d="M260,110 C210,130 180,180 150,160 C130,140 105,100 60,60" fill="none" className="ocean-vector-path" />਍ഀഀ
                <text x="265" y="114" fontSize="7" fill="var(--text-primary)" fontWeight="bold">Nansha Port</text>਍                㰀挀椀爀挀氀攀 挀砀㴀∀㈀㘀　∀ 挀礀㴀∀㄀㄀　∀ 爀㴀∀㌀∀ 昀椀氀氀㴀∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ漀爀愀渀最攀⤀∀ ⼀㸀ഀഀ
਍                㰀琀攀砀琀 砀㴀∀㐀㔀∀ 礀㴀∀㔀㔀∀ 昀漀渀琀匀椀稀攀㴀∀㜀∀ 昀椀氀氀㴀∀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀∀ 昀漀渀琀圀攀椀最栀琀㴀∀戀漀氀搀∀㸀匀漀甀琀栀愀洀瀀琀漀渀㰀⼀琀攀砀琀㸀ഀഀ
                <circle cx="60" cy="60" r="3" fill="var(--accent-green)" />਍ഀഀ
                <g transform="translate(162, 160)">਍                  㰀挀椀爀挀氀攀 挀砀㴀∀　∀ 挀礀㴀∀　∀ 爀㴀∀㐀∀ 昀椀氀氀㴀∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ瀀爀椀洀愀爀礀⤀∀ ⼀㸀ഀഀ
                  <circle cx="0" cy="0" r="8" fill="none" stroke="var(--accent-primary)" strokeWidth="1">਍                    㰀愀渀椀洀愀琀攀 愀琀琀爀椀戀甀琀攀一愀洀攀㴀∀爀∀ 瘀愀氀甀攀猀㴀∀㐀㬀㄀㈀㬀㐀∀ 搀甀爀㴀∀㈀猀∀ 爀攀瀀攀愀琀䌀漀甀渀琀㴀∀椀渀搀攀昀椀渀椀琀攀∀ ⼀㸀ഀഀ
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />਍                  㰀⼀挀椀爀挀氀攀㸀ഀഀ
                </g>਍              㰀⼀猀瘀最㸀ഀഀ
            </div>਍            㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀猀瀀愀挀攀ⴀ戀攀琀眀攀攀渀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㈀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀　⸀㔀爀攀洀✀ 紀紀㸀ഀഀ
              <span>{lang === "Cn" ? "붿뿯撽뿯墽붿붿붿浣뿯嶽뿯疽: 铇뿯嚽紛뿯澽뿯붿౎㽚 㨀 ∀倀漀猀椀琀椀漀渀㨀 匀甀攀稀 䌀愀渀愀氀 吀爀愀渀猀椀琀∀紀㰀⼀猀瀀愀渀㸀ഀഀ
              <span>ETA: <strong style={{ color: 'var(--text-primary)' }}>2026-06-08</strong></span>਍            㰀⼀搀椀瘀㸀ഀഀ
          </div>਍        㰀⼀搀椀瘀㸀ഀഀ
      );਍    紀ഀഀ
਍    ⼀⼀ ㄀　⸀ 匀㄀㔀㨀 匀瀀氀椀琀 搀攀氀椀瘀攀爀礀 䄀挀挀漀甀渀琀椀渀最 氀攀搀最攀爀ഀഀ
    if (stageId === "S15") {਍      爀攀琀甀爀渀 ⠀ഀഀ
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem' }}>਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ栀攀愀搀攀爀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀爀最戀愀⠀㄀㘀㘀Ⰰ㄀㌀㈀Ⰰ㄀㈀㠀Ⰰ　⸀　㌀⤀✀ 紀紀㸀ഀഀ
            <div className="panel-title" style={{ color: 'var(--accent-red)' }}>뿯붿捀 {lang === "Cn" ? "뿯璽″뿯媽붿붿뿯媽灏뿯嶽뿯붿붿뿯嚽뿯垽뿯붿瑰뿯垽뿯璽ㄦ牳뿯붿? : "Strike-through Accounting Audit"}</div>਍          㰀⼀搀椀瘀㸀ഀഀ
          <div className="panel-body" style={{ padding: '1rem' }}>਍            㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 昀氀攀砀䐀椀爀攀挀琀椀漀渀㨀 ✀挀漀氀甀洀渀✀Ⰰ 最愀瀀㨀 ✀　⸀㠀爀攀洀✀ 紀紀㸀ഀഀ
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>਍                笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㤀ⅰ붿붿;뿯붿뿯ᶽ뿯붿池睲뿯⚽붿붿䍴㽚᭭뿯綽䝜ᅟ㽚㈀ 붿뿯䎽붿붿뿯⮽⩛뿯妽뿯㾽㄀ 붿孛뿯䞽簰뿯붿뿯붿붿뿯붿㭐睮≴붿뿯붿幾붿佶붿䝝ᅟ╚⅘⥲뿯붿뿯₽붿붿붿뿯冽뿯窽뿯붿뿯疽뿯붿붿屽뿯붿鏅뿯傽笡붿뿯嶽뿯₽뿯₽娆뿯厽甫뿯붿뿯嶽畻灏뿯炽뿯붿뿯붿? : "The site reported layout modifications. 2 Armchairs and 1 Table are canceled. recasting accounts under the strike-through policy."}਍              㰀⼀搀椀瘀㸀ഀഀ
਍              笀℀猀瀀氀椀琀䐀攀氀椀瘀攀爀礀䄀挀琀椀瘀攀 㼀 ⠀ഀഀ
                <button className="btn-premium" style={{ background: 'var(--accent-red)', color: 'white', justifyContent: 'center' }} onClick={triggerSplitDelivery}>਍                  㼀뿯㾽笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀椀뿯붿ᅵ뿯劽뿯붿붿剘뿯붿붿呬뿯붿붿붿뿯붿붿뿯⊽ 㨀 ∀䔀砀攀挀甀琀攀 匀瀀氀椀琀 猀琀爀椀欀攀 爀攀挀愀氀挀甀氀愀琀椀漀渀∀紀ഀഀ
                </button>਍              ⤀ 㨀 ⠀ഀഀ
                <div style={{ padding: '0.8rem', background: 'rgba(125, 143, 123, 0.08)', border: '1px solid var(--accent-green)', borderRadius: '2px', fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: '600' }}>਍                  䄀뿯㾽笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀吀뿯붿붿붿뿯붿筝붿뿯ⲽ붿᭙뿯碽붿婠뿯붿䑜뿯Ⓗ붿⅝佻㽰␀㠀㜀　ᬀ뿯綽붿ٱ붿붿睑뿯䒽뿯붿쵚Ɠ붿붿붿뿯Ჽ蛡㾒 㨀 ∀刀攀挀愀氀挀甀氀愀琀椀漀渀 䄀瀀瀀氀椀攀搀㨀 䤀渀瘀漀椀挀攀 爀攀搀甀挀攀搀 戀礀 ␀㠀㜀　⸀ 䈀愀氀愀渀挀攀搀 甀瀀搀愀琀攀搀⸀∀紀ഀഀ
                </div>਍              ⤀紀ഀഀ
            </div>਍          㰀⼀搀椀瘀㸀ഀഀ
        </div>਍      ⤀㬀ഀഀ
    }਍ഀഀ
    // 11. S16, S17: Handover & Archive Hash਍    椀昀 ⠀猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀㄀㘀∀ 簀簀 猀琀愀最攀䤀搀 㴀㴀㴀 ∀匀㄀㜀∀⤀ 笀ഀഀ
      return (਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀 愀渀椀洀愀琀攀ⴀ昀愀搀攀ⴀ椀渀∀ 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀䈀漀琀琀漀洀㨀 ✀㄀爀攀洀✀ 紀紀㸀ഀഀ
          <div className="panel-header" style={{ background: 'rgba(124,114,103,0.03)' }}>਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ琀椀琀氀攀∀㸀붿뿯䂽⁥笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㤀൰夊뿯厽뿯妽告獢붿뿯嚽瘑뿯纽煎붿瀵╄뿯▽" : "Secure Handover & Archive Lock"}</div>਍          㰀⼀搀椀瘀㸀ഀഀ
          <div className="panel-body" style={{ padding: '1rem' }}>਍            㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 昀氀攀砀䐀椀爀攀挀琀椀漀渀㨀 ✀挀漀氀甀洀渀✀Ⰰ 最愀瀀㨀 ✀　⸀㠀爀攀洀✀ 紀紀㸀ഀഀ
              <div style={{ padding: '0.8rem', background: '#F4F2EE', border: '1px solid var(--glass-border)', borderRadius: '2px', fontSize: '0.72rem' }}>਍                㰀猀琀爀漀渀最 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀✀ 紀紀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀쬀澕ご붿୴䥙쉭붿≖噫뿯붿ご≽ 㨀 ∀倀爀漀樀攀挀琀 䐀漀猀猀椀攀爀 䌀漀洀瀀椀氀攀㨀∀紀㰀⼀猀琀爀漀渀最㸀㰀戀爀⼀㸀ഀഀ
                <span style={{ color: 'var(--text-secondary)' }}>਍                  笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀嘀뿯涽붿붿慭뿯붿왚ን湫啳붿硟읲ẓ붿ؠ桎愀渀最攀 䰀漀最猀 㔀䑰붿쌥붿夰붿뿯ҽ䥎 唀ⱴ붿뿯璽붿簿붿堟牸뿯璽夈뿯₽佺噧붿뿯掽強붿뿯徽捀붿뿯붿뿯璽뿯붿佺뿯徽붿뿯撽뿯붿뿯붿剁敖瑾뿯嶽뿯₽? : "Includes CAD Specs, Change logs, AI QC reports, IPPC certificates, and signed client receipts."}਍                㰀⼀猀瀀愀渀㸀ഀഀ
              </div>਍ഀഀ
              {archiveHashed ? (਍                㰀搀椀瘀 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀　⸀㠀爀攀洀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀爀最戀愀⠀㄀㈀㔀Ⰰ㄀㐀㌀Ⰰ㄀㈀㌀Ⰰ　⸀　㠀⤀✀Ⰰ 戀漀爀搀攀爀㨀 ✀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀✀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㈀瀀砀✀ 紀紀㸀ഀഀ
                  <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>붿?{lang === "Cn" ? "闋呯洰뿯宽뿯掽畬뿯붿村瘑灏佸뿯璽뿯妽? : "Dossier Encrypted & Archived"}</div>਍                  㰀搀椀瘀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㘀㈀爀攀洀✀Ⰰ 昀漀渀琀䘀愀洀椀氀礀㨀 ✀洀漀渀漀猀瀀愀挀攀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀㐀瀀砀✀Ⰰ 眀漀爀搀䈀爀攀愀欀㨀 ✀戀爀攀愀欀ⴀ愀氀氀✀ 紀紀㸀ഀഀ
                    SHA-256: 8f5c90b6a7d18721c4b2e70e17631bd4fb6029cf8e11a2f4219b16752d586b51਍                  㰀⼀搀椀瘀㸀ഀഀ
                </div>਍              ⤀ 㨀 ⠀ഀഀ
                <button ਍                  挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ瀀爀攀洀椀甀洀∀ ഀഀ
                  style={{ justifyContent: 'center' }} ਍                  漀渀䌀氀椀挀欀㴀笀栀愀渀搀氀攀䌀爀礀瀀琀漀最爀愀瀀栀椀挀䄀爀挀栀椀瘀攀紀ഀഀ
                  disabled={stageId !== "S17"}਍                㸀ഀഀ
                  뿯붿敀 {lang === "Cn" ? "瀵뿯喽뿯皽瀛樻獢뿯涽붿敓뿯붿愬뿯妽瀵뿯喽搱甯? : "Archive & Lock Ledger dossier"}਍                㰀⼀戀甀琀琀漀渀㸀ഀഀ
              )}਍            㰀⼀搀椀瘀㸀ഀഀ
          </div>਍        㰀⼀搀椀瘀㸀ഀഀ
      );਍    紀ഀഀ
਍    爀攀琀甀爀渀 渀甀氀氀㬀ഀഀ
  };਍ഀഀ
  // Supabase connection configuration states਍  挀漀渀猀琀 嬀搀戀唀爀氀Ⰰ 猀攀琀䐀戀唀爀氀崀 㴀 甀猀攀匀琀愀琀攀⠀猀愀瘀攀搀唀爀氀⤀㬀ഀഀ
  const [dbKey, setDbKey] = useState(savedKey);਍  挀漀渀猀琀 嬀猀栀漀眀䐀戀䌀漀渀昀椀最Ⰰ 猀攀琀匀栀漀眀䐀戀䌀漀渀昀椀最崀 㴀 甀猀攀匀琀愀琀攀⠀昀愀氀猀攀⤀㬀ഀഀ
  const [dbConnected, setDbConnected] = useState(!!supabaseClient);਍  挀漀渀猀琀 嬀搀戀䰀漀愀搀椀渀最Ⰰ 猀攀琀䐀戀䰀漀愀搀椀渀最崀 㴀 甀猀攀匀琀愀琀攀⠀昀愀氀猀攀⤀㬀ഀഀ
  const [dbError, setDbError] = useState("");਍ഀഀ
  const stages = mockData.stages;਍  挀漀渀猀琀 挀甀爀爀攀渀琀匀琀愀最攀 㴀 猀琀愀最攀猀嬀挀甀爀爀攀渀琀匀琀愀最攀䤀渀搀攀砀崀㬀ഀഀ
਍  ⼀⼀ 䄀甀琀漀 猀挀爀漀氀氀 琀攀爀洀椀渀愀氀 氀漀最猀ഀഀ
  useEffect(() => {਍    椀昀 ⠀琀攀爀洀椀渀愀氀䔀渀搀刀攀昀⸀挀甀爀爀攀渀琀⤀ 笀ഀഀ
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });਍    紀ഀഀ
  }, [currentStageIndex, chatMessages]);਍ഀഀ
  // Fetch real-time data from Supabase if connected਍  挀漀渀猀琀 昀攀琀挀栀匀甀瀀愀戀愀猀攀䐀愀琀愀 㴀 愀猀礀渀挀 ⠀猀栀漀甀氀搀吀栀爀漀眀 㴀 昀愀氀猀攀⤀ 㴀㸀 笀ഀഀ
    if (!window.supabase || !localStorage.getItem("supabase_url") || !localStorage.getItem("supabase_key")) {਍      猀攀琀䐀戀䌀漀渀渀攀挀琀攀搀⠀昀愀氀猀攀⤀㬀ഀഀ
      return;਍    紀ഀഀ
    ਍    猀攀琀䐀戀䰀漀愀搀椀渀最⠀琀爀甀攀⤀㬀ഀഀ
    setDbError("");਍    ഀഀ
    try {਍      挀漀渀猀琀 甀爀氀 㴀 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开甀爀氀∀⤀㬀ഀഀ
      const key = localStorage.getItem("supabase_key");਍      挀漀渀猀琀 挀氀椀攀渀琀 㴀 眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⸀挀爀攀愀琀攀䌀氀椀攀渀琀⠀甀爀氀Ⰰ 欀攀礀⤀㬀ഀഀ
      ਍      ⼀⼀ ㄀⸀ 䘀攀琀挀栀 氀椀瘀攀 倀爀漀樀攀挀琀 渀愀洀攀搀 ✀䌀刀䄀䘀吀ⴀ㈀　㈀㘀　㔀ⴀ　㄀✀ഀഀ
      const { data: projectsData, error: projectErr } = await client਍        ⸀昀爀漀洀⠀∀瀀爀漀樀攀挀琀猀∀⤀ഀഀ
        .select("*")਍        ⸀攀焀⠀∀渀愀洀攀∀Ⰰ ∀䌀刀䄀䘀吀ⴀ㈀　㈀㘀　㔀ⴀ　㄀∀⤀ഀഀ
        .limit(1);਍        ഀഀ
      if (projectErr) throw projectErr;਍      ഀഀ
      let dbProject = null;਍      氀攀琀 渀攀攀搀吀漀匀攀攀搀 㴀 昀愀氀猀攀㬀ഀഀ
      ਍      椀昀 ⠀℀瀀爀漀樀攀挀琀猀䐀愀琀愀 簀簀 瀀爀漀樀攀挀琀猀䐀愀琀愀⸀氀攀渀最琀栀 㴀㴀㴀 　⤀ 笀ഀഀ
        needToSeed = true;਍      紀 攀氀猀攀 笀ഀഀ
        dbProject = projectsData[0];਍        ഀഀ
        // Robustness integrity check: Ensure all child tables are actually populated਍        挀漀渀猀琀 笀 搀愀琀愀㨀 猀瀀攀挀猀䌀栀攀挀欀Ⰰ 攀爀爀漀爀㨀 猀瀀攀挀猀䔀爀爀 紀 㴀 愀眀愀椀琀 挀氀椀攀渀琀ഀഀ
          .from("specifications")਍          ⸀猀攀氀攀挀琀⠀∀椀搀∀⤀ഀഀ
          .eq("project_id", dbProject.id)਍          ⸀氀椀洀椀琀⠀㄀⤀㬀ഀഀ
          ਍        挀漀渀猀琀 笀 搀愀琀愀㨀 瀀愀礀洀攀渀琀猀䌀栀攀挀欀Ⰰ 攀爀爀漀爀㨀 瀀愀礀洀攀渀琀猀䔀爀爀 紀 㴀 愀眀愀椀琀 挀氀椀攀渀琀ഀഀ
          .from("payments")਍          ⸀猀攀氀攀挀琀⠀∀椀搀∀⤀ഀഀ
          .eq("project_id", dbProject.id)਍          ⸀氀椀洀椀琀⠀㄀⤀㬀ഀഀ
          ਍        椀昀 ⠀猀瀀攀挀猀䔀爀爀 簀簀 瀀愀礀洀攀渀琀猀䔀爀爀 簀簀 ℀猀瀀攀挀猀䌀栀攀挀欀 簀簀 猀瀀攀挀猀䌀栀攀挀欀⸀氀攀渀最琀栀 㴀㴀㴀 　 簀簀 ℀瀀愀礀洀攀渀琀猀䌀栀攀挀欀 簀簀 瀀愀礀洀攀渀琀猀䌀栀攀挀欀⸀氀攀渀最琀栀 㴀㴀㴀 　⤀ 笀ഀഀ
          console.log("Project CRAFT-202605-01 exists, but specifications or payments are empty. Deleting existing project to trigger cascade and clean re-seed...");਍          愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀瀀爀漀樀攀挀琀猀∀⤀⸀搀攀氀攀琀攀⠀⤀⸀攀焀⠀∀椀搀∀Ⰰ 搀戀倀爀漀樀攀挀琀⸀椀搀⤀㬀ഀഀ
          needToSeed = true;਍          搀戀倀爀漀樀攀挀琀 㴀 渀甀氀氀㬀ഀഀ
        }਍      紀ഀഀ
      ਍      椀昀 ⠀渀攀攀搀吀漀匀攀攀搀⤀ 笀ഀഀ
        console.log("Running client-side auto-seeding...");਍        ഀഀ
        // 1. Insert default project਍        挀漀渀猀琀 笀 搀愀琀愀㨀 渀攀眀倀爀漀樀䐀愀琀愀Ⰰ 攀爀爀漀爀㨀 猀攀攀搀倀爀漀樀䔀爀爀 紀 㴀 愀眀愀椀琀 挀氀椀攀渀琀ഀഀ
          .from("projects")਍          ⸀椀渀猀攀爀琀⠀笀ഀഀ
            name: "CRAFT-202605-01",਍            挀氀椀攀渀琀开渀愀洀攀㨀 ∀䌀氀椀攀渀琀 䐀攀猀椀最渀 匀琀甀搀椀漀 ⠀唀䬀⤀∀Ⰰഀഀ
            client_contact: "St Albans, UK",਍            挀甀爀爀攀渀琀开猀琀愀最攀㨀 ㄀Ⰰഀഀ
            selected_fabric: "FAB-02",਍            猀攀氀攀挀琀攀搀开氀攀最㨀 ∀洀愀琀琀攀ⴀ戀氀愀挀欀∀Ⰰഀഀ
            fabric_compatibility_test: null,਍            椀猀开挀爀椀戀㔀开戀氀漀挀欀攀搀㨀 昀愀氀猀攀Ⰰഀഀ
            selected_supplier: null,਍            猀瀀氀椀琀开搀攀氀椀瘀攀爀礀开愀挀琀椀瘀攀㨀 昀愀氀猀攀ഀഀ
          })਍          ⸀猀攀氀攀挀琀⠀⤀㬀ഀഀ
          ਍        椀昀 ⠀猀攀攀搀倀爀漀樀䔀爀爀⤀ 琀栀爀漀眀 渀攀眀 䔀爀爀漀爀⠀∀䄀甀琀漀ⴀ猀攀攀搀椀渀最 倀爀漀樀攀挀琀猀 昀愀椀氀攀搀㨀 ∀ ⬀ 猀攀攀搀倀爀漀樀䔀爀爀⸀洀攀猀猀愀最攀⤀㬀ഀഀ
        ਍        氀攀琀 椀渀猀攀爀琀攀搀倀爀漀樀 㴀 ⠀渀攀眀倀爀漀樀䐀愀琀愀 ☀☀ 渀攀眀倀爀漀樀䐀愀琀愀⸀氀攀渀最琀栀 㸀 　⤀ 㼀 渀攀眀倀爀漀樀䐀愀琀愀嬀　崀 㨀 渀甀氀氀㬀ഀഀ
        ਍        ⼀⼀ 刀漀戀甀猀琀 昀愀氀氀戀愀挀欀㨀 椀昀 椀渀猀攀爀琀ⴀ猀攀氀攀挀琀 爀攀琀甀爀渀猀 攀洀瀀琀礀 ⠀挀漀洀洀漀渀 眀椀琀栀 猀漀洀攀 刀䰀匀⼀琀爀椀最最攀爀猀⼀匀䐀䬀 椀猀猀甀攀猀⤀Ⰰ 猀攀氀攀挀琀 攀砀瀀氀椀挀椀琀氀礀 戀礀 渀愀洀攀ഀഀ
        if (!insertedProj) {਍          挀漀渀猀漀氀攀⸀眀愀爀渀⠀∀䤀渀猀攀爀琀 猀攀氀攀挀琀 爀攀琀甀爀渀攀搀 攀洀瀀琀礀Ⰰ 愀琀琀攀洀瀀琀椀渀最 昀愀氀氀戀愀挀欀 猀攀氀攀挀琀 戀礀 渀愀洀攀⸀⸀⸀∀⤀㬀ഀഀ
          const { data: fallbackData, error: fallbackErr } = await client਍            ⸀昀爀漀洀⠀∀瀀爀漀樀攀挀琀猀∀⤀ഀഀ
            .select("*")਍            ⸀攀焀⠀∀渀愀洀攀∀Ⰰ ∀䌀刀䄀䘀吀ⴀ㈀　㈀㘀　㔀ⴀ　㄀∀⤀ഀഀ
            .limit(1);਍            ഀഀ
          if (fallbackErr) {਍            琀栀爀漀眀 渀攀眀 䔀爀爀漀爀⠀∀䘀愀氀氀戀愀挀欀 瀀爀漀樀攀挀琀 爀攀琀爀椀攀瘀愀氀 昀愀椀氀攀搀㨀 ∀ ⬀ 昀愀氀氀戀愀挀欀䔀爀爀⸀洀攀猀猀愀最攀⤀㬀ഀഀ
          }਍          椀昀 ⠀昀愀氀氀戀愀挀欀䐀愀琀愀 ☀☀ 昀愀氀氀戀愀挀欀䐀愀琀愀⸀氀攀渀最琀栀 㸀 　⤀ 笀ഀഀ
            insertedProj = fallbackData[0];਍          紀ഀഀ
        }਍        ഀഀ
        if (insertedProj) {਍          ഀഀ
          // 2. Insert standard specifications linked to the project਍          挀漀渀猀琀 笀 攀爀爀漀爀㨀 猀攀攀搀匀瀀攀挀猀䔀爀爀 紀 㴀 愀眀愀椀琀 挀氀椀攀渀琀ഀഀ
            .from("specifications")਍            ⸀椀渀猀攀爀琀⠀嬀ഀഀ
              {਍                瀀爀漀樀攀挀琀开椀搀㨀 椀渀猀攀爀琀攀搀倀爀漀樀⸀椀搀Ⰰഀഀ
                item_type_cn: "뿯澽у爞뿯붿붿뿯墽뿯妽?,਍                椀琀攀洀开琀礀瀀攀开攀渀㨀 ∀䰀漀戀戀礀 䄀爀洀挀栀愀椀爀∀Ⰰഀഀ
                quantity: 40,਍                洀愀琀攀爀椀愀氀开挀渀㨀 ∀㐀붿坜붿뿯붿㥯祼㽩⠀䰀ⴀ㐀㐀㄀　⤀∀Ⰰഀഀ
                material_en: "Navy Classic Linen (L-4410)",਍                漀爀椀最椀渀愀氀开甀渀椀琀开瀀爀椀挀攀㨀 ㈀㄀　Ⰰഀഀ
                unit_price: 210,਍                渀漀琀攀猀开挀渀㨀 ∀∀Ⰰഀഀ
                notes_en: ""਍              紀Ⰰഀഀ
              {਍                瀀爀漀樀攀挀琀开椀搀㨀 椀渀猀攀爀琀攀搀倀爀漀樀⸀椀搀Ⰰഀഀ
                item_type_cn: "뿯璽붿뿯붿붿뿯暽汉뿯妽?,਍                椀琀攀洀开琀礀瀀攀开攀渀㨀 ∀嘀䤀倀 䌀氀甀戀 䌀栀愀椀爀∀Ⰰഀഀ
                quantity: 20,਍                洀愀琀攀爀椀愀氀开挀渀㨀 ∀⠀뿯붿붿菡붿⍯Ż㽿⠀嘀ⴀ㤀　㠀㈀⤀∀Ⰰഀഀ
                material_en: "Royal Velvet (V-9082)",਍                漀爀椀最椀渀愀氀开甀渀椀琀开瀀爀椀挀攀㨀 ㈀㠀　Ⰰഀഀ
                unit_price: 280,਍                渀漀琀攀猀开挀渀㨀 ∀∀Ⰰഀഀ
                notes_en: ""਍              紀Ⰰഀഀ
              {਍                瀀爀漀樀攀挀琀开椀搀㨀 椀渀猀攀爀琀攀搀倀爀漀樀⸀椀搀Ⰰഀഀ
                item_type_cn: "瀹氬뿯垽瀹뿯炽湪뿯澽ц尪붿?,਍                椀琀攀洀开琀礀瀀攀开攀渀㨀 ∀䌀甀猀琀漀洀 伀愀欀 䌀漀昀昀攀攀 吀愀戀氀攀∀Ⰰഀഀ
                quantity: 5,਍                洀愀琀攀爀椀愀氀开挀渀㨀 ∀붿䍯붿❒뿯붿뿯붿뿯좽㾓Ⰰഀഀ
                material_en: "Natural Solid White Oak",਍                漀爀椀最椀渀愀氀开甀渀椀琀开瀀爀椀挀攀㨀 㐀㔀　Ⰰഀഀ
                unit_price: 450,਍                渀漀琀攀猀开挀渀㨀 ∀∀Ⰰഀഀ
                notes_en: ""਍              紀ഀഀ
            ]);਍            ഀഀ
          if (seedSpecsErr) throw new Error("Auto-seeding Specifications failed: " + seedSpecsErr.message);਍          ഀഀ
          // 3. Insert standard payment milestones਍          挀漀渀猀琀 笀 攀爀爀漀爀㨀 猀攀攀搀倀愀礀洀攀渀琀猀䔀爀爀 紀 㴀 愀眀愀椀琀 挀氀椀攀渀琀ഀഀ
            .from("payments")਍            ⸀椀渀猀攀爀琀⠀嬀ഀഀ
              {਍                瀀爀漀樀攀挀琀开椀搀㨀 椀渀猀攀爀琀攀搀倀爀漀樀⸀椀搀Ⰰഀഀ
                milestone_cn: "50% 뿯梽栨湡瀹氶噾 (뿯宽붿뿯粽)",਍                洀椀氀攀猀琀漀渀攀开攀渀㨀 ∀㔀　─ 䐀攀瀀漀猀椀琀 ⠀倀愀椀搀⤀∀Ⰰഀഀ
                amount: 10450,਍                猀琀愀琀甀猀㨀 ∀倀愀椀搀∀Ⰰഀഀ
                payment_date: "2026-05-25"਍              紀Ⰰഀഀ
              {਍                瀀爀漀樀攀挀琀开椀搀㨀 椀渀猀攀爀琀攀搀倀爀漀樀⸀椀搀Ⰰഀഀ
                milestone_cn: "40% 붿붿뿯掽뿯涽붿뿯붿 (鏈붿牳뿯붿뿯₽)",਍                洀椀氀攀猀琀漀渀攀开攀渀㨀 ∀㐀　─ 匀栀椀瀀瀀椀渀最 刀攀氀攀愀猀攀 ⠀倀攀渀搀椀渀最⤀∀Ⰰഀഀ
                amount: 8360,਍                猀琀愀琀甀猀㨀 ∀倀攀渀搀椀渀最∀Ⰰഀഀ
                payment_date: "Pending"਍              紀Ⰰഀഀ
              {਍                瀀爀漀樀攀挀琀开椀搀㨀 椀渀猀攀爀琀攀搀倀爀漀樀⸀椀搀Ⰰഀഀ
                milestone_cn: "10% 浜뿯ソ뿯粽灏뿯炽뿯붿 (鏈붿牳뿯붿뿯₽)",਍                洀椀氀攀猀琀漀渀攀开攀渀㨀 ∀㄀　─ 䠀愀渀搀漀瘀攀爀 䈀愀氀愀渀挀攀 ⠀倀攀渀搀椀渀最⤀∀Ⰰഀഀ
                amount: 2090,਍                猀琀愀琀甀猀㨀 ∀倀攀渀搀椀渀最∀Ⰰഀഀ
                payment_date: "Pending"਍              紀ഀഀ
            ]);਍          椀昀 ⠀猀攀攀搀倀愀礀洀攀渀琀猀䔀爀爀⤀ 琀栀爀漀眀 渀攀眀 䔀爀爀漀爀⠀∀䄀甀琀漀ⴀ猀攀攀搀椀渀最 倀愀礀洀攀渀琀猀 昀愀椀氀攀搀㨀 ∀ ⬀ 猀攀攀搀倀愀礀洀攀渀琀猀䔀爀爀⸀洀攀猀猀愀最攀⤀㬀ഀഀ
਍          ⼀⼀ 㐀⸀ 䤀渀猀攀爀琀 椀渀椀琀椀愀氀 栀甀洀愀渀ⴀ䄀䤀 愀甀搀椀琀 氀漀最猀ഀഀ
          const { error: seedLogsErr } = await client਍            ⸀昀爀漀洀⠀∀愀最攀渀琀开氀漀最猀∀⤀ഀഀ
            .insert([਍              笀ഀഀ
                project_id: insertedProj.id,਍                漀瀀攀爀愀琀漀爀㨀 ∀伀瀀攀渀䌀氀愀眀∀Ⰰഀഀ
                action_desc_cn: "瑙붿瀽鏈뿯冽摗뿯涽붿績붿х뿯疽灏뿯嶽┍뿯妽뿯喽渶뿯妽뿯傽強뿯붿嬬뿯붿붿뿯岽뿯嚽붿뿯暽敓뿯붿愪뿯宽瑷뿯傽뿯枽붿夌뿯붿",਍                愀挀琀椀漀渀开搀攀猀挀开攀渀㨀 ∀倀愀爀猀攀搀 洀攀洀戀攀爀 瀀漀爀琀愀氀 洀攀猀猀愀最攀 愀渀搀 猀欀攀琀挀栀Ⰰ 愀甀琀漀ⴀ最攀渀攀爀愀琀攀搀 瀀爀漀樀攀挀琀 洀愀猀琀攀爀 搀爀愀昀琀⸀∀ഀഀ
              },਍              笀ഀഀ
                project_id: insertedProj.id,਍                漀瀀攀爀愀琀漀爀㨀 ∀伀瀀攀渀䌀氀愀眀∀Ⰰഀഀ
                action_desc_cn: "붿붿뿯媽뿯붿氶뿯亽붿х뿯疽娑堟伅뿯붿氶뿯亽붿戝鎴뿯疽뿯抽붿뿯徽뿯붿붿呮붿瀛愮뿯殽뿯붿戝爆붿块儴뿯澽楄뿯붿붿붿屨뿯綽붿붿㽛Ⰰഀഀ
                action_desc_en: "Automatically followed up via member portal to query metal legs coating and tolerance."਍              紀Ⰰഀഀ
              {਍                瀀爀漀樀攀挀琀开椀搀㨀 椀渀猀攀爀琀攀搀倀爀漀樀⸀椀搀Ⰰഀഀ
                operator: "OpenClaw",਍                愀挀琀椀漀渀开搀攀猀挀开挀渀㨀 ∀붿붿붿뿯㖽卵붿뿯⪽兡뿯箽뿯붿뿯붿佧붿붿啓붿硟읲榓뿯ᶽ佽붿붿뿯妽欐簴瀹氱뿯亽붿歐: 650mm, D: 600mm, H: 850mm",਍                愀挀琀椀漀渀开搀攀猀挀开攀渀㨀 ∀䈀椀氀椀渀最甀愀氀 猀瀀攀挀椀昀椀挀愀琀椀漀渀猀 最攀渀攀爀愀琀攀搀⸀ 䐀椀洀攀渀猀椀漀渀猀 搀攀昀椀渀攀搀㨀 圀㨀 㘀㔀　洀洀Ⰰ 䐀㨀 㘀　　洀洀Ⰰ 䠀㨀 㠀㔀　洀洀⸀∀ഀഀ
              }਍            崀⤀㬀ഀഀ
            ਍          椀昀 ⠀猀攀攀搀䰀漀最猀䔀爀爀⤀ 琀栀爀漀眀 渀攀眀 䔀爀爀漀爀⠀∀䄀甀琀漀ⴀ猀攀攀搀椀渀最 䄀最攀渀琀 䰀漀最猀 昀愀椀氀攀搀㨀 ∀ ⬀ 猀攀攀搀䰀漀最猀䔀爀爀⸀洀攀猀猀愀最攀⤀㬀ഀഀ
          ਍          ⼀⼀ 㔀⸀ 䤀渀猀攀爀琀 搀攀琀愀椀氀攀搀 琀攀挀栀渀椀挀愀氀 愀最攀渀琀 琀栀漀甀最栀琀 琀爀愀挀攀 氀漀最猀 ⠀昀漀爀 愀氀氀 ㄀㜀 猀琀愀最攀猀⤀ഀഀ
          const seedThoughtRows = [];਍          伀戀樀攀挀琀⸀攀渀琀爀椀攀猀⠀洀漀挀欀䐀愀琀愀⸀愀最攀渀琀吀栀漀甀最栀琀䰀漀最猀⤀⸀昀漀爀䔀愀挀栀⠀⠀嬀猀琀愀最攀䤀搀Ⰰ 氀漀最䰀椀猀琀崀⤀ 㴀㸀 笀ഀഀ
            logList.forEach(line => {਍              猀攀攀搀吀栀漀甀最栀琀刀漀眀猀⸀瀀甀猀栀⠀笀ഀഀ
                project_id: insertedProj.id,਍                猀琀愀最攀开椀搀㨀 猀琀愀最攀䤀搀Ⰰഀഀ
                role: line.role,਍                氀漀最开琀攀砀琀开挀渀㨀 氀椀渀攀⸀琀攀砀琀Ⰰഀഀ
                log_text_en: line.textEn || line.text਍              紀⤀㬀ഀഀ
            });਍          紀⤀㬀ഀഀ
          if (seedThoughtRows.length > 0) {਍            挀漀渀猀琀 笀 攀爀爀漀爀㨀 猀攀攀搀吀栀漀甀最栀琀猀䔀爀爀 紀 㴀 愀眀愀椀琀 挀氀椀攀渀琀ഀഀ
              .from("agent_thought_logs")਍              ⸀椀渀猀攀爀琀⠀猀攀攀搀吀栀漀甀最栀琀刀漀眀猀⤀㬀ഀഀ
            if (seedThoughtsErr) throw new Error("Auto-seeding Agent Thought Logs failed: " + seedThoughtsErr.message);਍          紀ഀഀ
਍          搀戀倀爀漀樀攀挀琀 㴀 椀渀猀攀爀琀攀搀倀爀漀樀㬀ഀഀ
        } else {਍          琀栀爀漀眀 渀攀眀 䔀爀爀漀爀⠀∀䘀愀椀氀攀搀 琀漀 爀攀琀爀椀攀瘀攀 愀甀琀漀ⴀ猀攀攀搀攀搀 瀀爀漀樀攀挀琀⸀∀⤀㬀ഀഀ
        }਍      紀 攀氀猀攀 笀ഀഀ
        dbProject = projectsData[0];਍      紀ഀഀ
      ਍      ⼀⼀ 䰀漀愀搀 猀瀀攀挀猀Ⰰ 瀀愀礀洀攀渀琀猀Ⰰ 氀漀最猀 愀渀搀 琀栀漀甀最栀琀 氀漀最猀ഀഀ
      if (dbProject) {਍        ⼀⼀ ㈀⸀ 䘀攀琀挀栀 氀椀瘀攀 匀瀀攀挀椀昀椀挀愀琀椀漀渀猀ഀഀ
        const { data: itemsData, error: itemsErr } = await client਍          ⸀昀爀漀洀⠀∀猀瀀攀挀椀昀椀挀愀琀椀漀渀猀∀⤀ഀഀ
          .select("*")਍          ⸀攀焀⠀∀瀀爀漀樀攀挀琀开椀搀∀Ⰰ 搀戀倀爀漀樀攀挀琀⸀椀搀⤀㬀ഀഀ
          ਍        椀昀 ⠀椀琀攀洀猀䔀爀爀⤀ 琀栀爀漀眀 椀琀攀洀猀䔀爀爀㬀ഀഀ
        ਍        ⼀⼀ ㌀⸀ 䘀攀琀挀栀 氀椀瘀攀 倀愀礀洀攀渀琀猀 匀挀栀攀搀甀氀攀ഀഀ
        const { data: paymentsData, error: paymentsErr } = await client਍          ⸀昀爀漀洀⠀∀瀀愀礀洀攀渀琀猀∀⤀ഀഀ
          .select("*")਍          ⸀攀焀⠀∀瀀爀漀樀攀挀琀开椀搀∀Ⰰ 搀戀倀爀漀樀攀挀琀⸀椀搀⤀ഀഀ
          .order("created_at", { ascending: true });਍          ഀഀ
        if (paymentsErr) throw paymentsErr;਍ഀഀ
        // 4. Fetch live Agent Logs਍        挀漀渀猀琀 笀 搀愀琀愀㨀 氀漀最猀䐀愀琀愀 紀 㴀 愀眀愀椀琀 挀氀椀攀渀琀ഀഀ
          .from("agent_logs")਍          ⸀猀攀氀攀挀琀⠀∀⨀∀⤀ഀഀ
          .eq("project_id", dbProject.id)਍          ⸀漀爀搀攀爀⠀∀挀爀攀愀琀攀搀开愀琀∀Ⰰ 笀 愀猀挀攀渀搀椀渀最㨀 昀愀氀猀攀 紀⤀㬀ഀഀ
਍        ⼀⼀ 㔀⸀ 䘀攀琀挀栀 氀椀瘀攀 䄀最攀渀琀 吀栀漀甀最栀琀 䰀漀最猀ഀഀ
        const { data: dbThoughtLogs, error: thoughtsErr } = await client਍          ⸀昀爀漀洀⠀∀愀最攀渀琀开琀栀漀甀最栀琀开氀漀最猀∀⤀ഀഀ
          .select("*")਍          ⸀攀焀⠀∀瀀爀漀樀攀挀琀开椀搀∀Ⰰ 搀戀倀爀漀樀攀挀琀⸀椀搀⤀㬀ഀഀ
਍        椀昀 ⠀琀栀漀甀最栀琀猀䔀爀爀⤀ 琀栀爀漀眀 琀栀漀甀最栀琀猀䔀爀爀㬀ഀഀ
਍        ⼀⼀ 䄀瀀瀀氀礀 搀戀吀栀漀甀最栀琀䰀漀最猀 琀漀 椀渀ⴀ洀攀洀漀爀礀 洀漀挀欀䐀愀琀愀⸀愀最攀渀琀吀栀漀甀最栀琀䰀漀最猀 眀椀琀栀 䔀渀最氀椀猀栀 栀攀愀氀椀渀最ഀഀ
        if (dbThoughtLogs && dbThoughtLogs.length > 0) {਍          挀漀渀猀琀 渀攀眀吀栀漀甀最栀琀䰀漀最猀 㴀 笀紀㬀ഀഀ
          ਍          ⼀⼀ 匀漀爀琀 漀爀 最爀漀甀瀀 戀礀 猀琀愀最攀开椀搀Ⰰ 愀渀搀 瀀爀攀猀攀爀瘀攀 椀渀猀攀爀琀椀漀渀 漀爀搀攀爀ഀഀ
          const sortedDbThoughtLogs = [...dbThoughtLogs].sort((a, b) => {਍            椀昀 ⠀愀⸀猀琀愀最攀开椀搀 ℀㴀㴀 戀⸀猀琀愀最攀开椀搀⤀ 爀攀琀甀爀渀 愀⸀猀琀愀最攀开椀搀⸀氀漀挀愀氀攀䌀漀洀瀀愀爀攀⠀戀⸀猀琀愀最攀开椀搀⤀㬀ഀഀ
            return new Date(a.created_at || 0) - new Date(b.created_at || 0);਍          紀⤀㬀ഀഀ
਍          猀漀爀琀攀搀䐀戀吀栀漀甀最栀琀䰀漀最猀⸀昀漀爀䔀愀挀栀⠀爀漀眀 㴀㸀 笀ഀഀ
            if (!newThoughtLogs[row.stage_id]) {਍              渀攀眀吀栀漀甀最栀琀䰀漀最猀嬀爀漀眀⸀猀琀愀最攀开椀搀崀 㴀 嬀崀㬀ഀഀ
            }਍            ഀഀ
            const currentIdx = newThoughtLogs[row.stage_id].length;਍            挀漀渀猀琀 氀漀挀愀氀䰀椀渀攀猀 㴀 洀漀挀欀䐀愀琀愀⸀愀最攀渀琀吀栀漀甀最栀琀䰀漀最猀嬀爀漀眀⸀猀琀愀最攀开椀搀崀㬀ഀഀ
            const localLine = localLines ? localLines[currentIdx] : null;਍            ഀഀ
            let textEn = row.log_text_en || row.log_text_cn;਍            ⼀⼀ 䤀昀 䐀䈀 䔀渀最氀椀猀栀 琀攀砀琀 椀猀 洀椀猀猀椀渀最 漀爀 挀漀渀琀愀椀渀猀 䌀栀椀渀攀猀攀Ⰰ 戀甀琀 眀攀 栀愀瘀攀 愀 挀氀攀愀渀 氀漀挀愀氀 䔀渀最氀椀猀栀 琀攀砀琀Ⰰ 甀猀攀 氀漀挀愀氀ഀഀ
            if (localLine && localLine.textEn && (!row.log_text_en || row.log_text_en === row.log_text_cn || /[\u4e00-\u9fa5]/.test(row.log_text_en))) {਍              琀攀砀琀䔀渀 㴀 氀漀挀愀氀䰀椀渀攀⸀琀攀砀琀䔀渀㬀ഀഀ
            }਍ഀഀ
            newThoughtLogs[row.stage_id].push({਍              爀漀氀攀㨀 爀漀眀⸀爀漀氀攀Ⰰഀഀ
              text: row.log_text_cn || row.log_text_en,਍              琀攀砀琀䔀渀㨀 琀攀砀琀䔀渀ഀഀ
            });਍          紀⤀㬀ഀഀ
          ਍          伀戀樀攀挀琀⸀愀猀猀椀最渀⠀洀漀挀欀䐀愀琀愀⸀愀最攀渀琀吀栀漀甀最栀琀䰀漀最猀Ⰰ 渀攀眀吀栀漀甀最栀琀䰀漀最猀⤀㬀ഀഀ
        }਍ഀഀ
        const stageNum = dbProject.current_stage || 1;਍        挀漀渀猀琀 挀甀爀爀攀渀琀匀琀愀最攀䤀搀 㴀 ∀匀∀ ⬀ 匀琀爀椀渀最⠀猀琀愀最攀一甀洀⤀⸀瀀愀搀匀琀愀爀琀⠀㈀Ⰰ ∀　∀⤀㬀ഀഀ
਍        ⼀⼀ 匀礀渀挀 猀琀愀琀攀 瘀愀爀椀愀戀氀攀猀 昀爀漀洀 琀栀攀 搀愀琀愀戀愀猀攀 琀漀 刀攀愀挀琀 猀琀愀琀攀ഀഀ
        if (dbProject.selected_fabric) setSelectedFabric(dbProject.selected_fabric);਍        椀昀 ⠀搀戀倀爀漀樀攀挀琀⸀猀攀氀攀挀琀攀搀开氀攀最⤀ 猀攀琀匀攀氀攀挀琀攀搀䰀攀最⠀搀戀倀爀漀樀攀挀琀⸀猀攀氀攀挀琀攀搀开氀攀最⤀㬀ഀഀ
        if (dbProject.fabric_compatibility_test !== undefined) setFabricCompatibilityTest(dbProject.fabric_compatibility_test);਍        椀昀 ⠀搀戀倀爀漀樀攀挀琀⸀椀猀开挀爀椀戀㔀开戀氀漀挀欀攀搀 ℀㴀㴀 甀渀搀攀昀椀渀攀搀⤀ 笀ഀഀ
          setIsCrib5Blocked(dbProject.is_crib5_blocked);਍          猀攀琀䌀漀渀昀椀最甀爀愀琀漀爀䌀爀椀戀㔀䈀氀漀挀欀攀搀⠀搀戀倀爀漀樀攀挀琀⸀椀猀开挀爀椀戀㔀开戀氀漀挀欀攀搀 ☀☀ 搀戀倀爀漀樀攀挀琀⸀猀攀氀攀挀琀攀搀开昀愀戀爀椀挀 㴀㴀㴀 ∀䘀䄀䈀ⴀ　㌀∀⤀㬀ഀഀ
        }਍        椀昀 ⠀搀戀倀爀漀樀攀挀琀⸀猀攀氀攀挀琀攀搀开猀甀瀀瀀氀椀攀爀⤀ 猀攀琀匀攀氀攀挀琀攀搀匀甀瀀瀀氀椀攀爀⠀搀戀倀爀漀樀攀挀琀⸀猀攀氀攀挀琀攀搀开猀甀瀀瀀氀椀攀爀⤀㬀ഀഀ
        if (dbProject.split_delivery_active !== undefined) setSplitDeliveryActive(dbProject.split_delivery_active);਍ഀഀ
        // Map project shape dynamically਍        挀漀渀猀琀 洀愀瀀瀀攀搀伀爀搀攀爀 㴀 笀ഀഀ
          id: dbProject.id,਍          漀爀搀攀爀䤀搀㨀 搀戀倀爀漀樀攀挀琀⸀渀愀洀攀 簀簀 ∀䌀刀䄀䘀吀ⴀ㈀　㈀㘀　㔀ⴀ　㄀∀Ⰰഀഀ
          clientName: dbProject.client_name || "Client Design Studio (UK)",਍          瀀爀漀樀攀挀琀䰀漀挀愀琀椀漀渀㨀 搀戀倀爀漀樀攀挀琀⸀挀氀椀攀渀琀开挀漀渀琀愀挀琀 簀簀 ∀匀琀 䄀氀戀愀渀猀Ⰰ 唀䬀∀Ⰰഀഀ
          createdDate: dbProject.created_at ? dbProject.created_at.split("T")[0] : "2026-05-25",਍          挀甀爀爀攀渀琀匀琀愀最攀䤀搀㨀 挀甀爀爀攀渀琀匀琀愀最攀䤀搀Ⰰഀഀ
          items: (itemsData && itemsData.length > 0) ? itemsData.map(item => ({਍            椀搀㨀 椀琀攀洀⸀椀搀Ⰰഀഀ
            typeCn: item.item_type_cn,਍            琀礀瀀攀䔀渀㨀 椀琀攀洀⸀椀琀攀洀开琀礀瀀攀开攀渀Ⰰഀഀ
            qty: item.quantity,਍            洀愀琀攀爀椀愀氀䌀渀㨀 椀琀攀洀⸀洀愀琀攀爀椀愀氀开挀渀Ⰰഀഀ
            materialEn: item.material_en,਍            漀爀椀最椀渀愀氀唀渀椀琀倀爀椀挀攀㨀 一甀洀戀攀爀⠀椀琀攀洀⸀漀爀椀最椀渀愀氀开甀渀椀琀开瀀爀椀挀攀 簀簀 　⤀Ⰰഀഀ
            unitPrice: Number(item.unit_price || 0),਍            猀琀愀琀甀猀㨀 ∀䄀挀琀椀瘀攀∀Ⰰഀഀ
            note: item.notes_cn || item.notes_en || ""਍          紀⤀⤀ 㨀 䨀匀伀一⸀瀀愀爀猀攀⠀䨀匀伀一⸀猀琀爀椀渀最椀昀礀⠀洀漀挀欀䐀愀琀愀⸀椀渀椀琀椀愀氀伀爀搀攀爀⸀椀琀攀洀猀⤀⤀Ⰰഀഀ
          payments: (paymentsData && paymentsData.length > 0) ? paymentsData.map(p => ({਍            椀搀㨀 瀀⸀椀搀Ⰰഀഀ
            milestone: lang === "Cn" ? p.milestone_cn : p.milestone_en,਍            愀洀漀甀渀琀㨀 一甀洀戀攀爀⠀瀀⸀愀洀漀甀渀琀 簀簀 　⤀Ⰰഀഀ
            date: p.payment_date,਍            猀琀愀琀甀猀㨀 瀀⸀猀琀愀琀甀猀ഀഀ
          })) : JSON.parse(JSON.stringify(mockData.initialOrder.payments))਍        紀㬀ഀഀ
        ਍        猀攀琀伀爀搀攀爀⠀洀愀瀀瀀攀搀伀爀搀攀爀⤀㬀ഀഀ
        setDbConnected(true);਍        ഀഀ
        // Update local stage view to match Supabase's status਍        挀漀渀猀琀 猀琀愀最攀䤀搀砀 㴀 猀琀愀最攀猀⸀昀椀渀搀䤀渀搀攀砀⠀猀 㴀㸀 猀⸀椀搀 㴀㴀㴀 挀甀爀爀攀渀琀匀琀愀最攀䤀搀⤀㬀ഀഀ
        if (stageIdx !== -1) {਍          猀攀琀䌀甀爀爀攀渀琀匀琀愀最攀䤀渀搀攀砀⠀猀琀愀最攀䤀搀砀⤀㬀ഀഀ
        }਍        ഀഀ
        if (logsData && logsData.length > 0) {਍          猀攀琀䰀漀最猀⠀氀漀最猀䐀愀琀愀⸀洀愀瀀⠀氀漀最 㴀㸀 笀ഀഀ
            const actionCn = log.action_desc_cn || log.action_desc_en;਍            氀攀琀 愀挀琀椀漀渀䔀渀 㴀 氀漀最⸀愀挀琀椀漀渀开搀攀猀挀开攀渀 簀簀 氀漀最⸀愀挀琀椀漀渀开搀攀猀挀开挀渀㬀ഀഀ
            if (!actionEn || actionEn === actionCn || /[\u4e00-\u9fa5]/.test(actionEn)) {਍              愀挀琀椀漀渀䔀渀 㴀 最攀琀䰀漀最䄀挀琀椀漀渀䔀渀⠀愀挀琀椀漀渀䌀渀⤀ 簀簀 愀挀琀椀漀渀䔀渀㬀ഀഀ
            }਍            爀攀琀甀爀渀 笀ഀഀ
              time: log.created_at ? new Date(log.created_at).toLocaleString() : "2026-05-25 10:15:20",਍              甀猀攀爀㨀 氀漀最⸀漀瀀攀爀愀琀漀爀 簀簀 ∀伀瀀攀渀䌀氀愀眀∀Ⰰഀഀ
              action: actionCn,਍              愀挀琀椀漀渀䔀渀㨀 愀挀琀椀漀渀䔀渀ഀഀ
            };਍          紀⤀⤀㬀ഀഀ
        }਍      紀ഀഀ
    } catch (err) {਍      挀漀渀猀漀氀攀⸀攀爀爀漀爀⠀∀匀甀瀀愀戀愀猀攀 氀漀愀搀 攀爀爀漀爀㨀∀Ⰰ 攀爀爀⤀㬀ഀഀ
      setDbError(err.message || "Failed to query. Please verify connection credentials.");਍      猀攀琀䐀戀䌀漀渀渀攀挀琀攀搀⠀昀愀氀猀攀⤀㬀ഀഀ
      if (shouldThrow) throw err;਍    紀 昀椀渀愀氀氀礀 笀ഀഀ
      setDbLoading(false);਍    紀ഀഀ
  };਍ഀഀ
  // Listen to postMessage from child loading-ai਍  甀猀攀䔀昀昀攀挀琀⠀⠀⤀ 㴀㸀 笀ഀഀ
    const handleChildMessage = (e) => {਍      椀昀 ⠀攀⸀搀愀琀愀 ☀☀ 攀⸀搀愀琀愀⸀琀礀瀀攀 㴀㴀㴀 ✀䌀刀䄀䘀吀伀一开䌀䠀䤀䰀䐀开䰀䄀一䜀开䌀䠀䄀一䜀䔀✀⤀ 笀ഀഀ
        setLang(e.data.lang); // "Cn" or "En"਍      紀ഀഀ
    };਍    眀椀渀搀漀眀⸀愀搀搀䔀瘀攀渀琀䰀椀猀琀攀渀攀爀⠀✀洀攀猀猀愀最攀✀Ⰰ 栀愀渀搀氀攀䌀栀椀氀搀䴀攀猀猀愀最攀⤀㬀ഀഀ
    return () => window.removeEventListener('message', handleChildMessage);਍  紀Ⰰ 嬀崀⤀㬀ഀഀ
਍  ⼀⼀ 刀攀ⴀ昀攀琀挀栀 眀栀攀渀 挀漀渀渀攀挀琀椀漀渀 瘀愀爀椀愀戀氀攀猀 漀爀 氀愀渀最甀愀最攀 挀栀愀渀最攀ഀഀ
  useEffect(() => {਍    昀攀琀挀栀匀甀瀀愀戀愀猀攀䐀愀琀愀⠀⤀㬀ഀഀ
  }, [lang]);਍ഀഀ
  // Subscribe to real-time changes on Supabase when connected਍  甀猀攀䔀昀昀攀挀琀⠀⠀⤀ 㴀㸀 笀ഀഀ
    if (!dbConnected) return;਍ഀഀ
    let channel = null;਍    琀爀礀 笀ഀഀ
      const url = localStorage.getItem("supabase_url");਍      挀漀渀猀琀 欀攀礀 㴀 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开欀攀礀∀⤀㬀ഀഀ
      if (url && key && window.supabase) {਍        挀漀渀猀琀 挀氀椀攀渀琀 㴀 眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⸀挀爀攀愀琀攀䌀氀椀攀渀琀⠀甀爀氀Ⰰ 欀攀礀⤀㬀ഀഀ
        ਍        挀栀愀渀渀攀氀 㴀 挀氀椀攀渀琀ഀഀ
          .channel("schema-db-changes")਍          ⸀漀渀⠀ഀഀ
            "postgres_changes",਍            笀ഀഀ
              event: "*",਍              猀挀栀攀洀愀㨀 ∀瀀甀戀氀椀挀∀Ⰰഀഀ
              table: "projects"਍            紀Ⰰഀഀ
            (payload) => {਍              挀漀渀猀漀氀攀⸀氀漀最⠀∀刀攀愀氀琀椀洀攀 䌀栀愀渀最攀 搀攀琀攀挀琀攀搀 漀渀 ✀瀀爀漀樀攀挀琀猀✀㨀∀Ⰰ 瀀愀礀氀漀愀搀⤀㬀ഀഀ
              fetchSupabaseData();਍            紀ഀഀ
          )਍          ⸀漀渀⠀ഀഀ
            "postgres_changes",਍            笀ഀഀ
              event: "*",਍              猀挀栀攀洀愀㨀 ∀瀀甀戀氀椀挀∀Ⰰഀഀ
              table: "specifications"਍            紀Ⰰഀഀ
            (payload) => {਍              挀漀渀猀漀氀攀⸀氀漀最⠀∀刀攀愀氀琀椀洀攀 䌀栀愀渀最攀 搀攀琀攀挀琀攀搀 漀渀 ✀猀瀀攀挀椀昀椀挀愀琀椀漀渀猀✀㨀∀Ⰰ 瀀愀礀氀漀愀搀⤀㬀ഀഀ
              fetchSupabaseData();਍            紀ഀഀ
          )਍          ⸀漀渀⠀ഀഀ
            "postgres_changes",਍            笀ഀഀ
              event: "*",਍              猀挀栀攀洀愀㨀 ∀瀀甀戀氀椀挀∀Ⰰഀഀ
              table: "payments"਍            紀Ⰰഀഀ
            (payload) => {਍              挀漀渀猀漀氀攀⸀氀漀最⠀∀刀攀愀氀琀椀洀攀 䌀栀愀渀最攀 搀攀琀攀挀琀攀搀 漀渀 ✀瀀愀礀洀攀渀琀猀✀㨀∀Ⰰ 瀀愀礀氀漀愀搀⤀㬀ഀഀ
              fetchSupabaseData();਍            紀ഀഀ
          )਍          ⸀漀渀⠀ഀഀ
            "postgres_changes",਍            笀ഀഀ
              event: "*",਍              猀挀栀攀洀愀㨀 ∀瀀甀戀氀椀挀∀Ⰰഀഀ
              table: "agent_logs"਍            紀Ⰰഀഀ
            (payload) => {਍              挀漀渀猀漀氀攀⸀氀漀最⠀∀刀攀愀氀琀椀洀攀 䌀栀愀渀最攀 搀攀琀攀挀琀攀搀 漀渀 ✀愀最攀渀琀开氀漀最猀✀㨀∀Ⰰ 瀀愀礀氀漀愀搀⤀㬀ഀഀ
              fetchSupabaseData();਍            紀ഀഀ
          )਍          ⸀漀渀⠀ഀഀ
            "postgres_changes",਍            笀ഀഀ
              event: "*",਍              猀挀栀攀洀愀㨀 ∀瀀甀戀氀椀挀∀Ⰰഀഀ
              table: "agent_thought_logs"਍            紀Ⰰഀഀ
            (payload) => {਍              挀漀渀猀漀氀攀⸀氀漀最⠀∀刀攀愀氀琀椀洀攀 䌀栀愀渀最攀 搀攀琀攀挀琀攀搀 漀渀 ✀愀最攀渀琀开琀栀漀甀最栀琀开氀漀最猀✀㨀∀Ⰰ 瀀愀礀氀漀愀搀⤀㬀ഀഀ
              fetchSupabaseData();਍            紀ഀഀ
          )਍          ⸀猀甀戀猀挀爀椀戀攀⠀⠀猀琀愀琀甀猀⤀ 㴀㸀 笀ഀഀ
            console.log("Supabase Realtime subscription status:", status);਍          紀⤀㬀ഀഀ
      }਍    紀 挀愀琀挀栀 ⠀攀爀爀⤀ 笀ഀഀ
      console.error("Realtime subscription setup failed:", err);਍    紀ഀഀ
਍    爀攀琀甀爀渀 ⠀⤀ 㴀㸀 笀ഀഀ
      if (channel && window.supabase) {਍        琀爀礀 笀ഀഀ
          const url = localStorage.getItem("supabase_url");਍          挀漀渀猀琀 欀攀礀 㴀 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开欀攀礀∀⤀㬀ഀഀ
          const client = window.supabase.createClient(url, key);਍          挀氀椀攀渀琀⸀爀攀洀漀瘀攀䌀栀愀渀渀攀氀⠀挀栀愀渀渀攀氀⤀㬀ഀഀ
          console.log("Supabase Realtime subscription unsubscribed successfully.");਍        紀 挀愀琀挀栀 ⠀攀爀爀⤀ 笀ഀഀ
          console.error("Failed to clean up realtime channel:", err);਍        紀ഀഀ
      }਍    紀㬀ഀഀ
  }, [dbConnected]);਍ഀഀ
  // Handle saving and testing Supabase configuration਍  挀漀渀猀琀 栀愀渀搀氀攀匀愀瘀攀䐀戀䌀漀渀昀椀最 㴀 愀猀礀渀挀 ⠀攀⤀ 㴀㸀 笀ഀഀ
    e.preventDefault();਍    椀昀 ⠀℀搀戀唀爀氀⸀琀爀椀洀⠀⤀ 簀簀 ℀搀戀䬀攀礀⸀琀爀椀洀⠀⤀⤀ 笀ഀഀ
      localStorage.removeItem("supabase_url");਍      氀漀挀愀氀匀琀漀爀愀最攀⸀爀攀洀漀瘀攀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开欀攀礀∀⤀㬀ഀഀ
      setDbConnected(false);਍      猀攀琀匀栀漀眀䐀戀䌀漀渀昀椀最⠀昀愀氀猀攀⤀㬀ഀഀ
      return;਍    紀ഀഀ
਍    猀攀琀䐀戀䰀漀愀搀椀渀最⠀琀爀甀攀⤀㬀ഀഀ
    setDbError("");਍ഀഀ
    try {਍      ⼀⼀ 吀攀猀琀 琀栀攀 挀氀椀攀渀琀 挀漀渀渀攀挀琀椀漀渀ഀഀ
      const testClient = window.supabase.createClient(dbUrl.trim(), dbKey.trim());਍      挀漀渀猀琀 笀 攀爀爀漀爀 紀 㴀 愀眀愀椀琀 琀攀猀琀䌀氀椀攀渀琀⸀昀爀漀洀⠀∀瀀爀漀樀攀挀琀猀∀⤀⸀猀攀氀攀挀琀⠀∀椀搀∀⤀⸀氀椀洀椀琀⠀㄀⤀㬀ഀഀ
      ਍      椀昀 ⠀攀爀爀漀爀⤀ 琀栀爀漀眀 攀爀爀漀爀㬀ഀഀ
਍      ⼀⼀ 倀攀爀猀椀猀琀 琀漀 氀漀挀愀氀匀琀漀爀愀最攀ഀഀ
      localStorage.setItem("supabase_url", dbUrl.trim());਍      氀漀挀愀氀匀琀漀爀愀最攀⸀猀攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开欀攀礀∀Ⰰ 搀戀䬀攀礀⸀琀爀椀洀⠀⤀⤀㬀ഀഀ
      ਍      ⼀⼀ 䰀漀愀搀 愀挀琀甀愀氀 搀愀琀愀 愀渀搀 攀砀攀挀甀琀攀 琀栀攀 愀甀琀漀ⴀ猀攀攀搀攀爀Ⰰ 氀攀琀琀椀渀最 攀爀爀漀爀猀 瀀爀漀瀀愀最愀琀攀ഀഀ
      await fetchSupabaseData(true);਍      ഀഀ
      // Only set success status and close the drawer on complete success!਍      猀攀琀䐀戀䌀漀渀渀攀挀琀攀搀⠀琀爀甀攀⤀㬀ഀഀ
      setShowDbConfig(false);਍    紀 挀愀琀挀栀 ⠀攀爀爀⤀ 笀ഀഀ
      console.error("Connection and seeding failed:", err);਍      猀攀琀䐀戀䔀爀爀漀爀⠀攀爀爀⸀洀攀猀猀愀最攀 簀簀 ∀䌀漀渀渀攀挀琀椀漀渀 昀愀椀氀攀搀⸀ 倀氀攀愀猀攀 挀栀攀挀欀 唀刀䰀 ⼀ 䄀渀漀渀 䬀攀礀 愀渀搀 搀愀琀愀戀愀猀攀 琀愀戀氀攀猀⸀∀⤀㬀ഀഀ
      setDbConnected(false);਍    紀 昀椀渀愀氀氀礀 笀ഀഀ
      setDbLoading(false);਍    紀ഀഀ
  };਍ഀഀ
  const handleForceSeed = async () => {਍    椀昀 ⠀℀眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⤀ 笀ഀഀ
      setDbError("Supabase client is not loaded in window.");਍      爀攀琀甀爀渀㬀ഀഀ
    }਍    挀漀渀猀琀 甀爀氀 㴀 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开甀爀氀∀⤀㬀ഀഀ
    const key = localStorage.getItem("supabase_key");਍    椀昀 ⠀℀甀爀氀 簀簀 ℀欀攀礀⤀ 笀ഀഀ
      setDbError("Please save a valid database connection first before seeding.");਍      爀攀琀甀爀渀㬀ഀഀ
    }਍ഀഀ
    setDbLoading(true);਍    猀攀琀䐀戀䔀爀爀漀爀⠀∀∀⤀㬀ഀഀ
਍    琀爀礀 笀ഀഀ
      const client = window.supabase.createClient(url, key);਍      挀漀渀猀漀氀攀⸀氀漀最⠀∀䘀漀爀挀攀 刀攀ⴀ猀攀攀搀㨀 䌀氀攀愀爀椀渀最 瀀爀漀樀攀挀琀猀 渀愀洀攀搀 ✀䌀刀䄀䘀吀ⴀ㈀　㈀㘀　㔀ⴀ　㄀✀⸀⸀⸀∀⤀㬀ഀഀ
      ਍      挀漀渀猀琀 笀 攀爀爀漀爀㨀 搀攀氀攀琀攀䔀爀爀 紀 㴀 愀眀愀椀琀 挀氀椀攀渀琀ഀഀ
        .from("projects")਍        ⸀搀攀氀攀琀攀⠀⤀ഀഀ
        .eq("name", "CRAFT-202605-01");਍        ഀഀ
      if (deleteErr) {਍        挀漀渀猀漀氀攀⸀眀愀爀渀⠀∀䐀攀氀攀琀攀 漀昀 瀀爀漀樀攀挀琀猀 昀愀椀氀攀搀 漀爀 爀攀琀甀爀渀攀搀 攀爀爀漀爀㨀∀Ⰰ 搀攀氀攀琀攀䔀爀爀⤀㬀ഀഀ
      }਍      ഀഀ
      console.log("Running cascading auto-seeding...");਍      愀眀愀椀琀 昀攀琀挀栀匀甀瀀愀戀愀猀攀䐀愀琀愀⠀琀爀甀攀⤀㬀ഀഀ
      setDbConnected(true);਍      挀漀渀猀漀氀攀⸀氀漀最⠀∀䘀漀爀挀攀 刀攀ⴀ猀攀攀搀 挀漀洀瀀氀攀琀攀搀 猀甀挀挀攀猀猀昀甀氀氀礀⸀∀⤀㬀ഀഀ
    } catch (err) {਍      挀漀渀猀漀氀攀⸀攀爀爀漀爀⠀∀䘀漀爀挀攀 刀攀ⴀ猀攀攀搀 昀愀椀氀攀搀㨀∀Ⰰ 攀爀爀⤀㬀ഀഀ
      setDbError("Force Re-seed failed: " + (err.message || err));਍    紀 昀椀渀愀氀氀礀 笀ഀഀ
      setDbLoading(false);਍    紀ഀഀ
  };਍ഀഀ
  const handleStageChange = async (index) => {਍    猀攀琀䌀甀爀爀攀渀琀匀琀愀最攀䤀渀搀攀砀⠀椀渀搀攀砀⤀㬀ഀഀ
    // Special trigger logic based on stage clicks to make prototype feel alive਍    椀昀 ⠀椀渀搀攀砀 㴀㴀㴀 㐀⤀ 笀 ⼀⼀ 匀琀愀最攀 㔀㨀 䌀爀椀戀 㔀 䌀栀攀挀欀ഀഀ
      setFabricCompatibilityTest("passed");਍      猀攀琀䤀猀䌀爀椀戀㔀䈀氀漀挀欀攀搀⠀昀愀氀猀攀⤀㬀ഀഀ
    } else if (index === 7) { // Stage 8: Cho Decision਍      猀攀琀䤀猀䈀椀搀搀椀渀最䐀漀渀攀⠀琀爀甀攀⤀㬀ഀഀ
    } else if (index === 14) { // Stage 15: Split Delivery and Strike out਍      琀爀椀最最攀爀匀瀀氀椀琀䐀攀氀椀瘀攀爀礀⠀⤀㬀ഀഀ
    }਍ഀഀ
    // Sync to Supabase if connected਍    椀昀 ⠀搀戀䌀漀渀渀攀挀琀攀搀 ☀☀ 漀爀搀攀爀⸀椀搀⤀ 笀ഀഀ
      try {਍        挀漀渀猀琀 挀氀椀攀渀琀 㴀 眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⸀挀爀攀愀琀攀䌀氀椀攀渀琀⠀氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开甀爀氀∀⤀Ⰰ 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开欀攀礀∀⤀⤀㬀ഀഀ
        const stageId = stages[index].id;਍        挀漀渀猀琀 挀甀爀爀攀渀琀匀琀愀最攀䤀渀琀 㴀 瀀愀爀猀攀䤀渀琀⠀猀琀愀最攀䤀搀⸀猀甀戀猀琀爀椀渀最⠀㄀⤀Ⰰ ㄀　⤀㬀ഀഀ
        await client.from("projects").update({ current_stage: currentStageInt }).eq("id", order.id);਍      紀 挀愀琀挀栀 ⠀攀爀爀⤀ 笀ഀഀ
        console.error("Supabase stage sync error:", err);਍      紀ഀഀ
    }਍  紀㬀ഀഀ
਍  挀漀渀猀琀 栀愀渀搀氀攀䰀愀渀最吀漀最最氀攀 㴀 ⠀⤀ 㴀㸀 笀ഀഀ
    setLang(lang === "Cn" ? "En" : "Cn");਍  紀㬀ഀഀ
਍  ⼀⼀ 匀椀洀甀氀愀琀椀渀最 甀猀攀爀 琀礀瀀椀渀最 椀渀 挀栀愀琀 眀椀渀搀漀眀ഀഀ
  const handleSendMessage = async () => {਍    椀昀 ⠀℀椀渀瀀甀琀吀攀砀琀⸀琀爀椀洀⠀⤀⤀ 爀攀琀甀爀渀㬀ഀഀ
    const newMsg = { sender: "client", text: inputText };਍    猀攀琀䌀栀愀琀䴀攀猀猀愀最攀猀⠀嬀⸀⸀⸀挀栀愀琀䴀攀猀猀愀最攀猀Ⰰ 渀攀眀䴀猀最崀⤀㬀ഀഀ
    setInputText("");਍ഀഀ
    // AI automated reply simulate਍    猀攀琀吀椀洀攀漀甀琀⠀愀猀礀渀挀 ⠀⤀ 㴀㸀 笀ഀഀ
      let replyText = "";਍      椀昀 ⠀氀愀渀最 㴀㴀㴀 ∀䌀渀∀⤀ 笀ഀഀ
        replyText = "뿯붿怬penClaw 鏅붿兘붿╃뿯悽뿯붿? 뿯붿뿯붿뿯垽붿佹뿯垽뿯妽붿湪뿯璽뿯冽彇 Supabase 뿯붿版嵁搴뿯撽尮뿯붿뿯嶽偍붿뿯劽渶뿯妽뿯傽뿯₽?;਍      紀 攀氀猀攀 笀ഀഀ
        replyText = "[OpenClaw AI Assistant]: Received! I am pulling data from Supabase to match your design request.";਍      紀ഀഀ
਍      椀昀 ⠀椀渀瀀甀琀吀攀砀琀⸀琀漀䰀漀眀攀爀䌀愀猀攀⠀⤀⸀椀渀挀氀甀搀攀猀⠀∀猀椀氀欀∀⤀ 簀簀 椀渀瀀甀琀吀攀砀琀⸀琀漀䰀漀眀攀爀䌀愀猀攀⠀⤀⸀椀渀挀氀甀搀攀猀⠀∀붿붿卯≨⤀⤀ 笀ഀഀ
        // Trigger blocking scenario!਍        猀攀琀䘀愀戀爀椀挀䌀漀洀瀀愀琀椀戀椀氀椀琀礀吀攀猀琀⠀∀戀氀漀挀欀攀搀∀⤀㬀ഀഀ
        setIsCrib5Blocked(true);਍        椀昀 ⠀氀愀渀最 㴀㴀㴀 ∀䌀渀∀⤀ 笀ഀഀ
          replyText = "붿뿯犽笍뿯붿愬뿯悽瑙뿯劽鎶?/ BANNED뿯붿? 뿯妽뿯₽娴嬪뿯垽뿯붿ㄩ뿯₽夐뿯₽夌敤붿뿯溽뿯冽뿯涽뿯澽桓缂뿯庽뿯₽뿯澽뿯₽뿯傽뿯媽붿?(Crib 5) 闃붿伀闃붿噧瑙뿯劽畾뿯纽佹붿灏뿯喽笣缁歌繘琛屽뿯宽瀛붿뿯榽붿뿯붿浘灞뿯傽붿붿뿯喽紙浼氬뿯붿붿뿯羽弗뿯붿뿯嶽缉뿯妽뿯羽笌붿樿뿯墽붿夈뿯₽뿯傽붿붿뿯暽뿯冽붿붿뿯妽뿯붿붿뿯垽뿯붿佸畾뿯붿뿯傽뿯붿鏇存崲뿯涽붿簹楹?(Linen) 뿯붿栫뿯殽뿯璽?(Leather)붿?;਍        紀 攀氀猀攀 笀ഀഀ
          replyText = "붿뿯犽笍 [COMPLIANCE ALERT / BANNED]: You selected Pure Silk Satin. UK Crib 5 fire codes prohibit flame coating on delicate silks (causes extreme shrinkage & discoloration). Order has been BLOCKED. Please select Linen or Leather!";਍        紀ഀഀ
        // Force process stage to S05 for demonstration਍        猀攀琀䌀甀爀爀攀渀琀匀琀愀最攀䤀渀搀攀砀⠀㐀⤀㬀 ഀഀ
        ਍        椀昀 ⠀搀戀䌀漀渀渀攀挀琀攀搀 ☀☀ 漀爀搀攀爀⸀椀搀⤀ 笀ഀഀ
          try {਍            挀漀渀猀琀 挀氀椀攀渀琀 㴀 眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⸀挀爀攀愀琀攀䌀氀椀攀渀琀⠀氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开甀爀氀∀⤀Ⰰ 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开欀攀礀∀⤀⤀㬀ഀഀ
            await client.from("projects").update({ ਍              挀甀爀爀攀渀琀开猀琀愀最攀㨀 㔀Ⰰഀഀ
              selected_fabric: "FAB-03",਍              椀猀开挀爀椀戀㔀开戀氀漀挀欀攀搀㨀 琀爀甀攀Ⰰഀഀ
              fabric_compatibility_test: "blocked"਍            紀⤀⸀攀焀⠀∀椀搀∀Ⰰ 漀爀搀攀爀⸀椀搀⤀㬀ഀഀ
          } catch (err) {਍            挀漀渀猀漀氀攀⸀攀爀爀漀爀⠀∀匀甀瀀愀戀愀猀攀 猀椀氀欀 戀氀漀挀欀 甀瀀搀愀琀攀 攀爀爀漀爀㨀∀Ⰰ 攀爀爀⤀㬀ഀഀ
          }਍        紀ഀഀ
      }਍ഀഀ
      setChatMessages(prev => [...prev, { sender: "agent", text: replyText }]);਍    紀Ⰰ ㄀㈀　　⤀㬀ഀഀ
  };਍ഀഀ
  // Simulate Cho's review check-off in S04਍  挀漀渀猀琀 栀愀渀搀氀攀䌀栀漀䄀瀀瀀爀漀瘀愀氀 㴀 愀猀礀渀挀 ⠀⤀ 㴀㸀 笀ഀഀ
    const nextIndex = currentStageIndex + 1;਍    猀攀琀䌀甀爀爀攀渀琀匀琀愀最攀䤀渀搀攀砀⠀渀攀砀琀䤀渀搀攀砀⤀㬀ഀഀ
     addLog("Cho", "뿯붿뿯₽鏈붿붿鏍뿯붿뿯劽붿਍佖䴀㔀䉰猥붿뿯㚽붿᭎뿯붿噜婥뿯붿붿⽪붿붿㼠Ⰰ ∀吀攀挀栀渀椀挀愀氀 猀瀀攀挀椀昀椀挀愀琀椀漀渀猀 愀渀搀 䈀伀䴀 愀瀀瀀爀漀瘀攀搀Ⰰ 猀椀最渀愀琀甀爀攀 爀攀氀攀愀猀攀搀⸀∀⤀㬀ഀഀ
਍    椀昀 ⠀搀戀䌀漀渀渀攀挀琀攀搀 ☀☀ 漀爀搀攀爀⸀椀搀⤀ 笀ഀഀ
      try {਍        挀漀渀猀琀 挀氀椀攀渀琀 㴀 眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⸀挀爀攀愀琀攀䌀氀椀攀渀琀⠀氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开甀爀氀∀⤀Ⰰ 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开欀攀礀∀⤀⤀㬀ഀഀ
        const nextStageId = stages[nextIndex].id;਍        挀漀渀猀琀 渀攀砀琀匀琀愀最攀䤀渀琀 㴀 瀀愀爀猀攀䤀渀琀⠀渀攀砀琀匀琀愀最攀䤀搀⸀猀甀戀猀琀爀椀渀最⠀㄀⤀Ⰰ ㄀　⤀㬀ഀഀ
        await client.from("projects").update({ current_stage: nextStageInt }).eq("id", order.id);਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀愀最攀渀琀开氀漀最猀∀⤀⸀椀渀猀攀爀琀⠀笀ഀഀ
          project_id: order.id,਍          漀瀀攀爀愀琀漀爀㨀 ∀䌀栀漀∀Ⰰഀഀ
          action_desc_cn: "뿯붿뿯₽鏈붿붿鏍뿯붿뿯劽붿਍佖䴀㔀䉰猥붿뿯㚽붿᭎뿯붿噜婥뿯붿붿⽪붿붿㼠Ⰰഀഀ
          action_desc_en: "Tech specifications and BOM approved, signed off."਍        紀⤀㬀ഀഀ
      } catch (err) {਍        挀漀渀猀漀氀攀⸀攀爀爀漀爀⠀∀匀甀瀀愀戀愀猀攀 甀瀀搀愀琀攀 攀爀爀漀爀㨀∀Ⰰ 攀爀爀⤀㬀ഀഀ
      }਍    紀ഀഀ
  };਍ഀഀ
  // Simulate Crib 5 Override to bypass block਍  挀漀渀猀琀 栀愀渀搀氀攀䈀礀瀀愀猀猀䌀爀椀戀㔀 㴀 愀猀礀渀挀 ⠀昀愀戀爀椀挀䌀漀搀攀⤀ 㴀㸀 笀ഀഀ
    setFabricCompatibilityTest("passed");਍    猀攀琀䤀猀䌀爀椀戀㔀䈀氀漀挀欀攀搀⠀昀愀氀猀攀⤀㬀ഀഀ
    setCurrentStageIndex(5); // Move to next stage S06਍    愀搀搀䰀漀最⠀∀䌀栀漀∀Ⰰ 怀붿붿뿯粽ᝥ뿯䊽붿婧뿯⎽䥘뿯ᮽ뿯ⶽ孬붿뿯Ⓗ瀲쉯ຓὫ뿯₽␀笀昀愀戀爀椀挀䌀漀搀攀紀 ⠀㐀붿坜붿뿯붿㥯祼㽩ᬀ뿯纽붿呗뿯붿붿㌠䍬⁾䌀爀椀戀 㔀 㤀൰夊뿯厽뿯붿붿뿯垽闂ㄧ뿯銆뿯侽, `Modified material compliance: Swapped fabric to ${fabricCode} (Navy Classic Linen), successfully passing the Crib 5 safety compliance gate.`);਍ഀഀ
    if (dbConnected && order.id) {਍      琀爀礀 笀ഀഀ
        const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀瀀爀漀樀攀挀琀猀∀⤀⸀甀瀀搀愀琀攀⠀笀 ഀഀ
          current_stage: 6,਍          猀攀氀攀挀琀攀搀开昀愀戀爀椀挀㨀 ∀䘀䄀䈀ⴀ　㈀∀Ⰰഀഀ
          is_crib5_blocked: false,਍          昀愀戀爀椀挀开挀漀洀瀀愀琀椀戀椀氀椀琀礀开琀攀猀琀㨀 ∀瀀愀猀猀攀搀∀ഀഀ
        }).eq("id", order.id);਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀愀最攀渀琀开氀漀最猀∀⤀⸀椀渀猀攀爀琀⠀笀ഀഀ
          project_id: order.id,਍          漀瀀攀爀愀琀漀爀㨀 ∀䌀栀漀∀Ⰰഀഀ
          action_desc_cn: `뿯涽뿯붿敼붿╂뿯枽붿堣붿붿氭浛뿯붿㈤潰鏂欎붿 ${fabricCode} (娴뿯岽啗뿯붿뿯澽簹楹?붿屾뿯垽붿뿯熽뿯₽氳繃 Crib 5 瀹਍붿붿뿯㶽뿯붿쉗➕붿蛦붿ⱏഀഀ
          action_desc_en: `Bypassed Crib 5: Changed fabric to ${fabricCode} (Navy Classic Linen), successfully overriding gate.`਍        紀⤀㬀ഀഀ
      } catch (err) {਍        挀漀渀猀漀氀攀⸀攀爀爀漀爀⠀∀匀甀瀀愀戀愀猀攀 甀瀀搀愀琀攀 攀爀爀漀爀㨀∀Ⰰ 攀爀爀⤀㬀ഀഀ
      }਍    紀ഀഀ
  };਍ഀഀ
  // Simulate Cho picking Foshan Gold-Sun in S08਍  挀漀渀猀琀 栀愀渀搀氀攀匀攀氀攀挀琀匀甀瀀瀀氀椀攀爀 㴀 愀猀礀渀挀 ⠀猀甀瀀瀀氀椀攀爀⤀ 㴀㸀 笀ഀഀ
    setSelectedSupplier(supplier);਍    猀攀琀䤀猀䈀椀搀搀椀渀最䐀漀渀攀⠀琀爀甀攀⤀㬀ഀഀ
    ਍    ⼀⼀ 唀瀀搀愀琀攀 䴀愀猀琀攀爀 漀爀搀攀爀 瘀愀氀甀攀猀ഀഀ
    const updatedItems = order.items.map(item => {਍      椀昀 ⠀椀琀攀洀⸀琀礀瀀攀䔀渀 㴀㴀㴀 ∀䰀漀戀戀礀 䄀爀洀挀栀愀椀爀∀ 簀簀 椀琀攀洀⸀琀礀瀀攀䔀渀 㴀㴀㴀 ∀嘀䤀倀 䌀氀甀戀 䌀栀愀椀爀∀⤀ 笀ഀഀ
        return { ...item, unitPrice: supplier.pricePerChair };਍      紀ഀഀ
      return item;਍    紀⤀㬀ഀഀ
਍    挀漀渀猀琀 甀瀀搀愀琀攀搀倀愀礀洀攀渀琀猀 㴀 漀爀搀攀爀⸀瀀愀礀洀攀渀琀猀⸀洀愀瀀⠀瀀愀礀洀攀渀琀 㴀㸀 笀ഀഀ
      if (payment.milestone.includes("50%")) {਍        爀攀琀甀爀渀 笀 ⸀⸀⸀瀀愀礀洀攀渀琀Ⰰ 愀洀漀甀渀琀㨀 㤀㌀㔀　 紀㬀 ⼀⼀ 匀椀洀甀氀愀琀攀搀 瀀爀椀挀攀 爀攀挀愀氀挀甀氀愀琀椀漀渀ഀഀ
      }਍      爀攀琀甀爀渀 瀀愀礀洀攀渀琀㬀ഀഀ
    });਍ഀഀ
    setOrder(prev => ({ ...prev, items: updatedItems, payments: updatedPayments }));਍    愀搀搀䰀漀最⠀∀䌀栀漀∀Ⰰ 怀붿붿붿㥳繰붿붿뿯붿㙐Ů╿붿ഠ夊畾浠붿伐붿? ${supplier.name}붿屽ぇ붿뿯傽뿯墽뿯붿嬫붿붿뿯暽뿯玽鏍稿畾뿯涽?$${supplier.pricePerChair}/뿯붿娿뿯₽뿯侽, `Bidding completed. Selected final supplier: ${supplier.name}. Lobby armchair unit price approved at $${supplier.pricePerChair}/pc.`);਍    猀攀琀䌀甀爀爀攀渀琀匀琀愀最攀䤀渀搀攀砀⠀㠀⤀㬀 ⼀⼀ 䴀漀瘀攀 琀漀 瀀爀漀搀甀挀琀椀漀渀 猀琀愀最攀 匀　㤀ഀഀ
਍    椀昀 ⠀搀戀䌀漀渀渀攀挀琀攀搀 ☀☀ 漀爀搀攀爀⸀椀搀⤀ 笀ഀഀ
      try {਍        挀漀渀猀琀 挀氀椀攀渀琀 㴀 眀椀渀搀漀眀⸀猀甀瀀愀戀愀猀攀⸀挀爀攀愀琀攀䌀氀椀攀渀琀⠀氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开甀爀氀∀⤀Ⰰ 氀漀挀愀氀匀琀漀爀愀最攀⸀最攀琀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开欀攀礀∀⤀⤀㬀ഀഀ
        await client.from("projects").update({ ਍          挀甀爀爀攀渀琀开猀琀愀最攀㨀 㤀Ⰰഀഀ
          selected_supplier: supplier਍        紀⤀⸀攀焀⠀∀椀搀∀Ⰰ 漀爀搀攀爀⸀椀搀⤀㬀ഀഀ
        ਍        ⼀⼀ 唀瀀搀愀琀攀 猀瀀攀挀椀昀椀挀愀琀椀漀渀猀 椀渀 搀愀琀愀戀愀猀攀ഀഀ
        await client.from("specifications")਍          ⸀甀瀀搀愀琀攀⠀笀 甀渀椀琀开瀀爀椀挀攀㨀 猀甀瀀瀀氀椀攀爀⸀瀀爀椀挀攀倀攀爀䌀栀愀椀爀 紀⤀ഀഀ
          .eq("project_id", order.id)਍          ⸀椀渀⠀∀椀琀攀洀开琀礀瀀攀开攀渀∀Ⰰ 嬀∀䰀漀戀戀礀 䄀爀洀挀栀愀椀爀∀Ⰰ ∀嘀䤀倀 䌀氀甀戀 䌀栀愀椀爀∀崀⤀㬀ഀഀ
਍        ⼀⼀ 唀瀀搀愀琀攀 爀攀氀愀琀椀漀渀愀氀 瀀愀礀洀攀渀琀猀 猀挀栀攀搀甀氀攀 椀渀 搀愀琀愀戀愀猀攀ഀഀ
        await client.from("payments").update({ amount: 9350 }).eq("project_id", order.id).ilike("milestone_en", "%50% Deposit%");਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀瀀愀礀洀攀渀琀猀∀⤀⸀甀瀀搀愀琀攀⠀笀 愀洀漀甀渀琀㨀 㜀㐀㠀　 紀⤀⸀攀焀⠀∀瀀爀漀樀攀挀琀开椀搀∀Ⰰ 漀爀搀攀爀⸀椀搀⤀⸀椀氀椀欀攀⠀∀洀椀氀攀猀琀漀渀攀开攀渀∀Ⰰ ∀─㐀　─ 匀栀椀瀀瀀椀渀最─∀⤀㬀ഀഀ
        await client.from("payments").update({ amount: 1870 }).eq("project_id", order.id).ilike("milestone_en", "%10% Handover%");਍ഀഀ
        await client.from("agent_logs").insert({਍          瀀爀漀樀攀挀琀开椀搀㨀 漀爀搀攀爀⸀椀搀Ⰰഀഀ
          operator: "Cho",਍          愀挀琀椀漀渀开搀攀猀挀开挀渀㨀 怀붿붿붿㥳繰붿붿뿯붿㙐Ů╿붿ഠ夊畾浠붿伐붿? ${supplier.name}붿屽ぇ붿뿯傽뿯墽뿯붿嬫붿붿뿯暽뿯玽鏍稿畾뿯涽?$${supplier.pricePerChair}/뿯붿娿뿯₽뿯侽,਍          愀挀琀椀漀渀开搀攀猀挀开攀渀㨀 怀匀甀瀀瀀氀椀攀爀 戀椀搀搀椀渀最 昀椀渀愀氀椀稀攀搀⸀ 䘀愀挀琀漀爀礀 猀攀氀攀挀琀攀搀㨀 ␀笀猀甀瀀瀀氀椀攀爀⸀渀愀洀攀紀⸀ 䰀漀戀戀礀 䄀爀洀挀栀愀椀爀 猀攀琀 琀漀 ␀␀笀猀甀瀀瀀氀椀攀爀⸀瀀爀椀挀攀倀攀爀䌀栀愀椀爀紀⼀瀀挀⸀怀ഀഀ
        });਍      紀 挀愀琀挀栀 ⠀攀爀爀⤀ 笀ഀഀ
        console.error("Supabase update error:", err);਍      紀ഀഀ
    }਍  紀㬀ഀഀ
਍  ⼀⼀ 匀椀洀甀氀愀琀攀 䌀氀椀攀渀琀 匀瀀氀椀琀 䐀攀氀椀瘀攀爀礀 愀渀搀 匀琀爀椀欀攀 漀甀琀 ⠀匀㄀㔀⤀ഀഀ
  const triggerSplitDelivery = async () => {਍    猀攀琀匀瀀氀椀琀䐀攀氀椀瘀攀爀礀䄀挀琀椀瘀攀⠀琀爀甀攀⤀㬀ഀഀ
    const updatedItems = order.items.map(item => {਍      椀昀 ⠀椀琀攀洀⸀琀礀瀀攀䔀渀 㴀㴀㴀 ∀䰀漀戀戀礀 䄀爀洀挀栀愀椀爀∀⤀ 笀ഀഀ
        return { ...item, qty: 38, note: "뿯宽뿯掽뿯嚽娓? 38 뿯붿?/ 붿뿯犽笍 붿栨뿯禽: 2 뿯붿?(붿板뿯溽붿뿯掽뿯嚽鏍搁攢)" };਍      紀ഀഀ
      if (item.typeEn === "Custom Oak Coffee Table") {਍        爀攀琀甀爀渀 笀 ⸀⸀⸀椀琀攀洀Ⰰ 焀琀礀㨀 㐀Ⰰ 渀漀琀攀㨀 ∀붿붿붿ፗ㽚 㐀 붿㽛⼀ 㼀뿯붿൲⁻夀뿯⢽붿㩹 ㄀ 붿㽛⠀붿⁴붿붿붿붿붿ؠ㽚∀ 紀㬀ഀഀ
      }਍      爀攀琀甀爀渀 椀琀攀洀㬀ഀഀ
    });਍ഀഀ
    const updatedPayments = [਍      笀 洀椀氀攀猀琀漀渀攀㨀 ∀㔀　─ 䐀攀瀀漀猀椀琀 ⠀붿浛뿯붿⥼∀Ⰰ 愀洀漀甀渀琀㨀 ㄀　㐀㔀　Ⰰ 搀愀琀攀㨀 ∀㈀　㈀㘀ⴀ　㔀ⴀ㈀㔀∀Ⰰ 猀琀愀琀甀猀㨀 ∀倀愀椀搀∀ 紀Ⰰഀഀ
      { milestone: "40% Shipping Release (붿붿뿯掽뿯涽붿뿯붿)", amount: 7860, date: "2026-05-25", status: "Paid" },਍      笀 洀椀氀攀猀琀漀渀攀㨀 ∀㄀　─ 刀攀挀愀氀挀甀氀愀琀攀搀 䈀愀氀愀渀挀攀 ⠀伀붿붿뿯劽뿯붿붿붿뿯붿筝⥵∀Ⰰ 愀洀漀甀渀琀㨀 㐀㜀　Ⰰ 搀愀琀攀㨀 ∀倀攀渀搀椀渀最∀Ⰰ 猀琀愀琀甀猀㨀 ∀倀攀渀搀椀渀最∀ 紀ഀഀ
    ];਍ഀഀ
    setOrder(prev => ({ ...prev, items: updatedItems, payments: updatedPayments }));਍    愀搀搀䰀漀最⠀∀䌀氀椀攀渀琀∀Ⰰ ∀ᴀ뿯붿池奲뿯붿붿뿯ᮽ뿯ⲽᱬ㥭ⅰ붿붿;뿯붿뿯ᶽ뿯붿池붿䉴붿᭚뿯綽䝜ᅟ㽚붿뿯䎽붿붿뿯⮽⩛뿯碽뿯㾽붿䍛⩏兜뿯붿붿붿붿啦뿯붿붿붿㍾붿啵뿯ኽ붿啖뿯붿硦붿䭾ᵩŽ㭩붿뿯宽뿯厽牳뿯붿붿洿鏂붿뿯₽?, "On-site feedback: Due to site changes, 2 armchairs and 1 coffee table were canceled. Initiated automatic strike-through financial recalculation; remaining balance updated.");਍ഀഀ
    if (dbConnected && order.id) {਍      琀爀礀 笀ഀഀ
        const client = window.supabase.createClient(localStorage.getItem("supabase_url"), localStorage.getItem("supabase_key"));਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀瀀爀漀樀攀挀琀猀∀⤀⸀甀瀀搀愀琀攀⠀笀 猀瀀氀椀琀开搀攀氀椀瘀攀爀礀开愀挀琀椀瘀攀㨀 琀爀甀攀 紀⤀⸀攀焀⠀∀椀搀∀Ⰰ 漀爀搀攀爀⸀椀搀⤀㬀ഀഀ
        ਍        ⼀⼀ 唀瀀搀愀琀攀 猀瀀攀挀椀昀椀挀愀琀椀漀渀猀 焀甀愀渀琀椀琀椀攀猀 愀渀搀 渀漀琀攀猀 椀渀 搀愀琀愀戀愀猀攀ഀഀ
        await client.from("specifications")਍          ⸀甀瀀搀愀琀攀⠀笀 ഀഀ
            quantity: 38, ਍            渀漀琀攀猀开挀渀㨀 ∀붿붿붿ፖ㽚 ㌀㠀 붿뿯㾽⼀ 㼀뿯붿൲⁻夀뿯⢽붿㩹 ㈀ 붿뿯㾽⠀ᰀ뿯羽붿剮뿯붿붿쵖Ɠ≤⥥∀Ⰰഀഀ
            notes_en: "Shipped: 38 pcs / 붿뿯犽笍 Cancelled: 2 pcs (site strike-through)"਍          紀⤀ഀഀ
          .eq("project_id", order.id)਍          ⸀攀焀⠀∀椀琀攀洀开琀礀瀀攀开攀渀∀Ⰰ ∀䰀漀戀戀礀 䄀爀洀挀栀愀椀爀∀⤀㬀ഀഀ
          ਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀猀瀀攀挀椀昀椀挀愀琀椀漀渀猀∀⤀ഀഀ
          .update({ ਍            焀甀愀渀琀椀琀礀㨀 㐀Ⰰ ഀഀ
            notes_cn: "뿯宽뿯掽뿯垽娓? 4 뿯宽?/ 붿뿯犽笍 붿栨뿯禽: 1 뿯宽?(뿯璽㈠뿯妽뿯宽뿯枽뿯₽뿯₽娆?",਍            渀漀琀攀猀开攀渀㨀 ∀䄀爀爀椀瘀攀搀㨀 㐀 瀀挀猀 ⼀ 㼀뿯붿൲⁻䌀愀渀挀攀氀氀攀搀㨀 ㄀ 瀀挀 ⠀爀攀昀甀渀搀攀搀⤀∀ഀഀ
          })਍          ⸀攀焀⠀∀瀀爀漀樀攀挀琀开椀搀∀Ⰰ 漀爀搀攀爀⸀椀搀⤀ഀഀ
          .eq("item_type_en", "Custom Oak Coffee Table");਍ഀഀ
        // Recalculate payments directly in the database਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀瀀愀礀洀攀渀琀猀∀⤀⸀甀瀀搀愀琀攀⠀笀 愀洀漀甀渀琀㨀 ㄀　㐀㔀　Ⰰ 猀琀愀琀甀猀㨀 ∀倀愀椀搀∀Ⰰ 瀀愀礀洀攀渀琀开搀愀琀攀㨀 ∀㈀　㈀㘀ⴀ　㔀ⴀ㈀㔀∀ 紀⤀⸀攀焀⠀∀瀀爀漀樀攀挀琀开椀搀∀Ⰰ 漀爀搀攀爀⸀椀搀⤀⸀椀氀椀欀攀⠀∀洀椀氀攀猀琀漀渀攀开攀渀∀Ⰰ ∀─㔀　─ 䐀攀瀀漀猀椀琀─∀⤀㬀ഀഀ
        await client.from("payments").update({ amount: 7860, status: "Paid", payment_date: "2026-05-25" }).eq("project_id", order.id).ilike("milestone_en", "%40% Shipping%");਍        愀眀愀椀琀 挀氀椀攀渀琀⸀昀爀漀洀⠀∀瀀愀礀洀攀渀琀猀∀⤀⸀甀瀀搀愀琀攀⠀笀 ഀഀ
          milestone_cn: "10% 灏뿯炽뿯붿붿뿯掽뿯嚽뿯붿뿯嶽畻 (鏈붿牳뿯붿뿯₽)",਍          洀椀氀攀猀琀漀渀攀开攀渀㨀 ∀㄀　─ 刀攀挀愀氀挀甀氀愀琀攀搀 䈀愀氀愀渀挀攀 ⠀倀攀渀搀椀渀最⤀∀Ⰰഀഀ
          amount: 470,਍          猀琀愀琀甀猀㨀 ∀倀攀渀搀椀渀最∀ഀഀ
        }).eq("project_id", order.id).ilike("milestone_en", "%10% Handover%");਍ഀഀ
        await client.from("agent_logs").insert({਍          瀀爀漀樀攀挀琀开椀搀㨀 漀爀搀攀爀⸀椀搀Ⰰഀഀ
          operator: "Client",਍          愀挀琀椀漀渀开搀攀猀挀开挀渀㨀 ∀ᴀ뿯붿池奲뿯붿붿뿯ᮽ뿯ⲽᱬ㥭ⅰ붿붿;뿯붿뿯ᶽ뿯붿池붿䉴붿᭚뿯綽䝜ᅟ㽚붿뿯䎽붿붿뿯⮽⩛뿯碽뿯㾽붿䍛⩏兜뿯붿붿붿붿啦뿯붿붿붿㍾붿啵뿯ኽ붿啖뿯붿硦붿䭾ᵩŽ㭩붿뿯宽뿯厽牳뿯붿붿洿鏂붿뿯₽?,਍          愀挀琀椀漀渀开搀攀猀挀开攀渀㨀 ∀匀椀琀攀 昀攀攀搀戀愀挀欀㨀 䌀愀渀挀攀氀氀攀搀 ㈀ 䄀爀洀挀栀愀椀爀猀 ☀ ㄀ 吀愀戀氀攀 搀甀攀 琀漀 昀椀琀漀甀琀 挀栀愀渀最攀猀⸀ 䄀甀琀漀 猀琀爀椀欀攀ⴀ琀栀爀漀甀最栀 爀攀挀愀氀挀甀氀愀琀椀漀渀 椀渀椀琀椀愀琀攀搀⸀∀ഀഀ
        });਍      紀 挀愀琀挀栀 ⠀攀爀爀⤀ 笀ഀഀ
        console.error("Supabase update error:", err);਍      紀ഀഀ
    }਍  紀㬀ഀഀ
਍  挀漀渀猀琀 愀搀搀䰀漀最 㴀 ⠀甀猀攀爀Ⰰ 愀挀琀椀漀渀䌀渀Ⰰ 愀挀琀椀漀渀䔀渀⤀ 㴀㸀 笀ഀഀ
    const time = new Date().toLocaleTimeString();਍    猀攀琀䰀漀最猀⠀瀀爀攀瘀 㴀㸀 嬀笀 ഀഀ
      time: `2026-05-25 ${time}`, ਍      甀猀攀爀Ⰰ ഀഀ
      action: actionCn, ਍      愀挀琀椀漀渀䔀渀㨀 愀挀琀椀漀渀䔀渀 簀簀 愀挀琀椀漀渀䌀渀 ഀഀ
    }, ...prev]);਍  紀㬀ഀഀ
਍  ⼀⼀ 䌀愀氀挀甀氀愀琀攀 漀爀搀攀爀 琀漀琀愀氀ഀഀ
  const getOrderTotal = () => {਍    爀攀琀甀爀渀 漀爀搀攀爀⸀椀琀攀洀猀⸀爀攀搀甀挀攀⠀⠀愀挀挀Ⰰ 椀琀攀洀⤀ 㴀㸀 愀挀挀 ⬀ ⠀椀琀攀洀⸀甀渀椀琀倀爀椀挀攀 ⨀ 椀琀攀洀⸀焀琀礀⤀Ⰰ 　⤀㬀ഀഀ
  };਍ഀഀ
  return (਍    㰀搀椀瘀㸀ഀഀ
      {/* Supabase Connection Drawer */}਍      笀猀栀漀眀䐀戀䌀漀渀昀椀最 ☀☀ ⠀ഀഀ
        <div className="animate-fade-in" style={{਍          戀愀挀欀最爀漀甀渀搀㨀 ∀⌀䘀䘀䘀䘀䘀䘀∀Ⰰഀഀ
          borderBottom: "1px solid var(--glass-border)",਍          瀀愀搀搀椀渀最㨀 ∀㈀⸀㔀爀攀洀 ㈀爀攀洀∀Ⰰഀഀ
          position: "relative",਍          稀䤀渀搀攀砀㨀 ㄀　　　Ⰰഀഀ
          boxShadow: "0 10px 30px rgba(28,27,24,0.05)"਍        紀紀㸀ഀഀ
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>਍            㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ∀昀氀攀砀∀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ∀猀瀀愀挀攀ⴀ戀攀琀眀攀攀渀∀Ⰰ 愀氀椀最渀䤀琀攀洀猀㨀 ∀挀攀渀琀攀爀∀Ⰰ 洀愀爀最椀渀䈀漀琀琀漀洀㨀 ∀㄀⸀㔀爀攀洀∀ 紀紀㸀ഀഀ
              <h3 style={{ fontFamily: "var(--font-tech)", color: "var(--text-primary)", margin: 0 }}>਍                붿뿯㊽⁥匀甀瀀愀戀愀猀攀 㔀㵰뿯붿붿뿯䪽乔㑤붿뿯₽붿帴 (Live Database Sync)਍              㰀⼀栀㌀㸀ഀഀ
              <button ਍                漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 猀攀琀匀栀漀眀䐀戀䌀漀渀昀椀最⠀昀愀氀猀攀⤀紀ഀഀ
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.2rem" }}਍              㸀ഀഀ
                붿?              </button>਍            㰀⼀搀椀瘀㸀ഀഀ
            ਍            㰀瀀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ∀　⸀㠀㔀爀攀洀∀Ⰰ 挀漀氀漀爀㨀 ∀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀∀Ⰰ 洀愀爀最椀渀䈀漀琀琀漀洀㨀 ∀㄀⸀㔀爀攀洀∀Ⰰ 氀椀渀攀䠀攀椀最栀琀㨀 ∀㄀⸀㘀∀ 紀紀㸀ഀഀ
              {lang === "Cn" ਍                㼀 ∀붿뿯䚽뿯㒽剞뿯䢽䵲⡐뿯㾽匀甀瀀愀戀愀猀攀 㔀㵰뿯붿왪붿붿붿뿯ⲽ蚗뿯붿붿뿯붿幾붿⥶뿯墽㑛붿㽛瀀爀漀樀攀挀琀猀Ⰰ 猀瀀攀挀椀昀椀挀愀琀椀漀渀猀 尀뿯㾽愀最攀渀琀开氀漀最猀 붿뿯䪽乔᭤⑴儱뿯붿붿夠뿯➽붿㕢㵰뿯붿㕪붿뿯붿붿뿯䪽乔붿뿯붿붿뿯쮽붿붿붿뿯㚽ᵛ佽붿붿왒璕붿붿Ȿ붿졗뿯璽붿͙搡붿뿯䪽乔붿뿯㾽ഀഀ
                : "Connect to your live Supabase cloud database. The prototype will dynamically read and write records to your projects, specifications, and agent_logs tables. Falls back to local mockup data if disconnected."}਍            㰀⼀瀀㸀ഀഀ
਍            㰀昀漀爀洀 漀渀匀甀戀洀椀琀㴀笀栀愀渀搀氀攀匀愀瘀攀䐀戀䌀漀渀昀椀最紀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ∀昀氀攀砀∀Ⰰ 昀氀攀砀䐀椀爀攀挀琀椀漀渀㨀 ∀挀漀氀甀洀渀∀Ⰰ 最愀瀀㨀 ∀㄀⸀㈀爀攀洀∀ 紀紀㸀ഀഀ
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>਍                㰀氀愀戀攀氀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ∀　⸀㜀㔀爀攀洀∀Ⰰ 挀漀氀漀爀㨀 ∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ挀礀愀渀⤀∀Ⰰ 昀漀渀琀䘀愀洀椀氀礀㨀 ∀瘀愀爀⠀ⴀⴀ昀漀渀琀ⴀ琀攀挀栀⤀∀Ⰰ 氀攀琀琀攀爀匀瀀愀挀椀渀最㨀 ∀㄀瀀砀∀ 紀紀㸀匀唀倀䄀䈀䄀匀䔀 倀刀伀䨀䔀䌀吀 唀刀䰀㰀⼀氀愀戀攀氀㸀ഀഀ
                <input ਍                  琀礀瀀攀㴀∀琀攀砀琀∀ ഀഀ
                  className="chat-input" ਍                  瀀氀愀挀攀栀漀氀搀攀爀㴀∀栀琀琀瀀猀㨀⼀⼀礀漀甀爀ⴀ瀀爀漀樀攀挀琀ⴀ椀搀⸀猀甀瀀愀戀愀猀攀⸀挀漀∀ ഀഀ
                  value={dbUrl} ਍                  漀渀䌀栀愀渀最攀㴀笀⠀攀⤀ 㴀㸀 猀攀琀䐀戀唀爀氀⠀攀⸀琀愀爀最攀琀⸀瘀愀氀甀攀⤀紀ഀഀ
                  style={{ width: "100%", background: "#FFFFFF", padding: "0.6rem", border: "1px solid var(--glass-border)", color: "var(--text-primary)", borderRadius: "2px" }}਍                ⼀㸀ഀഀ
              </div>਍ഀഀ
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>਍                㰀氀愀戀攀氀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ∀　⸀㜀㔀爀攀洀∀Ⰰ 挀漀氀漀爀㨀 ∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ挀礀愀渀⤀∀Ⰰ 昀漀渀琀䘀愀洀椀氀礀㨀 ∀瘀愀爀⠀ⴀⴀ昀漀渀琀ⴀ琀攀挀栀⤀∀Ⰰ 氀攀琀琀攀爀匀瀀愀挀椀渀最㨀 ∀㄀瀀砀∀ 紀紀㸀匀唀倀䄀䈀䄀匀䔀 䄀一伀一 䬀䔀夀㰀⼀氀愀戀攀氀㸀ഀഀ
                <input ਍                  琀礀瀀攀㴀∀瀀愀猀猀眀漀爀搀∀ ഀഀ
                  className="chat-input" ਍                  瀀氀愀挀攀栀漀氀搀攀爀㴀∀攀礀䨀栀戀䜀挀椀伀椀䨀䤀唀稀䤀㄀一椀䤀猀䤀渀刀㔀挀䌀䤀㘀䤀欀瀀堀嘀䌀䨀㤀⸀⸀⸀∀ ഀഀ
                  value={dbKey} ਍                  漀渀䌀栀愀渀最攀㴀笀⠀攀⤀ 㴀㸀 猀攀琀䐀戀䬀攀礀⠀攀⸀琀愀爀最攀琀⸀瘀愀氀甀攀⤀紀ഀഀ
                  style={{ width: "100%", background: "#FFFFFF", padding: "0.6rem", border: "1px solid var(--glass-border)", color: "var(--text-primary)", borderRadius: "2px" }}਍                ⼀㸀ഀഀ
              </div>਍ഀഀ
              {dbError && (਍                㰀搀椀瘀 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ爀攀搀⤀∀Ⰰ 昀漀渀琀匀椀稀攀㨀 ∀　⸀㠀爀攀洀∀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ∀爀最戀愀⠀㈀㔀㔀Ⰰ 㜀㘀Ⰰ 㜀㘀Ⰰ 　⸀　㠀⤀∀Ⰰ 瀀愀搀搀椀渀最㨀 ∀　⸀㠀爀攀洀∀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ∀㘀瀀砀∀Ⰰ 戀漀爀搀攀爀㨀 ∀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ爀攀搀⤀∀Ⰰ 昀漀渀琀䘀愀洀椀氀礀㨀 ∀瘀愀爀⠀ⴀⴀ昀漀渀琀ⴀ琀攀挀栀⤀∀ 紀紀㸀ഀഀ
                  붿뿯犽笍 ERROR: {dbError}਍                㰀⼀搀椀瘀㸀ഀഀ
              )}਍ഀഀ
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>਍                㰀戀甀琀琀漀渀 琀礀瀀攀㴀∀猀甀戀洀椀琀∀ 挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ瀀爀攀洀椀甀洀∀ 搀椀猀愀戀氀攀搀㴀笀搀戀䰀漀愀搀椀渀最紀 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ∀　⸀㘀爀攀洀 ㄀⸀㔀爀攀洀∀ 紀紀㸀ഀഀ
                  {dbLoading ? "Testing..." : "Save & Sync Live Database"}਍                㰀⼀戀甀琀琀漀渀㸀ഀഀ
                {dbConnected && (਍                  㰀㸀ഀഀ
                    <button ਍                      琀礀瀀攀㴀∀戀甀琀琀漀渀∀ ഀഀ
                      className="btn-premium" ਍                      猀琀礀氀攀㴀笀笀 ഀഀ
                        background: "linear-gradient(135deg, var(--accent-orange) 0%, #B8836C 100%)", ਍                        戀漀爀搀攀爀䌀漀氀漀爀㨀 ∀琀爀愀渀猀瀀愀爀攀渀琀∀Ⰰഀഀ
                        color: "white", ਍                        瀀愀搀搀椀渀最㨀 ∀　⸀㘀爀攀洀 ㄀⸀㔀爀攀洀∀ ഀഀ
                      }}਍                      漀渀䌀氀椀挀欀㴀笀栀愀渀搀氀攀䘀漀爀挀攀匀攀攀搀紀ഀഀ
                      disabled={dbLoading}਍                    㸀ഀഀ
                      {dbLoading ? (lang === "Cn" ? "铏뿯暽뿯悽뿯涽?.." : "Processing...") : (lang === "Cn" ? "붿★笍 뿯宽뿯岽뿯垽뿯붿뿯嶽뿯枽뿯붿붿뿯½뿯붿告摎" : "붿★笍 Force Re-Seed Database")}਍                    㰀⼀戀甀琀琀漀渀㸀ഀഀ
                    <button ਍                      琀礀瀀攀㴀∀戀甀琀琀漀渀∀ ഀഀ
                      className="btn-secondary" ਍                      猀琀礀氀攀㴀笀笀 戀漀爀搀攀爀䌀漀氀漀爀㨀 ∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ爀攀搀⤀∀Ⰰ 挀漀氀漀爀㨀 ∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ爀攀搀⤀∀Ⰰ 瀀愀搀搀椀渀最㨀 ∀　⸀㘀爀攀洀 ㄀⸀㔀爀攀洀∀ 紀紀ഀഀ
                      onClick={() => {਍                        猀攀琀䐀戀唀爀氀⠀∀∀⤀㬀ഀഀ
                        setDbKey("");਍                        氀漀挀愀氀匀琀漀爀愀最攀⸀爀攀洀漀瘀攀䤀琀攀洀⠀∀猀甀瀀愀戀愀猀攀开甀爀氀∀⤀㬀ഀഀ
                        localStorage.removeItem("supabase_key");਍                        猀攀琀䐀戀䌀漀渀渀攀挀琀攀搀⠀昀愀氀猀攀⤀㬀ഀഀ
                        setOrder(JSON.parse(JSON.stringify(mockData.initialOrder)));਍                        猀攀琀䰀漀最猀⠀䨀匀伀一⸀瀀愀爀猀攀⠀䨀匀伀一⸀猀琀爀椀渀最椀昀礀⠀洀漀挀欀䐀愀琀愀⸀挀栀愀渀最攀䰀漀最猀⤀⤀⤀㬀ഀഀ
                        setCurrentStageIndex(0);਍                      紀紀ഀഀ
                    >਍                      䐀椀猀挀漀渀渀攀挀琀ഀഀ
                    </button>਍                  㰀⼀㸀ഀഀ
                )}਍              㰀⼀搀椀瘀㸀ഀഀ
            </form>਍          㰀⼀搀椀瘀㸀ഀഀ
        </div>਍      ⤀紀ഀഀ
਍      笀⼀⨀ 一愀瘀戀愀爀 䠀攀愀搀攀爀 ⨀⼀紀ഀഀ
      <nav className="navbar">਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀氀漀最漀ⴀ挀漀渀琀愀椀渀攀爀∀㸀ഀഀ
          <span className="logo-logo">CRAFTON AI</span>਍        㰀⼀搀椀瘀㸀ഀഀ
਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀渀愀瘀ⴀ氀椀渀欀猀∀㸀ഀഀ
          <span className={`nav-link ${currentView === "Marketing" ? "active" : ""}`} onClick={() => setCurrentStageView("Marketing")}>਍            笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀簀睭὏㥻㱰붿≽ 㨀 ∀䠀漀洀攀瀀愀最攀∀紀ഀഀ
          </span>਍          㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀笀怀渀愀瘀ⴀ氀椀渀欀 ␀笀挀甀爀爀攀渀琀嘀椀攀眀 㴀㴀㴀 ∀䌀氀椀攀渀琀倀漀爀琀愀氀∀ 㼀 ∀愀挀琀椀瘀攀∀ 㨀 ∀∀紀怀紀 漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 猀攀琀䌀甀爀爀攀渀琀匀琀愀最攀嘀椀攀眀⠀∀䌀氀椀攀渀琀倀漀爀琀愀氀∀⤀紀㸀ഀഀ
            {lang === "Cn" ? "瀹㈡뿯垽浼氬뿯憽뿯涽붿績" : "Client Portal"}਍          㰀⼀猀瀀愀渀㸀ഀഀ
          <span className={`nav-link ${currentView === "Backoffice" ? "active" : ""}`} onClick={() => setCurrentStageView("Backoffice")}>਍            笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀倀뿯澽붿붿뿯䎽붿套뿯㾽⠀䌀栀漀⼀㤀ⅰ붿⥗∀ 㨀 ∀䈀愀挀欀漀昀昀椀挀攀 ⠀䌀栀漀⼀䌀氀椀攀渀琀⤀∀紀ഀഀ
          </span>਍        㰀⼀搀椀瘀㸀ഀഀ
਍        㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 最愀瀀㨀 ✀　⸀㠀爀攀洀✀Ⰰ 愀氀椀最渀䤀琀攀洀猀㨀 ✀挀攀渀琀攀爀✀ 紀紀㸀ഀഀ
          {/* Supabase Status Button */}਍          㰀戀甀琀琀漀渀 ഀഀ
            className="btn-secondary" ਍            猀琀礀氀攀㴀笀笀 ഀഀ
              borderColor: dbConnected ? "var(--accent-green)" : "rgba(255,255,255,0.1)", ਍              挀漀氀漀爀㨀 搀戀䌀漀渀渀攀挀琀攀搀 㼀 ∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀∀ 㨀 ∀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀∀Ⰰഀഀ
              display: 'flex',਍              愀氀椀最渀䤀琀攀洀猀㨀 ✀挀攀渀琀攀爀✀Ⰰഀഀ
              gap: '0.5rem',਍              昀漀渀琀匀椀稀攀㨀 ✀　⸀㠀爀攀洀✀Ⰰഀഀ
              padding: '0.4rem 0.8rem'਍            紀紀ഀഀ
            onClick={() => setShowDbConfig(!showDbConfig)}਍          㸀ഀഀ
            <span className={`stage-badge-dot dot-${dbConnected ? 'ai' : 'gate'}`} style={{ margin: 0, width: '8px', height: '8px', display: 'inline-block' }}></span>਍            笀搀戀䌀漀渀渀攀挀琀攀搀 㼀 ∀匀甀瀀愀戀愀猀攀 䌀漀渀渀攀挀琀攀搀∀ 㨀 ∀䌀漀渀渀攀挀琀 匀甀瀀愀戀愀猀攀∀紀ഀഀ
          </button>਍ഀഀ
          <button className="btn-secondary" onClick={handleLangToggle}>਍            붿뿯붿⁛笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀䔀渀最氀椀猀栀∀ 㨀 ∀붿붿붿붿彭뿯枽"}਍          㰀⼀戀甀琀琀漀渀㸀ഀഀ
          <button className="btn-premium" onClick={() => setCurrentStageView("ClientPortal")}>਍            笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀✀뿯붿⁽⼀ ऀ╚㴱≕ 㨀 ∀匀椀最渀 䤀渀∀紀ഀഀ
          </button>਍        㰀⼀搀椀瘀㸀ഀഀ
      </nav>਍ഀഀ
      {dbError && !dbConnected && (਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀愀渀椀洀愀琀攀ⴀ昀愀搀攀ⴀ椀渀∀ 猀琀礀氀攀㴀笀笀ഀഀ
          background: "rgba(166, 132, 128, 0.95)",਍          挀漀氀漀爀㨀 ∀⌀昀昀昀昀昀昀∀Ⰰഀഀ
          padding: "1rem 2rem",਍          搀椀猀瀀氀愀礀㨀 ∀昀氀攀砀∀Ⰰഀഀ
          justifyContent: "space-between",਍          愀氀椀最渀䤀琀攀洀猀㨀 ∀挀攀渀琀攀爀∀Ⰰഀഀ
          fontSize: "0.85rem",਍          昀漀渀琀䘀愀洀椀氀礀㨀 ∀瘀愀爀⠀ⴀⴀ昀漀渀琀ⴀ琀攀挀栀⤀∀Ⰰഀഀ
          borderBottom: "1px solid #FAF9F6",਍          最愀瀀㨀 ∀㄀⸀㔀爀攀洀∀Ⰰഀഀ
          zIndex: 999,਍          瀀漀猀椀琀椀漀渀㨀 ∀爀攀氀愀琀椀瘀攀∀ഀഀ
        }}>਍          㰀搀椀瘀㸀ഀഀ
            붿뿯犽笍 <strong>{lang === "Cn" ? "Supabase 붿屾붿 / 뿯붿붿뿯½뿯붿붿붿 (Seeding Error):" : "Supabase Sync / Seeding Error:"}</strong> {dbError}਍          㰀⼀搀椀瘀㸀ഀഀ
          <button ਍            猀琀礀氀攀㴀笀笀ഀഀ
              background: "rgba(255, 255, 255, 0.15)",਍              戀漀爀搀攀爀㨀 ∀㄀瀀砀 猀漀氀椀搀 ⌀昀昀昀昀昀昀∀Ⰰഀഀ
              color: "#ffffff",਍              瀀愀搀搀椀渀最㨀 ∀　⸀㐀爀攀洀 ㄀爀攀洀∀Ⰰഀഀ
              borderRadius: "2px",਍              挀甀爀猀漀爀㨀 ∀瀀漀椀渀琀攀爀∀Ⰰഀഀ
              fontSize: "0.75rem",਍              琀攀砀琀吀爀愀渀猀昀漀爀洀㨀 ∀甀瀀瀀攀爀挀愀猀攀∀Ⰰഀഀ
              letterSpacing: "1px"਍            紀紀ഀഀ
            onClick={() => setShowDbConfig(true)}਍          㸀ഀഀ
            {lang === "Cn" ? "뿯榽뿯炽搳뿯붿뿯掽煡뿯붿뿯嶽뿯疽 / Troubleshoot" : "Troubleshoot Config"}਍          㰀⼀戀甀琀琀漀渀㸀ഀഀ
        </div>਍      ⤀紀ഀഀ
਍      笀⼀⨀ 嘀䤀䔀圀 ㄀㨀 圀攀戀 䴀愀爀欀攀琀椀渀最 倀漀爀琀愀氀 ⨀⼀紀ഀഀ
      {currentView === "Marketing" && (਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀愀渀椀洀愀琀攀ⴀ昀愀搀攀ⴀ椀渀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最䈀漀琀琀漀洀㨀 ∀㐀爀攀洀∀ 紀紀㸀ഀഀ
          <div className="portal-hero">਍            㰀栀㄀㸀ഀഀ
              {lang === "Cn" ? "楂樻。瀹氬뿯垽瀹뿯붿뿯厽붿孉I 뿯澽氭뿯檽붿戒뿯綽붿ㄨ뿯嚽붿ㄨ뿯窽浜у뿯붿붿? : "High-End Bespoke Furniture, Driven by Autonomous Multi-Agent Workflows."}਍            㰀⼀栀㄀㸀ഀഀ
            <p>਍              笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ ഀഀ
                ? "Crafton AI 瀹뿯岽뿯綽瀵规帴붿卞浗 Crib 5 娑堥뿯榽鏍뿯嚽噯뿯붿뿯傽뿯粽뿯붿ㄥ湪浼氬뿯憽뿯涽붿績杈뿯撽뿯厽붿뿯劽뿯窽뿯纽뿯施畾붿堕渶뿯妽뿯傽強뿯璽捐鎵嬬뿯붿붿屽뿯垽鏈뿯₽缁堝뿯厽뿯붿뿯冽紝AI 붿뿯徽뿯妽뿯璽捐銆佸뿯厽붿붿뿯妽뿯璽붿붿붿붿붿뿯ڽ噎夀붿乕뿯宽뿯붿뿯嶽뿯妽뿯₽뿯붿뿯嶽뿯悽뿯妽뿯施뿯붿붿뿯岽뿯₽氬뿯厽鏃뿯犽뿯咽뿯붿? ਍                㨀 ∀䌀爀愀昀琀漀渀 䄀䤀 戀爀椀搀最攀猀 琀栀攀 最愀瀀 戀攀琀眀攀攀渀 瀀爀攀洀椀甀洀 搀攀猀椀最渀 愀渀搀 昀愀挀琀漀爀礀 昀氀漀漀爀⸀ 䤀渀琀攀最爀愀琀椀渀最 唀䬀 䌀爀椀戀 㔀 昀氀愀洀攀 挀漀搀攀猀Ⰰ 搀甀愀氀ⴀ氀愀渀最甀愀最攀 䈀伀䴀 最攀渀攀爀愀琀椀漀渀Ⰰ 愀甀琀漀洀愀琀椀挀 瀀爀椀挀椀渀最 戀椀搀猀Ⰰ 愀渀搀 䌀漀洀瀀甀琀攀爀 嘀椀猀椀漀渀 椀渀猀瀀攀挀琀椀漀渀猀⸀∀紀ഀഀ
            </p>਍            㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 最愀瀀㨀 ✀㄀爀攀洀✀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀挀攀渀琀攀爀✀ 紀紀㸀ഀഀ
              <button className="btn-premium" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }} onClick={() => setCurrentStageView("ClientPortal")}>਍                笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀ऀ╚㴱붿뿯⪽ὡ뿯粽Ɑ붿⁡ᬀ뿯㾽䄀䤀붿뿯ල夊搧" : "Join Membership & Design with AI"}਍              㰀⼀戀甀琀琀漀渀㸀ഀഀ
              <button className="btn-secondary" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }} onClick={() => setCurrentStageView("Backoffice")}>਍                笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀椀붿붿偓뿯璽㑔⁑㄀㜀 쌀㖕뿯붿뿯璽뿯熽釜" : "Simulate 17-Stage Tracker"}਍              㰀⼀戀甀琀琀漀渀㸀ഀഀ
            </div>਍          㰀⼀搀椀瘀㸀ഀഀ
਍          笀⼀⨀ 䤀渀琀攀最爀愀琀椀漀渀㨀 䴀愀琀攀爀椀愀氀 匀琀甀搀椀漀 䌀漀渀昀椀最甀爀愀琀漀爀 ⨀⼀紀ഀഀ
          <div style={{ maxWidth: '1200px', margin: '0 auto 3rem auto', padding: '0 2rem' }}>਍            笀爀攀渀搀攀爀䴀愀琀攀爀椀愀氀匀琀甀搀椀漀⠀⤀紀ഀഀ
          </div>਍ഀഀ
          <div className="portal-features-grid">਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀 昀攀愀琀甀爀攀ⴀ戀漀砀∀㸀ഀഀ
              <div className="feature-icon">뿯붿洝붿?/div>਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀昀攀愀琀甀爀攀ⴀ琀椀琀氀攀∀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀䌀爀椀戀 㔀 眀뿯䒽뿯붿ᅙ╚붿붿뿯㶽뿯붿≗ 㨀 ∀䌀爀椀戀 㔀 䄀渀琀椀ⴀ䘀椀爀攀 䠀愀爀搀 䜀愀琀攀∀紀㰀⼀搀椀瘀㸀ഀഀ
              <div className="feature-desc">਍                笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ ഀഀ
                  ? "뿯纽붿뿯粽瀹뿯炽椂뿯妽뿯施뿯붿뿯妽뿯施뿯枽뿯붿佹湪붿뿯붿樆붿뿯冽뿯悽瑙뿯劽뿯暽뿯붿뿯붿簱뿯붿뿯傽뿯嚽뿯涽뿯嶽敮뿯붿佺뿯墽붿뿯喽뿯榽붿뿯붿뿯禽灞뿯傽뿯殽뿯纽剧뿯粽闈㈡뿯枽뿯涽뿯₽뿯宽嬪湪뿯璽붿即뿯붿楝᭛䅰붿붿뿯亽뿯ᶽ쥽붿붿᝼뿯炽䝴붿䙴䴄붿붿붿붿뿯㾽 ഀഀ
                  : "Automatic material check against British fire databases. Delicate fabrics (like silk) that shrink under flame coating are flagged and blocked before production."}਍              㰀⼀搀椀瘀㸀ഀഀ
            </div>਍ഀഀ
            <div className="glass-card feature-box">਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀昀攀愀琀甀爀攀ⴀ椀挀漀渀∀㸀붿뿯붿ᑡ뿯㾽⼀搀椀瘀㸀ഀഀ
              <div className="feature-title">{lang === "Cn" ? "AI 瑙뿯喽붿♴붿닥붿붿붿붿붿뿯⊽ 㨀 ∀䄀䤀 䌀嘀 䤀渀猀瀀攀挀琀椀漀渀∀紀㰀⼀搀椀瘀㸀ഀഀ
              <div className="feature-desc">਍                笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ ഀഀ
                  ? "붿╃敤뿯璽붿畻鏈붿붿瑙夛紙OpenCV붿夛紝붿붿뿯妽灏뿯喽伐붿뿯傽瘡鏃뿯ソ뿯媽붿т笌붿뿯熽붿 CAD 뿯璽捐붿붿剧਍붿뿯붿붿붿붿붿뿯ᮽ뿯붿繜幖붿⩰뿯璽뿯㚽붿뿯禽뿯붿붿붿뿯ල붿砠ɏ㕦䱰붿붿붿뿯ᶽ兽뿯붿붿卝뿯붿붿呖뿯⚽붿붿뿯䖽뿯붿붿㩴뿯붿㼠 ഀഀ
                  : "Utilizing Computer Vision to overlap worker site photographs with raw CAD drawings. Detecting color or angle discrepancies before cargo leaves the factory floor."}਍              㰀⼀搀椀瘀㸀ഀഀ
            </div>਍ഀഀ
            <div className="glass-card feature-box">਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀昀攀愀琀甀爀攀ⴀ椀挀漀渀∀㸀붿뿯㮽뿯㲽⼀搀椀瘀㸀ഀഀ
              <div className="feature-title">{lang === "Cn" ? "OpenClaw 鏅붿兘浣뿯撽뿯嚽붿ㄨ뿯窽붿? : "OpenClaw Daemon Follow-up"}</div>਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀昀攀愀琀甀爀攀ⴀ搀攀猀挀∀㸀ഀഀ
                {lang === "Cn" ਍                  㼀 ∀쌀붿㙲奮뿯붿㉝뿯岽붿ၔ붿붿뿯箽蛡㾒㐀 伀붿ɟ붿뿯붿붿⁮䄀䤀 眀뿯䒽뿯붿řཿၫ塏뿯붿䉐붿뿯㾽圀栀愀琀猀䄀瀀瀀 붿彭뿯枽붿붿偓뿯涽★紝뿯璽뿯熽繘뿯璽ㄦ뿯붿붿э紝붿붿뿯₽佸嵆鏃뿯붿洖붿欙紝Cho 闅뿯徽椂뿯붿屾帶붿ㄥ眬뿯붿? ਍                  㨀 ∀一漀 洀愀渀甀愀氀 渀愀最最椀渀最⸀ 吀栀攀 伀瀀攀渀䌀氀愀眀 䐀愀攀洀漀渀 焀甀攀爀椀攀猀 瀀爀漀搀甀挀琀椀漀渀 猀琀愀琀攀猀 昀爀漀洀 匀甀瀀愀戀愀猀攀Ⰰ 愀甀琀漀洀愀琀椀挀愀氀氀礀 洀攀猀猀愀最椀渀最 昀愀挀琀漀爀椀攀猀 椀渀 䌀栀椀渀攀猀攀 漀渀 圀栀愀琀猀䄀瀀瀀 琀漀 昀攀琀挀栀 甀瀀搀愀琀攀猀⸀∀紀ഀഀ
              </div>਍            㰀⼀搀椀瘀㸀ഀഀ
          </div>਍        㰀⼀搀椀瘀㸀ഀഀ
      )}਍ഀഀ
      {/* VIEW 2: Client Portal (Member Center) */}਍      笀挀甀爀爀攀渀琀嘀椀攀眀 㴀㴀㴀 ∀䌀氀椀攀渀琀倀漀爀琀愀氀∀ ☀☀ ⠀ഀഀ
        <div className="animate-fade-in" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>਍          㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀猀瀀愀挀攀ⴀ戀攀琀眀攀攀渀✀Ⰰ 愀氀椀最渀䤀琀攀洀猀㨀 ✀挀攀渀琀攀爀✀Ⰰ 洀愀爀最椀渀䈀漀琀琀漀洀㨀 ✀㄀⸀㔀爀攀洀✀ 紀紀㸀ഀഀ
            <div>਍              㰀栀㈀ 猀琀礀氀攀㴀笀笀 昀漀渀琀䘀愀洀椀氀礀㨀 ∀瘀愀爀⠀ⴀⴀ昀漀渀琀ⴀ琀攀挀栀⤀∀Ⰰ 挀漀氀漀爀㨀 ∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ挀礀愀渀⤀∀ 紀紀㸀ഀഀ
                {lang === "Cn" ? "瀹㈡뿯垽뿯涽뿯撽睘浼氬뿯憽뿯붿у뿯垽붿뿯庽彴" : "CLIENT MEMBER CENTER"}਍              㰀⼀栀㈀㸀ഀഀ
              <p style={{ fontSize: '0.85rem', color: "var(--text-secondary)" }}>਍                䤀䐀㨀 笀漀爀搀攀爀⸀挀氀椀攀渀琀一愀洀攀紀 簀 笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㤀൰夊뿯厽뿯纽у뿯垽붿歋upabase Auth 뿯宽뿯掽뿯妽瀵? : "Security: Supabase Auth RLS Guarded"}਍              㰀⼀瀀㸀ഀഀ
            </div>਍            㰀搀椀瘀 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ∀爀最戀愀⠀㄀㈀㐀Ⰰ ㄀㄀㐀Ⰰ ㄀　㌀Ⰰ 　⸀　㠀⤀∀Ⰰ 瀀愀搀搀椀渀最㨀 ✀　⸀㔀爀攀洀 ㄀爀攀洀✀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㈀瀀砀✀Ⰰ 戀漀爀搀攀爀㨀 ∀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀∀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㠀㔀爀攀洀✀ 紀紀㸀ഀഀ
              {lang === "Cn" ? "붿뿯撽뿯墽붿ㄩ뿯₽뿯施붿붿뿯暽뿯妽뿯붿? " : "Order Tracking: "}਍              㰀猀琀爀漀渀最 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ瀀爀椀洀愀爀礀⤀∀Ⰰ 昀漀渀琀䘀愀洀椀氀礀㨀 ∀瘀愀爀⠀ⴀⴀ昀漀渀琀ⴀ琀攀挀栀⤀∀Ⰰ 昀漀渀琀圀攀椀最栀琀㨀 ∀戀漀氀搀∀ 紀紀㸀笀挀甀爀爀攀渀琀匀琀愀最攀⸀椀搀紀 ⴀ 笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 挀甀爀爀攀渀琀匀琀愀最攀⸀渀愀洀攀䌀渀 㨀 挀甀爀爀攀渀琀匀琀愀最攀⸀渀愀洀攀䔀渀紀㰀⼀猀琀爀漀渀最㸀ഀഀ
            </div>਍          㰀⼀搀椀瘀㸀ഀഀ
਍          㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀搀愀猀栀戀漀愀爀搀ⴀ瀀愀渀攀氀猀∀㸀ഀഀ
            {/* Left Column: Member Order Dashboard */}਍            㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 昀氀攀砀䐀椀爀攀挀琀椀漀渀㨀 ✀挀漀氀甀洀渀✀Ⰰ 最愀瀀㨀 ✀㄀⸀㔀爀攀洀✀ 紀紀㸀ഀഀ
              {renderMaterialStudio()}਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀∀㸀ഀഀ
                <div className="panel-header">਍                  㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ琀椀琀氀攀∀㸀붿뿯嶽⁤笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀昀뿯▽ἱ㥝Ɒ붿套붿硒붿붿塞㑾㽤 㨀 ∀䈀攀猀瀀漀欀攀 䤀琀攀洀猀 ☀ 匀瀀攀挀猀∀紀㰀⼀搀椀瘀㸀ഀഀ
                  <span style={{ fontSize: '0.8rem', color: "var(--accent-green)", fontFamily: "var(--font-tech)" }}>਍                    吀漀琀愀氀㨀 ␀笀最攀琀伀爀搀攀爀吀漀琀愀氀⠀⤀⸀琀漀䰀漀挀愀氀攀匀琀爀椀渀最⠀⤀紀ഀഀ
                  </span>਍                㰀⼀搀椀瘀㸀ഀഀ
                <div className="panel-body">਍                  㰀琀愀戀氀攀 挀氀愀猀猀一愀洀攀㴀∀漀爀搀攀爀ⴀ琀愀戀氀攀∀㸀ഀഀ
                    <thead>਍                      㰀琀爀㸀ഀഀ
                        <th>{lang === "Cn" ? "椤圭洰뿯纽뿯㞽≰ 㨀 ∀䤀琀攀洀∀紀㰀⼀琀栀㸀ഀഀ
                        <th>{lang === "Cn" ? "뿯붿伴噺" : "Qty"}</th>਍                        㰀琀栀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿붿붿ଠ坙붿㽴 㨀 ∀䴀愀琀攀爀椀愀氀 匀瀀攀挀猀∀紀㰀⼀琀栀㸀ഀഀ
                        <th>{lang === "Cn" ? "붿뿯暽뿯玽" : "Price"}</th>਍                        㰀琀栀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀伀붿硟뿯⊽ 㨀 ∀匀甀戀琀漀琀愀氀∀紀㰀⼀琀栀㸀ഀഀ
                      </tr>਍                    㰀⼀琀栀攀愀搀㸀ഀഀ
                    <tbody>਍                      笀漀爀搀攀爀⸀椀琀攀洀猀⸀洀愀瀀⠀椀琀攀洀 㴀㸀 ⠀ഀഀ
                        <tr key={item.id} className={splitDeliveryActive && (item.qty === 38 || item.qty === 4) ? "strike-row" : ""}>਍                          㰀琀搀 猀琀礀氀攀㴀笀笀 昀漀渀琀圀攀椀最栀琀㨀 ✀㔀　　✀ 紀紀㸀ഀഀ
                            {lang === "Cn" ? item.typeCn : item.typeEn}਍                          㰀⼀琀搀㸀ഀഀ
                          <td>਍                            笀猀瀀氀椀琀䐀攀氀椀瘀攀爀礀䄀挀琀椀瘀攀 ☀☀ 椀琀攀洀⸀椀搀 㴀㴀㴀 ∀䤀吀䔀䴀ⴀ　㄀∀ 㼀 ⠀ഀഀ
                              <span><span style={{ textDecoration: 'line-through', color: 'var(--accent-red)' }}>40</span> <strong style={{ color: 'var(--accent-green)' }}>38</strong></span>਍                            ⤀ 㨀 猀瀀氀椀琀䐀攀氀椀瘀攀爀礀䄀挀琀椀瘀攀 ☀☀ 椀琀攀洀⸀椀搀 㴀㴀㴀 ∀䤀吀䔀䴀ⴀ　㌀∀ 㼀 ⠀ഀഀ
                              <span><span style={{ textDecoration: 'line-through', color: 'var(--accent-red)' }}>5</span> <strong style={{ color: 'var(--accent-green)' }}>4</strong></span>਍                            ⤀ 㨀 ⠀ഀഀ
                              item.qty਍                            ⤀紀ഀഀ
                          </td>਍                          㰀琀搀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㠀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀ 紀紀㸀ഀഀ
                            {lang === "Cn" ? item.materialCn : item.materialEn}਍                            笀椀琀攀洀⸀渀漀琀攀 ☀☀ 㰀搀椀瘀 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ漀爀愀渀最攀⤀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀㌀瀀砀✀ 紀紀㸀笀椀琀攀洀⸀渀漀琀攀紀㰀⼀搀椀瘀㸀紀ഀഀ
                          </td>਍                          㰀琀搀㸀␀笀椀琀攀洀⸀甀渀椀琀倀爀椀挀攀紀㰀⼀琀搀㸀ഀഀ
                          <td style={{ fontWeight: 'bold' }}>${(item.unitPrice * item.qty).toLocaleString()}</td>਍                        㰀⼀琀爀㸀ഀഀ
                      ))}਍                    㰀⼀琀戀漀搀礀㸀ഀഀ
                  </table>਍                㰀⼀搀椀瘀㸀ഀഀ
              </div>਍ഀഀ
              {/* Step bar inside member portal */}਍              㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀㄀⸀㈀爀攀洀✀ 紀紀㸀ഀഀ
                <h4 style={{ fontFamily: 'var(--font-tech)', fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--accent-cyan)' }}>਍                  붿뿯㞽⁤笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㄀㜀 쌀㖕뿯붿뿯劽뿯ᖽ붿붿౲婻뿯⎽䥘뿯榽붿붿쥛㾓 㨀 ∀㄀㜀ⴀ匀琀愀最攀 倀爀漀搀甀挀琀椀漀渀 ☀ 䌀漀洀瀀氀椀愀渀挀攀 䨀漀甀爀渀攀礀∀紀ഀഀ
                </h4>਍                㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀最爀椀搀✀Ⰰ 最爀椀搀吀攀洀瀀氀愀琀攀䌀漀氀甀洀渀猀㨀 ✀爀攀瀀攀愀琀⠀㄀㜀Ⰰ ㄀昀爀⤀✀Ⰰ 最愀瀀㨀 ✀㐀瀀砀✀Ⰰ 栀攀椀最栀琀㨀 ✀㄀　瀀砀✀Ⰰ 戀愀挀欀最爀漀甀渀搀㨀 ✀瘀愀爀⠀ⴀⴀ戀最ⴀ琀攀爀琀椀愀爀礀⤀✀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㔀瀀砀✀Ⰰ 漀瘀攀爀昀氀漀眀㨀 ✀栀椀搀搀攀渀✀ 紀紀㸀ഀഀ
                  {stages.map((st, sidx) => {਍                    氀攀琀 戀最 㴀 ∀瘀愀爀⠀ⴀⴀ戀最ⴀ琀攀爀琀椀愀爀礀⤀∀㬀ഀഀ
                    if (sidx < currentStageIndex) bg = "var(--accent-green)";਍                    椀昀 ⠀猀椀搀砀 㴀㴀㴀 挀甀爀爀攀渀琀匀琀愀最攀䤀渀搀攀砀⤀ 戀最 㴀 ∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ挀礀愀渀⤀∀㬀ഀഀ
                    return (਍                      㰀搀椀瘀 欀攀礀㴀笀猀琀⸀椀搀紀 琀椀琀氀攀㴀笀怀␀笀猀琀⸀椀搀紀 ⴀ ␀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 猀琀⸀渀愀洀攀䌀渀 㨀 猀琀⸀渀愀洀攀䔀渀紀怀紀 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 戀最Ⰰ 琀爀愀渀猀椀琀椀漀渀㨀 ✀戀愀挀欀最爀漀甀渀搀 　⸀㌀猀✀ 紀紀㸀㰀⼀搀椀瘀㸀ഀഀ
                    );਍                  紀⤀紀ഀഀ
                </div>਍                㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀猀瀀愀挀攀ⴀ戀攀琀眀攀攀渀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㔀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ洀甀琀攀搀⤀✀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀　⸀㔀爀攀洀✀ 紀紀㸀ഀഀ
                  <span>S01 Intake</span>਍                  㰀猀瀀愀渀㸀匀　㔀 䌀爀椀戀㔀 䜀愀琀攀㰀⼀猀瀀愀渀㸀ഀഀ
                  <span>S11 AI CV Gate</span>਍                  㰀猀瀀愀渀㸀匀㄀㜀 䌀漀洀瀀氀攀琀攀㰀⼀猀瀀愀渀㸀ഀഀ
                </div>਍              㰀⼀搀椀瘀㸀ഀഀ
            </div>਍ഀഀ
            {/* Right Column: OpenClaw Web chat for member to talk directly to AI Agent */}਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀∀㸀ഀഀ
              <div className="panel-header" style={{ background: "rgba(124, 114, 103, 0.04)" }}>਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ琀椀琀氀攀∀㸀ഀഀ
                  <span className="stage-badge-dot dot-ai" style={{ background: "var(--accent-primary)" }}></span>਍                  笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿㽭䌀爀愀昀琀漀渀 䄀䤀 붿뿯ල夊搧붿╂뿯墽瀵硅瘽" : "Design & Swatch Agent (OpenClaw)"}਍                㰀⼀搀椀瘀㸀ഀഀ
                <span className="logo-badge">Live Chat</span>਍              㰀⼀搀椀瘀㸀ഀഀ
              <div className="panel-body chat-window">਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀挀栀愀琀ⴀ洀攀猀猀愀最攀猀∀㸀ഀഀ
                  {chatMessages.map((msg, midx) => (਍                    㰀搀椀瘀 欀攀礀㴀笀洀椀搀砀紀 挀氀愀猀猀一愀洀攀㴀笀怀挀栀愀琀ⴀ戀甀戀戀氀攀 ␀笀洀猀最⸀猀攀渀搀攀爀 㴀㴀㴀 ∀挀氀椀攀渀琀∀ 㼀 ∀戀甀戀戀氀攀ⴀ挀氀椀攀渀琀∀ 㨀 ∀戀甀戀戀氀攀ⴀ愀最攀渀琀∀紀怀紀㸀ഀഀ
                      {msg.text}਍                    㰀⼀搀椀瘀㸀ഀഀ
                  ))}਍                㰀⼀搀椀瘀㸀ഀഀ
                ਍                笀⼀⨀ 匀椀洀甀氀愀琀攀搀 匀圀䄀吀䌀䠀 猀攀氀攀挀琀漀爀猀 昀漀爀 攀愀猀椀攀爀 搀攀洀漀椀渀最 ⨀⼀紀ഀഀ
                <div style={{ padding: '0.8rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>਍                  㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ洀甀琀攀搀⤀✀Ⰰ 眀椀搀琀栀㨀 ✀㄀　　─✀ 紀紀㸀ഀഀ
                    {lang === "Cn" ? "붿뿯붿嵎뿯붿਍❙졤↕붿㑧ⵚ⽛᭶뿯⊽捘児뿯붿彂뿯붿佹ā뿯붿뿯熽뿯붿娴嬶級붿? : "Fabric swatches shortcut (click to simulate):"}਍                  㰀⼀猀瀀愀渀㸀ഀഀ
                  <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => { setInputText("I want to check FAB-01 Royal Velvet (붿뿯嚽뿯钃뿯澽笣缁? compatibility"); setTimeout(handleSendMessage, 100); }}>਍                    刀漀礀愀氀 嘀攀氀瘀攀琀 ⠀䌀爀椀戀 㔀 伀欀⤀ഀഀ
                  </button>਍                  㰀戀甀琀琀漀渀 挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ猀攀挀漀渀搀愀爀礀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀　⸀㈀爀攀洀 　⸀㔀爀攀洀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀爀攀洀✀Ⰰ 戀漀爀搀攀爀䌀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ爀攀搀⤀✀ 紀紀 漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 笀 猀攀琀䤀渀瀀甀琀吀攀砀琀⠀∀䤀 猀攀氀攀挀琀 䘀䄀䈀ⴀ　㌀ 倀甀爀攀 匀椀氀欀 匀愀琀椀渀 ⠀붿᥾뿯⎽Ż붿ὔ⥽∀⤀㬀 猀攀琀吀椀洀攀漀甀琀⠀栀愀渀搀氀攀匀攀渀搀䴀攀猀猀愀最攀Ⰰ ㄀　　⤀㬀 紀紀㸀ഀഀ
                    Pure Silk Satin (붿뿯犽笍 WILL BLOCK)਍                  㰀⼀戀甀琀琀漀渀㸀ഀഀ
                </div>਍ഀഀ
                <div className="chat-input-area">਍                  㰀椀渀瀀甀琀 琀礀瀀攀㴀∀琀攀砀琀∀ 挀氀愀猀猀一愀洀攀㴀∀挀栀愀琀ⴀ椀渀瀀甀琀∀ 瀀氀愀挀攀栀漀氀搀攀爀㴀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀娀뿯㾽䄀䤀 붿⑴붿붿뿯➽䥨읟붿灤쉯㾓⸀⸀∀ 㨀 ∀䄀猀欀 䄀䤀 匀眀愀琀挀栀 漀爀 挀栀攀挀欀 挀漀搀攀猀⸀⸀⸀∀紀 瘀愀氀甀攀㴀笀椀渀瀀甀琀吀攀砀琀紀 漀渀䌀栀愀渀最攀㴀笀⠀攀⤀ 㴀㸀 猀攀琀䤀渀瀀甀琀吀攀砀琀⠀攀⸀琀愀爀最攀琀⸀瘀愀氀甀攀⤀紀 漀渀䬀攀礀䐀漀眀渀㴀笀⠀攀⤀ 㴀㸀 攀⸀欀攀礀 㴀㴀㴀 ✀䔀渀琀攀爀✀ ☀☀ 栀愀渀搀氀攀匀攀渀搀䴀攀猀猀愀最攀⠀⤀紀 ⼀㸀ഀഀ
                  <button className="btn-premium" onClick={handleSendMessage}>Send</button>਍                㰀⼀搀椀瘀㸀ഀഀ
              </div>਍            㰀⼀搀椀瘀㸀ഀഀ
          </div>਍        㰀⼀搀椀瘀㸀ഀഀ
      )}਍ഀഀ
      {/* VIEW 3: Internal Backoffice (Cho / Client View) */}਍      笀挀甀爀爀攀渀琀嘀椀攀眀 㴀㴀㴀 ∀䈀愀挀欀漀昀昀椀挀攀∀ ☀☀ ⠀ഀഀ
        <div className="dashboard-grid animate-fade-in">਍          笀⼀⨀ 匀椀搀攀戀愀爀 䰀攀昀琀㨀 ㄀㜀 匀琀愀最攀猀 䌀漀渀琀爀漀氀氀攀爀 ⨀⼀紀ഀഀ
          <div className="sidebar">਍            㰀栀㌀ 挀氀愀猀猀一愀洀攀㴀∀猀椀搀攀戀愀爀ⴀ琀椀琀氀攀∀㸀ഀഀ
              {lang === "Cn" ? "17闃붿뿯붿붿ㄦ뿯檽鏃堕뿯梽杞? : "17-Stage Control Center"}਍            㰀⼀栀㌀㸀ഀഀ
            <div className="stage-timeline-vertical">਍              笀猀琀愀最攀猀⸀洀愀瀀⠀⠀猀琀Ⰰ 椀搀砀⤀ 㴀㸀 笀ഀഀ
                let statusClass = "";਍                椀昀 ⠀椀搀砀 㰀 挀甀爀爀攀渀琀匀琀愀最攀䤀渀搀攀砀⤀ 猀琀愀琀甀猀䌀氀愀猀猀 㴀 ∀挀漀洀瀀氀攀琀攀搀∀㬀ഀഀ
                if (idx === currentStageIndex) statusClass = "active";਍ഀഀ
                return (਍                  㰀搀椀瘀 欀攀礀㴀笀猀琀⸀椀搀紀 挀氀愀猀猀一愀洀攀㴀笀怀猀琀愀最攀ⴀ椀琀攀洀 ␀笀猀琀愀琀甀猀䌀氀愀猀猀紀怀紀 漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 栀愀渀搀氀攀匀琀愀最攀䌀栀愀渀最攀⠀椀搀砀⤀紀㸀ഀഀ
                    <span className={`stage-badge-dot dot-${st.type.toLowerCase()}`}></span>਍                    㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀猀琀愀最攀ⴀ椀渀昀漀∀㸀ഀഀ
                      <div className="stage-id">STAGE {st.id} ({st.type})</div>਍                      㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀猀琀愀最攀ⴀ渀愀洀攀∀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 猀琀⸀渀愀洀攀䌀渀 㨀 猀琀⸀渀愀洀攀䔀渀紀㰀⼀搀椀瘀㸀ഀഀ
                    </div>਍                  㰀⼀搀椀瘀㸀ഀഀ
                );਍              紀⤀紀ഀഀ
            </div>਍          㰀⼀搀椀瘀㸀ഀഀ
਍          笀⼀⨀ 刀椀最栀琀 䴀愀椀渀 䄀搀洀椀渀 䄀爀攀愀 ⨀⼀紀ഀഀ
          <div className="main-content">਍            笀⼀⨀ 吀漀瀀 倀栀愀猀攀 䠀攀愀搀攀爀 ⨀⼀紀ഀഀ
            <div className="glass-card phase-progress-banner">਍              㰀搀椀瘀㸀ഀഀ
                <span className="logo-badge" style={{ background: "rgba(124, 114, 103, 0.08)", color: "var(--accent-primary)" }}>਍                  笀挀甀爀爀攀渀琀匀琀愀最攀⸀瀀栀愀猀攀紀ഀഀ
                </span>਍                㰀栀㈀ 猀琀礀氀攀㴀笀笀 昀漀渀琀䘀愀洀椀氀礀㨀 ∀瘀愀爀⠀ⴀⴀ昀漀渀琀ⴀ琀攀挀栀⤀∀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ∀　⸀㔀爀攀洀∀ 紀紀㸀ഀഀ
                  Stage {currentStage.id}: {lang === "Cn" ? currentStage.nameCn : currentStage.nameEn}਍                㰀⼀栀㈀㸀ഀഀ
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.2rem" }}>਍                  笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 挀甀爀爀攀渀琀匀琀愀最攀⸀搀攀猀挀䌀渀 㨀 挀甀爀爀攀渀琀匀琀愀最攀⸀搀攀猀挀䔀渀紀ഀഀ
                </p>਍              㰀⼀搀椀瘀㸀ഀഀ
਍              笀⼀⨀ 刀攀渀搀攀爀 匀椀洀甀氀愀琀椀漀渀 䤀渀琀攀爀愀挀琀椀瘀椀琀礀 搀攀瀀攀渀搀椀渀最 漀渀 挀甀爀爀攀渀琀 愀挀琀椀瘀攀 猀琀愀最攀 ⨀⼀紀ഀഀ
              <div style={{ marginLeft: 'auto' }}>਍                笀挀甀爀爀攀渀琀匀琀愀最攀⸀椀搀 㴀㴀㴀 ∀匀　㐀∀ ☀☀ ⠀ഀഀ
                  <button className="btn-premium" onClick={handleChoApproval}>਍                    䄀뿯붿൝⁻笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿뿯炽潴奖붿硒붿㽭뿯ಽ䉻伀䴀 ⠀䠀甀洀愀渀 䠀㄀⤀∀ 㨀 ∀䄀瀀瀀爀漀瘀攀 吀攀挀栀 䈀伀䴀 ⠀䠀甀洀愀渀 䠀㄀⤀∀紀ഀഀ
                  </button>਍                ⤀紀ഀഀ
਍                笀挀甀爀爀攀渀琀匀琀愀最攀⸀椀搀 㴀㴀㴀 ∀匀　㔀∀ ☀☀ 椀猀䌀爀椀戀㔀䈀氀漀挀欀攀搀 ☀☀ ⠀ഀഀ
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>਍                    㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ爀攀搀⤀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㠀爀攀洀✀Ⰰ 昀漀渀琀圀攀椀最栀琀㨀 ✀戀漀氀搀✀ 紀紀㸀㼀뿯붿൲⁻䌀刀䤀䈀 㔀 䈀䰀伀䌀䬀 䤀一吀䔀刀䌀䔀倀吀䔀䐀 ⠀䌀爀椀戀 㔀 붿붿붿붿뿯㶽뿯붿붿㽭㰀⼀猀瀀愀渀㸀ഀഀ
                    <button className="btn-premium" style={{ background: 'var(--accent-orange)', color: 'white' }} onClick={() => handleBypassCrib5("Navy Classic Linen")}>਍                      붿뿯➽⁥笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿붿붿쑗붿붿뿯붿祭뿯붿뿯媽뿯ᖽ牗椀戀 㔀저↕붿≧ 㨀 ∀䈀礀瀀愀猀猀 戀氀漀挀欀㨀 䌀栀愀渀最攀 琀漀 一愀瘀礀 䰀椀渀攀渀∀紀ഀഀ
                    </button>਍                  㰀⼀搀椀瘀㸀ഀഀ
                )}਍ഀഀ
                {currentStage.id === "S08" && (਍                  㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ漀爀愀渀最攀⤀✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㠀㔀爀攀洀✀Ⰰ 昀漀渀琀圀攀椀最栀琀㨀 ✀戀漀氀搀✀ 紀紀㸀ഀഀ
                    뿯붿뿯憽 {lang === "Cn" ? "뿯璽뿯岽湪붿充晶뿯붿夋뿯媽渚뿯涽簲붿뿯喽笅붿? : "Select supplier on the right column"}਍                  㰀⼀猀瀀愀渀㸀ഀഀ
                )}਍ഀഀ
                {currentStage.id === "S15" && !splitDeliveryActive && (਍                  㰀戀甀琀琀漀渀 挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ瀀爀攀洀椀甀洀∀ 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ爀攀搀⤀✀Ⰰ 挀漀氀漀爀㨀 ✀眀栀椀琀攀✀ 紀紀 漀渀䌀氀椀挀欀㴀笀琀爀椀最最攀爀匀瀀氀椀琀䐀攀氀椀瘀攀爀礀紀㸀ഀഀ
                    붿?{lang === "Cn" ? "瀹㈡뿯垽뿯붿愬뿯嚽鏇存敼붿氭뿯墽琛屽뿯垽뿯붿붿氦浠樿뿯傽붿″뿯垽뿯纽挎牳뿯붿뿯₽" : "Execute Split Delivery Strike-through"}਍                  㰀⼀戀甀琀琀漀渀㸀ഀഀ
                )}਍ഀഀ
                {currentStage.id !== "S04" && currentStage.id !== "S08" && (!isCrib5Blocked) && (਍                  㰀戀甀琀琀漀渀 挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ猀攀挀漀渀搀愀爀礀∀ 漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 栀愀渀搀氀攀匀琀愀最攀䌀栀愀渀最攀⠀䴀愀琀栀⸀洀椀渀⠀挀甀爀爀攀渀琀匀琀愀最攀䤀渀搀攀砀 ⬀ ㄀Ⰰ ㄀㘀⤀⤀紀㸀ഀഀ
                    {lang === "Cn" ? "뿯涽嬩뿯窽뿯妽?(뿯妽℃뿯媽娴佽浆)" : "Next Simulation Stage 붿?}਍                  㰀⼀戀甀琀琀漀渀㸀ഀഀ
                )}਍              㰀⼀搀椀瘀㸀ഀഀ
            </div>਍ഀഀ
            {/* Admin Center Split Panels */}਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀搀愀猀栀戀漀愀爀搀ⴀ瀀愀渀攀氀猀∀㸀ഀഀ
              {/* Left Column: Shared Master Sheet (Memory Base) */}਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 昀氀攀砀䐀椀爀攀挀琀椀漀渀㨀 ✀挀漀氀甀洀渀✀Ⰰ 最愀瀀㨀 ✀㄀⸀㔀爀攀洀✀ 紀紀㸀ഀഀ
                <div className="glass-card">਍                  㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ栀攀愀搀攀爀∀㸀ഀഀ
                    <div className="panel-title">뿯붿搵 Supabase 붿뿯厽韩涓뿯纽뿯暽뿯붿뿯붿簱 (Master Sheet)</div>਍                    㰀猀瀀愀渀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㠀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ洀甀琀攀搀⤀✀ 紀紀㸀䤀䐀㨀 笀漀爀搀攀爀⸀漀爀搀攀爀䤀搀紀㰀⼀猀瀀愀渀㸀ഀഀ
                  </div>਍                  㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ戀漀搀礀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀㄀⸀㔀爀攀洀 　✀ 紀紀㸀ഀഀ
                    <div className="table-container" style={{ padding: '0 1.5rem' }}>਍                      㰀琀愀戀氀攀 挀氀愀猀猀一愀洀攀㴀∀漀爀搀攀爀ⴀ琀愀戀氀攀∀ 猀琀礀氀攀㴀笀笀 洀椀渀圀椀搀琀栀㨀 ✀㘀㔀　瀀砀✀ 紀紀㸀ഀഀ
                        <thead>਍                          㰀琀爀㸀ഀഀ
                            <th>{lang === "Cn" ? "椤圭洰뿯纽뿯㞽≰ 㨀 ∀䤀琀攀洀∀紀㰀⼀琀栀㸀ഀഀ
                            <th>{lang === "Cn" ? "뿯붿伴噺" : "Qty"}</th>਍                            㰀琀栀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀준⾓붿奝붿硒⁲⠀夀뿯붿붿뿯⦽∀ 㨀 ∀䈀椀氀椀渀最甀愀氀 䴀愀琀攀爀椀愀氀∀紀㰀⼀琀栀㸀ഀഀ
                            <th>{lang === "Cn" ? "붿堝뿯悽붿뿯暽뿯玽" : "Unit Price"}</th>਍                            㰀琀栀㸀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀伀붿硟뿯⊽ 㨀 ∀匀甀戀琀漀琀愀氀∀紀㰀⼀琀栀㸀ഀഀ
                          </tr>਍                        㰀⼀琀栀攀愀搀㸀ഀഀ
                        <tbody>਍                          笀漀爀搀攀爀⸀椀琀攀洀猀⸀洀愀瀀⠀椀琀攀洀 㴀㸀 ⠀ഀഀ
                            <tr key={item.id}>਍                              㰀琀搀 猀琀礀氀攀㴀笀笀 昀漀渀琀圀攀椀最栀琀㨀 ✀㘀　　✀ 紀紀㸀ഀഀ
                                {lang === "Cn" ? item.typeCn : item.typeEn}਍                              㰀⼀琀搀㸀ഀഀ
                              <td>਍                                笀猀瀀氀椀琀䐀攀氀椀瘀攀爀礀䄀挀琀椀瘀攀 ☀☀ 椀琀攀洀⸀椀搀 㴀㴀㴀 ∀䤀吀䔀䴀ⴀ　㄀∀ 㼀 ⠀ഀഀ
                                  <span><span style={{ textDecoration: 'line-through', color: 'var(--accent-red)' }}>40</span> 붿?<strong style={{ color: 'var(--accent-green)' }}>38</strong></span>਍                                ⤀ 㨀 猀瀀氀椀琀䐀攀氀椀瘀攀爀礀䄀挀琀椀瘀攀 ☀☀ 椀琀攀洀⸀椀搀 㴀㴀㴀 ∀䤀吀䔀䴀ⴀ　㌀∀ 㼀 ⠀ഀഀ
                                  <span><span style={{ textDecoration: 'line-through', color: 'var(--accent-red)' }}>5</span> 붿?<strong style={{ color: 'var(--accent-green)' }}>4</strong></span>਍                                ⤀ 㨀 ⠀ഀഀ
                                  item.qty਍                                ⤀紀ഀഀ
                              </td>਍                              㰀琀搀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㠀爀攀洀✀ 紀紀㸀ഀഀ
                                <div style={{ color: 'var(--accent-cyan)' }}>{item.materialEn}</div>਍                                㰀搀椀瘀 猀琀礀氀攀㴀笀笀 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀ 紀紀㸀笀椀琀攀洀⸀洀愀琀攀爀椀愀氀䌀渀紀㰀⼀搀椀瘀㸀ഀഀ
                                {item.note && <div style={{ color: 'var(--accent-orange)', fontSize: '0.75rem', marginTop: '3px' }}>{item.note}</div>}਍                              㰀⼀琀搀㸀ഀഀ
                              <td>਍                                笀猀攀氀攀挀琀攀搀匀甀瀀瀀氀椀攀爀 㼀 ⠀ഀഀ
                                  <span><span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.75rem' }}>${item.originalUnitPrice}</span> ${item.unitPrice}</span>਍                                ⤀ 㨀 ⠀ഀഀ
                                  `$${item.unitPrice}`਍                                ⤀紀ഀഀ
                              </td>਍                              㰀琀搀 猀琀礀氀攀㴀笀笀 昀漀渀琀圀攀椀最栀琀㨀 ✀戀漀氀搀✀ 紀紀㸀␀笀⠀椀琀攀洀⸀甀渀椀琀倀爀椀挀攀 ⨀ 椀琀攀洀⸀焀琀礀⤀⸀琀漀䰀漀挀愀氀攀匀琀爀椀渀最⠀⤀紀㰀⼀琀搀㸀ഀഀ
                            </tr>਍                          ⤀⤀紀ഀഀ
                        </tbody>਍                      㰀⼀琀愀戀氀攀㸀ഀഀ
                    </div>਍ഀഀ
                    {/* Recalculated Payments at bottom of Master Sheet */}਍                    㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀礀洀攀渀琀猀ⴀ最爀椀搀∀ 猀琀礀氀攀㴀笀笀 瀀愀搀搀椀渀最㨀 ✀　 ㄀⸀㔀爀攀洀✀ 紀紀㸀ഀഀ
                      {order.payments.map((p, pidx) => (਍                        㰀搀椀瘀 欀攀礀㴀笀瀀椀搀砀紀 猀琀礀氀攀㴀笀笀 戀愀挀欀最爀漀甀渀搀㨀 ✀瘀愀爀⠀ⴀⴀ戀最ⴀ猀攀挀漀渀搀愀爀礀⤀✀Ⰰ 瀀愀搀搀椀渀最㨀 ✀　⸀㠀爀攀洀 　⸀㘀爀攀洀✀Ⰰ 戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㈀瀀砀✀Ⰰ 戀漀爀搀攀爀㨀 ✀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ最氀愀猀猀ⴀ戀漀爀搀攀爀⤀✀ 紀紀㸀ഀഀ
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.milestone}</div>਍                          㰀搀椀瘀 猀琀礀氀攀㴀笀笀 昀漀渀琀匀椀稀攀㨀 ✀　⸀㤀爀攀洀✀Ⰰ 昀漀渀琀圀攀椀最栀琀㨀 ✀戀漀氀搀✀Ⰰ 挀漀氀漀爀㨀 瀀⸀猀琀愀琀甀猀 㴀㴀㴀 ∀倀愀椀搀∀ 㼀 ∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ最爀攀攀渀⤀∀ 㨀 ∀瘀愀爀⠀ⴀⴀ愀挀挀攀渀琀ⴀ漀爀愀渀最攀⤀∀Ⰰ 洀愀爀最椀渀吀漀瀀㨀 ✀㌀瀀砀✀ 紀紀㸀ഀഀ
                            ${p.amount.toLocaleString()} ({p.status === "Paid" ? (lang === "Cn" ? "뿯宽붿뿯粽" : "Paid") : (lang === "Cn" ? "鏈붿牳뿯붿뿯₽" : "Pending")})਍                          㰀⼀搀椀瘀㸀ഀഀ
                        </div>਍                      ⤀⤀紀ഀഀ
                    </div>਍                  㰀⼀搀椀瘀㸀ഀഀ
                </div>਍ഀഀ
                {/* Change Tracker Log Panel */}਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀∀㸀ഀഀ
                  <div className="panel-header">਍                    㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ琀椀琀氀攀∀㸀ഀഀ
                      {lang === "Cn" ? "뿯붿洝붿?붿樻洿瀹뿯½붿鏃뿯ソ織 (Change Tracker Log)" : "뿯붿洝붿?Change Tracker Log"}਍                    㰀⼀搀椀瘀㸀ഀഀ
                  </div>਍                  㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ戀漀搀礀∀ 猀琀礀氀攀㴀笀笀 洀愀砀䠀攀椀最栀琀㨀 ✀㄀㠀　瀀砀✀Ⰰ 漀瘀攀爀昀氀漀眀夀㨀 ✀愀甀琀漀✀ 紀紀㸀ഀഀ
                    {logs.map((log, lidx) => {਍                      挀漀渀猀琀 搀椀猀瀀氀愀礀䄀挀琀椀漀渀 㴀 氀愀渀最 㴀㴀㴀 ∀䌀渀∀ ഀഀ
                        ? log.action ਍                        㨀 ⠀氀漀最⸀愀挀琀椀漀渀䔀渀 ☀☀ ℀⼀嬀尀甀㐀攀　　ⴀ尀甀㤀昀愀㔀崀⼀⸀琀攀猀琀⠀氀漀最⸀愀挀琀椀漀渀䔀渀⤀ ഀഀ
                            ? log.actionEn ਍                            㨀 ⠀最攀琀䰀漀最䄀挀琀椀漀渀䔀渀⠀氀漀最⸀愀挀琀椀漀渀⤀ 簀簀 氀漀最⸀愀挀琀椀漀渀䔀渀 簀簀 氀漀最⸀愀挀琀椀漀渀⤀⤀㬀ഀഀ
                      return (਍                        㰀搀椀瘀 欀攀礀㴀笀氀椀搀砀紀 挀氀愀猀猀一愀洀攀㴀∀氀漀最ⴀ椀琀攀洀∀㸀ഀഀ
                          <span className="log-time">{log.time}</span>਍                          㰀猀瀀愀渀 挀氀愀猀猀一愀洀攀㴀∀氀漀最ⴀ甀猀攀爀∀㸀笀氀漀最⸀甀猀攀爀紀㨀㰀⼀猀瀀愀渀㸀ഀഀ
                          <span style={{ color: 'var(--text-secondary)' }}>਍                            笀搀椀猀瀀氀愀礀䄀挀琀椀漀渀紀ഀഀ
                          </span>਍                        㰀⼀搀椀瘀㸀ഀഀ
                      );਍                    紀⤀紀ഀഀ
                  </div>਍                㰀⼀搀椀瘀㸀ഀഀ
              </div>਍ഀഀ
              {/* Right Column: AI OpenClaw Core Thought Console */}਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 昀氀攀砀䐀椀爀攀挀琀椀漀渀㨀 ✀挀漀氀甀洀渀✀Ⰰ 最愀瀀㨀 ✀㄀⸀㔀爀攀洀✀ 紀紀㸀ഀഀ
                ਍                笀⼀⨀ 䤀渀琀攀最爀愀琀椀漀渀㨀 ㄀㜀ⴀ匀琀愀最攀 匀琀愀琀攀昀甀氀 嘀椀猀甀愀氀 倀氀愀礀最爀漀甀渀搀 ⨀⼀紀ഀഀ
                {renderInteractivePlayground()}਍ഀഀ
                {/* Default OpenClaw Thinking Logs Terminal */}਍                㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀最氀愀猀猀ⴀ挀愀爀搀∀㸀ഀഀ
                  <div className="panel-header" style={{ background: "rgba(124, 114, 103, 0.03)" }}>਍                    㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瀀愀渀攀氀ⴀ琀椀琀氀攀∀㸀ഀഀ
                      <span className="stage-badge-dot dot-ai" style={{ animation: "scanEffect 2s infinite alternate", background: "var(--accent-primary)" }}></span>਍                      笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀伀瀀攀渀䌀氀愀眀 씀㾓뿯墽捑붿붿붿붿붿붿楞쑧㚉剞뿯붿뿯璽 ⠀吀栀漀甀最栀琀ⴀ倀爀漀挀攀猀猀 吀攀爀洀椀渀愀氀⤀∀ 㨀 ∀伀瀀攀渀䌀氀愀眀 吀栀漀甀最栀琀ⴀ倀爀漀挀攀猀猀 吀攀爀洀椀渀愀氀∀紀ഀഀ
                    </div>਍                  㰀⼀搀椀瘀㸀ഀഀ
                  <div className="panel-body">਍                    㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀琀攀爀洀椀渀愀氀ⴀ挀漀渀猀漀氀攀∀㸀ഀഀ
                      {mockData.agentThoughtLogs[currentStage.id] ? (਍                        洀漀挀欀䐀愀琀愀⸀愀最攀渀琀吀栀漀甀最栀琀䰀漀最猀嬀挀甀爀爀攀渀琀匀琀愀最攀⸀椀搀崀⸀洀愀瀀⠀⠀琀氀漀最Ⰰ 琀椀搀砀⤀ 㴀㸀 笀ഀഀ
                          const roleLabel = lang === "Cn"਍                            㼀 ⠀琀氀漀最⸀爀漀氀攀 㴀㴀㴀 ∀琀栀漀甀最栀琀∀ 㼀 ∀붿뿯ঽ䥠 吀䠀伀唀䜀䠀吀붿뿯㾽 㨀 琀氀漀最⸀爀漀氀攀 㴀㴀㴀 ∀愀挀琀椀漀渀∀ 㼀 ∀붿뿯ঽ䍠吀䤀伀一 䌀䄀䰀䰀붿뿯㾽 㨀 琀氀漀最⸀爀漀氀攀 㴀㴀㴀 ∀漀戀猀攀爀瘀愀琀椀漀渀∀ 㼀 ∀붿뿯ⲽ䉠匀䔀刀嘀䄀吀䤀伀一붿뿯㾽 㨀 ∀붿뿯ㆽ奠匀吀䔀䴀붿뿯㾽⤀ഀഀ
                            : (tlog.role === "thought" ? "[AI THOUGHT] " : tlog.role === "action" ? "[ACTION CALL] " : tlog.role === "observation" ? "[OBSERVATION] " : "[SYSTEM] ");਍                          爀攀琀甀爀渀 ⠀ഀഀ
                            <div key={tidx} className={`terminal-line line-${tlog.role}`}>਍                              㰀猀瀀愀渀㸀☀最琀㬀 笀爀漀氀攀䰀愀戀攀氀紀㰀⼀猀瀀愀渀㸀ഀഀ
                              {lang === "Cn" ? tlog.text : (tlog.textEn || tlog.text)}਍                            㰀⼀搀椀瘀㸀ഀഀ
                          );਍                        紀⤀ഀഀ
                      ) : (਍                        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀琀攀爀洀椀渀愀氀ⴀ氀椀渀攀 氀椀渀攀ⴀ猀礀猀琀攀洀∀㸀ഀഀ
                          &gt; {lang === "Cn" ਍                            㼀 ∀붿뿯ㆽ奠匀吀䔀䴀붿뿯岽灡攀渀䌀氀愀眀 䐀愀攀洀漀渀 瘀㈀⸀㄀ 붿뿯붿붿붿浛붿붿뿯붿붿卽뿯붿ŝࡪ붿浗Ůᵿ繢붿붿뿯妽붿붿뿯妽붿栦换붿뿯½뿯₽뿯傽붿붿ㄧ洃붿?Supabase Webhook 瑙붿彂뿯붿? ਍                            㨀 ∀嬀匀夀匀吀䔀䴀崀 伀瀀攀渀䌀氀愀眀 䐀愀攀洀漀渀 瘀㈀⸀㄀ 匀琀愀渀搀戀礀⸀ 一漀 愀挀琀椀瘀攀 愀甀琀漀洀愀琀攀搀 琀愀猀欀 椀猀 戀漀甀渀搀 琀漀 琀栀攀 挀甀爀爀攀渀琀 猀琀愀最攀⸀ 䰀椀猀琀攀渀椀渀最 昀漀爀 匀甀瀀愀戀愀猀攀 圀攀戀栀漀漀欀 琀爀椀最最攀爀猀⸀∀紀ഀഀ
                        </div>਍                      ⤀紀ഀഀ
                      <div ref={terminalEndRef}></div>਍                    㰀⼀搀椀瘀㸀ഀഀ
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.5rem' }}>਍                      笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀椀뿯炽뿯ⲽ⁼伀瀀攀渀䌀氀愀眀 ⼀ 匀甀瀀愀戀愀猀攀 尀⥭≛煫뿯붿붿쭙㖓뿯⾽≰ 㨀 ∀倀漀眀攀爀攀搀 戀礀 伀瀀攀渀䌀氀愀眀 ☀ 匀甀瀀愀戀愀猀攀 䔀瘀攀渀琀 䄀爀挀栀椀琀攀挀琀甀爀攀∀紀ഀഀ
                    </div>਍                  㰀⼀搀椀瘀㸀ഀഀ
                </div>਍              㰀⼀搀椀瘀㸀ഀഀ
            </div>਍          㰀⼀搀椀瘀㸀ഀഀ
        </div>਍      ⤀紀ഀഀ
਍      笀⼀⨀ 䠀椀最栀ⴀ䔀渀搀 䜀氀愀猀猀洀漀爀瀀栀椀猀洀 嘀漀氀甀洀攀琀爀椀挀 ㌀䐀 倀愀挀欀椀渀最 匀椀洀甀氀愀琀椀漀渀 䴀漀搀愀氀 ⨀⼀紀ഀഀ
      {showVolumetricSimulation && (਍        㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瘀漀氀甀洀攀琀爀椀挀ⴀ洀漀搀愀氀ⴀ漀瘀攀爀氀愀礀∀㸀ഀഀ
          <div className="volumetric-modal-card">਍            笀⼀⨀ 䴀漀搀愀氀 䠀攀愀搀攀爀 ⨀⼀紀ഀഀ
            <div className="volumetric-modal-header">਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 愀氀椀最渀䤀琀攀洀猀㨀 ✀挀攀渀琀攀爀✀Ⰰ 最愀瀀㨀 ✀㄀　瀀砀✀ 紀紀㸀ഀഀ
                <span style={{ fontSize: '1.4rem' }}>뿯붿摝</span>਍                㰀搀椀瘀㸀ഀഀ
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-tech)', color: 'var(--text-primary)', fontWeight: '600', letterSpacing: '0.5px' }}>਍                    笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀㌀䐀 였붿붿뿯붿붿뿯Ꮍ՞붿붿噒뿯⚽扨뿯⪽뿯붿ű栁뿯㾽⠀䰀椀瘀攀 嘀漀氀甀洀攀琀爀椀挀 倀愀挀欀椀渀最 匀椀洀甀氀愀琀椀漀渀⤀∀ 㨀 ∀㌀䐀 嘀漀氀甀洀攀琀爀椀挀 䌀漀渀琀愀椀渀攀爀 倀愀挀欀椀渀最 匀椀洀甀氀愀琀椀漀渀 䌀漀渀猀漀氀攀∀紀ഀഀ
                  </h3>਍                  㰀瀀 猀琀礀氀攀㴀笀笀 洀愀爀最椀渀㨀 ✀㈀瀀砀 　 　 　✀Ⰰ 昀漀渀琀匀椀稀攀㨀 ✀　⸀㜀㈀爀攀洀✀Ⰰ 挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ猀攀挀漀渀搀愀爀礀⤀✀ 紀紀㸀ഀഀ
                    {lang === "Cn" ? "뿯妽붿湪뿯붿嬭붿鏂?Bluehost VPS 鏈뿯嶽뿯妽붿뿯붿細129.121.98.185 | 瀵붿뿯檽뿯涽夌붿娓뿯厽煋붿뿯嚽爢붿婄畻娉? : "Live executing on Bluehost VPS: 129.121.98.185 | Realtime WebGL Render & Heuristics"}਍                  㰀⼀瀀㸀ഀഀ
                </div>਍              㰀⼀搀椀瘀㸀ഀഀ
              ਍              㰀搀椀瘀 猀琀礀氀攀㴀笀笀 搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰ 愀氀椀最渀䤀琀攀洀猀㨀 ✀挀攀渀琀攀爀✀Ⰰ 最愀瀀㨀 ✀㄀㈀瀀砀✀Ⰰ 昀氀攀砀圀爀愀瀀㨀 ✀眀爀愀瀀✀Ⰰ 樀甀猀琀椀昀礀䌀漀渀琀攀渀琀㨀 ✀挀攀渀琀攀爀✀ 紀紀㸀ഀഀ
                {/* Open in New Tab Button */}਍                㰀戀甀琀琀漀渀 ഀഀ
                  onClick={() => window.open(`/loading-ai/?lang=${lang === "Cn" ? "cn" : "en"}`, '_blank')}਍                  猀琀礀氀攀㴀笀笀ഀഀ
                    background: 'none',਍                    戀漀爀搀攀爀㨀 ✀㄀瀀砀 猀漀氀椀搀 瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀✀Ⰰഀഀ
                    color: 'var(--text-primary)',਍                    瀀愀搀搀椀渀最㨀 ✀　⸀㐀爀攀洀 　⸀㠀爀攀洀✀Ⰰഀഀ
                    fontSize: '0.75rem',਍                    昀漀渀琀䘀愀洀椀氀礀㨀 ✀瘀愀爀⠀ⴀⴀ昀漀渀琀ⴀ琀攀挀栀⤀✀Ⰰഀഀ
                    cursor: 'pointer',਍                    搀椀猀瀀氀愀礀㨀 ✀昀氀攀砀✀Ⰰഀഀ
                    alignItems: 'center',਍                    最愀瀀㨀 ✀㔀瀀砀✀Ⰰഀഀ
                    borderRadius: '2px',਍                    琀爀愀渀猀椀琀椀漀渀㨀 ✀愀氀氀 　⸀㈀猀✀Ⰰഀഀ
                  }}਍                  漀渀䴀漀甀猀攀䔀渀琀攀爀㴀笀⠀攀⤀ 㴀㸀 笀 攀⸀琀愀爀最攀琀⸀猀琀礀氀攀⸀戀愀挀欀最爀漀甀渀搀䌀漀氀漀爀 㴀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀✀㬀 攀⸀琀愀爀最攀琀⸀猀琀礀氀攀⸀挀漀氀漀爀 㴀 ✀⌀昀昀昀昀昀昀✀㬀 紀紀ഀഀ
                  onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--text-primary)'; }}਍                㸀ഀഀ
                  <span style={{ fontSize: '0.85rem' }}>붿?/span> {lang === "Cn" ? "붿ㄦ뿯枽붿뿯喽爜뿯涽붿뿯厽灞뿯徽뿯亽琛? : "Open Fullscreen in New Tab"}਍                㰀⼀戀甀琀琀漀渀㸀ഀഀ
਍                笀⼀⨀ 䌀氀漀猀攀 䈀甀琀琀漀渀 ⨀⼀紀ഀഀ
                <button ਍                  漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 猀攀琀匀栀漀眀嘀漀氀甀洀攀琀爀椀挀匀椀洀甀氀愀琀椀漀渀⠀昀愀氀猀攀⤀紀ഀഀ
                  style={{਍                    戀愀挀欀最爀漀甀渀搀㨀 ✀渀漀渀攀✀Ⰰഀഀ
                    border: 'none',਍                    挀漀氀漀爀㨀 ✀瘀愀爀⠀ⴀⴀ琀攀砀琀ⴀ瀀爀椀洀愀爀礀⤀✀Ⰰഀഀ
                    cursor: 'pointer',਍                    昀漀渀琀匀椀稀攀㨀 ✀㄀⸀㐀爀攀洀✀Ⰰഀഀ
                    display: 'flex',਍                    愀氀椀最渀䤀琀攀洀猀㨀 ✀挀攀渀琀攀爀✀Ⰰഀഀ
                    justifyContent: 'center',਍                    眀椀搀琀栀㨀 ✀㌀㈀瀀砀✀Ⰰഀഀ
                    height: '32px',਍                    戀漀爀搀攀爀刀愀搀椀甀猀㨀 ✀㔀　─✀Ⰰഀഀ
                    transition: 'background-color 0.2s',਍                    氀椀渀攀䠀攀椀最栀琀㨀 ✀㄀✀ഀഀ
                  }}਍                  漀渀䴀漀甀猀攀䔀渀琀攀爀㴀笀⠀攀⤀ 㴀㸀 攀⸀琀愀爀最攀琀⸀猀琀礀氀攀⸀戀愀挀欀最爀漀甀渀搀䌀漀氀漀爀 㴀 ✀爀最戀愀⠀㈀㠀Ⰰ㈀㜀Ⰰ㈀㐀Ⰰ　⸀　㠀⤀✀紀ഀഀ
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}਍                㸀ഀഀ
                  붿?                </button>਍              㰀⼀搀椀瘀㸀ഀഀ
            </div>਍ഀഀ
            {/* Modal Body / Iframe Container (Perfect 100% Height Fill) */}਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瘀漀氀甀洀攀琀爀椀挀ⴀ洀漀搀愀氀ⴀ戀漀搀礀∀㸀ഀഀ
              <iframe ਍                猀爀挀㴀笀怀⼀氀漀愀搀椀渀最ⴀ愀椀⼀㼀氀愀渀最㴀␀笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀挀渀∀ 㨀 ∀攀渀∀紀怀紀 ഀഀ
                style={{਍                  眀椀搀琀栀㨀 ✀㄀　　─✀Ⰰഀഀ
                  height: '100%',਍                  昀氀攀砀㨀 ㄀Ⰰഀഀ
                  border: '1px solid var(--glass-border)',਍                  戀愀挀欀最爀漀甀渀搀㨀 ✀⌀䘀䘀䘀䘀䘀䘀✀Ⰰഀഀ
                  borderRadius: '2px',਍                  戀漀砀匀栀愀搀漀眀㨀 ✀椀渀猀攀琀 　 ㈀瀀砀 ㄀　瀀砀 爀最戀愀⠀　Ⰰ　Ⰰ　Ⰰ　⸀　㈀⤀✀Ⰰഀഀ
                  display: 'block'਍                紀紀ഀഀ
                title="3D Loading AI Simulation"਍              ⼀㸀ഀഀ
            </div>਍ഀഀ
            {/* Modal Footer */}਍            㰀搀椀瘀 挀氀愀猀猀一愀洀攀㴀∀瘀漀氀甀洀攀琀爀椀挀ⴀ洀漀搀愀氀ⴀ昀漀漀琀攀爀∀㸀ഀഀ
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>਍                笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀붿뿯ᖽ⁣붿뿯⺽婡ᬰ뿯ⶽ붿붿붿붿卵䑧뿯犽붿붿뿯施瑕栬붿붿屾뿯宽浣뿯徽乏뿯붿붿彲鏃嬭뿯綽뿯璽ㄦ뿯玽붿屾뿯宽붿뿯抽嵉뿯붿栨洺붿钩뿯纽昏뿯붿瑙뿯掽뿯₽? : "뿯붿挕 Controls: Scroll wheel to zoom, left click & drag to rotate, right click to pan."}਍              㰀⼀猀瀀愀渀㸀ഀഀ
              <button ਍                挀氀愀猀猀一愀洀攀㴀∀戀琀渀ⴀ瀀爀攀洀椀甀洀∀ ഀഀ
                style={{ padding: '0.5rem 1.5rem' }}਍                漀渀䌀氀椀挀欀㴀笀⠀⤀ 㴀㸀 猀攀琀匀栀漀眀嘀漀氀甀洀攀琀爀椀挀匀椀洀甀氀愀琀椀漀渀⠀昀愀氀猀攀⤀紀ഀഀ
              >਍                笀氀愀渀最 㴀㴀㴀 ∀䌀渀∀ 㼀 ∀숀붿붿붿붿㙾奞뿯㾽 㨀 ∀䌀氀漀猀攀 匀椀洀甀氀愀琀椀漀渀∀紀ഀഀ
              </button>਍            㰀⼀搀椀瘀㸀ഀഀ
          </div>਍        㰀⼀搀椀瘀㸀ഀഀ
      )}਍    㰀⼀搀椀瘀㸀ഀഀ
  );਍紀ഀഀ
਍攀砀瀀漀爀琀 搀攀昀愀甀氀琀 䄀瀀瀀㬀ഀഀ
