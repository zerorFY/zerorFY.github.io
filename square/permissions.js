/* 由 build_data.py 生成，勿手改 */
window.PERM_DATA = {
 "version": "2026-09-15",
 "title": "Square Permission Set 执行手册",
 "subtitle": "Sales / Office / Owner 权限配置参考（加拿大）",
 "intro": "说明：本手册按 Square 加拿大公开帮助文档、Developer 文档及当前权限界面整理。Square 会按订阅套餐、已启用产品和 UI 更新动态显示权限项；“功能范围”表示官方明确支持该功能范围，但公开手册未证明它一定是单独 checkbox；“未公开”表示公开手册没有完整公布细项，应以账户实际页面为准。",
 "roles": [
  {
   "role": "Owner",
   "form": "Account Owner / Full administrative control",
   "principle": "不建立额外 Owner Permission Set；保留公司、资金、订阅、权限和开发者最高控制权。"
  },
  {
   "role": "Sales",
   "form": "Custom Permission Set #1",
   "principle": "开放销售、订单、客户查询等日常前台操作；退款、税、成本、库存修改、系统设置严格限制。"
  },
  {
   "role": "Office",
   "form": "Custom Permission Set #2",
   "principle": "开放订单、商品、库存、收货、PO、Invoice、报表等办公室后台工作；银行、Owner 安全项和开发 Token 仍关闭。"
  }
 ],
 "markers": "标记说明：已确认 = 官方公开手册明确确认；  功能范围 = 官方确认功能范围但不一定是独立 checkbox；  未公开 = 官方未公开完整细项；  “有限/按需/审批” = 建议根据内部流程谨慎开放。",
 "templateNote": "适合“先测试 Square、只替换 ACE、VIVA 保留”的初始版本；后续仓库角色独立时再建立新 Permission Set 或升级权限套餐。",
 "menus": [
  {
   "no": "01",
   "key": "checkout",
   "en": "Checkout",
   "zh": "收银 / 结账",
   "purpose": "控制销售交易、收款、税、折扣、现金抽屉和 Open Ticket。",
   "template": {
    "sales": "开（按上表限制敏感项）",
    "office": "开"
   },
   "items": [
    {
     "key": "checkout.take_payments",
     "en": "Take payments",
     "zh": "收取付款",
     "desc": "允许员工在 Square POS 中完成正常销售收款，包括现金、银行卡、Tap 等已启用的付款方式。启用后员工可以把当前购物车/订单真正结账；如果关闭，员工即使能看商品和订单，也不能完成收款。",
     "confirm": "已确认",
     "sales": "开",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "checkout.take_itemized_payments",
     "en": "Take itemized payments",
     "zh": "按商品明细收款",
     "desc": "允许按购物车中的具体 SKU、数量、价格和税费进行收款，并把销售记录到对应商品上。适合你们正常灯具/家具销售，因为后续库存、商品销量和报表都会对应到具体 SKU，而不是只留下一个总金额。",
     "confirm": "已确认",
     "sales": "开",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "checkout.manually_enter_custom_amounts",
     "en": "Manually enter custom amounts",
     "zh": "手动输入自定义金额",
     "desc": "允许不选择任何商品，直接输入一个自定义金额进行收款，例如直接收 $500。虽然方便收杂费或临时款项，但不会天然对应某个 SKU，容易让商品销量、库存和订单分析脱节，因此普通销售通常不建议开放。",
     "confirm": "已确认",
     "sales": "关",
     "office": "有限",
     "sensitive": false
    },
    {
     "key": "checkout.use_virtual_terminal",
     "en": "Use Virtual Terminal",
     "zh": "使用虚拟终端",
     "desc": "允许员工在浏览器里的 Square Dashboard 使用 Virtual Terminal，手工输入客户银行卡信息进行远程/无卡收款。适合电话订单或客户不在现场的情况，但涉及手工录卡和更高的支付风险，通常只给办公室或受信任人员。",
     "confirm": "已确认",
     "sales": "关",
     "office": "有限",
     "sensitive": false
    },
    {
     "key": "checkout.cancel_transactions",
     "en": "Cancel transactions",
     "zh": "取消交易",
     "desc": "允许员工取消正在处理、尚未完成的交易。这个权限会直接影响销售记录和收款流程，适合处理客户临时放弃购买或操作错误，但普通销售如果频繁使用会增加审计难度。",
     "confirm": "已确认",
     "sales": "关",
     "office": "开/有限",
     "sensitive": false
    },
    {
     "key": "checkout.back_out_of_customer_facing_payment_screen",
     "en": "Back out of customer-facing payment screen",
     "zh": "退出顾客付款界面",
     "desc": "允许付款流程进入顾客端界面后退回上一步，例如客户临时改付款方式、金额或商品。它不会等于退款，而是让尚未完成的交易返回修改，所以一般销售可以开放。",
     "confirm": "已确认",
     "sales": "开",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "checkout.manually_adjust_taxes_during_a_transaction",
     "en": "Manually adjust taxes during a transaction",
     "zh": "交易时手动调整税费",
     "desc": "允许员工在结账时手工调整、取消或改变税费。对加拿大零售来说这会直接影响 HST/GST/PST 等税务记录，因此除非有明确业务场景，否则应限制给管理人员。",
     "confirm": "已确认",
     "sales": "关",
     "office": "有限",
     "sensitive": false
    },
    {
     "key": "checkout.apply_restricted_discounts_and_comps",
     "en": "Apply restricted discounts and comps",
     "zh": "使用受限制折扣/免单",
     "desc": "允许员工使用被设置为“受限制”的折扣、Comp 或特殊优惠，即使普通员工默认不能使用。适合经理授权的大额折扣、特殊补偿或内部优惠；开放给普通销售会增加随意让价风险。",
     "confirm": "已确认",
     "sales": "关",
     "office": "开/有限",
     "sensitive": false
    },
    {
     "key": "checkout.add_customer_to_a_sales_transaction",
     "en": "Add customer to a sales transaction",
     "zh": "销售单关联客户",
     "desc": "允许在结账时把这笔销售关联到 Customer Directory 中现有客户，或按权限新增客户。这样以后可以按客户查看购买历史、订单和沟通记录，也方便 VIVA/CRM 做客户对应。",
     "confirm": "已确认",
     "sales": "开",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "checkout.open_cash_drawer_outside_of_a_transaction",
     "en": "Open cash drawer outside of a transaction",
     "zh": "非交易状态打开钱箱",
     "desc": "允许在没有销售交易的情况下直接打开现金抽屉，例如换零钱或盘点现金。因为无法天然对应一笔销售，现金管理风险较高，通常只给主管或办公室人员。",
     "confirm": "已确认",
     "sales": "关",
     "office": "有限",
     "sensitive": false
    },
    {
     "key": "checkout.view_own_open_tickets",
     "en": "View own open tickets",
     "zh": "查看本人未结单",
     "desc": "允许员工查看自己创建、但尚未结账或关闭的 Open Tickets。适合客户先选货、稍后付款或销售暂存订单，员工可以继续处理自己之前未完成的单。",
     "confirm": "已确认",
     "sales": "开",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "checkout.view_all_team_members_open_tickets",
     "en": "View all team members' open tickets",
     "zh": "查看所有员工未结单",
     "desc": "允许员工查看其他员工创建的所有未结 Open Tickets，而不只看自己的。适合销售之间交接客户、办公室协助处理订单或客户换销售继续结账；同时意味着能看到其他人的未完成订单。",
     "confirm": "已确认",
     "sales": "开",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "checkout.delete_or_void_saved_items_in_open_tickets",
     "en": "Delete or void saved items in open tickets",
     "zh": "删除/作废未结单商品",
     "desc": "允许从已经保存的 Open Ticket 中删除或作废商品。这个操作会改变原本已暂存的订单内容，可能影响客户承诺、库存预留或后续追踪，因此普通销售通常不建议开放。",
     "confirm": "已确认",
     "sales": "关",
     "office": "开/有限",
     "sensitive": false
    }
   ]
  },
  {
   "no": "02",
   "key": "orders",
   "en": "Orders",
   "zh": "订单",
   "purpose": "控制订单查看、修改、履约、发货、取消和退款等订单管理工作。",
   "template": {
    "sales": "开",
    "office": "开"
   },
   "items": [
    {
     "key": "orders.take_and_manage_orders",
     "en": "Take and manage orders",
     "zh": "接单和管理订单",
     "desc": "允许员工查看并管理 Square 中的订单，例如 POS 订单、线上订单、Bills/Tabs 等。通常包含打开订单、查看状态、继续处理和更新订单，是销售与办公室日常订单操作的核心权限。",
     "confirm": "已确认",
     "sales": "开",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "orders.manage_fulfillment",
     "en": "Manage fulfillment",
     "zh": "管理履约",
     "desc": "允许管理员工订单的履约过程，包括 Pickup、Delivery、Shipment 等状态。员工可以把订单从“待处理”推进到“准备中/已取货/已发货”等阶段，因此更适合办公室、仓库或负责交付的人。",
     "confirm": "功能范围",
     "sales": "有限",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "orders.update_shipment_status_info",
     "en": "Update shipment status/info",
     "zh": "修改发货状态/信息",
     "desc": "允许修改发货相关信息，例如承运商、Tracking Number、发货状态或履约状态。启用后员工可以更新客户看到的物流进度，所以应给真正负责发货/跟单的人，而不是所有销售。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "orders.print_packing_slips",
     "en": "Print packing slips",
     "zh": "打印装箱单",
     "desc": "允许打印 Packing Slip/装箱单，供仓库拣货、核对和随货使用。它主要影响仓库和发货流程，不改变订单金额，但会让员工访问并输出订单明细。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "orders.split_shipments",
     "en": "Split shipments",
     "zh": "拆分发货",
     "desc": "允许把同一张订单拆成多个包裹或多次发货，例如部分商品先到、剩余商品后到。适合家具灯具这类经常分批到货的业务，但需要和你们 VIVA/供应商履约逻辑保持一致。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "orders.cancel_orders",
     "en": "Cancel orders",
     "zh": "取消订单",
     "desc": "允许在订单尚未完全履约前取消订单。取消可能影响客户承诺、库存、付款和后续采购，因此普通销售最好只允许申请或经审批处理，办公室可按流程开放。",
     "confirm": "功能范围",
     "sales": "关/审批",
     "office": "开/有限",
     "sensitive": false
    },
    {
     "key": "orders.refund_orders",
     "en": "Refund orders",
     "zh": "订单退款",
     "desc": "允许对订单关联的付款发起退款。它不只是修改订单状态，还会产生真实资金退回，因此属于高风险权限，通常只给办公室/主管并配合退款审批。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "开/有限",
     "sensitive": false
    }
   ]
  },
  {
   "no": "03",
   "key": "transactions",
   "en": "Transactions",
   "zh": "交易记录",
   "purpose": "控制查看已完成交易以及退款、无原单退款、结算待小费交易。",
   "template": {
    "sales": "查看开；退款审批",
    "office": "开；无原单退款建议关"
   },
   "items": [
    {
     "key": "transactions.view_completed_sales",
     "en": "View completed sales",
     "zh": "查看已完成销售",
     "desc": "允许查看已经完成、付款成功或结算完成的历史销售交易，包括金额、时间、付款方式和相关商品等。普通销售需要查历史单时可以开放，但要注意他们会看到一定范围的销售数据。",
     "confirm": "已确认",
     "sales": "开",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "transactions.issue_refunds",
     "en": "Issue refunds",
     "zh": "正常退款",
     "desc": "允许从 Square 中已有的原始交易发起正常退款，并把退款关联回原单。由于有原交易可追踪，审计性较好，但仍会直接退回客户资金，建议设置审批或只给受信任人员。",
     "confirm": "已确认",
     "sales": "关/审批",
     "office": "开/有限",
     "sensitive": false
    },
    {
     "key": "transactions.issue_unlinked_refunds",
     "en": "Issue unlinked refunds",
     "zh": "无原单退款",
     "desc": "允许在找不到或不关联原始交易的情况下直接退款。因为退款没有对应原销售作为依据，Square 本身也把它视为高风险操作，原则上只应给极少数管理人员。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/谨慎",
     "sensitive": true
    },
    {
     "key": "transactions.settle_transactions_awaiting_tip",
     "en": "Settle transactions awaiting tip",
     "zh": "结算待小费交易",
     "desc": "允许把仍处于等待小费或最终结算状态的交易完成结算。主要适用于餐饮/小费场景；你们零售业务通常用不到，除非以后启用了相关付款流程。",
     "confirm": "已确认",
     "sales": "关",
     "office": "有限",
     "sensitive": false
    }
   ]
  },
  {
   "no": "04",
   "key": "house_accounts",
   "en": "House Accounts",
   "zh": "客户赊账账户",
   "purpose": "用于客户先拿货/消费、以后统一结算的挂账账户。",
   "template": {
    "sales": "按需",
    "office": "按需"
   },
   "items": [
    {
     "key": "house_accounts.view_and_check_out_a_house_account",
     "en": "View and check out a house account",
     "zh": "查看并使用赊账账户",
     "desc": "允许查看客户的 House Account，并在结账时把本次消费记到该客户的赊账账户，而不是现场立即付款。适合有信用额度、月结或长期客户账期的业务；销售发生时仍会形成销售记录和应收余额。",
     "confirm": "已确认",
     "sales": "按需",
     "office": "开/按需",
     "sensitive": false
    },
    {
     "key": "house_accounts.create_edit_and_invoice_house_accounts",
     "en": "Create, edit and invoice house accounts",
     "zh": "建立/修改/结算赊账账户",
     "desc": "允许建立、修改 House Account，设置信用额度、查看余额，并向客户发送结算/账单。这个权限相当于管理客户赊账体系，不只是“看账”，因此更适合办公室或财务负责人。",
     "confirm": "已确认",
     "sales": "关",
     "office": "开/按需",
     "sensitive": false
    }
   ]
  },
  {
   "no": "05",
   "key": "reports",
   "en": "Reports",
   "zh": "报表",
   "purpose": "控制销售、商品、折扣、税、现金、争议等经营报表的查看和处理权限。",
   "template": {
    "sales": "基础/个人范围",
    "office": "详细报表开"
   },
   "items": [
    {
     "key": "reports.view_limited_reporting",
     "en": "View limited reporting",
     "zh": "查看基础报表",
     "desc": "允许查看较基础、范围较窄的销售摘要，通常用于员工了解自己或当前 POS 的基本表现。相比详细报表，暴露的经营数据更少，适合需要看基础数据但不应看到公司完整经营信息的员工。",
     "confirm": "已确认",
     "sales": "有限",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "reports.view_detailed_sales_reporting",
     "en": "View detailed sales reporting",
     "zh": "查看详细销售报表",
     "desc": "允许查看 Dashboard 中更完整的销售分析，例如历史趋势、商品/分类表现、折扣、税、付款方式等。这个权限会暴露大量经营和业绩信息，通常只给办公室、管理层或需要分析数据的人。",
     "confirm": "已确认",
     "sales": "关",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "reports.view_cash_drawer_reporting",
     "en": "View cash drawer reporting",
     "zh": "查看钱箱报告",
     "desc": "允许查看现金抽屉的起始金额、现金收入、现金支出和结余，用来核对每日现金。适合负责开关班、对账或现金盘点的人，不建议给不负责现金管理的普通销售。",
     "confirm": "已确认",
     "sales": "关/按需",
     "office": "开/按需",
     "sensitive": false
    },
    {
     "key": "reports.view_disputes",
     "en": "View disputes",
     "zh": "查看付款争议",
     "desc": "允许查看信用卡争议/Chargeback 的状态、金额和相关交易，但不一定能提交处理。适合需要知道争议情况的办公室人员。",
     "confirm": "已确认",
     "sales": "关",
     "office": "开/按需",
     "sensitive": false
    },
    {
     "key": "reports.respond_to_disputes",
     "en": "Respond to disputes",
     "zh": "处理付款争议",
     "desc": "允许对 Chargeback/付款争议采取行动，例如接受争议或上传证据进行反驳。因为会直接影响资金和商户风险记录，应只给负责支付争议的管理人员。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/管理层",
     "sensitive": true
    }
   ]
  },
  {
   "no": "06",
   "key": "banking",
   "en": "Banking",
   "zh": "银行 / 资金",
   "purpose": "控制 Square 入账、转账和银行相关财务信息。",
   "template": {
    "sales": "关",
    "office": "原则上关或只读"
   },
   "items": [
    {
     "key": "banking.view_transfer_reporting",
     "en": "View transfer reporting",
     "zh": "查看转账/入账报告",
     "desc": "允许查看 Square 销售款如何汇总成银行入账/Transfer，以及每笔入账对应哪些交易。这个权限有助于办公室对账，但会暴露资金流和营业额数据，普通销售不应开放。",
     "confirm": "已确认",
     "sales": "关",
     "office": "开/按需",
     "sensitive": false
    },
    {
     "key": "banking.other_banking_controls",
     "en": "Other Banking controls",
     "zh": "其他 Banking 权限",
     "desc": "Square 加拿大公开手册没有完整列出你账户当前 Banking 页面全部细分权限。原则上凡涉及银行账户、Square Balance、Transfer 或资金去向的权限都属于高敏感权限，应以实际 UI 为准并只给 Owner/财务负责人。",
     "confirm": "未公开",
     "sales": "关",
     "office": "谨慎",
     "sensitive": false
    }
   ]
  },
  {
   "no": "07",
   "key": "customers",
   "en": "Customers",
   "zh": "客户",
   "purpose": "控制 Customer Directory 的查看、新建、修改、分组和清理。",
   "template": {
    "sales": "开",
    "office": "开"
   },
   "items": [
    {
     "key": "customers.view_customers",
     "en": "View customers",
     "zh": "查看客户",
     "desc": "允许查看 Customer Directory 中的客户档案、联系方式、购买记录和可见备注等。适合销售查客户历史和跟进，但如果客户资料包含敏感备注，要注意访问范围。",
     "confirm": "已确认",
     "sales": "开",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "customers.create_new_customers",
     "en": "Create new customers",
     "zh": "新建客户",
     "desc": "允许新建 Customer Directory 客户资料，例如姓名、电话、Email、地址等。适合销售在开单或跟进时建立客户，但应避免重复建档，最好统一客户录入规则。",
     "confirm": "已确认",
     "sales": "开",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "customers.edit_customer_data",
     "en": "Edit customer data",
     "zh": "修改客户",
     "desc": "允许修改现有客户的联系方式、地址、备注和其他可编辑资料。错误修改可能影响送货、联系和 CRM 对应，因此可开放给销售，但最好有统一规范。",
     "confirm": "已确认",
     "sales": "开/有限",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "customers.manage_manual_and_smart_groups",
     "en": "Manage manual and smart groups",
     "zh": "管理客户分组",
     "desc": "允许建立和维护客户分组，例如手动 VIP 组或按条件自动生成的 Smart Group。主要用于客户分类、营销和后续筛选，不是普通销售日常必需权限。",
     "confirm": "已确认",
     "sales": "关",
     "office": "开/按需",
     "sensitive": false
    },
    {
     "key": "customers.merge_delete_customer_profiles",
     "en": "Merge/delete customer profiles",
     "zh": "合并/删除客户档案",
     "desc": "允许合并重复客户档案或删除客户资料。合并会改变历史数据归属，删除可能不可逆，因此应限制给办公室或数据管理员。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "开/谨慎",
     "sensitive": false
    }
   ]
  },
  {
   "no": "08",
   "key": "messages",
   "en": "Messages",
   "zh": "客户消息",
   "purpose": "通过 Square Messages 与客户进行短信/邮件等沟通。",
   "template": {
    "sales": "按需",
    "office": "按需"
   },
   "items": [
    {
     "key": "messages.view_and_send_messages_to_customers",
     "en": "View and send messages to customers",
     "zh": "查看并发送客户消息",
     "desc": "允许通过 Square Messages 查看并回复客户消息，例如来自收据、Invoice、Online Order 或网站联系表单的沟通。适合客服/办公室使用；如果销售使用，应明确谁负责回复，避免多人重复回复同一客户。",
     "confirm": "已确认",
     "sales": "按需",
     "office": "按需",
     "sensitive": false
    }
   ]
  },
  {
   "no": "09",
   "key": "items",
   "en": "Items",
   "zh": "商品与库存",
   "purpose": "控制 SKU、价格、分类、库存、收货、盘点、采购、供应商和库存调拨等。",
   "template": {
    "sales": "只读为主；修改全关",
    "office": "商品/库存/收货/PO 开"
   },
   "items": [
    {
     "key": "items.manage_items",
     "en": "Manage items",
     "zh": "管理商品",
     "desc": "允许建立和修改商品主数据，例如商品名称、SKU、价格、分类、变体等。它相当于控制 Square 商品资料库，错误修改会影响 POS、网站、电商和 API 同步，因此不应给普通销售。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "items.update_item_availability",
     "en": "Update item availability",
     "zh": "修改商品可售状态",
     "desc": "允许控制某个商品在指定 Location 是否可售/可用，而不一定直接改库存数量。常用于暂停售卖、缺货隐藏或门店差异化商品，开放后会影响前端是否能卖这个商品。",
     "confirm": "已确认",
     "sales": "关",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "items.update_modifier_availability",
     "en": "Update modifier availability",
     "zh": "修改选项可售状态",
     "desc": "允许控制 Modifier 或商品选项是否可选，例如某种颜色、附件或加购选项暂时停用。对有复杂变体的商品有用，但你们如果主要通过 SKU/Variation 管理，使用频率可能较低。",
     "confirm": "已确认",
     "sales": "关",
     "office": "开/按需",
     "sensitive": false
    },
    {
     "key": "items.update_stock_counts",
     "en": "Update stock counts",
     "zh": "修改库存数量",
     "desc": "允许直接修改商品的 On Hand 库存数量。这个操作会改变 Square 认为的正式库存，可能影响销售、报表和电商同步，因此应该只给办公室/库存管理员。",
     "confirm": "已确认",
     "sales": "关",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "items.receive_stock",
     "en": "Receive stock",
     "zh": "收货入库",
     "desc": "允许把到货商品正式收进 Square 库存，通常用于采购到货或补货。收货后 On Hand 会增加，是仓库/办公室核心操作，必须与实际到货数量核对。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "items.adjust_stock",
     "en": "Adjust stock",
     "zh": "调整库存",
     "desc": "允许因为损坏、盘亏、盘盈、内部使用等原因手工调整库存。它不是正常采购收货或销售扣减，所以每次调整最好保留明确原因，避免库存被随意改动。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "items.count_inventory",
     "en": "Count inventory",
     "zh": "库存盘点",
     "desc": "允许执行库存盘点/Stocktake，把系统库存与实际数量核对并更新。适合仓库盘点人员；盘点结果可能批量改变库存，因此不应给无关员工。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "items.purchase_orders",
     "en": "Purchase orders",
     "zh": "采购订单",
     "desc": "允许创建、查看或处理 Square Retail 的采购订单（具体可操作项依你账户 UI/套餐而定）。用于向供应商下单、跟踪订货和后续收货，但 Square 公开 API 对 PO 的支持仍有限，与你们 VIVA 对接时需要单独设计。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "items.vendors",
     "en": "Vendors",
     "zh": "供应商",
     "desc": "允许管理供应商资料，例如 Vendor、Vendor Code、成本和相关采购信息。供应商数据会影响采购和成本分析，适合办公室/采购人员，不建议销售修改。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "items.transfer_orders",
     "en": "Transfer orders",
     "zh": "库存调拨单",
     "desc": "允许在不同 Location 之间创建、发送、接收库存调拨。适合门店与仓库之间移货；操作会改变各 Location 的库存，因此需要实际物流与系统状态同步。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "开",
     "sensitive": false
    }
   ]
  },
  {
   "no": "10",
   "key": "online",
   "en": "Online",
   "zh": "Square Online 网站",
   "purpose": "控制 Square 自带网站/电商的编辑、预览、发布和下线。",
   "template": {
    "sales": "关",
    "office": "关，除非负责电商"
   },
   "items": [
    {
     "key": "online.online_permission",
     "en": "Online permission",
     "zh": "Square Online 总权限",
     "desc": "允许进入 Square Online 网站/电商后台，并使用其相关管理功能。这个总权限可能让员工接触网站商品、订单和设置，因此如果你们继续使用自己的外部网站，通常无需给普通员工开放。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/电商负责人",
     "sensitive": true
    },
    {
     "key": "online.edit_site",
     "en": "Edit site",
     "zh": "编辑网站",
     "desc": "允许修改 Square Online 网站页面、布局、文字、图片和商品展示等内容。错误操作可能直接改变对外网站，因此只给电商/网站负责人。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "按需",
     "sensitive": false
    },
    {
     "key": "online.preview",
     "en": "Preview",
     "zh": "预览网站",
     "desc": "允许查看尚未发布的网站改动效果，但不会把改动正式上线。属于相对低风险的网站权限，适合内容审核。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "按需",
     "sensitive": false
    },
    {
     "key": "online.publish",
     "en": "Publish",
     "zh": "发布网站",
     "desc": "允许把 Square Online 的改动正式发布到公网，客户会立即看到。因为会影响对外销售页面，应限制给网站负责人。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "谨慎",
     "sensitive": false
    },
    {
     "key": "online.unpublish",
     "en": "Unpublish",
     "zh": "下线网站",
     "desc": "允许把整个 Square Online 网站下线/撤下。风险很高，可能让客户无法访问网站或下单，通常只给 Owner 或网站管理员。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "关/管理层",
     "sensitive": true
    }
   ]
  },
  {
   "no": "11",
   "key": "payment_links",
   "en": "Payment Links",
   "zh": "付款链接",
   "purpose": "控制创建和管理可发送给客户直接付款的链接。",
   "template": {
    "sales": "按需",
    "office": "按需"
   },
   "items": [
    {
     "key": "payment_links.payment_links",
     "en": "Payment Links",
     "zh": "管理付款链接",
     "desc": "允许建立、修改和管理付款链接，让客户通过一个 URL 直接付款。适合收订金、远程付款或简单商品收款，但需要明确链接金额、商品和用途，避免与正常订单流程脱节。",
     "confirm": "已确认",
     "sales": "关/按需",
     "office": "开/按需",
     "sensitive": false
    }
   ]
  },
  {
   "no": "12",
   "key": "invoices",
   "en": "Invoices",
   "zh": "发票 / 报价",
   "purpose": "控制 Square Invoice、Estimate、Project、订金和付款计划。",
   "template": {
    "sales": "按业务流程有限开放",
    "office": "开"
   },
   "items": [
    {
     "key": "invoices.view_invoices_and_estimates",
     "en": "View invoices and estimates",
     "zh": "查看 Invoice / Estimate",
     "desc": "允许查看已建立的 Invoice 和 Estimate，包括客户、金额、付款状态和相关内容。适合销售跟进报价或办公室查账，但会看到客户应收信息。",
     "confirm": "已确认",
     "sales": "开/按需",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "invoices.create_invoices_and_estimates",
     "en": "Create invoices and estimates",
     "zh": "创建 Invoice / Estimate",
     "desc": "允许新建并发送客户 Invoice 或 Estimate。创建 Invoice 会形成正式应收/付款流程，因此应明确你们什么时候用 Square Invoice、什么时候仍按 VIVA/正式单号逻辑处理。",
     "confirm": "已确认",
     "sales": "按需",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "invoices.edit_invoices_and_estimates",
     "en": "Edit invoices and estimates",
     "zh": "修改 Invoice / Estimate",
     "desc": "允许修改尚处于可编辑状态的 Invoice/Estimate，例如商品、价格、备注或付款条件。已经付款或处于终态的单据可能不能改；对你们 L1→1- 的流程尤其要注意单据状态。",
     "confirm": "已确认",
     "sales": "按需",
     "office": "开",
     "sensitive": false
    },
    {
     "key": "invoices.delete_invoices_and_estimates",
     "en": "Delete invoices and estimates",
     "zh": "删除 Invoice / Estimate",
     "desc": "允许删除符合条件的 Invoice/Estimate。删除会影响客户历史和内部追踪，因此通常只给办公室并要求有明确原因。",
     "confirm": "已确认",
     "sales": "关",
     "office": "开/谨慎",
     "sensitive": false
    },
    {
     "key": "invoices.manage_invoice_projects",
     "en": "Manage invoice projects",
     "zh": "管理 Invoice Project",
     "desc": "允许使用 Invoice Projects，把 Invoice、Estimate、Contract、附件等归到同一个项目中管理。适合周期较长、需要多份单据的客户项目，例如整屋灯具/家具项目。",
     "confirm": "已确认",
     "sales": "关/按需",
     "office": "开/按需",
     "sensitive": false
    },
    {
     "key": "invoices.recurring_invoices",
     "en": "Recurring invoices",
     "zh": "周期性发票",
     "desc": "允许设置周期性重复开票/收费，例如每月固定服务费。你们目前以一次性零售和项目单为主时使用频率可能不高。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "按需",
     "sensitive": false
    },
    {
     "key": "invoices.deposits_payment_schedules",
     "en": "Deposits/payment schedules",
     "zh": "订金/付款计划",
     "desc": "允许在 Invoice 中设置订金和后续付款节点，例如 30% Deposit + 70% 尾款。它适合分期收款，但 Square 的 Invoice 逻辑与现有 VIVA 的 L1/doc ID/转正式单逻辑并不完全相同，实施前要单独设计。",
     "confirm": "功能范围",
     "sales": "按需",
     "office": "开/按需",
     "sensitive": false
    }
   ]
  },
  {
   "no": "13",
   "key": "subscriptions",
   "en": "Subscriptions",
   "zh": "客户订阅",
   "purpose": "管理面向客户的周期性订阅/重复收费；当前加拿大公开手册未列出完整子权限。",
   "template": {
    "sales": "关",
    "office": "按需"
   },
   "items": [
    {
     "key": "subscriptions.subscription_permissions",
     "en": "Subscription permissions",
     "zh": "客户订阅权限",
     "desc": "用于管理面向客户的 recurring subscription/周期收费，例如定期自动扣款或订阅服务。Square 加拿大公开权限手册没有完整公布你当前 UI 中的细分 checkbox，因此实际权限范围应以账户页面为准；你们现阶段通常可以关闭。",
     "confirm": "未公开",
     "sales": "关",
     "office": "按需",
     "sensitive": false
    }
   ]
  },
  {
   "no": "14",
   "key": "shifts",
   "en": "Shifts",
   "zh": "排班 / 工时",
   "purpose": "控制员工可上班时间、排班、工时卡、工资成本、小费和提成设置。",
   "template": {
    "sales": "员工本人功能即可",
    "office": "仅管理人员按需"
   },
   "items": [
    {
     "key": "shifts.manage_availability",
     "en": "Manage availability",
     "zh": "管理员工可上班时间",
     "desc": "允许设置员工可上班/不可上班的时间范围，供排班系统参考。它不是直接排班，而是定义员工什么时候“可以被排班”。",
     "confirm": "已确认",
     "sales": "关",
     "office": "按需",
     "sensitive": false
    },
    {
     "key": "shifts.manage_schedules",
     "en": "Manage schedules",
     "zh": "管理排班",
     "desc": "允许创建、修改和发布员工班次，包括谁在哪天、什么时间上班。适合主管或办公室安排人员，不应由普通员工随意修改全公司排班。",
     "confirm": "已确认",
     "sales": "关",
     "office": "按需",
     "sensitive": false
    },
    {
     "key": "shifts.manage_timecard_reports",
     "en": "Manage timecard reports",
     "zh": "管理工时卡",
     "desc": "允许查看和修改员工打卡记录、工时和 Clock in/out 数据。修改后会影响工时统计和人工成本，因此一般只给负责考勤的人。",
     "confirm": "已确认",
     "sales": "关",
     "office": "按需",
     "sensitive": false
    },
    {
     "key": "shifts.view_wages_and_labour_cost",
     "en": "View wages and labour cost",
     "zh": "查看工资/人工成本",
     "desc": "允许查看员工工资率以及 Square 计算出的 Labour Cost。属于薪资/人工成本敏感信息，普通销售和多数员工不应看到。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/管理层",
     "sensitive": true
    },
    {
     "key": "shifts.manage_tip_settings",
     "en": "Manage tip settings",
     "zh": "管理小费设置",
     "desc": "允许设置小费规则，例如 Tip Pooling、分配方法等。主要适用于有小费业务；你们普通零售通常可以关闭。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/管理层",
     "sensitive": true
    },
    {
     "key": "shifts.manage_commission_settings_rates",
     "en": "Manage commission settings & rates",
     "zh": "管理提成",
     "desc": "允许设置员工 Commission/提成比例和规则。它会直接影响销售提成计算，属于薪酬敏感权限，只应给管理层或负责薪酬的人。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/管理层",
     "sensitive": true
    }
   ]
  },
  {
   "no": "15",
   "key": "team_management",
   "en": "Team Management",
   "zh": "员工管理",
   "purpose": "控制 Team Member 的创建、修改、停用以及员工文件和授权代表。",
   "template": {
    "sales": "关",
    "office": "关，交 Owner/管理员"
   },
   "items": [
    {
     "key": "team_management.create_team_members",
     "en": "Create team members",
     "zh": "新建员工",
     "desc": "允许在 Square 中建立新的 Team Member，填写姓名、联系方式、职位并分配权限。新建后员工可获得自己的登录/Passcode，因此只应由管理员操作。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/管理员",
     "sensitive": true
    },
    {
     "key": "team_management.edit_team_members",
     "en": "Edit team members",
     "zh": "修改员工",
     "desc": "允许修改员工资料、岗位、Location 和部分访问设置。错误修改可能导致员工获得不该有的访问权限，因此不建议普通 Office 人员开放。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/管理员",
     "sensitive": true
    },
    {
     "key": "team_management.remove_deactivate_team_members",
     "en": "Remove/deactivate team members",
     "zh": "删除/停用员工",
     "desc": "允许停用员工访问，通常用于离职或不再需要访问的人员。停用不会删除其历史交易和操作记录，因此是员工离职时应执行的标准动作。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/管理员",
     "sensitive": true
    },
    {
     "key": "team_management.view_team_member_documents",
     "en": "View team member documents",
     "zh": "查看员工文件",
     "desc": "允许查看员工上传或保存的就业、证书等文件。可能涉及个人和人事资料，因此应限于管理层/HR。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/管理员",
     "sensitive": true
    },
    {
     "key": "team_management.manage_authorized_representatives",
     "en": "Manage authorized representatives",
     "zh": "管理授权代表",
     "desc": "允许指定谁可以作为 Authorized Representative 与 Square Support 讨论账户敏感信息或处理某些账户事项。权限级别很高，应由 Owner 控制。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "关/Owner",
     "sensitive": true
    }
   ]
  },
  {
   "no": "16",
   "key": "team_communication",
   "en": "Team Communication",
   "zh": "员工内部沟通",
   "purpose": "控制 Square Team 中的内部聊天、群组沟通和文件发送。",
   "template": {
    "sales": "按需",
    "office": "按需"
   },
   "items": [
    {
     "key": "team_communication.manage_conversations",
     "en": "Manage conversations",
     "zh": "管理员工聊天",
     "desc": "允许在 Square Team 内发送和管理一对一或群组员工消息、文件和内部沟通。适合团队协作，但如果你们已经使用其他内部沟通工具，可以不启用。",
     "confirm": "已确认",
     "sales": "按需",
     "office": "按需",
     "sensitive": false
    }
   ]
  },
  {
   "no": "17",
   "key": "appointments",
   "en": "Appointments",
   "zh": "预约",
   "purpose": "控制个人/全员预约日历以及预约系统设置。",
   "template": {
    "sales": "关",
    "office": "按需"
   },
   "items": [
    {
     "key": "appointments.view_personal_calendar",
     "en": "View personal calendar",
     "zh": "查看本人预约日历",
     "desc": "允许员工查看自己负责的预约和日历。适用于使用 Square Appointments 的服务类业务；你们零售业务通常用不到。",
     "confirm": "已确认",
     "sales": "关/按需",
     "office": "按需",
     "sensitive": false
    },
    {
     "key": "appointments.view_appointments",
     "en": "View appointments",
     "zh": "查看预约",
     "desc": "允许查看预约详情和待处理请求，可能包括客户信息、时间和服务内容。只有启用预约业务时才需要。",
     "confirm": "已确认",
     "sales": "关/按需",
     "office": "按需",
     "sensitive": false
    },
    {
     "key": "appointments.manage_all_team_member_calendars",
     "en": "Manage all team member calendars",
     "zh": "管理所有员工预约日历",
     "desc": "允许查看和修改所有员工的预约日历与可预约时间。属于预约管理员权限，不适合普通员工。",
     "confirm": "已确认",
     "sales": "关",
     "office": "按需",
     "sensitive": false
    },
    {
     "key": "appointments.configure_appointment_settings",
     "en": "Configure appointment settings",
     "zh": "设置预约系统",
     "desc": "允许修改整个预约系统的规则，例如预约政策、取消政策、Reminder 和 Deposit。会影响所有客户预约体验，因此只给管理员。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/管理层",
     "sensitive": true
    }
   ]
  },
  {
   "no": "18",
   "key": "marketing",
   "en": "Marketing",
   "zh": "营销",
   "purpose": "控制营销 Campaign 和优惠券等客户营销工具。",
   "template": {
    "sales": "关",
    "office": "按需"
   },
   "items": [
    {
     "key": "marketing.create_edit_send_marketing_campaigns",
     "en": "Create/edit/send marketing campaigns",
     "zh": "创建/编辑/发送营销活动",
     "desc": "允许通过 Square Marketing 创建、编辑和发送营销活动，例如 Email/SMS Campaign。员工可能接触大量客户并代表公司发营销内容，因此应由营销或管理人员操作。",
     "confirm": "已确认",
     "sales": "关",
     "office": "按需",
     "sensitive": false
    },
    {
     "key": "marketing.create_coupons",
     "en": "Create coupons",
     "zh": "创建优惠券",
     "desc": "允许创建促销码/Coupon 并设置优惠规则。优惠券可能直接影响售价和毛利，普通销售不应随意创建。",
     "confirm": "已确认",
     "sales": "关",
     "office": "按需",
     "sensitive": false
    }
   ]
  },
  {
   "no": "19",
   "key": "contracts",
   "en": "Contracts",
   "zh": "合同",
   "purpose": "控制向客户创建、发送和管理电子合同。",
   "template": {
    "sales": "按需",
    "office": "按需"
   },
   "items": [
    {
     "key": "contracts.create_send_and_manage_contracts",
     "en": "Create, send and manage contracts",
     "zh": "创建/发送/管理合同",
     "desc": "允许使用 Square Contracts 创建、发送、查看和管理电子合同，并追踪客户是否签署。适合定制项目、订金或需要书面条款的销售，但合同模板和发送权限应由办公室/管理层控制。",
     "confirm": "已确认",
     "sales": "关/按需",
     "office": "开/按需",
     "sensitive": false
    }
   ]
  },
  {
   "no": "20",
   "key": "risk_manager",
   "en": "Risk Manager",
   "zh": "风控",
   "purpose": "控制支付欺诈检测和风险规则。",
   "template": {
    "sales": "关",
    "office": "关，交 Owner"
   },
   "items": [
    {
     "key": "risk_manager.configure_risk_manager_settings",
     "en": "Configure Risk Manager settings",
     "zh": "设置支付风控",
     "desc": "允许设置支付风险管理规则，例如欺诈检测、3D Secure 和相关风控策略。错误设置可能导致正常交易被拒或高风险交易放行，因此通常只给 Owner/支付风控负责人。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/Owner",
     "sensitive": true
    }
   ]
  },
  {
   "no": "21",
   "key": "account_settings",
   "en": "Account & Settings",
   "zh": "账户与系统设置",
   "purpose": "控制公司资料、订阅、硬件、结账、订单、设备、第三方集成等系统级设置。",
   "template": {
    "sales": "关",
    "office": "原则上关"
   },
   "items": [
    {
     "key": "account_settings.update_edit_business_information",
     "en": "Update/Edit business information",
     "zh": "修改公司资料",
     "desc": "允许修改 Square 中的公司和 Location 信息，例如 Business Name、地址、Branding 等。部分资料可能出现在收据、客户页面或账户验证中，因此应只给 Owner 或极少数管理员。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/Owner",
     "sensitive": true
    },
    {
     "key": "account_settings.manage_square_subscriptions_and_add_ons",
     "en": "Manage Square subscriptions and add-ons",
     "zh": "管理 Square 订阅",
     "desc": "允许开通、升级、降级或取消 Square 的付费产品和 Add-ons，例如 Retail、Online、Marketing 等。会直接产生或取消月费，属于财务决策权限，建议只给 Owner。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/Owner",
     "sensitive": true
    },
    {
     "key": "account_settings.configure_hardware_settings",
     "en": "Configure hardware settings",
     "zh": "配置硬件",
     "desc": "允许配置 Square Terminal、Reader、Printer、Cash Drawer 等硬件和连接方式。错误设置可能导致收银、打印或支付设备无法使用，适合 IT/办公室管理员。",
     "confirm": "已确认",
     "sales": "关",
     "office": "有限/管理员",
     "sensitive": false
    },
    {
     "key": "account_settings.configure_checkout_settings",
     "en": "Configure checkout settings",
     "zh": "配置结账",
     "desc": "允许修改整个系统的结账规则，例如签名、小费、付款流程和部分收银行为。它影响所有员工和客户的结账体验，应由管理员统一设置。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/管理员",
     "sensitive": true
    },
    {
     "key": "account_settings.configure_order_settings",
     "en": "Configure order settings",
     "zh": "配置订单",
     "desc": "允许修改订单相关的全局设置，例如 Ticket、订单提示、Fulfillment 等。改动可能影响所有门店/员工的订单流程，因此不建议普通员工开放。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/管理员",
     "sensitive": true
    },
    {
     "key": "account_settings.create_edit_delete_devices",
     "en": "Create/edit/delete devices",
     "zh": "管理 POS 设备",
     "desc": "允许在账户中新增、修改或移除 POS 设备。设备权限可能决定某台电脑/平板能否连接到 Square，因此通常只给 IT/Owner。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "关/管理员",
     "sensitive": true
    },
    {
     "key": "account_settings.create_edit_delete_device_profiles",
     "en": "Create/edit/delete device profiles",
     "zh": "管理设备配置模板",
     "desc": "允许建立和维护 Device Profile，把一套统一配置分配给多台 POS 设备。适合多设备部署，但错误配置可能批量影响多台终端。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "关/管理员",
     "sensitive": true
    },
    {
     "key": "account_settings.view_set_up_app_marketplace_integrations",
     "en": "View/set up App Marketplace integrations",
     "zh": "管理第三方集成",
     "desc": "允许查看、安装和配置 Square App Marketplace 的第三方集成。第三方 App 可能获得订单、客户、库存等数据访问权限，因此启用前应由 Owner/IT 审核。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/Owner/IT",
     "sensitive": true
    },
    {
     "key": "account_settings.create_edit_delete_modes",
     "en": "Create/edit/delete Modes",
     "zh": "管理 POS Mode",
     "desc": "允许管理 Square POS 的工作 Mode，例如不同业务模式或界面配置。修改后可能改变员工 POS 上能看到和操作的功能，应由管理员统一控制。",
     "confirm": "功能范围",
     "sales": "关",
     "office": "关/管理员",
     "sensitive": true
    }
   ]
  },
  {
   "no": "22",
   "key": "developers",
   "en": "Developers",
   "zh": "开发者 / API",
   "purpose": "控制 Developer App、API 工具、Access Token、Webhook 和 App Marketplace 开发权限。",
   "template": {
    "sales": "关",
    "office": "关，交 Owner/IT"
   },
   "items": [
    {
     "key": "developers.view_basic_application_information",
     "en": "View basic application information",
     "zh": "查看开发应用基础信息",
     "desc": "允许只读查看已经创建的 Square Developer Application 基础资料，例如 App 名称和部分配置。风险相对较低，但普通销售和办公室人员没有必要访问。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/IT",
     "sensitive": true
    },
    {
     "key": "developers.access_all_developer_tools",
     "en": "Access all developer tools",
     "zh": "使用全部开发工具",
     "desc": "允许使用 API Explorer、Logs、Sandbox、Webhook 等开发工具，对接和调试 Square API。适合负责 VIVA↔Square 集成的开发/IT 人员，不应给普通员工。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/IT",
     "sensitive": true
    },
    {
     "key": "developers.create_and_view_personal_access_tokens",
     "en": "Create and view personal access tokens",
     "zh": "创建/查看 Personal Access Token",
     "desc": "允许创建或查看 Personal Access Token。拿到 Token 的人可以通过 API 访问账户数据和执行被授权的操作，等同于高权限系统钥匙，必须严格限制并妥善保管。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/Owner/IT",
     "sensitive": true
    },
    {
     "key": "developers.view_app_marketplace_submissions",
     "en": "View App Marketplace submissions",
     "zh": "查看 App Marketplace 提交",
     "desc": "允许查看你们提交到 Square App Marketplace 的应用审核资料。只有真正做公开 Square App 时才会用到。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/IT",
     "sensitive": true
    },
    {
     "key": "developers.manage_app_marketplace_listings",
     "en": "Manage App Marketplace listings",
     "zh": "管理 App Marketplace 应用",
     "desc": "允许修改和管理公开发布在 Square App Marketplace 的应用 Listing。你们只是内部 VIVA 集成时通常不需要此权限。",
     "confirm": "已确认",
     "sales": "关",
     "office": "关/IT",
     "sensitive": true
    }
   ]
  }
 ],
 "notes": [
  {
   "topic": "VIVA 保留",
   "rule": "本手册只用于 Square 替换 ACE 的权限设计，不把 VIVA 替换掉。"
  },
  {
   "topic": "双库存",
   "rule": "Square 与 VIVA 可以继续各自保留不同业务含义的库存逻辑；权限重点是控制谁能改 Square 的正式库存。"
  },
  {
   "topic": "Sales",
   "rule": "建议能查商品、价格、客户、订单和必要库存信息，但不允许直接改成本、数量、税或系统配置。"
  },
  {
   "topic": "Office",
   "rule": "负责商品、库存、收货、PO、Invoice、报表等后台操作，但银行、账户所有权、Developer Token 仍保留给 Owner/IT。"
  },
  {
   "topic": "Developers",
   "rule": "VIVA ↔ Square API 对接时，Access Token 应放在受控服务器/Secret Manager，不应由普通 Team Member 持有。"
  }
 ],
 "sources": [
  {
   "topic": "Team permissions",
   "url": "https://squareup.com/help/ca/en/article/5822-employee-permissions"
  },
  {
   "topic": "Team members",
   "url": "https://squareup.com/help/ca/en/article/8356-add-and-manage-team-members"
  },
  {
   "topic": "Orders",
   "url": "https://squareup.com/help/ca/en/article/8454-manage-orders-with-square"
  },
  {
   "topic": "Returns / refunds",
   "url": "https://squareup.com/help/ca/en/article/6350-process-a-return-or-exchange-with-square-for-retail"
  },
  {
   "topic": "House Accounts",
   "url": "https://squareup.com/help/ca/en/article/8034-create-and-charge-square-house-accounts"
  },
  {
   "topic": "Reports",
   "url": "https://squareup.com/help/ca/en/article/5381-in-app-summaries-and-reports"
  },
  {
   "topic": "Customers",
   "url": "https://squareup.com/help/ca/en/article/7387-identify-customers-at-your-counter-with-qr-codes"
  },
  {
   "topic": "Messages",
   "url": "https://squareup.com/help/ca/en/article/7985-get-started-with-square-messages-plus"
  },
  {
   "topic": "Inventory / Retail",
   "url": "https://squareup.com/help/ca/en/article/6110-manage-inventory-with-the-retail-pos-app"
  },
  {
   "topic": "Invoices",
   "url": "https://squareup.com/help/ca/en/article/8387-create-and-send-invoices"
  },
  {
   "topic": "Shifts / scheduling",
   "url": "https://squareup.com/help/ca/en/article/7155-scheduling-with-team-management"
  },
  {
   "topic": "Team Communication",
   "url": "https://squareup.com/help/ca/en/article/8397-send-messages-to-your-team-with-square-team-communication"
  },
  {
   "topic": "Marketing",
   "url": "https://squareup.com/help/ca/en/article/8412-create-marketing-campaigns"
  },
  {
   "topic": "Contracts",
   "url": "https://squareup.com/help/ca/en/article/7104-contracts"
  },
  {
   "topic": "Risk Manager",
   "url": "https://squareup.com/help/ca/en/article/7623-risk-manager-3d-secure-3ds"
  },
  {
   "topic": "Account settings",
   "url": "https://squareup.com/help/ca/en/article/3861-edit-your-account-and-business-settings"
  },
  {
   "topic": "Developer permissions",
   "url": "https://developer.squareup.com/docs/devtools/developer-permissions"
  }
 ],
 "limitation": "局限：Square 没有公开一张与当前 UI 100% 同步的“所有 Permission checkbox 总表”。Banking、Items、Subscriptions 等部分页面的公开说明尤其不完整，因此本手册用“功能范围 / 未公开”明确区分，不把功能范围臆造成独立 checkbox。实际配置时，以账户页面中出现的字段为最终准绳。",
 "people": [
  "david",
  "coco",
  "helen",
  "ethan",
  "echo",
  "zeror"
 ]
};
