import { readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = process.cwd();
const reportDir = join(root, 'public', 'report');
const templatePath = join(root, 'scripts', 'report-template.zh.html');

const imageFiles = [
  'set furniture.png',
  'safty standard.png',
  'FireShot Capture 017 - Crafton AI - Premium Bespoke Furniture Engine - [129.121.98.185].png',
  'FireShot Capture 018 - Crafton AI - Premium Bespoke Furniture Engine - [129.121.98.185].png',
  'FireShot Capture 019 - Crafton AI - Premium Bespoke Furniture Engine - [129.121.98.185].png',
  'FireShot Capture 020 - Crafton AI - Premium Bespoke Furniture Engine - [129.121.98.185].png',
];

const translations = [
  ['<html lang="zh-CN">', '<html lang="en">'],
  ['Crafton 网站与制造管理平台开发进度汇报', 'Crafton Website & Manufacturing Platform Development Progress Report'],
  ['Crafton 网站开发进度汇报 | 2026.07', 'Crafton Development Progress Report | 2026.07'],
  ['aria-label="报告导航"', 'aria-label="Report navigation"'],
  ['aria-label="语言切换"', 'aria-label="Language switch"'],
  [
    '<span>中文</span>\n          <span aria-hidden="true">/</span>\n          <a href="index-en.html">English</a>',
    '<a href="index.html">中文</a>\n          <span aria-hidden="true">/</span>\n          <span>English</span>',
  ],
  ['进度概览', 'Overview'],
  ['主页更新', 'Website'],
  ['<a href="#workspace">管理后台</a>', '<a href="#workspace">Operations</a>'],
  ['<a href="#next">下一阶段</a>', '<a href="#next">Next steps</a>'],
  ['从品牌主页升级到覆盖 S01–S17 的订单运营工作台，项目已完成主要界面搭建，正式进入系统测试与流程验证阶段。', 'From the brand website to an operations workspace spanning S01–S17, the project has completed its core interface build and has now entered system testing and workflow validation.'],
  ['汇报日期：2026 年 7 月 16 日', 'Report date: 16 July 2026'],
  ['本阶段完成三项关键推进', 'Three key advances in this phase'],
  ['网站展示层与内部运营层同步演进。对外页面更聚焦家具产品与定制服务，对内管理控制台已经覆盖 17 阶段制造流程的主要业务界面。', 'The customer-facing website and internal operations platform have advanced together. The website now focuses more clearly on furniture products and bespoke services, while the management console covers the main interfaces across the 17-stage manufacturing workflow.'],
  ['<h3>新增 Set Furniture</h3>', '<h3>New Set Furniture section</h3>'],
  ['主页增加成套家具入口，以产品类别组织成熟家具款式，帮助客户更直接地浏览、选择并发起定制。', 'A new set-furniture entry point organises established furniture forms by category, helping clients browse, select and begin customisation more directly.'],
  ['调整主页品牌表达', 'Refined homepage messaging'],
  ['删除主页上有关 AI 的表述，将前台沟通重点回归高端定制家具、材料、工艺、合规与交付能力。', 'AI-related wording has been removed from the homepage so the customer message focuses on premium bespoke furniture, materials, craftsmanship, compliance and delivery capability.'],
  ['管理后台进入测试', 'Management console in testing'],
  ['管理员控制台主体已经基本搭建完成，现阶段重点转入数据联调、权限验证、异常流程和真实项目测试。', 'The main management console is substantially complete. Current work has moved to data integration, permission validation, exception flows and testing with realistic projects.'],
  ['主页内容更聚焦产品与客户决策', 'Homepage content now supports product-led decisions'],
  ['新增产品分类展示后，客户可以从成熟家具形态出发，再进一步定制尺寸、材质、颜色及区域合规要求。主页的沟通语言也完成调整，减少技术概念对客户决策的干扰。', 'The new category presentation lets clients begin with established furniture forms and then tailor dimensions, materials, colours and regional compliance requirements. Homepage language has also been refined to keep technical concepts from distracting from the buying decision.'],
  ['主页新增 Set Furniture 区块', 'New Set Furniture section on the homepage'],
  ['放大查看 Set Furniture 截图', 'Enlarge the Set Furniture screenshot'],
  ['Crafton 主页新增 Set Furniture 家具分类区块', 'The new Set Furniture category section on the Crafton homepage'],
  ['Set Furniture 产品入口', 'Set Furniture product entry point'],
  ['首批页面展示六个核心家具类别，为后续产品详情、配置选项与询价流程建立统一入口。', 'The initial release presents six core furniture categories and creates a consistent entry point for product details, configuration options and quotation requests.'],
  ['沙发与休闲座椅', 'Sofas and lounge seating'],
  ['边桌与餐桌', 'Side tables and dining tables'],
  ['餐椅与媒体柜', 'Dining chairs and media units'],
  ['支持尺寸、材料与颜色定制', 'Dimensions, materials and colours can be tailored'],
  ['合规要求前置', 'Compliance captured from the start'],
  ['订单提交表单已加入英国、美国、欧盟及澳新市场的家具防火与安全标准选项。客户需求从入口处结构化记录，为后续规格审核、询价和验收提供一致依据。', 'The order form now includes furniture fire and safety standards for the UK, US, EU, Australia and New Zealand. Requirements are captured in a structured format from the outset, providing a consistent basis for specification review, quotation and inspection.'],
  ['订单表单中的区域安全标准选项', 'Regional safety-standard options in the order form'],
  ['放大查看安全标准截图', 'Enlarge the safety-standard screenshot'],
  ['订单提交表单中的区域安全标准下拉选项', 'Regional safety-standard selection in the order form'],
  ['管理员控制台已覆盖 17 阶段制造流程', 'The management console now spans all 17 manufacturing stages'],
  ['后台界面已经形成从客户订单接收到最终归档的完整工作区结构。各业务阶段已具备状态、数据区、审核动作与操作入口，目前正通过测试项目验证前后阶段的数据衔接。', 'The back-office interface now provides a complete workspace structure from client order intake through final archive. Each stage includes status, data, review actions and operating controls, while test projects are being used to validate data hand-offs between stages.'],
  ['17 阶段管理后台模块', '17-stage management console modules'],
  ['订单接收与审核', 'Order intake and review'],
  ['客户资料、缺失项检查、BOM 与双语规格草稿、最终审批。', 'Client data, missing-information checks, BOM and bilingual specification drafts, and final approval.'],
  ['询价与供应商决策', 'RFQ and supplier decision'],
  ['RFQ 生成与发送、报价标准化对比、最优供应商审批。', 'RFQ generation and dispatch, normalised bid comparison and winning-supplier approval.'],
  ['生产与质量控制', 'Production and quality control'],
  ['生产计划、延期风险、进度证据、视觉质检与放行。', 'Production planning, delay risks, progress evidence, visual inspection and release.'],
  ['出货与交付归档', 'Shipping, handover and archive'],
  ['装柜、单证、物流追踪、拆分交付、客户交接与审计归档。', 'Container loading, documentation, shipment tracking, split delivery, client handover and audit archive.'],
  ['S01–S05 客户订单接收与审批', 'S01–S05 Client order intake and approval'],
  ['放大查看订单接收与审批页面', 'Enlarge the order intake and approval workspace'],
  ['管理员控制台订单接收与审批页面', 'Management console order intake and approval workspace'],
  ['客户订单接收与审批', 'Client order intake and approval'],
  ['聚合客户资料、上传文件、规格缺口、BOM 草稿与 Cho 最终审批。', 'Brings together client data, uploaded files, specification gaps, the BOM draft and Cho final approval.'],
  ['S06–S08 供应商询价与报价决策', 'S06–S08 Supplier RFQ and quotation decision'],
  ['放大查看供应商询价与报价页面', 'Enlarge the supplier RFQ and quotation workspace'],
  ['管理员控制台供应商询价和报价对比页面', 'Management console supplier RFQ and quotation comparison workspace'],
  ['供应商询价与报价决策', 'Supplier RFQ and quotation decision'],
  ['覆盖供应商目录、标准 RFQ、报价标准化比较与人工选择供应商。', 'Covers the supplier directory, standard RFQ, normalised quotation comparison and human supplier selection.'],
  ['S09–S11 生产进度与质量控制', 'S09–S11 Production progress and quality control'],
  ['放大查看生产进度与质量控制页面', 'Enlarge the production and quality-control workspace'],
  ['管理员控制台生产进度和质量控制页面', 'Management console production progress and quality-control workspace'],
  ['生产进度与质量控制', 'Production progress and quality control'],
  ['包含生产计划、阶段节点、延期风险管理及视觉质量检查入口。', 'Includes production planning, stage milestones, delay-risk management and visual quality-inspection controls.'],
  ['S12–S17 出货、交接与归档', 'S12–S17 Shipping, handover and archive'],
  ['放大查看出货交接与归档页面', 'Enlarge the shipping, handover and archive workspace'],
  ['管理员控制台出货交接和归档页面', 'Management console shipping, handover and archive workspace'],
  ['出货、交接与归档', 'Shipping, handover and archive'],
  ['覆盖装柜计划、出口单证、运输追踪、数量调整、客户交接和审计归档。', 'Covers container loading, export documents, shipment tracking, quantity adjustments, client handover and audit archive.'],
  ['当前状态：基础搭建完成，进入测试阶段', 'Current status: core build complete, testing underway'],
  ['页面结构和主要业务入口已经具备；现阶段将重点验证真实数据、角色权限、跨阶段状态流转、异常处理与操作记录。', 'The page structure and main operating controls are in place. Testing now focuses on real data, role permissions, cross-stage status transitions, exception handling and audit records.'],
  ['下一阶段工作重点', 'Priorities for the next phase'],
  ['完成端到端流程测试', 'Complete end-to-end workflow testing'],
  ['使用真实测试订单验证上传、审核、询价、生产、质检到出货归档的数据闭环。', 'Use realistic test orders to validate the complete data loop from upload and review through RFQ, production, quality inspection, shipping and archive.'],
  ['完善权限与审批机制', 'Complete permissions and approval controls'],
  ['验证客户、管理员和供应商的角色边界，以及关键节点的人工确认与操作留痕。', 'Validate the boundaries between client, administrator and supplier roles, together with human approval and audit records at key gates.'],
  ['优化异常状态与提示', 'Improve exception states and guidance'],
  ['补全资料缺失、报价异常、延期、质检不通过和单证缺失等业务分支。', 'Complete the business branches for missing data, quotation anomalies, delays, failed inspections and missing documents.'],
  ['根据测试反馈优化体验', 'Refine the experience from test feedback'],
  ['调整后台信息密度、操作顺序、移动端表现，并准备下一轮内部验收。', 'Adjust information density, action order and mobile behaviour, then prepare the next internal acceptance review.'],
  ['aria-label="截图放大预览"', 'aria-label="Enlarged screenshot preview"'],
  ['截图预览', 'Screenshot preview'],
  ['aria-label="关闭预览"', 'aria-label="Close preview"'],
];

function translate(source) {
  return translations.reduce((html, [from, to]) => html.replaceAll(from, to), source);
}

async function inlineImages(source) {
  let html = source;

  for (const fileName of imageFiles) {
    const extension = extname(fileName).slice(1).toLowerCase();
    const mime = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : `image/${extension}`;
    const bytes = await readFile(join(reportDir, fileName));
    const dataUri = `data:${mime};base64,${bytes.toString('base64')}`;

    html = html
      .replaceAll(`url("${fileName}")`, `url("${dataUri}")`)
      .replaceAll(`src="${fileName}"`, `src="${dataUri}"`);
  }

  return html;
}

const chineseTemplate = await readFile(templatePath, 'utf8');
const englishTemplate = translate(chineseTemplate);

const [chineseReport, englishReport] = await Promise.all([
  inlineImages(chineseTemplate),
  inlineImages(englishTemplate),
]);

await Promise.all([
  writeFile(join(reportDir, 'index.html'), chineseReport, 'utf8'),
  writeFile(join(reportDir, 'index-en.html'), englishReport, 'utf8'),
]);

console.log(`Built self-contained reports:\n- public/report/index.html\n- public/report/index-en.html`);
